import type {
  MappedInvoiceOut,
  MappedInvoiceIn,
  MappedInvoiceOutContact,
  MappedInvoiceOutWorkOrder,
  MappedBillingLine,
} from '@/types/invoice'

function calcHours(
  startTime: Date,
  endTime: Date | null,
  startBreak: Date | null,
  endBreak: Date | null,
  employeeCount: number,
): number {
  if (!endTime) return 0
  const workMs = endTime.getTime() - startTime.getTime()
  const breakMs = startBreak && endBreak ? endBreak.getTime() - startBreak.getTime() : 0
  const netMs = Math.max(0, workMs - breakMs)
  const hours = netMs / (1000 * 60 * 60)
  return Math.round(hours) * Math.max(1, employeeCount)
}

type PriceListItemRaw = {
  id: string
  description: string
  unit: string
  price: {toNumber: () => number}
  isCostMargin: boolean
  PriceListItemTarget: {targetId: string} | null
}

const STAY_OVER_UNIT = 'STAY_OVER'

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase().replace(/\s+/g, '_')
}

function findStayOverPrice(items: PriceListItemRaw[]): {itemId: string; unit: string; basePrice: number} | null {
  const byUnit = items.find(item => !item.isCostMargin && normalizeText(item.unit) === STAY_OVER_UNIT)
  if (byUnit) {
    return {
      itemId: byUnit.id,
      unit: byUnit.unit,
      basePrice: byUnit.price.toNumber(),
    }
  }

  // Compatibility fallback for older lists where stay-over was encoded in description.
  const byDescription = items.find(item => {
    if (item.isCostMargin) return false
    const normalizedDescription = normalizeText(item.description).replace(/_/g, '')
    return normalizedDescription === 'STAYOVER'
  })

  if (!byDescription) return null

  return {
    itemId: byDescription.id,
    unit: byDescription.unit,
    basePrice: byDescription.price.toNumber(),
  }
}

function buildTargetPriceMap(
  items: PriceListItemRaw[],
): Map<string, {itemId: string; unit: string; basePrice: number}> {
  const map = new Map<string, {itemId: string; unit: string; basePrice: number}>()
  for (const item of items) {
    // Only map explicit target price items (exclude cost-margin rows).
    if (!item.isCostMargin && item.PriceListItemTarget) {
      map.set(item.PriceListItemTarget.targetId, {
        itemId: item.id,
        unit: item.unit,
        basePrice: item.price.toNumber(),
      })
    }
  }
  return map
}

function applyMargin(basePrice: number, marginPercent: number): number {
  return basePrice * (1 + marginPercent / 100)
}

type TimeRegistryRaw = {
  id: string
  invoiceTime: boolean | null
  stayOver: boolean | null
  startTime: Date
  endTime: Date | null
  startBreak: Date | null
  endBreak: Date | null
  hourTypeId: string
  vatMarginId: string | null
  HourType: {id: string; name: string; targetId: string | null}
  VatMargin: {id: string; vat: number} | null
  TimeRegistryEmployee: {id: string; employeeId: string}[]
}

type WorkOrderStructureRaw = {
  id: string
  quantity: number | null
  shortDescription: string | null
  materialId: string
  vatMarginId: string | null
  VatMargin: {id: string; vat: number} | null
  Material: {
    id: string
    name: string | null
    shortDescription: string
    beNumber: string
    targetId: string | null
    Unit: {abbreviation: string}
  }
}

type TrainingRaw = {
  id: string
  trainingNumber: string | null
  targetId: string | null
  vatMarginId: string | null
  VatMargin: {id: string; vat: number} | null
  TrainingStandard: {
    id: string
    descriptionShort: string | null
    description: string | null
    location: string | null
    targetId: string | null
    Certificate: {descriptionShort: string | null} | null
  } | null
}

type WorkOrderRaw = {
  id: string
  workOrderNumber: string | null
  description: string | null
  completed: boolean
  hoursMaterialClosed: boolean
  projectId: string
  Project: {
    id: string
    projectNumber: string
    projectName: string
    companyId: string
    Company: {id: string; name: string}
    // No PriceList here anymore
  }
  TimeRegistry: TimeRegistryRaw[]
  WorkOrderStructure: WorkOrderStructureRaw[]
  Training: TrainingRaw[]
}

type WorkOrderInvoiceRaw = {
  id: string
  invoiceOutId: string
  workOrderId: string
  deleted: boolean
  WorkOrder: WorkOrderRaw
}

