// ─── Shared lookup types ───────────────────────────────────────────────────────
export interface InvoiceLookup {
  id: string
  name: string
}

export interface VatMarginOption {
  id: string
  vat: number
}

// ─── Billing lines ─────────────────────────────────────────────────────────────
export type BillingLineType = 'hours' | 'material' | 'training'

export interface MappedBillingLine {
  workOrderId: string
  type: BillingLineType
  // What the line represents
  sourceId: string // hourTypeId, materialId, trainingId
  sourceLabel: string // name shown in the table
  // Quantity
  quantity: number // hours worked, material quantity, or 1 for training
  unit: string // 'h', material unit, or 'session'
  // Pricing — null if no matching pricelist item
  priceListItemId: string | null
  unitPriceBase: number | null // before cost margin
  unitPriceFinal: number | null // after cost margin baked in
  lineTotalFinal: number | null // unitPriceFinal * quantity
  unmatched: boolean // true when no pricelist item found
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
  contacts: MappedInvoiceOutContact[]
  workOrders: MappedInvoiceOutWorkOrder[]
  // Totals — computed from billing lines
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
