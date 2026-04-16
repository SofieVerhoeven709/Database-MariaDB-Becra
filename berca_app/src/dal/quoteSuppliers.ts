import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

const employeeSelect = {select: {id: true, firstName: true, lastName: true}} as const

// Shared include shape for payment condition audit data.
const paymentConditionInclude = {
  Employee_PaymentCondition_createdByToEmployee: employeeSelect,
  Employee_PaymentCondition_deletedByToEmployee: employeeSelect,
} as const

// Include the relations needed for list rendering and line counts.
const quoteSupplierInclude = {
  Employee: employeeSelect,
  Employee_QuoteSupplier_deletedByToEmployee: employeeSelect,
  Company: {select: {id: true, name: true, number: true}},
  PaymentCondition: {select: {id: true, name: true}},
  _count: {select: {QuoteSupplierLine: true}},
} as const

const quoteSupplierDetailInclude = {
  ...quoteSupplierInclude,
  QuoteSupplierLine: {
    include: {
      Material: {select: {id: true, beNumber: true, name: true, shortDescription: true}},
      PurchaseBOMStructure: {
        where: {deleted: false},
        select: {id: true},
      },
      MaterialDemand: {
        select: {
          id: true,
          Material: {select: {id: true, beNumber: true, name: true, shortDescription: true}},
        },
      },
    },
    // Stable order for detail line rendering.
    orderBy: {id: 'asc'},
  },
} as const

export async function getQuoteSuppliers() {
  return prismaClient.quoteSupplier.findMany({
    include: quoteSupplierInclude,
    orderBy: {validUntil: 'desc'},
  })
}

export async function getQuoteSupplierById(id: string) {
  return prismaClient.quoteSupplier.findUnique({where: {id}, include: quoteSupplierDetailInclude})
}

export async function getPaymentConditionOptions() {
  return prismaClient.paymentCondition.findMany({
    where: {deleted: false},
    select: {id: true, name: true},
    orderBy: {name: 'asc'},
  })
}

export async function getPaymentConditions() {
  return prismaClient.paymentCondition.findMany({
    include: paymentConditionInclude,
    orderBy: {name: 'asc'},
  })
}
