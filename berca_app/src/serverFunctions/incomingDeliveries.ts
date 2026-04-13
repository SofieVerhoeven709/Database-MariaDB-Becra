'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {
  createIncomingDeliverySchema,
  updateIncomingDeliverySchema,
  incomingDeliveryIdSchema,
  createIncomingDeliveryLineSchema,
  updateIncomingDeliveryLineSchema,
  incomingDeliveryLineIdSchema,
  createIncomingDeliveryLineAllocationSchema,
  incomingDeliveryLineAllocationIdSchema,
} from '@/schemas/incomingDeliverySchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {INCOMING_PERMISSION_LEVELS} from '@/constants'
import {generateIncomingDeliveryNumber} from '@/lib/utils'
import {syncMaterialDemandFromIncomingAllocations} from '@/dal/materialDemands'

const REVALIDATE_BASE = '/departments'

function getHighestRoleLevel(profile: {RoleLevelEmployee: Array<{RoleLevel: {SubRole: {level: number}}}>}): number {
  return Math.max(0, ...profile.RoleLevelEmployee.map(row => row.RoleLevel.SubRole.level))
}

function assertMinRoleLevel(
  profile: {RoleLevelEmployee: Array<{RoleLevel: {SubRole: {level: number}}}>},
  minLevel: number,
  message: string,
) {
  if (getHighestRoleLevel(profile) < minLevel) {
    throw new Error(message)
  }
}

function toDate(val: string | null | undefined): Date | null {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

function toDecimalString(val: string | number | null | undefined): string | null {
  if (val == null || val === '') return null
  const n = typeof val === 'number' ? val : Number.parseFloat(val)
  if (!Number.isFinite(n)) return null
  return n.toFixed(2)
}

function revalidateIncomingDeliveryRoutes(incomingDeliveryId?: string) {
  revalidatePath(REVALIDATE_BASE, 'layout')
  revalidatePath('/departments/purchasing/incomingDeliveries')
  if (incomingDeliveryId) {
    revalidatePath(`/departments/purchasing/incomingDeliveries/${incomingDeliveryId}`)
  }
}

async function ensurePendingIncomingLinesFromPurchase(incomingDeliveryId: string, purchaseId: string, createdBy: string) {
  const purchaseDetails = await prismaClient.purchaseDetail.findMany({
    where: {purchaseId, deleted: false},
    select: {
      id: true,
      materialId: true,
      quantity: true,
      unitPrice: true,
    },
  })

  if (purchaseDetails.length === 0) return

  const existing = await prismaClient.incomingDeliveryLine.findMany({
    where: {incomingDeliveryId, purchaseDetailId: {in: purchaseDetails.map(detail => detail.id)}},
    select: {purchaseDetailId: true},
  })

  const existingPurchaseDetailIds = new Set(existing.map(line => line.purchaseDetailId).filter((id): id is string => !!id))

  const toCreate = purchaseDetails.filter(detail => !existingPurchaseDetailIds.has(detail.id))
  if (toCreate.length === 0) return

  await prismaClient.incomingDeliveryLine.createMany({
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
      notCorrect: false,
      notCorrectReason: null,
      createdAt: new Date(),
      createdBy,
    })),
  })
}

