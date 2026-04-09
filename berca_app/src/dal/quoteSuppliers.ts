import 'server-only'
import {prismaClient} from '@/dal/prismaClient'
import {Prisma} from '@/generated/prisma/client'

const employeeSelect = {select: {id: true, firstName: true, lastName: true}} as const

const paymentConditionInclude = {
  Employee_PaymentCondition_createdByToEmployee: employeeSelect,
  Employee_PaymentCondition_deletedByToEmployee: employeeSelect,
} as const

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
    orderBy: {id: 'asc'},
  },
} as const

export async function getQuoteSuppliers() {
  const rows = await prismaClient.quoteSupplier.findMany({
    include: quoteSupplierInclude,
    orderBy: {validUntil: 'desc'},
  })

  const ids = rows.map(row => row.id)
  if (ids.length === 0) return rows.map(row => ({...row, executed: false}))

  try {
    const executedRows = await prismaClient.$queryRaw<Array<{id: string; executed: number | boolean | null}>>(
      Prisma.sql`SELECT id, executed FROM QuoteSupplier WHERE id IN (${Prisma.join(ids)})`,
    )
    const executedMap = new Map(
      executedRows.map(row => [row.id, row.executed === true || row.executed === 1]),
    )
    return rows.map(row => ({...row, executed: executedMap.get(row.id) ?? false}))
  } catch {
    // Keep app operational before the SQL column exists.
    return rows.map(row => ({...row, executed: false}))
  }
}

export async function getQuoteSupplierById(id: string) {
  const row = await prismaClient.quoteSupplier.findUnique({where: {id}, include: quoteSupplierDetailInclude})
  if (!row) return null

  try {
    const executedRows = await prismaClient.$queryRaw<Array<{executed: number | boolean | null}>>(
      Prisma.sql`SELECT executed FROM QuoteSupplier WHERE id = ${id}`,
    )
    const executed = executedRows[0]?.executed === true || executedRows[0]?.executed === 1
    return {...row, executed}
  } catch {
    return {...row, executed: false}
  }
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

