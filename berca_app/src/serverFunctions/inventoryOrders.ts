'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {
  createInventoryOrderSchema,
  updateInventoryOrderSchema,
  inventoryOrderIdSchema,
} from '@/schemas/inventoryOrderSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'

const REVALIDATE_PATH = '/departments/purchasing/orderRequests'

function toDate(val: string): Date {
  const d = new Date(val)
  if (isNaN(d.getTime())) {
    throw new Error('Invalid order date')
  }
  return d
}

export const createInventoryOrderAction = protectedServerFunction({
  schema: createInventoryOrderSchema,
  functionName: 'Create inventory order action',
  serverFn: async ({data, profile, logger}) => {
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
