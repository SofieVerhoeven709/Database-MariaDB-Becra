'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {
  createQuoteSupplierSchema,
  updateQuoteSupplierSchema,
  quoteSupplierIdSchema,
  createPaymentConditionSchema,
  updatePaymentConditionSchema,
  paymentConditionIdSchema,
  quoteSupplierExecutedSchema,
} from '@/schemas/quoteSupplierSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'

const REVALIDATE_DEPARTMENTS_PATH = '/departments'
const QUOTE_NUMBER_BASE = 1_000_000
const QUOTE_NUMBER_PREFIX = 'Q'

function parseQuoteNumber(value: string | null | undefined): number | null {
  if (!value) return null
  const match = /^Q(\d+)$/.exec(value.trim().toUpperCase())
  if (!match) return null
  const parsed = Number.parseInt(match[1], 10)
  return Number.isFinite(parsed) ? parsed : null
}

function formatQuoteNumber(n: number): string {
  return `${QUOTE_NUMBER_PREFIX}${n}`
}

async function quoteNumberExists(quoteNumber: string): Promise<boolean> {
  const existing = await prismaClient.quoteSupplier.findFirst({
    where: {quoteNumber},
    select: {id: true},
  })
  return !!existing
}

async function quoteNumberExistsExcludingId(quoteNumber: string, excludeId: string): Promise<boolean> {
  const existing = await prismaClient.quoteSupplier.findFirst({
    where: {
      quoteNumber,
      NOT: {id: excludeId},
    },
    select: {id: true},
  })
  return !!existing
}

async function getNextQuoteNumber(): Promise<string> {
  const rows = await prismaClient.quoteSupplier.findMany({
    select: {quoteNumber: true},
  })

  const max = rows.reduce((acc, row) => {
    const parsed = parseQuoteNumber(row.quoteNumber)
    return parsed !== null && parsed > acc ? parsed : acc
  }, QUOTE_NUMBER_BASE - 1)

  return formatQuoteNumber(Math.max(QUOTE_NUMBER_BASE, max + 1))
}

async function getNextAvailableQuoteNumber(): Promise<string> {
  let candidate = await getNextQuoteNumber()
  let parsed = parseQuoteNumber(candidate) ?? QUOTE_NUMBER_BASE
  while (await quoteNumberExists(candidate)) {
    parsed += 1
    candidate = formatQuoteNumber(parsed)
  }
  return candidate
}

