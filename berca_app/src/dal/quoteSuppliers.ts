import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

const REQUIRED_PAYMENT_CONDITIONS = ['14 dagen', '30 dagen', '60 dagen', '30 dagen einde maand'] as const

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

async function ensureDefaultPaymentConditions() {
  const existing = await prismaClient.paymentCondition.findMany({
    where: {name: {in: [...REQUIRED_PAYMENT_CONDITIONS]}},
    select: {id: true, name: true, deleted: true},
  })

  const byName = new Map(existing.map(row => [row.name, row]))
  const firstEmployee = await prismaClient.employee.findFirst({select: {id: true}, orderBy: {createdAt: 'asc'}})
  if (!firstEmployee) return

  for (const name of REQUIRED_PAYMENT_CONDITIONS) {
    const row = byName.get(name)
    if (!row) {
      await prismaClient.paymentCondition.create({
        data: {
          id: crypto.randomUUID(),
          name,
          createdAt: new Date(),
          createdBy: firstEmployee.id,
          deleted: false,
        },
      })
      continue
    }

    if (row.deleted) {
      await prismaClient.paymentCondition.update({
        where: {id: row.id},
        data: {deleted: false, deletedAt: null, deletedBy: null},
      })
    }
  }
}

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
  await ensureDefaultPaymentConditions()
  return prismaClient.paymentCondition.findMany({
    where: {deleted: false},
    select: {id: true, name: true},
    orderBy: {name: 'asc'},
  })
}

export async function getPaymentConditions() {
  await ensureDefaultPaymentConditions()
  return prismaClient.paymentCondition.findMany({
    include: paymentConditionInclude,
    orderBy: {name: 'asc'},
  })
}
