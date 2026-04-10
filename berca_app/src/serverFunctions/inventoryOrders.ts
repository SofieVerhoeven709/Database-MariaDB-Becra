'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {
  createInventoryOrderSchema,
  updateInventoryOrderSchema,
  inventoryOrderIdSchema,
} from '@/schemas/inventoryOrderSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {createMaterialDemandSourceForInventoryOrder, removeMaterialDemandSourceForInventoryOrder} from '@/dal/materialDemands'

const REVALIDATE_PATH = '/departments/purchasing/orderRequests'
const REVALIDATE_MATERIAL_DEMAND = '/departments/purchasing/materialDemand'

function toDate(val: string): Date {
  const d = new Date(val)
  if (isNaN(d.getTime())) {
    throw new Error('Invalid order date')
  }
  return d
}

function resolveRequestedQtyFromDescription(longDescription: string | null | undefined): number {
  if (!longDescription) return 1
  const match = /__REQUESTED_QTY__:(\d+)/.exec(longDescription)
  if (!match) return 1
  const qty = Number.parseInt(match[1], 10)
  return Number.isNaN(qty) || qty < 1 ? 1 : qty
}

function isLowStockRequestDescription(shortDescription: string | null | undefined): boolean {
  return (shortDescription ?? '').toLowerCase().startsWith('low-stock request for')
}

export const createInventoryOrderAction = protectedServerFunction({
  schema: createInventoryOrderSchema,
  functionName: 'Create inventory order action',
  serverFn: async ({data, profile, logger}) => {
    const material = await prismaClient.material.findUnique({
      where: {id: data.materialId},
      select: {id: true},
    })

    if (!material) {
      throw new Error('Material not found.')
    }

    if (isLowStockRequestDescription(data.shortDescription)) {
      const existingPendingLowStock = await prismaClient.inventoryOrder.findFirst({
        where: {
          deleted: false,
          approved: false,
          rejected: false,
          shortDescription: {startsWith: 'Low-stock request for'},
          materialId: material.id,
        },
        select: {id: true},
      })

      if (existingPendingLowStock) {
        throw new Error('There is already a pending low-stock request for this material.')
      }
    }

    logger.info(`Creating inventory order, createdBy: ${profile.id}`)
    await prismaClient.inventoryOrder.create({
      data: {
        id: crypto.randomUUID(),
        materialId: data.materialId,
        orderNumber: data.orderNumber,
        requestedQty: data.requestedQty,
        orderDate: toDate(data.orderDate),
        shortDescription: data.shortDescription,
        longDescription: data.longDescription ?? null,
        createdBy: profile.id,
      },
    })
    revalidatePath(REVALIDATE_PATH)
  },
})

export const updateInventoryOrderAction = protectedServerFunction({
  schema: updateInventoryOrderSchema,
  functionName: 'Update inventory order action',
  serverFn: async ({data, logger}) => {
    const {id, ...rest} = data
    await prismaClient.inventoryOrder.update({
      where: {id},
      data: {
        materialId: rest.materialId,
        orderNumber: rest.orderNumber,
        requestedQty: rest.requestedQty,
        orderDate: toDate(rest.orderDate),
        shortDescription: rest.shortDescription,
        longDescription: rest.longDescription ?? null,
      },
    })
    logger.info(`Inventory order updated: ${id}`)
    revalidatePath(REVALIDATE_PATH)
  },
})

export const approveInventoryOrderAction = protectedServerFunction({
  schema: inventoryOrderIdSchema,
  functionName: 'Approve inventory order action',
  serverFn: async ({data: {id}, profile, logger}) => {
    const order = await prismaClient.inventoryOrder.findUnique({
      where: {id},
      select: {
        id: true,
        materialId: true,
        deleted: true,
        rejected: true,
        approved: true,
        longDescription: true,
        requestedQty: true,
      },
    })

    if (!order) {
      throw new Error('Inventory order not found.')
    }

    if (order.deleted) {
      throw new Error('Inventory order is already processed.')
    }

    if (order.rejected) {
      throw new Error('Inventory order is already rejected.')
    }

    if (order.approved) {
      throw new Error('Inventory order is already approved.')
    }

    const legacyRequestedQty = resolveRequestedQtyFromDescription(order.longDescription)
    const requestedQty = Math.max(order.requestedQty ?? 1, legacyRequestedQty)

    await prismaClient.$transaction(async tx => {
      await tx.inventoryOrder.update({
        where: {id},
        data: {
          approved: true,
          approvedAt: new Date(),
          approvedBy: profile.id,
        },
      })

      await createMaterialDemandSourceForInventoryOrder({
        materialId: order.materialId,
        inventoryOrderId: id,
        requiredQty: requestedQty,
        createdBy: profile.id,
        tx,
      })
    })

    logger.info(`Inventory order approved and added to material demand: ${id}`)
    revalidatePath(REVALIDATE_PATH)
    revalidatePath(REVALIDATE_MATERIAL_DEMAND)
  },
})