type InvoiceOutRaw = {
  id: string
  invoiceNumber: string
  poNumber: string | null
  clientReference: string | null
  invoiceDate: Date
  createdAt: Date
  dueDate: Date
  sentDate: Date | null
  deletedAt: Date | null
  modifiedAt: Date | null
  reminderSent: boolean
  outstanding: boolean
  deleted: boolean
  deletedBy: string | null
  createdBy: string
  modifiedBy: string | null
  invoiceTypeId: string
  targetId: string
  paymentMethodId: string
  invoiceSentTypeId: string
  invoiceStatusId: string
  priceListId: string | null
  InvoiceType: {id: string; name: string}
  Employee: {id: string; firstName: string; lastName: string}
  PaymentMethod: {id: string; name: string}
  InvoiceSentType: {id: string; name: string}
  InvoiceStatus: {id: string; name: string}
  // ← Price list at invoice level
  PriceList: {
    id: string
    name: string
    PriceListItem: PriceListItemRaw[]
  } | null
  InvoiceOutContact: {
    id: string
    contactId: string
    invoiceOutId: string
    Contact: {
      id: string
      firstName: string
      lastName: string
      mail1: string | null
      generalPhone: string | null
    }
  }[]
  WorkOrderInvoice: WorkOrderInvoiceRaw[]
}

