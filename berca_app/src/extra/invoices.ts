import {MappedInvoiceIn, MappedInvoiceOut, MappedInvoiceOutContact} from '@/types/invoice'

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
  InvoiceType: {id: string; name: string}
  Employee: {id: string; firstName: string; lastName: string}
  PaymentMethod: {id: string; name: string}
  InvoiceSentType: {id: string; name: string}
  InvoiceStatus: {id: string; name: string}
  VatMargin: {id: string; vat: number}
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
}

export function mapInvoiceOut(r: InvoiceOutRaw): MappedInvoiceOut {
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
    vatMarginVat: r.VatMargin.vat,
    contacts: r.InvoiceOutContact.map(
      (c): MappedInvoiceOutContact => ({
        id: c.id,
        contactId: c.contactId,
        contactName: `${c.Contact.firstName} ${c.Contact.lastName}`,
        contactMail: c.Contact.mail1,
        contactPhone: c.Contact.generalPhone,
      }),
    ),
  }
}

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
