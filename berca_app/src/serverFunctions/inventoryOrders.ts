'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {
  createInventoryOrderSchema,
  updateInventoryOrderSchema,
  inventoryOrderIdSchema,
} from '@/schemas/inventoryOrderSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {ensureMaterialDemandForMaterial} from '@/dal/materialDemands'

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

export const createInventoryOrderAction = protectedServerFunction({
  schema: createInventoryOrderSchema,
  functionName: 'Create inventory order action',
  serverFn: async ({data, profile, logger}) => {
    const inventory = await prismaClient.inventory.findUnique({
      where: {id: data.inventoryId},
      select: {materialId: true},
    })

    if (!inventory) {
      throw new Error('Inventory item not found.')
    }

    const existingPending = await prismaClient.inventoryOrder.findFirst({
      where: {
        deleted: false,
        Inventory: {is: {materialId: inventory.materialId}},
      },
      select: {id: true},
    })

    if (existingPending) {
      throw new Error('There is already a pending request for this material.')
    }

    logger.info(`Creating inventory order, createdBy: ${profile.id}`)
    await prismaClient.inventoryOrder.create({
      data: {
        id: crypto.randomUUID(),
        inventoryId: data.inventoryId,
        orderNumber: data.orderNumber,
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
        inventoryId: rest.inventoryId,
        orderNumber: rest.orderNumber,
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
      include: {
        Inventory: {
          select: {
            materialId: true,
            quantityInStock: true,
            minQuantityInStock: true,
          },
        },
      },
    })

    if (!order) {
      throw new Error('Inventory order not found.')
    }

    if (order.deleted) {
      throw new Error('Inventory order is already processed.')
    }

    const materialDemand = await ensureMaterialDemandForMaterial(order.Inventory.materialId)
    const fallbackQty = Math.max(1, order.Inventory.minQuantityInStock - order.Inventory.quantityInStock)
    const requestedQty = Math.max(resolveRequestedQtyFromDescription(order.longDescription), fallbackQty)

    await prismaClient.$transaction(async tx => {
      await tx.inventoryOrder.update({
        where: {id},
        data: {
          deleted: true,
          deletedAt: new Date(),
          deletedBy: profile.id,
        },
      })

      await tx.materialDemand.update({
        where: {id: materialDemand.id},
        data: {
          totalRequiredQty: {increment: requestedQty},
        },
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
    await prismaClient.inventoryOrder.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Inventory order soft deleted: ${id}`)
    revalidatePath(REVALIDATE_PATH)
  },
})

export const hardDeleteInventoryOrderAction = protectedServerFunction({
  schema: inventoryOrderIdSchema,
  functionName: 'Hard delete inventory order action',
  serverFn: async ({data, logger}) => {
    const {id} = data
    await prismaClient.inventoryOrder.delete({where: {id}})
    logger.info(`Inventory order hard deleted: ${id}`)
    revalidatePath(REVALIDATE_PATH)
  },
})
