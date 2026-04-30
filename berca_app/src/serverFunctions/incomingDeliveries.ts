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
  createIncomingDeliveryOverDeliveryAllocationSchema,
  incomingDeliveryLineAllocationIdSchema,
} from '@/schemas/incomingDeliverySchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {INCOMING_PERMISSION_LEVELS} from '@/constants'
import {generateIncomingDeliveryNumber} from '@/lib/utils'
import {
  adjustInventoryStockForMaterial,
  ensureMaterialDemandForMaterial,
  ensureMaterialDemandSourceType,
  syncMaterialDemandFromIncomingAllocations,
} from '@/dal/materialDemands'
import {syncPurchaseStatusFromFulfilledSources} from '@/dal/purchases'

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

async function syncPurchaseStatusForIncomingDelivery(incomingDeliveryId: string | null | undefined) {
  if (!incomingDeliveryId) return

  const incoming = await prismaClient.incomingDelivery.findUnique({
    where: {id: incomingDeliveryId},
    select: {purchaseId: true},
  })

  if (!incoming?.purchaseId) return
  const result = await syncPurchaseStatusFromFulfilledSources(incoming.purchaseId)
  if (result.updated) {
    revalidatePath('/departments/purchasing/orders')
    revalidatePath(`/departments/purchasing/orders/${incoming.purchaseId}`)
  }
}

