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

function buildTargetPriceMap(
  items: PriceListItemRaw[],
): Map<string, {itemId: string; unit: string; basePrice: number}> {
  const map = new Map<string, {itemId: string; unit: string; basePrice: number}>()
  for (const item of items) {
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
  startTime: Date
  endTime: Date | null
  startBreak: Date | null
  endBreak: Date | null
  hourTypeId: string
  HourType: {id: string; name: string; targetId: string | null}
  TimeRegistryEmployee: {id: string; employeeId: string}[]
}

type WorkOrderStructureRaw = {
  id: string
  quantity: number | null
  shortDescription: string | null
  materialId: string
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
  humanId: string | null
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
  vatMarginId: string
  priceListId: string | null
  InvoiceType: {id: string; name: string}
  Employee: {id: string; firstName: string; lastName: string}
  PaymentMethod: {id: string; name: string}
  InvoiceSentType: {id: string; name: string}
  InvoiceStatus: {id: string; name: string}
  VatMargin: {id: string; vat: number}
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
function mapWorkOrderWithLines(
  w: WorkOrderInvoiceRaw,
  priceMap: Map<string, {itemId: string; unit: string; basePrice: number}>,
  costMargin: number,
): MappedInvoiceOutWorkOrder {
  const wo = w.WorkOrder
  const lines: MappedBillingLine[] = []

  // ── Hour lines ────────────────────────────────────────────────────────────
  const hoursByType = new Map<string, {label: string; targetId: string | null; totalHours: number}>()
  for (const tr of wo.TimeRegistry) {
    const existing = hoursByType.get(tr.hourTypeId)
    const hours = calcHours(tr.startTime, tr.endTime, tr.startBreak, tr.endBreak, tr.TimeRegistryEmployee.length || 1)
    if (existing) {
      existing.totalHours += hours
    } else {
      hoursByType.set(tr.hourTypeId, {
        label: tr.HourType.name,
        targetId: tr.HourType.targetId,
        totalHours: hours,
      })
    }
  }

  for (const [hourTypeId, {label, targetId, totalHours}] of hoursByType) {
    const match = targetId ? priceMap.get(targetId) : undefined
    lines.push({
      workOrderId: wo.id,
      type: 'hours',
      sourceId: hourTypeId,
      sourceLabel: label,
      quantity: totalHours,
      unit: match?.unit ?? 'H',
      priceListItemId: match?.itemId ?? null,
      unitPriceBase: match?.basePrice ?? null,
      unitPriceFinal: match ? applyMargin(match.basePrice, costMargin) : null,
      lineTotalFinal: match ? applyMargin(match.basePrice, costMargin) * totalHours : null,
      unmatched: !match,
    })
  }

  // ── Material lines ────────────────────────────────────────────────────────
  for (const wos of wo.WorkOrderStructure) {
    const mat = wos.Material
    const qty = wos.quantity ?? 1
    const match = mat.targetId ? priceMap.get(mat.targetId) : undefined
    lines.push({
      workOrderId: wo.id,
      type: 'material',
      sourceId: mat.id,
      sourceLabel: mat.name ?? mat.shortDescription ?? mat.beNumber,
      quantity: qty,
      unit: match?.unit ?? mat.Unit.abbreviation,
      priceListItemId: match?.itemId ?? null,
      unitPriceBase: match?.basePrice ?? null,
      unitPriceFinal: match ? applyMargin(match.basePrice, costMargin) : null,
      lineTotalFinal: match ? applyMargin(match.basePrice, costMargin) * qty : null,
      unmatched: !match,
    })
  }

  // ── Training lines ────────────────────────────────────────────────────────
  for (const tr of wo.Training ?? []) {
    const targetId = tr.targetId ?? tr.TrainingStandard?.targetId ?? null
    const match = targetId ? priceMap.get(targetId) : undefined
    const label =
      tr.TrainingStandard?.descriptionShort ?? tr.TrainingStandard?.description ?? `Training ${tr.trainingNumber}`
    lines.push({
      workOrderId: wo.id,
      type: 'training',
      sourceId: tr.id,
      sourceLabel: label,
      quantity: 1,
      unit: match?.unit ?? 'T',
      priceListItemId: match?.itemId ?? null,
      unitPriceBase: match?.basePrice ?? null,
      unitPriceFinal: match ? applyMargin(match.basePrice, costMargin) : null,
      lineTotalFinal: match ? applyMargin(match.basePrice, costMargin) * 1 : null,
      unmatched: !match,
    })
  }

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
  }
}

export function mapInvoiceOut(r: InvoiceOutRaw): MappedInvoiceOut {
  const vatPct = r.VatMargin.vat

  // Build price map from invoice-level price list
  const priceItems = r.PriceList?.PriceListItem ?? []
  const priceMap = buildTargetPriceMap(priceItems)
  const costMargin = priceItems.find(i => i.isCostMargin)?.price.toNumber() ?? 0

  const workOrders = r.WorkOrderInvoice.map(w => mapWorkOrderWithLines(w, priceMap, costMargin))

  const subtotalExVat = workOrders.flatMap(wo => wo.billingLines).reduce((sum, l) => sum + (l.lineTotalFinal ?? 0), 0)
  const vatAmount = subtotalExVat * (vatPct / 100)
  const totalInclVat = subtotalExVat + vatAmount

  return {
    id: r.id,
    invoiceNumber: r.invoiceNumber,
    poNumber: r.poNumber,
    humanId: r.humanId,
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
    vatMarginId: r.vatMarginId,
    vatMarginVat: vatPct,
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
    vatAmount,
    totalInclVat,
  }
}

// ─── InvoiceIn ─────────────────────────────────────────────────────────────────
type InvoiceInRaw = {
  id: string
  invoiceNumber: string
  poNumber: string | null
  humanId: string | null
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
    humanId: r.humanId,
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
