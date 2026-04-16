'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {Prisma} from '@/generated/prisma/client'
import {syncPurchaseBOMStructuresForOrderedApprovedPurchase} from '@/dal/purchases'
import {
  createPurchaseSchema,
  updatePurchaseSchema,
  purchaseIdSchema,
  createPurchaseDetailSchema,
  updatePurchaseDetailSchema,
  purchaseDetailIdSchema,
} from '@/schemas/purchaseSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {generateIncomingDeliveryNumber, generatePurchaseNumber} from '@/lib/utils'

const REVALIDATE_PATH = '/departments/purchasing/orders'
const INCOMING_REVALIDATE_PATH = '/departments/purchasing/incomingDeliveries'
const PURCHASE_STATUSES = new Set(['DRAFT', 'ORDERED', 'PARTIAL_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED'])
// These thresholds mirror the purchasing permission model used by the detail actions below.
const PURCHASE_DETAIL_PERMISSION_LEVELS = {
  edit: 40,
  create: 60,
  softDelete: 80,
  hardDelete: 100,
} as const

function getHighestRoleLevel(profile: {RoleLevelEmployee: Array<{RoleLevel: {SubRole: {level: number}}}>}): number {
  return Math.max(0, ...profile.RoleLevelEmployee.map(row => row.RoleLevel.SubRole.level))
}

function isManagerLevel(profile: {RoleLevelEmployee: Array<{RoleLevel: {SubRole: {level: number}}}>}): boolean {
  return getHighestRoleLevel(profile) >= 80
}

function isOrderedNotSentStatus(status: string | null | undefined): boolean {
  return normalizePurchaseStatus(status) === 'ORDERED'
}

function normalizePurchaseStatus(status: string | null | undefined): string {
  // Guard against invalid or empty statuses from user input.
  // Unknown values fall back to ORDERED so the lifecycle never stores an invalid status.
  if (!status) return 'DRAFT'
  return PURCHASE_STATUSES.has(status) ? status : 'ORDERED'
}

async function assertCanEditPurchase(purchaseId: string) {
  const purchase = await prismaClient.purchase.findUnique({
    where: {id: purchaseId},
    select: {status: true},
  })
  if (!purchase) throw new Error('Purchase not found.')
}

function assertPurchaseDetailPermission(
  profile: {RoleLevelEmployee: Array<{RoleLevel: {SubRole: {level: number}}}>},
  minLevel: number,
  message: string,
) {
  if (getHighestRoleLevel(profile) < minLevel) {
    throw new Error(message)
  }
}

function revalidateDetail(purchaseId: string) {
  revalidatePath(`${REVALIDATE_PATH}/${purchaseId}`)
  revalidatePath(REVALIDATE_PATH)
}

function revalidateIncomingDeliveries(incomingDeliveryId?: string) {
  revalidatePath(INCOMING_REVALIDATE_PATH)
  if (incomingDeliveryId) {
    revalidatePath(`${INCOMING_REVALIDATE_PATH}/${incomingDeliveryId}`)
  }
}