function toDate(val: string | null | undefined): Date | null {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

function normalizeQuoteNumber(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

export const createQuoteSupplierAction = protectedServerFunction({
  schema: createQuoteSupplierSchema,
  functionName: 'Create quote supplier action',
  serverFn: async ({data, profile, logger}) => {
    if (data.initialMaterialDemandId) {
      const existingForDemand = await prismaClient.quoteSupplierLine.findMany({
        where: {materialDemandId: data.initialMaterialDemandId},
        select: {
          QuoteSupplier: {
            select: {
              deleted: true,
              executed: true,
              acceptedForPOB: true,
            },
          },
        },
      })
      if (existingForDemand.some(line => !line.QuoteSupplier.deleted && !(line.QuoteSupplier.executed && line.QuoteSupplier.acceptedForPOB))) {
        throw new Error('A quote already exists for this material demand.')
      }
    }

    const id = crypto.randomUUID()
    const manualQuoteNumber = normalizeQuoteNumber(data.quoteNumber)
    const hasManualOverride = manualQuoteNumber.length > 0
    const quoteNumber = hasManualOverride ? manualQuoteNumber : await getNextAvailableQuoteNumber()

    if (hasManualOverride && (await quoteNumberExists(quoteNumber))) {
      throw new Error(`Quote number ${quoteNumber} already exists.`)
    }

    logger.info(`Creating quote supplier, createdBy: ${profile.id}`)
    await prismaClient.quoteSupplier.create({
      data: {
        id,
        quoteNumber,
        quotationNumber: data.quotationNumber ?? null,
        companyId: data.companyId,
        description: data.description ?? null,
        rejected: data.rejected ?? false,
        additionalInfo: data.additionalInfo ?? null,
        acceptedForPOB: data.acceptedForPOB ?? false,
        validUntil: toDate(data.validUntil),
        deliveryTimeDays: data.deliveryTimeDays ?? null,
        paymentConditionId: data.paymentConditionId ?? null,
        createdBy: profile.id,
      },
    })

    if (data.initialMaterialId) {
      await prismaClient.quoteSupplierLine.create({
        data: {
          id: crypto.randomUUID(),
          quoteSupplierId: id,
          materialId: data.initialMaterialId,
          materialDemandId: data.initialMaterialDemandId ?? null,
          quantity: data.initialQuantity ?? 1,
          unitPrice: 0,
          minQuantity: null,
          selected: false,
        },
      })
      logger.info(`Initial quote line created for quote ${id} and material ${data.initialMaterialId}`)
    }

    logger.info(`Quote supplier created: ${id}`)
    revalidatePath(REVALIDATE_DEPARTMENTS_PATH, 'layout')
  },
})

export const updateQuoteSupplierAction = protectedServerFunction({
  schema: updateQuoteSupplierSchema,
  functionName: 'Update quote supplier action',
  serverFn: async ({data: {id, ...data}, logger}) => {
    const quoteNumber = normalizeQuoteNumber(data.quoteNumber)

    if (!quoteNumber) {
      throw new Error('Quote number cannot be empty.')
    }

    if (await quoteNumberExistsExcludingId(quoteNumber, id)) {
      throw new Error(`Quote number ${quoteNumber} already exists.`)
    }

    await prismaClient.quoteSupplier.update({
      where: {id},
      data: {
        quoteNumber,
        quotationNumber: data.quotationNumber ?? null,
        companyId: data.companyId,
        description: data.description ?? null,
        rejected: data.rejected ?? false,
        additionalInfo: data.additionalInfo ?? null,
        acceptedForPOB: data.acceptedForPOB ?? false,
        validUntil: toDate(data.validUntil),
        deliveryTimeDays: data.deliveryTimeDays ?? null,
        paymentConditionId: data.paymentConditionId ?? null,
      },
    })
    logger.info(`Quote supplier updated: ${id}`)
    revalidatePath(REVALIDATE_DEPARTMENTS_PATH, 'layout')
  },
})

export const softDeleteQuoteSupplierAction = protectedServerFunction({
  schema: quoteSupplierIdSchema,
  functionName: 'Soft delete quote supplier action',
  serverFn: async ({data, profile, logger}) => {
    const {id} = data
    await prismaClient.quoteSupplier.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Quote supplier soft deleted: ${id}`)
    revalidatePath(REVALIDATE_DEPARTMENTS_PATH, 'layout')
  },
})

export const hardDeleteQuoteSupplierAction = protectedServerFunction({
  schema: quoteSupplierIdSchema,
  functionName: 'Hard delete quote supplier action',
  serverFn: async ({data, logger}) => {
    const {id} = data
    await prismaClient.quoteSupplier.delete({where: {id}})
    logger.info(`Quote supplier hard deleted: ${id}`)
    revalidatePath(REVALIDATE_DEPARTMENTS_PATH, 'layout')
  },
})

export const undeleteQuoteSupplierAction = protectedServerFunction({
  schema: quoteSupplierIdSchema,
  functionName: 'Undelete quote supplier action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.quoteSupplier.update({
      where: {id},
      data: {deleted: false, deletedAt: null, deletedBy: null},
    })
    logger.info(`Quote supplier undeleted: ${id}`)
    revalidatePath(REVALIDATE_DEPARTMENTS_PATH, 'layout')
  },
})

export const createPaymentConditionAction = protectedServerFunction({
  schema: createPaymentConditionSchema,
  functionName: 'Create payment condition action',
  serverFn: async ({data, profile, logger}) => {
    await prismaClient.paymentCondition.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name,
        createdAt: new Date(),
        createdBy: profile.id,
        deleted: false,
      },
    })
    logger.info(`Payment condition created: ${data.name}`)
    revalidatePath(REVALIDATE_DEPARTMENTS_PATH, 'layout')
  },
})

export const updatePaymentConditionAction = protectedServerFunction({
  schema: updatePaymentConditionSchema,
  functionName: 'Update payment condition action',
  serverFn: async ({data: {id, name}, logger}) => {
    await prismaClient.paymentCondition.update({
      where: {id},
      data: {name},
    })
    logger.info(`Payment condition updated: ${id}`)
    revalidatePath(REVALIDATE_DEPARTMENTS_PATH, 'layout')
  },
})

export const softDeletePaymentConditionAction = protectedServerFunction({
  schema: paymentConditionIdSchema,
  functionName: 'Soft delete payment condition action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.paymentCondition.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Payment condition soft deleted: ${id}`)
    revalidatePath(REVALIDATE_DEPARTMENTS_PATH, 'layout')
  },
})

export const hardDeletePaymentConditionAction = protectedServerFunction({
  schema: paymentConditionIdSchema,
  functionName: 'Hard delete payment condition action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.paymentCondition.delete({where: {id}})
    logger.info(`Payment condition hard deleted: ${id}`)
    revalidatePath(REVALIDATE_DEPARTMENTS_PATH, 'layout')
  },
})

export const undeletePaymentConditionAction = protectedServerFunction({
  schema: paymentConditionIdSchema,
  functionName: 'Undelete payment condition action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.paymentCondition.update({
      where: {id},
      data: {deleted: false, deletedAt: null, deletedBy: null},
    })
    logger.info(`Payment condition undeleted: ${id}`)
    revalidatePath(REVALIDATE_DEPARTMENTS_PATH, 'layout')
  },
})

export const setQuoteSupplierExecutedAction = protectedServerFunction({
  schema: quoteSupplierExecutedSchema,
  functionName: 'Set quote supplier executed action',
  serverFn: async ({data: {id, executed}, logger}) => {

    try {
      await prismaClient.$executeRaw`UPDATE QuoteSupplier SET executed = ${executed ? 1 : 0} WHERE id = ${id}`
    } catch {
      throw new Error('Missing QuoteSupplier.executed column. Please apply the MariaDB ALTER TABLE script first.')
    }

    logger.info(`Quote executed state updated: ${id} -> ${executed}`)
    revalidatePath(REVALIDATE_DEPARTMENTS_PATH, 'layout')
  },
})