export const createIncomingDeliveryAction = protectedServerFunction({
  schema: createIncomingDeliverySchema,
  functionName: 'Create incoming delivery action',
  serverFn: async ({data, profile, logger}) => {
    assertMinRoleLevel(profile, INCOMING_PERMISSION_LEVELS.create, 'You do not have permission to create incoming deliveries.')

    let incomingDeliveryNumber = data.incomingDeliveryNumber || generateIncomingDeliveryNumber()
    let attempts = 0
    let created: {id: string} | null = null

    while (attempts < 5) {
      try {
        created = await prismaClient.incomingDelivery.create({
          data: {
            id: crypto.randomUUID(),
            incomingDeliveryNumber,
            purchaseId: data.purchaseId ?? null,
            additionalInfo: data.additionalInfo ?? null,
            description: data.description ?? null,
            status: data.status ?? 'DRAFT',
            deliveryDate: toDate(data.deliveryDate) ?? new Date(),
            receivedAt: toDate(data.receivedAt),
            createdAt: new Date(),
            createdBy: profile.id,
          },
          select: {id: true},
        })
        break
      } catch (err: unknown) {
        const prismaErr = err as {code?: string}
        if (prismaErr.code === 'P2002') {
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

    if (data.purchaseId) {
      await ensurePendingIncomingLinesFromPurchase(created.id, data.purchaseId, profile.id)
    }

    logger.info(`Incoming delivery created: ${created.id}`)
    revalidateIncomingDeliveryRoutes(created.id)
  },
})

export const updateIncomingDeliveryAction = protectedServerFunction({
  schema: updateIncomingDeliverySchema,
  functionName: 'Update incoming delivery action',
  serverFn: async ({data: {id, ...data}, profile, logger}) => {
    assertMinRoleLevel(profile, INCOMING_PERMISSION_LEVELS.edit, 'You do not have permission to edit incoming deliveries.')

    const before = await prismaClient.incomingDelivery.findUnique({
      where: {id},
      select: {purchaseId: true},
    })
    if (!before) throw new Error('Incoming delivery not found.')

    await prismaClient.incomingDelivery.update({
      where: {id},
      data: {
        incomingDeliveryNumber: data.incomingDeliveryNumber,
        purchaseId: data.purchaseId ?? null,
        additionalInfo: data.additionalInfo ?? null,
        description: data.description ?? null,
        status: data.status ?? 'DRAFT',
        deliveryDate: toDate(data.deliveryDate) ?? new Date(),
        receivedAt: toDate(data.receivedAt),
      },
    })

    if (data.purchaseId) {
      await ensurePendingIncomingLinesFromPurchase(id, data.purchaseId, profile.id)
    }

    logger.info(`Incoming delivery updated: ${id}`)
    revalidateIncomingDeliveryRoutes(id)
  },
})

export const softDeleteIncomingDeliveryAction = protectedServerFunction({
  schema: incomingDeliveryIdSchema,
  functionName: 'Soft delete incoming delivery action',
  serverFn: async ({data: {id}, profile, logger}) => {
    assertMinRoleLevel(profile, INCOMING_PERMISSION_LEVELS.delete, 'You do not have permission to delete incoming deliveries.')

    await prismaClient.incomingDelivery.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })

    logger.info(`Incoming delivery soft deleted: ${id}`)
    revalidateIncomingDeliveryRoutes()
  },
})

export const undeleteIncomingDeliveryAction = protectedServerFunction({
  schema: incomingDeliveryIdSchema,
  functionName: 'Undelete incoming delivery action',
  serverFn: async ({data: {id}, profile, logger}) => {
    assertMinRoleLevel(profile, INCOMING_PERMISSION_LEVELS.delete, 'You do not have permission to restore incoming deliveries.')

    await prismaClient.incomingDelivery.update({
      where: {id},
      data: {deleted: false, deletedAt: null, deletedBy: null},
    })

    logger.info(`Incoming delivery restored: ${id}`)
    revalidateIncomingDeliveryRoutes(id)
  },
})

export const hardDeleteIncomingDeliveryAction = protectedServerFunction({
  schema: incomingDeliveryIdSchema,
  functionName: 'Hard delete incoming delivery action',
  serverFn: async ({data: {id}, profile, logger}) => {
    assertMinRoleLevel(profile, INCOMING_PERMISSION_LEVELS.hardDelete, 'You do not have permission to permanently delete incoming deliveries.')

    await prismaClient.incomingDelivery.delete({where: {id}})

    logger.info(`Incoming delivery hard deleted: ${id}`)
    revalidateIncomingDeliveryRoutes()
  },
})

export const createIncomingDeliveryLineAction = protectedServerFunction({
  schema: createIncomingDeliveryLineSchema,
  functionName: 'Create incoming delivery line action',
  serverFn: async ({data, profile, logger}) => {
    assertMinRoleLevel(profile, INCOMING_PERMISSION_LEVELS.create, 'You do not have permission to create incoming delivery lines.')

    await prismaClient.incomingDeliveryLine.create({
      data: {
        id: crypto.randomUUID(),
        incomingDeliveryId: data.incomingDeliveryId,
        purchaseDetailId: data.purchaseDetailId ?? null,
        materialId: data.materialId,
        orderedQty: data.orderedQty,
        deliveredQty: data.deliveredQty,
        acceptedQty: data.acceptedQty,
        rejectedQty: data.rejectedQty ?? 0,
        backorderQty: data.backorderQty ?? 0,
        unitPrice: toDecimalString(data.unitPrice),
        lineStatus: data.lineStatus ?? 'RECEIVED',
        notCorrect: data.notCorrect ?? false,
        notCorrectReason: data.notCorrect ? (data.notCorrectReason ?? null) : null,
        createdAt: new Date(),
        createdBy: profile.id,
      },
    })

    logger.info(`Incoming delivery line created for delivery ${data.incomingDeliveryId}`)
    revalidateIncomingDeliveryRoutes(data.incomingDeliveryId)
  },
})

export const updateIncomingDeliveryLineAction = protectedServerFunction({
  schema: updateIncomingDeliveryLineSchema,
  functionName: 'Update incoming delivery line action',
  serverFn: async ({data: {id, incomingDeliveryId, ...data}, profile, logger}) => {
    assertMinRoleLevel(profile, INCOMING_PERMISSION_LEVELS.edit, 'You do not have permission to edit incoming delivery lines.')

    await prismaClient.incomingDeliveryLine.update({
      where: {id},
      data: {
        purchaseDetailId: data.purchaseDetailId ?? null,
        materialId: data.materialId,
        orderedQty: data.orderedQty,
        deliveredQty: data.deliveredQty,
        acceptedQty: data.acceptedQty,
        rejectedQty: data.rejectedQty ?? 0,
        backorderQty: data.backorderQty ?? 0,
        unitPrice: toDecimalString(data.unitPrice),
        lineStatus: data.lineStatus ?? 'RECEIVED',
        notCorrect: data.notCorrect ?? false,
        notCorrectReason: data.notCorrect ? (data.notCorrectReason ?? null) : null,
      },
    })

    logger.info(`Incoming delivery line updated: ${id}`)
    revalidateIncomingDeliveryRoutes(incomingDeliveryId)
  },
})

export const softDeleteIncomingDeliveryLineAction = protectedServerFunction({
  schema: incomingDeliveryLineIdSchema,
  functionName: 'Soft delete incoming delivery line action',
  serverFn: async ({data: {id, incomingDeliveryId}, profile, logger}) => {
    assertMinRoleLevel(profile, INCOMING_PERMISSION_LEVELS.delete, 'You do not have permission to delete incoming delivery lines.')

    await prismaClient.incomingDeliveryLine.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })

    logger.info(`Incoming delivery line soft deleted: ${id}`)
    revalidateIncomingDeliveryRoutes(incomingDeliveryId)
  },
})