async function ensurePendingIncomingLinesFromPurchase(
  incomingDeliveryId: string,
  purchaseId: string,
  createdBy: string,
) {
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

  const existingPurchaseDetailIds = new Set(
    existing.map(line => line.purchaseDetailId).filter((id): id is string => !!id),
  )
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

async function isLowStockInventoryOrderSource(
  sourceReferenceId: string | null,
  sourceTypeName: string,
): Promise<boolean> {
  if (sourceTypeName !== 'InventoryOrder' || !sourceReferenceId) return false
  const inventoryOrder = await prismaClient.inventoryOrder.findUnique({
    where: {id: sourceReferenceId},
    select: {shortDescription: true},
  })
  return (inventoryOrder?.shortDescription ?? '').toLowerCase().startsWith('low-stock request for')
}

export const createIncomingDeliveryAction = protectedServerFunction({
  schema: createIncomingDeliverySchema,
  functionName: 'Create incoming delivery action',
  serverFn: async ({data, profile, logger}) => {
    assertMinRoleLevel(
      profile,
      INCOMING_PERMISSION_LEVELS.create,
      'You do not have permission to create incoming deliveries.',
    )

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
    assertMinRoleLevel(
      profile,
      INCOMING_PERMISSION_LEVELS.edit,
      'You do not have permission to edit incoming deliveries.',
    )

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
    assertMinRoleLevel(
      profile,
      INCOMING_PERMISSION_LEVELS.delete,
      'You do not have permission to delete incoming deliveries.',
    )

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
    assertMinRoleLevel(
      profile,
      INCOMING_PERMISSION_LEVELS.delete,
      'You do not have permission to restore incoming deliveries.',
    )

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
    assertMinRoleLevel(
      profile,
      INCOMING_PERMISSION_LEVELS.hardDelete,
      'You do not have permission to permanently delete incoming deliveries.',
    )

    await prismaClient.incomingDelivery.delete({where: {id}})

    logger.info(`Incoming delivery hard deleted: ${id}`)
    revalidateIncomingDeliveryRoutes()
  },
})

export const createIncomingDeliveryLineAction = protectedServerFunction({
  schema: createIncomingDeliveryLineSchema,
  functionName: 'Create incoming delivery line action',
  serverFn: async ({data, profile, logger}) => {
    assertMinRoleLevel(
      profile,
      INCOMING_PERMISSION_LEVELS.create,
      'You do not have permission to create incoming delivery lines.',
    )

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
    assertMinRoleLevel(
      profile,
      INCOMING_PERMISSION_LEVELS.edit,
      'You do not have permission to edit incoming delivery lines.',
    )

    const allocationSourceIds = await prismaClient.incomingDeliveryLineAllocation.findMany({
      where: {incomingDeliveryLineId: id, deleted: false},
      select: {
        materialDemandSourceId: true,
        allocatedQty: true,
        MaterialDemandSource: {
          select: {
            MaterialDemandSourceType: {select: {name: true}},
          },
        },
      },
    })

    const assignedOverDeliveryQty = allocationSourceIds.reduce((sum, allocation) => {
      if ((allocation.MaterialDemandSource.MaterialDemandSourceType.name ?? '').toLowerCase() !== 'warehouseplace')
        return sum
      return sum + allocation.allocatedQty
    }, 0)
    const nextOverDeliveredQty = Math.max((data.deliveredQty ?? 0) - (data.orderedQty ?? 0), 0)
    if (assignedOverDeliveryQty > nextOverDeliveredQty) {
      throw new Error(
        `Over-delivery assigned quantity (${assignedOverDeliveryQty}) exceeds remaining over-delivered quantity (${nextOverDeliveredQty}). Remove warehouse assignments first.`,
      )
    }

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

    const materialDemandIds = new Set<string>()
    for (const allocation of allocationSourceIds) {
      const source = await prismaClient.materialDemandSource.findUnique({
        where: {id: allocation.materialDemandSourceId},
        select: {materialDemandId: true},
      })
      if (source) materialDemandIds.add(source.materialDemandId)
    }

    for (const materialDemandId of materialDemandIds) {
      await syncMaterialDemandFromIncomingAllocations(materialDemandId, profile.id)
    }

    await syncPurchaseStatusForIncomingDelivery(incomingDeliveryId)

    logger.info(`Incoming delivery line updated: ${id}`)
    revalidateIncomingDeliveryRoutes(incomingDeliveryId)
  },
})

export const softDeleteIncomingDeliveryLineAction = protectedServerFunction({
  schema: incomingDeliveryLineIdSchema,
  functionName: 'Soft delete incoming delivery line action',
  serverFn: async ({data: {id, incomingDeliveryId}, profile, logger}) => {
    assertMinRoleLevel(
      profile,
      INCOMING_PERMISSION_LEVELS.delete,
      'You do not have permission to delete incoming delivery lines.',
    )

    const allocations = await prismaClient.incomingDeliveryLineAllocation.findMany({
      where: {incomingDeliveryLineId: id, deleted: false},
      select: {
        id: true,
        allocatedQty: true,
        materialDemandSourceId: true,
        MaterialDemandSource: {
          select: {
            sourceReferenceId: true,
            MaterialDemandSourceType: {select: {name: true}},
          },
        },
      },
    })

    await prismaClient.$transaction(async tx => {
      await tx.incomingDeliveryLine.update({
        where: {id},
        data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
      })

      await tx.incomingDeliveryLineAllocation.updateMany({
        where: {incomingDeliveryLineId: id, deleted: false},
        data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
      })
    })

    // No stock rollback — items were physically received regardless of allocation bookkeeping.

    const materialDemandIds = new Set<string>()
    for (const allocation of allocations) {
      const source = await prismaClient.materialDemandSource.findUnique({
        where: {id: allocation.materialDemandSourceId},
        select: {materialDemandId: true},
      })
      if (source) materialDemandIds.add(source.materialDemandId)
    }

    for (const materialDemandId of materialDemandIds) {
      await syncMaterialDemandFromIncomingAllocations(materialDemandId, profile.id)
    }

    await syncPurchaseStatusForIncomingDelivery(incomingDeliveryId)

    logger.info(`Incoming delivery line soft deleted: ${id}`)
    revalidateIncomingDeliveryRoutes(incomingDeliveryId)
  },
})

export const createIncomingDeliveryLineAllocationAction = protectedServerFunction({
  schema: createIncomingDeliveryLineAllocationSchema,
  functionName: 'Create incoming delivery line allocation action',
  serverFn: async ({data, profile, logger}) => {
    assertMinRoleLevel(
      profile,
      INCOMING_PERMISSION_LEVELS.addSourceLink,
      'You do not have permission to add source links.',
    )

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
          select: {
            materialDemandId: true,
            sourceReferenceId: true,
            MaterialDemandSourceType: {select: {name: true}},
          },
        },
      },
    })

    const line = await prismaClient.incomingDeliveryLine.findUnique({
      where: {id: data.incomingDeliveryLineId},
      select: {incomingDeliveryId: true, materialId: true},
    })

    if (allocation.MaterialDemandSource) {
      const {sourceReferenceId, MaterialDemandSourceType} = allocation.MaterialDemandSource
      const isLowStock = await isLowStockInventoryOrderSource(sourceReferenceId, MaterialDemandSourceType.name)

      // Linking a delivery line to a low-stock source means those items have arrived — increase stock.
      if (isLowStock && line?.materialId) {
        await adjustInventoryStockForMaterial(line.materialId, data.allocatedQty)
      }

      await syncMaterialDemandFromIncomingAllocations(allocation.MaterialDemandSource.materialDemandId, profile.id)
    }

    await syncPurchaseStatusForIncomingDelivery(line?.incomingDeliveryId)

    logger.info(`Incoming delivery line allocation created for line ${data.incomingDeliveryLineId}`)
    revalidateIncomingDeliveryRoutes(line?.incomingDeliveryId)
  },
})

