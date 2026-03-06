'use server'
import {revalidatePath} from 'next/cache'
import {randomUUID} from 'crypto'
import {createWarehousePlace, updateWarehousePlace, softDeleteWarehousePlace} from '@/dal/warehousePlace'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {
  createWarehousePlaceSchema,
  updateWarehousePlaceSchema,
  deleteWarehousePlaceSchema,
} from '@/schemas/warehousePlaceSchemas'

const REVALIDATE = '/departments/warehouse/place'

export const createWarehousePlaceAction = protectedServerFunction({
  schema: createWarehousePlaceSchema,
  functionName: 'Create warehouse place',
  serverFn: async ({data, profile, logger}) => {
    const item = await createWarehousePlace({
      ...data,
      id: data.id || randomUUID(),
      quantityInStock: Number(data.quantityInStock ?? 0),
      createdAt: new Date(),
      createdBy: profile.id,
    })
    logger.info(`WarehousePlace created: ${item.id}`)
    revalidatePath(REVALIDATE)
  },
})

export const updateWarehousePlaceAction = protectedServerFunction({
  schema: updateWarehousePlaceSchema,
  functionName: 'Update warehouse place',
  serverFn: async ({data, logger}) => {
    const {id, ...rest} = data
    const item = await updateWarehousePlace(id, {
      ...rest,
      quantityInStock: rest.quantityInStock != null ? Number(rest.quantityInStock) : undefined,
    })
    logger.info(`WarehousePlace updated: ${item.id}`)
    revalidatePath(REVALIDATE)
  },
})

export const deleteWarehousePlaceAction = protectedServerFunction({
  schema: deleteWarehousePlaceSchema,
  functionName: 'Delete warehouse place',
  serverFn: async ({data, profile, logger}) => {
    await softDeleteWarehousePlace(data.id, profile.id)
    logger.info(`WarehousePlace soft-deleted: ${data.id}`)
    revalidatePath(REVALIDATE)
  },
})
