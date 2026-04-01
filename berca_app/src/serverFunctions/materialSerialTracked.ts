'use server'

import {revalidatePath} from 'next/cache'
import {randomUUID} from 'crypto'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {prismaClient} from '@/dal/prismaClient'

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
    if (!data.materialId) {
      throw new Error('Selecteer eerst een materiaal dat als serial tracked staat gemarkeerd.')
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
      throw new Error('Geselecteerd materiaal bestaat niet of is verwijderd.')
    }

    if (!material.isSerialTracked) {
      throw new Error('Dit materiaal staat niet op serial tracked. Zet dit eerst aan in Materials.')
    }

    const existing = await prismaClient.materialSerialTrack.findFirst({
      where: {materialId: material.id, deleted: false},
      select: {id: true},
    })

    if (existing) {
      throw new Error('Er bestaat al een serial tracked record voor dit materiaal.')
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