export const createIncomingDeliveryLineAllocationAction = protectedServerFunction({
  schema: createIncomingDeliveryLineAllocationSchema,
  functionName: 'Create incoming delivery line allocation action',
  serverFn: async ({data, profile, logger}) => {
    assertMinRoleLevel(profile, INCOMING_PERMISSION_LEVELS.addSourceLink, 'You do not have permission to add source links.')

    const allocation = await prismaClient.incomingDeliveryLineAllocation.create({
      data: {
        id: crypto.randomUUID(),
        incomingDeliveryLineId: data.incomingDeliveryLineId,
        materialDemandSourceId: data.materialDemandSourceId,
        allocatedQty: data.allocatedQty,
        createdAt: new Date(),
        createdBy: profile.id,
      },
      include: {
        MaterialDemandSource: {
          select: {materialDemandId: true},
        },
      },
    })

    const line = await prismaClient.incomingDeliveryLine.findUnique({
      where: {id: data.incomingDeliveryLineId},
      select: {incomingDeliveryId: true},
    })

    // Sync the material demand fulfillment status
    if (allocation.MaterialDemandSource) {
      await syncMaterialDemandFromIncomingAllocations(allocation.MaterialDemandSource.materialDemandId, profile.id)
    }

    logger.info(`Incoming delivery line allocation created for line ${data.incomingDeliveryLineId}`)
    revalidateIncomingDeliveryRoutes(line?.incomingDeliveryId)
  },
})

export const softDeleteIncomingDeliveryLineAllocationAction = protectedServerFunction({
  schema: incomingDeliveryLineAllocationIdSchema,
  functionName: 'Soft delete incoming delivery line allocation action',
  serverFn: async ({data: {id, incomingDeliveryId}, profile, logger}) => {
    assertMinRoleLevel(profile, INCOMING_PERMISSION_LEVELS.deleteSourceLink, 'You do not have permission to delete source links.')

    const allocation = await prismaClient.incomingDeliveryLineAllocation.findUnique({
      where: {id},
      select: {materialDemandSourceId: true},
    })

    await prismaClient.incomingDeliveryLineAllocation.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })

    // Sync the material demand fulfillment status
    if (allocation?.materialDemandSourceId) {
      const source = await prismaClient.materialDemandSource.findUnique({
        where: {id: allocation.materialDemandSourceId},
        select: {materialDemandId: true},
      })
      if (source) {
        await syncMaterialDemandFromIncomingAllocations(source.materialDemandId, profile.id)
      }
    }

    logger.info(`Incoming delivery line allocation soft deleted: ${id}`)
    revalidateIncomingDeliveryRoutes(incomingDeliveryId)
  },
})