// Now takes priceMap and costMargin directly — sourced from invoice.PriceList
// Returns work order with calculated VAT per material based on VatMargin
function mapWorkOrderWithLines(
  w: WorkOrderInvoiceRaw,
  priceMap: Map<string, {itemId: string; unit: string; basePrice: number}>,
  costMargin: number,
  stayOverPrice: {itemId: string; unit: string; basePrice: number} | null,
): MappedInvoiceOutWorkOrder {
  const wo = w.WorkOrder
  const lines: MappedBillingLine[] = []
  const vatByRateMap = new Map<number, number>() // VAT rate → total VAT amount
  const vatRateById = new Map<string, number>()

  // ── Hour lines ────────────────────────────────────────────────────────────
  const hoursByType = new Map<
    string,
    {
      label: string
      targetId: string | null
      totalHours: number
      timeRegistryIds: string[]
      vatMarginIds: Set<string | null>
      vatAmount: number
    }
  >()
  const stayOverByType = new Map<
    string,
    {
      label: string
      count: number
      timeRegistryIds: string[]
      vatMarginIds: Set<string | null>
      vatAmount: number
    }
  >()
  for (const tr of wo.TimeRegistry) {
    if (tr.invoiceTime !== true) {
      continue
    }
    const hours = calcHours(tr.startTime, tr.endTime, tr.startBreak, tr.endBreak, tr.TimeRegistryEmployee.length || 1)

    if (tr.vatMarginId && tr.VatMargin?.vat != null) {
      vatRateById.set(tr.vatMarginId, tr.VatMargin.vat)
    }

    const hoursGroup = hoursByType.get(tr.hourTypeId) ?? {
      label: tr.HourType.name,
      targetId: tr.HourType.targetId,
      totalHours: 0,
      timeRegistryIds: [],
      vatMarginIds: new Set<string | null>(),
      vatAmount: 0,
    }

    const hoursMatch = tr.HourType.targetId ? priceMap.get(tr.HourType.targetId) : undefined
    const hoursUnitPrice = hoursMatch ? applyMargin(hoursMatch.basePrice, costMargin) : null
    const hoursLineTotal = hoursUnitPrice ? hoursUnitPrice * hours : null
    const hoursVatRate = tr.VatMargin?.vat ?? 0
    if (hoursLineTotal !== null && hoursVatRate > 0) {
      const vatAmount = hoursLineTotal * (hoursVatRate / 100)
      hoursGroup.vatAmount += vatAmount
      vatByRateMap.set(hoursVatRate, (vatByRateMap.get(hoursVatRate) ?? 0) + vatAmount)
    }

    hoursGroup.totalHours += hours
    hoursGroup.timeRegistryIds.push(tr.id)
    hoursGroup.vatMarginIds.add(tr.vatMarginId ?? null)
    hoursByType.set(tr.hourTypeId, hoursGroup)

    if (tr.stayOver === true) {
      const stayGroup = stayOverByType.get(tr.hourTypeId) ?? {
        label: tr.HourType.name,
        count: 0,
        timeRegistryIds: [],
        vatMarginIds: new Set<string | null>(),
        vatAmount: 0,
      }
      const stayUnitPrice = stayOverPrice ? applyMargin(stayOverPrice.basePrice, costMargin) : null
      const stayVatRate = tr.VatMargin?.vat ?? 0
      if (stayUnitPrice !== null && stayVatRate > 0) {
        const vatAmount = stayUnitPrice * (stayVatRate / 100)
        stayGroup.vatAmount += vatAmount
        vatByRateMap.set(stayVatRate, (vatByRateMap.get(stayVatRate) ?? 0) + vatAmount)
      }
      stayGroup.count += 1
      stayGroup.timeRegistryIds.push(tr.id)
      stayGroup.vatMarginIds.add(tr.vatMarginId ?? null)
      stayOverByType.set(tr.hourTypeId, stayGroup)
    }
  }

  const sortedHourGroups = Array.from(hoursByType.entries()).sort((a, b) => a[1].label.localeCompare(b[1].label))
  for (const [hourTypeId, group] of sortedHourGroups) {
    const match = group.targetId ? priceMap.get(group.targetId) : undefined
    const unitPrice = match ? applyMargin(match.basePrice, costMargin) : null
    const lineTotalFinal = unitPrice ? unitPrice * group.totalHours : null
    const lineVatAmount = unitPrice ? group.vatAmount : null
    const lineTotalInclVat = lineTotalFinal !== null ? lineTotalFinal + (lineVatAmount ?? 0) : null
    const vatMarginId = group.vatMarginIds.size === 1 ? Array.from(group.vatMarginIds)[0] : null
    const vatRate = vatMarginId ? (vatRateById.get(vatMarginId) ?? null) : null
    lines.push({
      workOrderId: wo.id,
      type: 'hours',
      sourceId: hourTypeId,
      sourceLabel: group.label,
      timeRegistryIds: group.timeRegistryIds,
      quantity: group.totalHours,
      unit: match?.unit ?? 'H',
      priceListItemId: match?.itemId ?? null,
      unitPriceBase: match?.basePrice ?? null,
      unitPriceFinal: unitPrice,
      lineTotalFinal,
      vatMarginId,
      vatRate,
      lineVatAmount,
      lineTotalInclVat,
      unmatched: !match,
    })
  }

  const sortedStayOverGroups = Array.from(stayOverByType.entries()).sort((a, b) => a[1].label.localeCompare(b[1].label))
  for (const [hourTypeId, group] of sortedStayOverGroups) {
    const unitPrice = stayOverPrice ? applyMargin(stayOverPrice.basePrice, costMargin) : null
    const lineTotalFinal = unitPrice ? unitPrice * group.count : null
    const lineVatAmount = unitPrice ? group.vatAmount : null
    const lineTotalInclVat = lineTotalFinal !== null ? lineTotalFinal + (lineVatAmount ?? 0) : null
    const vatMarginId = group.vatMarginIds.size === 1 ? Array.from(group.vatMarginIds)[0] : null
    const vatRate = vatMarginId ? (vatRateById.get(vatMarginId) ?? null) : null
    lines.push({
      workOrderId: wo.id,
      type: 'stay_over',
      sourceId: hourTypeId,
      sourceLabel: `Stay Over (${group.label})`,
      timeRegistryIds: group.timeRegistryIds,
      quantity: group.count,
      unit: stayOverPrice?.unit ?? 'STAY_OVER',
      priceListItemId: stayOverPrice?.itemId ?? null,
      unitPriceBase: stayOverPrice?.basePrice ?? null,
      unitPriceFinal: unitPrice,
      lineTotalFinal,
      vatMarginId,
      vatRate,
      lineVatAmount,
      lineTotalInclVat,
      unmatched: !stayOverPrice,
    })
  }

  // ── Material lines ────────────────────────────────────────────────────────
  for (const wos of wo.WorkOrderStructure) {
    const mat = wos.Material
    const qty = wos.quantity ?? 1
    const match = mat.targetId ? priceMap.get(mat.targetId) : undefined
    const unitPrice = match ? applyMargin(match.basePrice, costMargin) : null
    const lineTotal = unitPrice ? unitPrice * qty : null
    const vatRate = wos.VatMargin?.vat ?? null
    const lineVat = lineTotal !== null ? lineTotal * ((vatRate ?? 0) / 100) : null
    const lineTotalInclVat = lineTotal !== null ? lineTotal + (lineVat ?? 0) : null

    // Calculate VAT for this material line based on its VatMargin
    if (lineTotal !== null && vatRate && vatRate > 0) {
      vatByRateMap.set(vatRate, (vatByRateMap.get(vatRate) ?? 0) + (lineVat ?? 0))
    }

    lines.push({
      workOrderId: wo.id,
      type: 'material',
      sourceId: mat.id,
      sourceLabel: mat.name ?? mat.shortDescription ?? mat.beNumber,
      quantity: qty,
      unit: match?.unit ?? mat.Unit.abbreviation,
      priceListItemId: match?.itemId ?? null,
      unitPriceBase: match?.basePrice ?? null,
      unitPriceFinal: unitPrice,
      lineTotalFinal: lineTotal,
      vatMarginId: wos.vatMarginId ?? null,
      vatRate,
      lineVatAmount: lineVat,
      lineTotalInclVat,
      unmatched: !match,
      workOrderStructureId: wos.id,
    })
  }

  // ── Training lines ────────────────────────────────────────────────────────
  for (const tr of wo.Training ?? []) {
    const targetId = tr.targetId ?? tr.TrainingStandard?.targetId ?? null
    const match = targetId ? priceMap.get(targetId) : undefined
    const label =
      tr.TrainingStandard?.descriptionShort ?? tr.TrainingStandard?.description ?? `Training ${tr.trainingNumber}`
    const unitPrice = match ? applyMargin(match.basePrice, costMargin) : null
    const lineTotalFinal = unitPrice
    const vatRate = tr.VatMargin?.vat ?? null
    const lineVatAmount = lineTotalFinal !== null ? lineTotalFinal * ((vatRate ?? 0) / 100) : null
    const lineTotalInclVat = lineTotalFinal !== null ? lineTotalFinal + (lineVatAmount ?? 0) : null
    if (lineTotalFinal !== null && vatRate && vatRate > 0) {
      vatByRateMap.set(vatRate, (vatByRateMap.get(vatRate) ?? 0) + (lineVatAmount ?? 0))
    }
    lines.push({
      workOrderId: wo.id,
      type: 'training',
      sourceId: tr.id,
      sourceLabel: label,
      quantity: 1,
      unit: match?.unit ?? 'T',
      priceListItemId: match?.itemId ?? null,
      unitPriceBase: match?.basePrice ?? null,
      unitPriceFinal: unitPrice,
      lineTotalFinal,
      vatMarginId: tr.vatMarginId ?? null,
      vatRate,
      lineVatAmount,
      lineTotalInclVat,
      unmatched: !match,
    })
  }

  const subtotalExVat = lines.reduce((sum, l) => sum + (l.lineTotalFinal ?? 0), 0)
  const totalVat = Array.from(vatByRateMap.values()).reduce((sum, v) => sum + v, 0)
  const totalInclVat = subtotalExVat + totalVat

  // Convert map to sorted array for consistent output
  const vatByRateArray = Array.from(vatByRateMap.entries())
    .map(([rate, amount]) => ({rate, amount}))
    .sort((a, b) => a.rate - b.rate)

  return {
    id: wo.id,
    workOrderInvoiceId: w.id,
    workOrderNumber: wo.workOrderNumber,
    description: wo.description,
    completed: wo.completed,
    hoursMaterialClosed: wo.hoursMaterialClosed,
    projectId: wo.Project.id,
    projectNumber: wo.Project.projectNumber,
    projectName: wo.Project.projectName,
    companyId: wo.Project.Company.id,
    companyName: wo.Project.Company.name,
    billingLines: lines,
    subtotalExVat,
    vatByRate: vatByRateArray,
    totalVat,
    totalInclVat,
  }
}

