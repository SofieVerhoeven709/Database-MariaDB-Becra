// ─── Shared lookup types ───────────────────────────────────────────────────────
export interface InvoiceLookup {
  id: string
  name: string
}

export interface VatMarginOption {
  id: string
  vat: number
}

export interface PriceListOption {
  id: string
  name: string
}

// ─── Billing lines ─────────────────────────────────────────────────────────────
export type BillingLineType = 'hours' | 'material' | 'training' | 'stay_over'

export interface MappedBillingLine {
  workOrderId: string
  type: BillingLineType
  sourceId: string
  sourceLabel: string
  timeRegistryIds?: string[]
  quantity: number
  unit: string
  priceListItemId: string | null
  unitPriceBase: number | null
  unitPriceFinal: number | null
  lineTotalFinal: number | null
  vatMarginId: string | null
  vatRate: number | null
  lineVatAmount: number | null
  lineTotalInclVat: number | null
  unmatched: boolean
  workOrderStructureId?: string // For materials with VAT
}

// ─── InvoiceOut ────────────────────────────────────────────────────────────────
export interface MappedInvoiceOutWorkOrder {
  id: string
  workOrderInvoiceId: string
  workOrderNumber: string | null
  description: string | null
  completed: boolean
  hoursMaterialClosed: boolean
  projectId: string
  projectNumber: string
  projectName: string
  companyId: string
  companyName: string
  billingLines: MappedBillingLine[]
  // VAT calculation per work order
  subtotalExVat: number
  vatByRate: Array<{rate: number; amount: number}> // VAT grouped by rate
  totalVat: number
  totalInclVat: number
}

export interface MappedInvoiceOut {
  id: string
  invoiceNumber: string
  poNumber: string | null
  humanId: string | null
  invoiceDate: string
  createdAt: string
  dueDate: string
  sentDate: string | null
  deletedAt: string | null
  modifiedAt: string | null
  reminderSent: boolean
  outstanding: boolean
  deleted: boolean
  deletedBy: string | null
  deletedByName: string | null
  createdBy: string
  createdByName: string
  modifiedBy: string | null
  modifiedByName: string | null
  invoiceTypeId: string
  invoiceTypeName: string
  targetId: string
  paymentMethodId: string
  paymentMethodName: string
  invoiceSentTypeId: string
  invoiceSentTypeName: string
  invoiceStatusId: string
  invoiceStatusName: string
  vatMarginId: string
  vatMarginVat: number
  // Optional price list used to calculate billing totals.
  priceListId: string | null
  priceListName: string | null
  contacts: MappedInvoiceOutContact[]
  workOrders: MappedInvoiceOutWorkOrder[]
  subtotalExVat: number
  // VAT breakdown by rate across all work orders
  vatByRate: Array<{rate: number; amount: number}>
  totalVat: number
  totalInclVat: number
}

export interface MappedInvoiceOutContact {
  id: string
  contactId: string
  contactName: string
  contactMail: string | null
  contactPhone: string | null
}

// ─── InvoiceIn ─────────────────────────────────────────────────────────────────
export interface MappedInvoiceIn {
  id: string
  invoiceNumber: string
  poNumber: string | null
  humanId: string | null
  invoiceDate: string
  createdAt: string
  dueDate: string
  deletedAt: string | null
  modifiedAt: string | null
  reminderSent: boolean
  outstanding: boolean
  deleted: boolean
  deletedBy: string | null
  deletedByName: string | null
  createdBy: string
  createdByName: string
  modifiedBy: string | null
  modifiedByName: string | null
  invoiceTypeId: string
  invoiceTypeName: string
  targetId: string
  paymentMethodId: string
  paymentMethodName: string
  invoiceSentTypeId: string
  invoiceSentTypeName: string
  invoiceStatusId: string
  invoiceStatusName: string
  vatMarginId: string
  vatMarginVat: number
  companyId: string
  companyName: string
}
