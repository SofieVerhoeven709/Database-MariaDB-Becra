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
  WorkOrderInvoice: {
    where: {deleted: false},
    include: {
      WorkOrder: {
        select: {
          id: true,
          workOrderNumber: true,
          description: true,
          completed: true,
          hoursMaterialClosed: true,
          projectId: true,
          Project: {
            select: {
              id: true,
              projectNumber: true,
              projectName: true,
              companyId: true,
              Company: {select: {id: true, name: true}},
            },
          },
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

// ─── Company contacts for invoice (contacts linked to the project's company) ──
export async function getCompanyContactsForInvoice(companyIds: string[]) {
  if (companyIds.length === 0) return []
  return prismaClient.companyContact.findMany({
    where: {
      deleted: false,
      companyId: {in: companyIds},
      endDate: null,
    },
    select: {
      id: true,
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
    orderBy: {Contact: {lastName: 'asc'}},
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

export async function getOpenProjects() {
  return prismaClient.project.findMany({
    where: {deleted: false, isOpen: true, isClosed: false},
    select: {
      id: true,
      projectNumber: true,
      projectName: true,
      Company: {select: {name: true}},
    },
    orderBy: {projectNumber: 'asc'},
  })
}

export async function getActiveWorkOrdersForProject(projectId: string) {
  return prismaClient.workOrder.findMany({
    where: {deleted: false, completed: false, projectId},
    select: {id: true, workOrderNumber: true, description: true},
    orderBy: {workOrderNumber: 'asc'},
  })
}
