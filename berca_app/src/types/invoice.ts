// ─── Shared lookup types ───────────────────────────────────────────────────────
export interface InvoiceLookup {
  id: string
  name: string
}

export interface VatMarginOption {
  id: string
  vat: number
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
