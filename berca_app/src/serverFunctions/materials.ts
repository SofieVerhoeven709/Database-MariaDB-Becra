'use server'

import {revalidatePath} from 'next/cache'
import {randomUUID} from 'crypto'
import {createMaterial, updateMaterial, softDeleteMaterial} from '@/dal/materials'
import {protectedFormAction} from '@/lib/serverFunctions'
import {createMaterialSchema, updateMaterialSchema, deleteMaterialSchema} from '@/schemas/materialSchemas'

export const createMaterialAction = protectedFormAction({
  schema: createMaterialSchema,
  functionName: 'Create material',
  globalErrorMessage: 'Could not create the material, please try again.',
  serverFn: async ({data, profile, logger}) => {
    const material = await createMaterial({
      ...data,
      id: data.id || randomUUID(),
      brandOrderNr: Number(data.brandOrderNr),
      bePartDoc: data.bePartDoc != null ? Number(data.bePartDoc) : null,
      createdBy: profile.id,
    })
    logger.info(`Material created: ${material.id}`)
    revalidatePath('/departments/engineering/material')
  },
})

export const updateMaterialAction = protectedFormAction({
  schema: updateMaterialSchema,
  functionName: 'Update material',
  globalErrorMessage: 'Could not update the material, please try again.',
  serverFn: async ({data, logger}) => {
    const {id, ...rest} = data
    const updated = await updateMaterial(id, {
      ...rest,
      brandOrderNr: rest.brandOrderNr != null ? Number(rest.brandOrderNr) : undefined,
      bePartDoc: rest.bePartDoc != null ? Number(rest.bePartDoc) : rest.bePartDoc,
    })
    logger.info(`Material updated: ${updated.id}`)
    revalidatePath('/departments/engineering/material')
  },
})

export const deleteMaterialAction = protectedFormAction({
  schema: deleteMaterialSchema,
  functionName: 'Delete material',
  globalErrorMessage: 'Could not delete the material, please try again.',
  serverFn: async ({data, profile, logger}) => {
    await softDeleteMaterial(data.id, profile.id)
    logger.info(`Material soft-deleted: ${data.id}`)
    revalidatePath('/departments/engineering/material')
  },
})