export const softDeleteInventoryOrderAction = protectedServerFunction({
  schema: inventoryOrderIdSchema,
  functionName: 'Soft delete inventory order action',
  serverFn: async ({data, profile, logger}) => {
    const {id} = data
    await prismaClient.$transaction(async tx => {
      const order = await tx.inventoryOrder.findUnique({
        where: {id},
        select: {id: true, deleted: true},
      })

      if (!order) {
        throw new Error('Inventory order not found.')
      }

      if (order.deleted) {
        throw new Error('Inventory order is already deleted.')
      }

      await tx.inventoryOrder.update({
        where: {id},
        data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
      })

      await removeMaterialDemandSourceForInventoryOrder({inventoryOrderId: id, tx})
    })

    logger.info(`Inventory order soft deleted: ${id}`)
    revalidatePath(REVALIDATE_PATH)
    revalidatePath(REVALIDATE_MATERIAL_DEMAND)
  },
})

export const rejectInventoryOrderAction = protectedServerFunction({
  schema: inventoryOrderIdSchema,
  functionName: 'Reject inventory order action',
  serverFn: async ({data: {id}, profile, logger}) => {
    const order = await prismaClient.inventoryOrder.findUnique({
      where: {id},
      select: {id: true, deleted: true, approved: true, rejected: true},
    })

    if (!order) {
      throw new Error('Inventory order not found.')
    }

    if (order.deleted) {
      throw new Error('Inventory order is already deleted.')
    }

    if (order.approved) {
      throw new Error('Approved inventory orders cannot be rejected.')
    }

    if (order.rejected) {
      throw new Error('Inventory order is already rejected.')
    }

    await prismaClient.inventoryOrder.update({
      where: {id},
      data: {
        rejected: true,
        rejectedAt: new Date(),
        rejectedBy: profile.id,
      },
    })

    logger.info(`Inventory order rejected: ${id}`)
    revalidatePath(REVALIDATE_PATH)
  },
})

export const hardDeleteInventoryOrderAction = protectedServerFunction({
  schema: inventoryOrderIdSchema,
  functionName: 'Hard delete inventory order action',
  serverFn: async ({data, logger}) => {
    const {id} = data
    await prismaClient.$transaction(async tx => {
      const order = await tx.inventoryOrder.findUnique({
        where: {id},
        select: {id: true, deleted: true},
      })

      if (!order) {
        throw new Error('Inventory order not found.')
      }

      if (!order.deleted) {
        throw new Error('Hard delete is blocked. Soft delete this order request first.')
      }

      await removeMaterialDemandSourceForInventoryOrder({inventoryOrderId: id, tx})
      await tx.inventoryOrder.delete({where: {id}})
    })

    logger.info(`Inventory order hard deleted: ${id}`)
    revalidatePath(REVALIDATE_PATH)
    revalidatePath(REVALIDATE_MATERIAL_DEMAND)
  },
})

export const undeleteInventoryOrderAction = protectedServerFunction({
  schema: inventoryOrderIdSchema,
  functionName: 'Undelete inventory order action',
  serverFn: async ({data, profile, logger}) => {
    const {id} = data

    await prismaClient.$transaction(async tx => {
      const order = await tx.inventoryOrder.findUnique({
        where: {id},
        select: {
          id: true,
          materialId: true,
          deleted: true,
          approved: true,
          longDescription: true,
          requestedQty: true,
        },
      })

      if (!order) {
        throw new Error('Inventory order not found.')
      }

      if (!order.deleted) {
        throw new Error('Inventory order is not deleted.')
      }

      await tx.inventoryOrder.update({
        where: {id},
        data: {
          deleted: false,
          deletedAt: null,
          deletedBy: null,
        },
      })

      if (order.approved) {
        const legacyRequestedQty = resolveRequestedQtyFromDescription(order.longDescription)
        const requestedQty = Math.max(order.requestedQty ?? 1, legacyRequestedQty)

        await createMaterialDemandSourceForInventoryOrder({
          materialId: order.materialId,
          inventoryOrderId: id,
          requiredQty: requestedQty,
          createdBy: profile.id,
          tx,
        })
      }
    })

    logger.info(`Inventory order restored: ${id}`)
    revalidatePath(REVALIDATE_PATH)
    revalidatePath(REVALIDATE_MATERIAL_DEMAND)
  },
})

