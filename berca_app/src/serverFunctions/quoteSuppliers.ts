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
  quoteSupplierSentSchema,
  quoteSupplierReceivedSchema,
} from '@/schemas/quoteSupplierSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {ensurePurchaseFromApprovedQuote} from '@/dal/purchases'

const REVALIDATE_DEPARTMENTS_PATH = '/departments'
const REVALIDATE_PURCHASES_PATH = '/departments/purchasing/orders'
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
  // Increment until we find a quote number that is not already used.
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

function getHighestRoleLevel(profile: {RoleLevelEmployee: Array<{RoleLevel: {SubRole: {level: number}}}>}): number {
  return Math.max(0, ...profile.RoleLevelEmployee.map(row => row.RoleLevel.SubRole.level))
}

async function assertMaterialIsSupplierLinked(companyId: string, materialId: string) {
  const supplierLink = await prismaClient.materialSupplier.findFirst({
    where: {companyId, materialId},
    select: {id: true},
  })

  if (!supplierLink) {
    throw new Error('Selected material is not linked to the chosen supplier.')
  }
}

export const createQuoteSupplierAction = protectedServerFunction({
  schema: createQuoteSupplierSchema,
  functionName: 'Create quote supplier action',
  serverFn: async ({data, profile, logger}) => {
    if (data.initialMaterialId) {
      await assertMaterialIsSupplierLinked(data.companyId, data.initialMaterialId)
    }

    if (data.initialMaterialDemandId) {
      const existingForDemand = await prismaClient.quoteSupplierLine.findMany({
        where: {materialDemandId: data.initialMaterialDemandId},
        select: {
          QuoteSupplier: {
            select: {
              deleted: true,
              sent: true,
              acceptedForPOB: true,
            },
          },
        },
      })
      // Only allow one active (unsent or unapproved) quote per demand.
      if (existingForDemand.some(line => !line.QuoteSupplier.deleted && !(line.QuoteSupplier.sent && line.QuoteSupplier.acceptedForPOB))) {
        throw new Error('A quote already exists for this material demand.')
      }
    }

    if (data.initialMaterialId && data.initialMaterialDemandId) {
      const reusableQuote = await prismaClient.quoteSupplier.findFirst({
        where: {
          companyId: data.companyId,
          deleted: false,
          rejected: false,
          acceptedForPOB: false,
          sent: false,
        },
        orderBy: {quoteNumber: 'desc'},
        select: {id: true},
      })

      // Reuse the latest unsent quote for the same supplier instead of creating a new header.
      if (reusableQuote) {
        await prismaClient.quoteSupplierLine.create({
          data: {
            id: crypto.randomUUID(),
            quoteSupplierId: reusableQuote.id,
            materialId: data.initialMaterialId,
            materialDemandId: data.initialMaterialDemandId,
            quantity: data.initialQuantity ?? 1,
            unitPrice: 0,
            minQuantity: null,
            selected: false,
          },
        })

        logger.info(`Quote line added to existing unsent quote ${reusableQuote.id} from material demand ${data.initialMaterialDemandId}`)
        revalidatePath(REVALIDATE_DEPARTMENTS_PATH, 'layout')
        return
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

    if (data.acceptedForPOB ?? false) {
      // Approved quotes ensure a matching purchase order in the purchasing module.
      const result = await ensurePurchaseFromApprovedQuote(id, profile.id)
      if (result.purchaseId) {
        logger.info(`Purchase ensured from quote create approval: quote=${id}, purchase=${result.purchaseId}`)
        revalidatePath(REVALIDATE_PURCHASES_PATH)
      }
    }

    revalidatePath(REVALIDATE_DEPARTMENTS_PATH, 'layout')
  },
})

export const updateQuoteSupplierAction = protectedServerFunction({
  schema: updateQuoteSupplierSchema,
  functionName: 'Update quote supplier action',
  serverFn: async ({data: {id, ...data}, profile, logger}) => {
    const before = await prismaClient.quoteSupplier.findUnique({
      where: {id},
      select: {acceptedForPOB: true, rejected: true},
    })
    if (!before) {
      throw new Error('Quote supplier not found.')
    }

    const highestRoleLevel = getHighestRoleLevel(profile)
    const canManageApprovedQuotes = highestRoleLevel >= 80
    if (before.acceptedForPOB && !canManageApprovedQuotes) {
      throw new Error('Only managers can edit an approved quote.')
    }

    const quoteNumber = normalizeQuoteNumber(data.quoteNumber)

    if (!quoteNumber) {
      throw new Error('Quote number cannot be empty.')
    }

    if (await quoteNumberExistsExcludingId(quoteNumber, id)) {
      throw new Error(`Quote number ${quoteNumber} already exists.`)
    }

    const nextRejected = data.rejected ?? false
    const nextApproved = data.acceptedForPOB ?? false

    await prismaClient.quoteSupplier.update({
      where: {id},
      data: {
        quoteNumber,
        quotationNumber: data.quotationNumber ?? null,
        companyId: data.companyId,
        description: data.description ?? null,
        rejected: nextRejected,
        rejectedAt: nextRejected ? (before.rejected ? undefined : new Date()) : null,
        rejectedBy: nextRejected ? (before.rejected ? undefined : profile.id) : null,
        additionalInfo: data.additionalInfo ?? null,
        acceptedForPOB: nextApproved,
        approvedAt: nextApproved ? (!before.acceptedForPOB ? new Date() : undefined) : null,
        approvedBy: nextApproved ? (!before.acceptedForPOB ? profile.id : undefined) : null,
        validUntil: toDate(data.validUntil),
        deliveryTimeDays: data.deliveryTimeDays ?? null,
        paymentConditionId: data.paymentConditionId ?? null,
      },
    })

    if (!before.acceptedForPOB && nextApproved) {
      // Newly approved quotes trigger a purchase order check/create.
      const result = await ensurePurchaseFromApprovedQuote(id, profile.id)
      if (result.purchaseId) {
        logger.info(`Purchase ensured from quote approval: quote=${id}, purchase=${result.purchaseId}`)
        revalidatePath(REVALIDATE_PURCHASES_PATH)
      }
    }

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

export const setQuoteSupplierSentAction = protectedServerFunction({
  schema: quoteSupplierSentSchema,
  functionName: 'Set quote supplier sent action',
  serverFn: async ({data: {id, sent}, profile, logger}) => {
    const existing = await prismaClient.quoteSupplier.findUnique({
      where: {id},
      select: {acceptedForPOB: true},
    })
    if (!existing) throw new Error('Quote supplier not found.')
    const highestRoleLevel = getHighestRoleLevel(profile)
    if (existing.acceptedForPOB && highestRoleLevel < 80) {
      throw new Error('Only managers can edit an approved quote.')
    }

    await prismaClient.quoteSupplier.update({
      where: {id},
      data: sent
        ? {
            sent: true,
            sentAt: new Date(),
            sentBy: profile.id,
          }
        : {
            // Reset received flags when moving back to unsent.
            sent: false,
            sentAt: null,
            sentBy: null,
            received: false,
            receivedAt: null,
            receivedBy: null,
          },
    })

    logger.info(`Quote sent state updated: ${id} -> ${sent}`)
    revalidatePath(REVALIDATE_DEPARTMENTS_PATH, 'layout')
  },
})

export const setQuoteSupplierReceivedAction = protectedServerFunction({
  schema: quoteSupplierReceivedSchema,
  functionName: 'Set quote supplier received action',
  serverFn: async ({data: {id, received}, profile, logger}) => {
    const existing = await prismaClient.quoteSupplier.findUnique({
      where: {id},
      select: {sent: true, acceptedForPOB: true},
    })
    if (!existing) throw new Error('Quote supplier not found.')
    const highestRoleLevel = getHighestRoleLevel(profile)
    if (existing.acceptedForPOB && highestRoleLevel < 80) {
      throw new Error('Only managers can edit an approved quote.')
    }

    await prismaClient.quoteSupplier.update({
      where: {id},
      data: received
        ? {
            // Ensure sent timestamps are populated when receiving directly.
            sent: true,
            sentAt: existing.sent ? undefined : new Date(),
            sentBy: existing.sent ? undefined : profile.id,
            received: true,
            receivedAt: new Date(),
            receivedBy: profile.id,
          }
        : {
            received: false,
            receivedAt: null,
            receivedBy: null,
          },
    })

    logger.info(`Quote received state updated: ${id} -> ${received}`)
    revalidatePath(REVALIDATE_DEPARTMENTS_PATH, 'layout')
  },
})