function toDate(val: string | null | undefined): Date | null {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

function toDecimalString(val: string | number | null | undefined): string {
  if (val == null || val === '') return '0.00'
  const n = typeof val === 'number' ? val : Number.parseFloat(val)
  if (!Number.isFinite(n)) return '0.00'
  return n.toFixed(2)
}

async function ensurePendingIncomingLinesFromPurchase(
  tx: Prisma.TransactionClient,
  incomingDeliveryId: string,
  purchaseId: string,
  createdBy: string,
) {
  // Mirror active purchase details into the draft incoming delivery so receiving can start immediately.
  const purchaseDetails = await tx.purchaseDetail.findMany({
    where: {purchaseId, deleted: false},
    select: {id: true, materialId: true, quantity: true, unitPrice: true},
  })

  if (purchaseDetails.length === 0) return

  const existing = await tx.incomingDeliveryLine.findMany({
    where: {incomingDeliveryId, purchaseDetailId: {in: purchaseDetails.map(detail => detail.id)}},
    select: {purchaseDetailId: true},
  })

  const existingPurchaseDetailIds = new Set(existing.map(line => line.purchaseDetailId).filter((id): id is string => !!id))
  const toCreate = purchaseDetails.filter(detail => !existingPurchaseDetailIds.has(detail.id))
  if (toCreate.length === 0) return

  await tx.incomingDeliveryLine.createMany({
    data: toCreate.map(detail => ({
      id: crypto.randomUUID(),
      incomingDeliveryId,
      purchaseDetailId: detail.id,
      materialId: detail.materialId,
      orderedQty: detail.quantity,
      deliveredQty: 0,
      acceptedQty: 0,
      rejectedQty: 0,
      backorderQty: 0,
      unitPrice: detail.unitPrice,
      lineStatus: 'PENDING',
      createdAt: new Date(),
      createdBy,
    })),
  })
}

async function ensureDraftIncomingDeliveryForPurchase(
  tx: Prisma.TransactionClient,
  purchaseId: string,
  createdBy: string,
): Promise<string> {
  // Reuse the first draft incoming delivery if one already exists; otherwise create a unique draft.
  const existing = await tx.incomingDelivery.findFirst({
    where: {purchaseId, deleted: false},
    orderBy: {createdAt: 'asc'},
    select: {id: true},
  })

  if (existing) {
    await ensurePendingIncomingLinesFromPurchase(tx, existing.id, purchaseId, createdBy)
    return existing.id
  }

  let incomingDeliveryNumber = generateIncomingDeliveryNumber()
  let attempts = 0
  let created: {id: string} | null = null

  while (attempts < 5) {
    try {
      created = await tx.incomingDelivery.create({
        data: {
          id: crypto.randomUUID(),
          incomingDeliveryNumber,
          purchaseId,
          status: 'DRAFT',
          deliveryDate: new Date(),
          createdAt: new Date(),
          createdBy,
        },
        select: {id: true},
      })
      break
    } catch (err: unknown) {
      const prismaErr = err as {code?: string}
      if (prismaErr.code === 'P2002') {
        // Retry number generation on unique constraint collisions.
        attempts++
        incomingDeliveryNumber = generateIncomingDeliveryNumber()
        continue
      }
      throw err
    }
  }

  if (!created) {
    throw new Error('Failed to generate a unique incoming delivery number after 5 attempts')
  }

  await ensurePendingIncomingLinesFromPurchase(tx, created.id, purchaseId, createdBy)
  return created.id
}

export const createPurchaseAction = protectedServerFunction({
  schema: createPurchaseSchema,
  functionName: 'Create purchase action',
  serverFn: async ({data, profile, logger}) => {
    const d = data
    logger.info(`Creating purchase, createdBy: ${profile.id}`)

    let purchaseNumber = d.purchaseNumber || generatePurchaseNumber()
    let attempts = 0
    let created = false
    let createdPurchaseId: string | null = null
    let createdStatus = 'DRAFT'

    while (attempts < 5) {
      try {
        const nextStatus = normalizePurchaseStatus(d.status)
        const createdPurchase = await prismaClient.purchase.create({
          data: {
            id: crypto.randomUUID(),
            purchaseNumber,
            purchaseDate: toDate(d.purchaseDate) ?? new Date(),
            status: nextStatus,
            companyId: d.companyId,
            quoteSupplierId: d.quoteSupplierId ?? null,
            paymentConditionId: d.paymentConditionId ?? null,
            shortDescription: d.shortDescription ?? null,
            description: d.description ?? null,
            additionalInfo: d.additionalInfo ?? null,
            createdBy: profile.id,
          },
          select: {id: true},
        })
        createdPurchaseId = createdPurchase.id
        createdStatus = nextStatus
        created = true
        break
      } catch (err: unknown) {
        const prismaErr = err as {code?: string}
        if (prismaErr.code === 'P2002') {
          attempts++
          purchaseNumber = generatePurchaseNumber()
          continue
        }
        throw err
      }
    }

    if (!created) {
      throw new Error('Failed to generate a unique purchase number after 5 attempts')
    }

    if (createdPurchaseId && createdStatus === 'ORDERED') {
      // Ordered purchases must immediately reconcile their approved BOM structures.
      await syncPurchaseBOMStructuresForOrderedApprovedPurchase(createdPurchaseId)
    }

    revalidatePath(REVALIDATE_PATH)
  },
})

export const updatePurchaseAction = protectedServerFunction({
  schema: updatePurchaseSchema,
  functionName: 'Update purchase action',
  serverFn: async ({data, profile, logger}) => {
    const {id, purchaseDate, ...rest} = data
    const before = await prismaClient.purchase.findUnique({
      where: {id},
      select: {status: true},
    })
    if (!before) {
      throw new Error('Purchase not found.')
    }

    // Once a purchase is ordered, only managers may keep editing it.
    if (isOrderedNotSentStatus(before.status) && !isManagerLevel(profile)) {
      throw new Error('Only managers can edit an ordered purchase.')
    }

    const nextStatus = normalizePurchaseStatus(rest.status ?? before.status)

    const autoIncomingDeliveryId = await prismaClient.$transaction(async tx => {
      await tx.purchase.update({
        where: {id},
        data: {
          ...rest,
          ...(rest.status !== undefined ? {status: normalizePurchaseStatus(rest.status)} : {}),
          purchaseDate: toDate(purchaseDate) ?? new Date(),
        },
      })

      if (!isOrderedNotSentStatus(before.status) && isOrderedNotSentStatus(nextStatus)) {
        // Switching into ORDERED also flips all active purchase details and prepares a draft incoming delivery.
        await tx.purchaseDetail.updateMany({
          where: {purchaseId: id, deleted: false},
          data: {lineStatus: 'ORDERED'},
        })

        return ensureDraftIncomingDeliveryForPurchase(tx, id, profile.id)
      }

      return null
    })

    logger.info(`Purchase updated: ${id}`)

    if (nextStatus === 'ORDERED') {
      // The ordered state is what links the purchase back to approved BOM structures.
      await syncPurchaseBOMStructuresForOrderedApprovedPurchase(id)
    }

    revalidateDetail(id)
    if (autoIncomingDeliveryId) {
      logger.info(`Auto-created or updated draft incoming delivery for purchase: ${id}`)
      revalidateIncomingDeliveries(autoIncomingDeliveryId)
    }
  },
})

export const softDeletePurchaseAction = protectedServerFunction({
  schema: purchaseIdSchema,
  functionName: 'Soft delete purchase action',
  serverFn: async ({data, profile, logger}) => {
    const {id} = data as {id: string}
    await prismaClient.purchase.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Purchase soft deleted: ${id}`)
    revalidatePath(REVALIDATE_PATH)
  },
})

export const hardDeletePurchaseAction = protectedServerFunction({
  schema: purchaseIdSchema,
  functionName: 'Hard delete purchase action',
  serverFn: async ({data, logger}) => {
    const {id} = data as {id: string}
    await prismaClient.purchase.delete({where: {id}})
    logger.info(`Purchase hard deleted: ${id}`)
    revalidatePath(REVALIDATE_PATH)
  },
})

export const undeletePurchaseAction = protectedServerFunction({
  schema: purchaseIdSchema,
  functionName: 'Undelete purchase action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.purchase.update({where: {id}, data: {deleted: false}})
    logger.info(`Purchase undeleted: ${id}`)
    revalidatePath('/departments/purchasing')
  },
})

// ─── PurchaseDetail ──────────────────────────────────────────────────────────

export const createPurchaseDetailAction = protectedServerFunction({
  schema: createPurchaseDetailSchema,
  functionName: 'Create purchase detail action',
  serverFn: async ({data, profile, logger}) => {
    assertPurchaseDetailPermission(
      profile,
      PURCHASE_DETAIL_PERMISSION_LEVELS.create,
      'You do not have permission to create purchase detail lines.',
    )
    await assertCanEditPurchase(data.purchaseId)
    logger.info(`Creating purchase detail for purchase: ${data.purchaseId}`)
    await prismaClient.purchaseDetail.create({
      data: {
        id: crypto.randomUUID(),
        purchaseId: data.purchaseId,
        quoteSupplierLineId: data.quoteSupplierLineId ?? null,
        materialId: data.materialId,
        materialDemandId: data.materialDemandId ?? null,
        unitPrice: toDecimalString(data.unitPrice),
        quantity: data.quantity,
        minQuantity: data.minQuantity ?? null,
        lineStatus: data.lineStatus ?? 'OPEN',
        additionalInfo: data.additionalInfo ?? null,
        notDeliverable: data.notDeliverable ?? false,
        createdBy: profile.id,
      },
    })
    revalidateDetail(data.purchaseId)
  },
})

export const updatePurchaseDetailAction = protectedServerFunction({
  schema: updatePurchaseDetailSchema,
  functionName: 'Update purchase detail action',
  serverFn: async ({data, profile, logger}) => {
    const {id, purchaseId, ...rest} = data
    assertPurchaseDetailPermission(
      profile,
      PURCHASE_DETAIL_PERMISSION_LEVELS.edit,
      'You do not have permission to edit purchase detail lines.',
    )
    await assertCanEditPurchase(purchaseId)
    await prismaClient.purchaseDetail.update({
      where: {id},
      data: {
        ...rest,
        unitPrice: toDecimalString(rest.unitPrice),
        notDeliverable: rest.notDeliverable ?? false,
      },
    })
    logger.info(`Purchase detail updated: ${id}`)
    revalidateDetail(purchaseId)
  },
})

export const softDeletePurchaseDetailAction = protectedServerFunction({
  schema: purchaseDetailIdSchema,
  functionName: 'Soft delete purchase detail action',
  serverFn: async ({data, profile, logger}) => {
    const {id, purchaseId} = data as {id: string; purchaseId: string}
    assertPurchaseDetailPermission(
      profile,
      PURCHASE_DETAIL_PERMISSION_LEVELS.softDelete,
      'You do not have permission to soft delete purchase detail lines.',
    )
    await assertCanEditPurchase(purchaseId)
    await prismaClient.purchaseDetail.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Purchase detail soft deleted: ${id}`)
    revalidateDetail(purchaseId)
  },
})

export const hardDeletePurchaseDetailAction = protectedServerFunction({
  schema: purchaseDetailIdSchema,
  functionName: 'Hard delete purchase detail action',
  serverFn: async ({data, profile, logger}) => {
    const {id, purchaseId} = data as {id: string; purchaseId: string}
    assertPurchaseDetailPermission(
      profile,
      PURCHASE_DETAIL_PERMISSION_LEVELS.hardDelete,
      'You do not have permission to hard delete purchase detail lines.',
    )
    await assertCanEditPurchase(purchaseId)
    await prismaClient.purchaseDetail.delete({where: {id}})
    logger.info(`Purchase detail hard deleted: ${id}`)
    revalidateDetail(purchaseId)
  },
})
