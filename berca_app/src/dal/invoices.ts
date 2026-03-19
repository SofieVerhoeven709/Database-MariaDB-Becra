import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

// ─── Shared includes ───────────────────────────────────────────────────────────
const invoiceOutInclude = {
  InvoiceType: {select: {id: true, name: true}},
  Employee: {select: {id: true, firstName: true, lastName: true}},
  PaymentMethod: {select: {id: true, name: true}},
  InvoiceSentType: {select: {id: true, name: true}},
  InvoiceStatus: {select: {id: true, name: true}},
  VatMargin: {select: {id: true, vat: true}},
  InvoiceOutContact: {
    include: {
      Contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          mail1: true,
          generalPhone: true,
        },
      },
    },
  },
} as const

const invoiceInInclude = {
  InvoiceType: {select: {id: true, name: true}},
  Employee: {select: {id: true, firstName: true, lastName: true}},
  PaymentMethod: {select: {id: true, name: true}},
  InvoiceSentType: {select: {id: true, name: true}},
  InvoiceStatus: {select: {id: true, name: true}},
  VatMargin: {select: {id: true, vat: true}},
  Company: {select: {id: true, name: true}},
} as const

// ─── InvoiceOut ────────────────────────────────────────────────────────────────
export async function getInvoicesOut() {
  return prismaClient.invoiceOut.findMany({
    include: invoiceOutInclude,
    orderBy: {invoiceDate: 'desc'},
  })
}

export async function getInvoiceOutById(id: string) {
  return prismaClient.invoiceOut.findUniqueOrThrow({
    where: {id},
    include: invoiceOutInclude,
  })
}

// ─── InvoiceIn ─────────────────────────────────────────────────────────────────
export async function getInvoicesIn() {
  return prismaClient.invoiceIn.findMany({
    include: invoiceInInclude,
    orderBy: {invoiceDate: 'desc'},
  })
}

export async function getInvoiceInById(id: string) {
  return prismaClient.invoiceIn.findUniqueOrThrow({
    where: {id},
    include: invoiceInInclude,
  })
}

// ─── Lookup tables ─────────────────────────────────────────────────────────────
export async function getInvoiceTypes() {
  return prismaClient.invoiceType.findMany({
    where: {deleted: false},
    select: {id: true, name: true},
    orderBy: {name: 'asc'},
  })
}

export async function getPaymentMethods() {
  return prismaClient.paymentMethod.findMany({
    where: {deleted: false},
    select: {id: true, name: true},
    orderBy: {name: 'asc'},
  })
}

export async function getInvoiceSentTypes() {
  return prismaClient.invoiceSentType.findMany({
    where: {deleted: false},
    select: {id: true, name: true},
    orderBy: {name: 'asc'},
  })
}

export async function getInvoiceStatuses() {
  return prismaClient.invoiceStatus.findMany({
    where: {deleted: false},
    select: {id: true, name: true},
    orderBy: {name: 'asc'},
  })
}

export async function getVatMargins() {
  return prismaClient.vatMargin.findMany({
    where: {deleted: false},
    select: {id: true, vat: true},
    orderBy: {vat: 'asc'},
  })
}