export const createIncomingDeliveryOverDeliveryAllocationAction = protectedServerFunction({
  schema: createIncomingDeliveryOverDeliveryAllocationSchema,
  functionName: 'Create incoming over-delivery allocation action',
  serverFn: async ({data, profile, logger}) => {
    assertMinRoleLevel(
      profile,
      INCOMING_PERMISSION_LEVELS.addSourceLink,
      'You do not have permission to add warehouse over-delivery assignments.',
    )

    let incomingDeliveryId: string | null = null

    await prismaClient.$transaction(async tx => {
      const line = await tx.incomingDeliveryLine.findUnique({
        where: {id: data.incomingDeliveryLineId},
        select: {
          id: true,
          incomingDeliveryId: true,
          materialId: true,
          orderedQty: true,
          deliveredQty: true,
          deleted: true,
        },
      })

      if (!line || line.deleted) {
        throw new Error('Incoming delivery line not found.')
      }

      incomingDeliveryId = line.incomingDeliveryId

      const overDeliveredQty = Math.max(line.deliveredQty - line.orderedQty, 0)
      if (overDeliveredQty <= 0) {
        throw new Error('No over-delivered quantity is available for warehouse assignment.')
      }

      const warehousePlace = await tx.warehousePlace.findFirst({
        where: {id: data.warehousePlaceId, deleted: false},
        select: {id: true},
      })
      if (!warehousePlace) {
        throw new Error('Warehouse location not found.')
      }

      const sourceTypeId = await ensureMaterialDemandSourceType(
        'WarehousePlace',
        profile.id,
        'Over-delivery assigned to warehouse location',
        tx,
      )
      const materialDemand = await ensureMaterialDemandForMaterial(line.materialId, tx)

      let warehouseSource = await tx.materialDemandSource.findFirst({
        where: {
          materialDemandId: materialDemand.id,
          sourceTypeId,
          sourceReferenceId: data.warehousePlaceId,
        },
        select: {id: true},
      })

      if (!warehouseSource) {
        warehouseSource = await tx.materialDemandSource.create({
          data: {
            id: crypto.randomUUID(),
            materialDemandId: materialDemand.id,
            sourceTypeId,
            sourceReferenceId: data.warehousePlaceId,
            requiredQty: 0,
            reservedQty: 0,
            createdAt: new Date(),
            createdBy: profile.id,
          },
          select: {id: true},
        })
      }

      const assignedQtyAggregate = await tx.incomingDeliveryLineAllocation.aggregate({
        _sum: {allocatedQty: true},
        where: {
          incomingDeliveryLineId: line.id,
          deleted: false,
          MaterialDemandSource: {sourceTypeId},
        },
      })

      const alreadyAssignedQty = assignedQtyAggregate._sum.allocatedQty ?? 0
      const remainingQty = Math.max(overDeliveredQty - alreadyAssignedQty, 0)
      if (data.allocatedQty > remainingQty) {
        throw new Error(
          `Assigned quantity (${data.allocatedQty}) exceeds over-delivery remaining quantity (${remainingQty}).`,
        )
      }

      await tx.incomingDeliveryLineAllocation.create({
        data: {
          id: crypto.randomUUID(),
          incomingDeliveryLineId: line.id,
          materialDemandSourceId: warehouseSource.id,
          allocatedQty: data.allocatedQty,
          createdAt: new Date(),
          createdBy: profile.id,
        },
      })

      // Over-delivered items physically arrived — increase inventory stock, not warehouse place qty.
      await adjustInventoryStockForMaterial(line.materialId, data.allocatedQty, tx)

      // Keep material pointing at the latest warehouse location.
      await tx.material.update({
        where: {id: line.materialId},
        data: {warehousePlaceId: data.warehousePlaceId},
      })

      await syncMaterialDemandFromIncomingAllocations(materialDemand.id, profile.id, tx)
    })

    logger.info(`Incoming over-delivery allocation created for line ${data.incomingDeliveryLineId}`)
    await syncPurchaseStatusForIncomingDelivery(incomingDeliveryId)
    revalidateIncomingDeliveryRoutes(incomingDeliveryId ?? undefined)
  },
})

export const softDeleteIncomingDeliveryLineAllocationAction = protectedServerFunction({
  schema: incomingDeliveryLineAllocationIdSchema,
  functionName: 'Soft delete incoming delivery line allocation action',
  serverFn: async ({data: {id, incomingDeliveryId}, profile, logger}) => {
    assertMinRoleLevel(
      profile,
      INCOMING_PERMISSION_LEVELS.deleteSourceLink,
      'You do not have permission to delete source links.',
    )

    const allocation = await prismaClient.incomingDeliveryLineAllocation.findUnique({
      where: {id},
      select: {
        materialDemandSourceId: true,
        allocatedQty: true,
        MaterialDemandSource: {
          select: {
            sourceReferenceId: true,
            MaterialDemandSourceType: {select: {name: true}},
          },
        },
      },
    })

    await prismaClient.incomingDeliveryLineAllocation.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })

    // No stock rollback for any allocation type — items were physically received.

    if (allocation?.materialDemandSourceId) {
      const source = await prismaClient.materialDemandSource.findUnique({
        where: {id: allocation.materialDemandSourceId},
        select: {materialDemandId: true},
      })
      if (source) {
        await syncMaterialDemandFromIncomingAllocations(source.materialDemandId, profile.id)
      }
    }

    await syncPurchaseStatusForIncomingDelivery(incomingDeliveryId)

    logger.info(`Incoming delivery line allocation soft deleted: ${id}`)
    revalidateIncomingDeliveryRoutes(incomingDeliveryId)
  },
})
