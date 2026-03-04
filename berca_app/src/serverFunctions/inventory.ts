'use server'
import {revalidatePath} from 'next/cache'
import {randomUUID} from 'crypto'
import {createInventory, updateInventory, softDeleteInventory} from '@/dal/inventory'
import {protectedFormAction} from '@/lib/serverFunctions'
import {createInventorySchema, updateInventorySchema, deleteInventorySchema} from '@/schemas/inventorySchemas'
const REVALIDATE = '/departments/warehouse/inventory'
export const createInventoryAction = protectedFormAction({
  schema: createInventorySchema,
  functionName: 'Create inventory item',
  globalErrorMessage: 'Could not create the inventory item, please try again.',
  serverFn: async ({data, profile, logger}) => {
    const item = await createInventory({
      ...data,
      id: data.id || randomUUID(),
      quantityInStock: Number(data.quantityInStock),
      minQuantityInStock: Number(data.minQuantityInStock),
      maxQuantityInStock: Number(data.maxQuantityInStock),
      noValidDate: new Date(data.noValidDate),
      createdBy: profile.id,
    })
    logger.info(`Inventory created: ${item.id}`)
    revalidatePath(REVALIDATE)
  },
})
export const updateInventoryAction = protectedFormAction({
  schema: updateInventorySchema,
  functionName: 'Update inventory item',
  globalErrorMessage: 'Could not update the inventory item, please try again.',
  serverFn: async ({data, logger}) => {
    const {id, ...rest} = data
    const item = await updateInventory(id, {
      ...rest,
      quantityInStock: rest.quantityInStock != null ? Number(rest.quantityInStock) : undefined,
      minQuantityInStock: rest.minQuantityInStock != null ? Number(rest.minQuantityInStock) : undefined,
      maxQuantityInStock: rest.maxQuantityInStock != null ? Number(rest.maxQuantityInStock) : undefined,
      noValidDate: rest.noValidDate != null ? new Date(rest.noValidDate) : undefined,
    })
    logger.info(`Inventory updated: ${item.id}`)
    revalidatePath(REVALIDATE)
  },
})
export const deleteInventoryAction = protectedFormAction({
  schema: deleteInventorySchema,
  functionName: 'Delete inventory item',
  globalErrorMessage: 'Could not delete the inventory item, please try again.',
  serverFn: async ({data, profile, logger}) => {
    await softDeleteInventory(data.id, profile.id)
    logger.info(`Inventory soft-deleted: ${data.id}`)
    revalidatePath(REVALIDATE)
  },
})
