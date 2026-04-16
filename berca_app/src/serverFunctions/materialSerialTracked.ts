'use server'

import {revalidatePath} from 'next/cache'
import {randomUUID} from 'crypto'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {prismaClient} from '@/dal/prismaClient'

import {
  createSerialTracked,
  updateSerialTracked,
  softDeleteSerialTracked,
  undeleteSerialTracked,
  hardDeleteSerialTracked,
} from '@/dal/materialSerialTracked'

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
    if (!data.materialId) {
      throw new Error('First select a material that is marked as a serial tracked.')
    }

    const material = await prismaClient.material.findUnique({
      where: {id: data.materialId},
      select: {
        id: true,
        deleted: true,
        isSerialTracked: true,
        beNumber: true,
        materialGroupIdA: true,
      },
    })

    if (!material || material.deleted) {
      throw new Error('The selected material does not exist or has been deleted.')
    }

    if (!material.isSerialTracked) {
      throw new Error(
        'This material is not marked as a serial tracked. First mark it as a serial tracked in the Materials.',
      )
    }

    const existing = await prismaClient.materialSerialTrack.findFirst({
      where: {materialId: material.id, deleted: false},
      select: {id: true},
    })

    if (existing) {
      throw new Error('There is already a serial tracked for this material.')
    }

    if (data.warehousePlaceId) {
      const warehousePlace = await prismaClient.warehousePlace.findUnique({
        where: {id: data.warehousePlaceId},
        select: {id: true, deleted: true},
      })

      if (!warehousePlace || warehousePlace.deleted) {
        throw new Error('Selected warehouse place does not exist or is deleted.')
      }
    }

    const payload = {
      ...data,
      id: data.id || randomUUID(),
      createdBy: profile.id,
      materialId: material.id,
      beNumber: data.beNumber ?? material.beNumber,
      materialGroupId: data.materialGroupId ?? material.materialGroupIdA,
    }

    const item = await createSerialTracked(payload)

    logger.info(`Serial tracked item created: ${item.id}`)
    revalidatePath(REVALIDATE)
  },
})

export const updateMaterialSerialTrackedAction = protectedServerFunction({
  schema: updateMaterialSerialTrackedSchema,
  functionName: 'Update serial tracked item',
  serverFn: async ({data, logger}) => {
    const {id, ...rest} = data

    if (rest.warehousePlaceId) {
      const warehousePlace = await prismaClient.warehousePlace.findUnique({
        where: {id: rest.warehousePlaceId},
        select: {id: true, deleted: true},
      })

      if (!warehousePlace || warehousePlace.deleted) {
        throw new Error('Selected warehouse place does not exist or is deleted.')
      }
    }

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

export const undeleteMaterialSerialTrackedAction = protectedServerFunction({
  schema: deleteMaterialSerialTrackedSchema,
  functionName: 'Undelete serial tracked item',
  serverFn: async ({data, profile, logger}) => {
    const canDelete = profile.RoleLevelEmployee.some(
      rle => rle.RoleLevel.Role.name === 'Administrator' || rle.RoleLevel.SubRole.level >= 80,
    )

    if (!canDelete) {
      throw new Error('You are not allowed to restore serial tracked items.')
    }

    await undeleteSerialTracked(data.id)

    logger.info(`Serial tracked item restored: ${data.id}`)
    revalidatePath(REVALIDATE)
  },
})

export const hardDeleteMaterialSerialTrackedAction = protectedServerFunction({
  schema: deleteMaterialSerialTrackedSchema,
  functionName: 'Hard delete serial tracked item',
  serverFn: async ({data, profile, logger}) => {
    const isAdmin = profile.RoleLevelEmployee.some(
      rle => rle.RoleLevel.Role.name === 'Administrator' || rle.RoleLevel.SubRole.level >= 100,
    )

    if (!isAdmin) {
      throw new Error('Only administrators can permanently delete serial tracked items.')
    }

    await hardDeleteSerialTracked(data.id)

    logger.info(`Serial tracked item hard-deleted: ${data.id}`)
    revalidatePath(REVALIDATE)
  },
})
