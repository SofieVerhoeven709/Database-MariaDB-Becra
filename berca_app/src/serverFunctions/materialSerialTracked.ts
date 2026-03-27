'use server'

import {revalidatePath} from 'next/cache'
import {randomUUID} from 'crypto'
import {protectedServerFunction} from '@/lib/serverFunctions'

import {createSerialTracked, updateSerialTracked, softDeleteSerialTracked} from '@/dal/materialSerialTracked'

import {
  createMaterialSerialTrackedSchema,
  updateMaterialSerialTrackedSchema,
  deleteMaterialSerialTrackedSchema,
} from '@/schemas/materialSerialTrackedSchema'

const REVALIDATE = '/departments/serialTracked'

export const createMaterialSerialTrackedAction = protectedServerFunction({
  schema: createMaterialSerialTrackedSchema,
  functionName: 'Create serial tracked item',
  serverFn: async ({data, profile, logger}) => {
    // Remove beNumber from data, use materialId for relation
    const {beNumber, ...rest} = data
    const item = await createSerialTracked({
      ...rest,
      id: data.id || randomUUID(),
      createdBy: profile.id,
    })
    console.log('[ServerAction:createMaterialSerialTrackedAction] payload:', { ...rest, id: data.id || randomUUID(), createdBy: profile.id })
    console.log('[ServerAction:createMaterialSerialTrackedAction] created item:', item)
    logger.info(`Serial tracked item created: ${item.id}`)
    revalidatePath(REVALIDATE)
    console.log('[ServerAction:createMaterialSerialTrackedAction] revalidatePath called:', REVALIDATE)
  },
})

export const updateMaterialSerialTrackedAction = protectedServerFunction({
  schema: updateMaterialSerialTrackedSchema,
  functionName: 'Update serial tracked item',
  serverFn: async ({data, logger}) => {
    const {id, ...rest} = data

    const item = await updateSerialTracked(id, rest)

    logger.info(`Serial tracked item updated: ${item.id}`)
    revalidatePath(REVALIDATE)
  },
})

export const deleteMaterialSerialTrackedAction = protectedServerFunction({
  schema: deleteMaterialSerialTrackedSchema,
  functionName: 'Delete serial tracked item',
  serverFn: async ({data, profile, logger}) => {
    await softDeleteSerialTracked(data.id, profile.id)

    logger.info(`Serial tracked item soft-deleted: ${data.id}`)
    revalidatePath(REVALIDATE)
  },
})
