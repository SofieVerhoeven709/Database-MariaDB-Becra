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
export type BillingLineType = 'hours' | 'material' | 'training'

export interface MappedBillingLine {
  workOrderId: string
  type: BillingLineType
  sourceId: string
  sourceLabel: string
  quantity: number
  unit: string
  priceListItemId: string | null
  unitPriceBase: number | null
  unitPriceFinal: number | null
  lineTotalFinal: number | null
  unmatched: boolean
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
  priceListId: string | null // ← new
  priceListName: string | null // ← new
  contacts: MappedInvoiceOutContact[]
  workOrders: MappedInvoiceOutWorkOrder[]
  subtotalExVat: number
  vatAmount: number
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
