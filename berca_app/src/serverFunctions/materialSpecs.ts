'use server'

import {revalidatePath} from 'next/cache'
import {randomUUID} from 'crypto'
import {
  createMaterialGroup,
  updateMaterialGroup,
  softDeleteMaterialGroup,
  createUnit,
  updateUnit,
  softDeleteUnit,
} from '@/dal/materialSpecs'
import {protectedFormAction} from '@/lib/serverFunctions'
import {
  materialGroupSchema,
  deleteMaterialGroupSchema,
  unitSchema,
  deleteUnitSchema,
} from '@/schemas/materialSpecSchemas'

const REVALIDATE = '/departments/warehouse/spec'
const REVALIDATE_MATERIAL = '/departments/engineering/material'

// ─── MaterialGroup actions ───────────────────────────────────────────────────

export const createMaterialGroupAction = protectedFormAction({
  schema: materialGroupSchema,
  functionName: 'Create material group',
  globalErrorMessage: 'Could not create the material group, please try again.',
  serverFn: async ({data, logger}) => {
    const group = await createMaterialGroup({...data, id: data.id || randomUUID()})
    logger.info(`MaterialGroup created: ${group.id}`)
    revalidatePath(REVALIDATE)
    revalidatePath(REVALIDATE_MATERIAL)
  },
})

export const updateMaterialGroupAction = protectedFormAction({
  schema: materialGroupSchema,
  functionName: 'Update material group',
  globalErrorMessage: 'Could not update the material group, please try again.',
  serverFn: async ({data, logger}) => {
    const {id, ...rest} = data
    const group = await updateMaterialGroup(id, rest)
    logger.info(`MaterialGroup updated: ${group.id}`)
    revalidatePath(REVALIDATE)
    revalidatePath(REVALIDATE_MATERIAL)
  },
})

export const deleteMaterialGroupAction = protectedFormAction({
  schema: deleteMaterialGroupSchema,
  functionName: 'Delete material group',
  globalErrorMessage: 'Could not delete the material group, please try again.',
  serverFn: async ({data, profile, logger}) => {
    await softDeleteMaterialGroup(data.id, profile.id)
    logger.info(`MaterialGroup soft-deleted: ${data.id}`)
    revalidatePath(REVALIDATE)
    revalidatePath(REVALIDATE_MATERIAL)
  },
})

// ─── Unit actions ────────────────────────────────────────────────────────────

export const createUnitAction = protectedFormAction({
  schema: unitSchema,
  functionName: 'Create unit',
  globalErrorMessage: 'Could not create the unit, please try again.',
  serverFn: async ({data, profile, logger}) => {
    const unit = await createUnit({
      ...data,
      id: data.id || randomUUID(),
      createdBy: profile.id,
      createdAt: new Date(),
    })
    logger.info(`Unit created: ${unit.id}`)
    revalidatePath(REVALIDATE)
    revalidatePath(REVALIDATE_MATERIAL)
  },
})

export const updateUnitAction = protectedFormAction({
  schema: unitSchema,
  functionName: 'Update unit',
  globalErrorMessage: 'Could not update the unit, please try again.',
  serverFn: async ({data, logger}) => {
    const {id, ...rest} = data
    const unit = await updateUnit(id, rest)
    logger.info(`Unit updated: ${unit.id}`)
    revalidatePath(REVALIDATE)
    revalidatePath(REVALIDATE_MATERIAL)
  },
})

export const deleteUnitAction = protectedFormAction({
  schema: deleteUnitSchema,
  functionName: 'Delete unit',
  globalErrorMessage: 'Could not delete the unit, please try again.',
  serverFn: async ({data, profile, logger}) => {
    await softDeleteUnit(data.id, profile.id)
    logger.info(`Unit soft-deleted: ${data.id}`)
    revalidatePath(REVALIDATE)
    revalidatePath(REVALIDATE_MATERIAL)
  },
})