export function mapInvoiceOut(r: InvoiceOutRaw): MappedInvoiceOut {
  // Build price map from invoice-level price list
  const priceItems = r.PriceList?.PriceListItem ?? []
  const priceMap = buildTargetPriceMap(priceItems)
  const costMargin = priceItems.find(i => i.isCostMargin)?.price.toNumber() ?? 0
  const stayOverPrice = findStayOverPrice(priceItems)

  const workOrders = r.WorkOrderInvoice.map(w => mapWorkOrderWithLines(w, priceMap, costMargin, stayOverPrice))

  // Aggregate VAT from all work orders
  const invoiceVatByRateMap = new Map<number, number>() // rate → total amount
  for (const wo of workOrders) {
    for (const {rate, amount} of wo.vatByRate) {
      invoiceVatByRateMap.set(rate, (invoiceVatByRateMap.get(rate) ?? 0) + amount)
    }
  }
  // Compute totals from all matched billing lines.
  const subtotalExVat = workOrders.reduce((sum, wo) => sum + wo.subtotalExVat, 0)
  const totalVat = workOrders.reduce((sum, wo) => sum + wo.totalVat, 0)
  const totalInclVat = subtotalExVat + totalVat

  // Convert map to sorted array
  const vatByRateArray = Array.from(invoiceVatByRateMap.entries())
    .map(([rate, amount]) => ({rate, amount}))
    .sort((a, b) => a.rate - b.rate)

  return {
    id: r.id,
    invoiceNumber: r.invoiceNumber,
    poNumber: r.poNumber,
    clientReference: r.clientReference,
    invoiceDate: r.invoiceDate.toISOString(),
    createdAt: r.createdAt.toISOString(),
    dueDate: r.dueDate.toISOString(),
    sentDate: r.sentDate?.toISOString() ?? null,
    deletedAt: r.deletedAt?.toISOString() ?? null,
    modifiedAt: r.modifiedAt?.toISOString() ?? null,
    reminderSent: r.reminderSent,
    outstanding: r.outstanding,
    deleted: r.deleted,
    deletedBy: r.deletedBy,
    deletedByName: null,
    createdBy: r.createdBy,
    createdByName: `${r.Employee.firstName} ${r.Employee.lastName}`,
    modifiedBy: r.modifiedBy,
    modifiedByName: null,
    invoiceTypeId: r.invoiceTypeId,
    invoiceTypeName: r.InvoiceType.name,
    targetId: r.targetId,
    paymentMethodId: r.paymentMethodId,
    paymentMethodName: r.PaymentMethod.name,
    invoiceSentTypeId: r.invoiceSentTypeId,
    invoiceSentTypeName: r.InvoiceSentType.name,
    invoiceStatusId: r.invoiceStatusId,
    invoiceStatusName: r.InvoiceStatus.name,
    priceListId: r.priceListId,
    priceListName: r.PriceList?.name ?? null,
    contacts: r.InvoiceOutContact.map(
      (c): MappedInvoiceOutContact => ({
        id: c.id,
        contactId: c.contactId,
        contactName: `${c.Contact.firstName} ${c.Contact.lastName}`,
        contactMail: c.Contact.mail1,
        contactPhone: c.Contact.generalPhone,
      }),
    ),
    workOrders,
    subtotalExVat,
    vatByRate: vatByRateArray,
    totalVat,
    totalInclVat,
  }
}

