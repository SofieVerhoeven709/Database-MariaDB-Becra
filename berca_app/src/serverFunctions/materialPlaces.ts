'use server'
import {revalidatePath} from 'next/cache'
import {randomUUID} from 'crypto'
import {createMaterialPlace, updateMaterialPlace, softDeleteMaterialPlace} from '@/dal/materialPlace'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {createMaterialPlaceSchema, updateMaterialPlaceSchema, deleteMaterialPlaceSchema} from '@/schemas/materialPlaceSchemas'

const REVALIDATE = '/departments/warehouse/materialPlace'

export const createMaterialPlaceAction = protectedServerFunction({
  schema: createMaterialPlaceSchema,
  functionName: 'Create material place',
  serverFn: async ({data, profile, logger}) => {
    const item = await createMaterialPlace({
      ...data,
      id: data.id || randomUUID(),
      quantityInStock: Number(data.quantityInStock ?? 0),
      createdAt: new Date(),
      createdBy: profile.id,
    })
    logger.info(`MaterialPlace created: ${item.id}`)
    revalidatePath(REVALIDATE)
  },
})

export const updateMaterialPlaceAction = protectedServerFunction({
  schema: updateMaterialPlaceSchema,
  functionName: 'Update material place',
  serverFn: async ({data, logger}) => {
    const {id, ...rest} = data
    const item = await updateMaterialPlace(id, {
      ...rest,
      quantityInStock: rest.quantityInStock != null ? Number(rest.quantityInStock) : undefined,
    })
    logger.info(`MaterialPlace updated: ${item.id}`)
    revalidatePath(REVALIDATE)
  },
})

export const deleteMaterialPlaceAction = protectedServerFunction({
  schema: deleteMaterialPlaceSchema,
  functionName: 'Delete material place',
  serverFn: async ({data, profile, logger}) => {
    await softDeleteMaterialPlace(data.id, profile.id)
    logger.info(`MaterialPlace soft-deleted: ${data.id}`)
    revalidatePath(REVALIDATE)
  },
})

