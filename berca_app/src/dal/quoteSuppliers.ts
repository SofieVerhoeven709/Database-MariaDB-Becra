import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

const REQUIRED_PAYMENT_CONDITIONS = [
  '14 days',
  '30 days invoice date',
  '30 days end of month',
  '60 days invoice date',
  '60 days end of month',
] as const

// Prevent concurrent normalize/seed runs in the same server process.
let ensurePaymentConditionsPromise: Promise<void> | null = null

const PAYMENT_CONDITION_ALIASES: Record<string, string> = {
  '14 dagen': '14 days',
  '30 dagen': '30 days invoice date',
  '30 dagen factuurdatum': '30 days invoice date',
  '30 days': '30 days invoice date',
  '30 dagen einde maand': '30 days end of month',
  '60 dagen': '60 days invoice date',
  '60 dagen factuurdatum': '60 days invoice date',
  '60 days': '60 days invoice date',
  '60 dats end of month': '60 days end of month',
  '60 dagen einde maand': '60 days end of month',
}

function normalizePaymentConditionName(name: string): string {
  const trimmed = name.trim()
  return PAYMENT_CONDITION_ALIASES[trimmed.toLowerCase()] ?? trimmed
}

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
  QuoteSupplierMiscLine: {
    // Stable order for misc line rendering.
    orderBy: {id: 'asc'},
  },
} as const

async function normalizeAndMergePaymentConditions() {
  const rows = await prismaClient.paymentCondition.findMany({
    select: {id: true, name: true, deleted: true, createdAt: true},
    orderBy: {createdAt: 'asc'},
  })

  const grouped = new Map<string, typeof rows>()
  for (const row of rows) {
    const normalized = normalizePaymentConditionName(row.name)
    const list = grouped.get(normalized) ?? []
    list.push(row)
    grouped.set(normalized, list)
  }

  for (const [normalizedName, group] of grouped) {
    const keeper = group.find(row => !row.deleted) ?? group[0]
    if (!keeper) continue

    if (keeper.name !== normalizedName || keeper.deleted) {
      await prismaClient.paymentCondition.updateMany({
        where: {id: keeper.id},
        data: {
          name: normalizedName,
          deleted: false,
          deletedAt: null,
          deletedBy: null,
        },
      })
    }

    for (const row of group) {
      if (row.id === keeper.id) continue

      await prismaClient.quoteSupplier.updateMany({
        where: {paymentConditionId: row.id},
        data: {paymentConditionId: keeper.id},
      })

      await prismaClient.purchase.updateMany({
        where: {paymentConditionId: row.id},
        data: {paymentConditionId: keeper.id},
      })

      await prismaClient.paymentCondition.updateMany({
        where: {id: row.id},
        data: {
          name: normalizedName,
          deleted: true,
          deletedAt: new Date(),
        },
      })
    }
  }
}

async function ensureDefaultPaymentConditions() {
  if (ensurePaymentConditionsPromise) {
    await ensurePaymentConditionsPromise
    return
  }

  ensurePaymentConditionsPromise = (async () => {
    await normalizeAndMergePaymentConditions()

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
        await prismaClient.paymentCondition.updateMany({
          where: {id: row.id},
          data: {deleted: false, deletedAt: null, deletedBy: null},
        })
      }
    }
  })()

  try {
    await ensurePaymentConditionsPromise
  } finally {
    ensurePaymentConditionsPromise = null
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