// ─── InvoiceIn ─────────────────────────────────────────────────────────────────
type InvoiceInRaw = {
  id: string
  invoiceNumber: string
  poNumber: string | null
  clientInvoiceNumber: string | null
  description: string | null
  invoiceDate: Date
  createdAt: Date
  dueDate: Date
  deletedAt: Date | null
  modifiedAt: Date | null
  reminderSent: boolean
  outstanding: boolean
  deleted: boolean
  deletedBy: string | null
  createdBy: string
  modifiedBy: string | null
  invoiceTypeId: string
  targetId: string
  paymentMethodId: string
  invoiceSentTypeId: string
  invoiceStatusId: string
  vatMarginId: string
  companyId: string
  InvoiceType: {id: string; name: string}
  Employee: {id: string; firstName: string; lastName: string}
  PaymentMethod: {id: string; name: string}
  InvoiceSentType: {id: string; name: string}
  InvoiceStatus: {id: string; name: string}
  VatMargin: {id: string; vat: number}
  Company: {id: string; name: string}
}

export function mapInvoiceIn(r: InvoiceInRaw): MappedInvoiceIn {
  return {
    id: r.id,
    invoiceNumber: r.invoiceNumber,
    poNumber: r.poNumber,
    clientInvoiceNumber: r.clientInvoiceNumber,
    description: r.description,
    invoiceDate: r.invoiceDate.toISOString(),
    createdAt: r.createdAt.toISOString(),
    dueDate: r.dueDate.toISOString(),
    deletedAt: r.deletedAt?.toISOString() ?? null,
    modifiedAt: r.modifiedAt?.toISOString() ?? null,
    reminderSent: r.reminderSent,
    outstanding: r.outstanding,
    deleted: r.deleted,
    deletedBy: r.deletedBy,
    deletedByName: null,
    createdBy: r.createdBy,
    createdByName: `${r.Employee.firstName} ${r.Employee.lastName}`,
    modifiedBy: r.modifiedBy,
    modifiedByName: null,
    invoiceTypeId: r.invoiceTypeId,
    invoiceTypeName: r.InvoiceType.name,
    targetId: r.targetId,
    paymentMethodId: r.paymentMethodId,
    paymentMethodName: r.PaymentMethod.name,
    invoiceSentTypeId: r.invoiceSentTypeId,
    invoiceSentTypeName: r.InvoiceSentType.name,
    invoiceStatusId: r.invoiceStatusId,
    invoiceStatusName: r.InvoiceStatus.name,
    vatMarginId: r.vatMarginId,
    vatMarginVat: r.VatMargin.vat,
    companyId: r.companyId,
    companyName: r.Company.name,
  }
}
