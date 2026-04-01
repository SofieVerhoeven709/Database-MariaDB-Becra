'use server'

import {revalidatePath} from 'next/cache'
import {randomUUID} from 'crypto'
import {createMaterial, updateMaterial, softDeleteMaterial, restoreMaterial, cloneMaterial} from '@/dal/materials'
import {prismaClient} from '@/dal/prismaClient'
import {protectedFormAction} from '@/lib/serverFunctions'
import {createMaterialSchema, updateMaterialSchema, deleteMaterialSchema} from '@/schemas/materialSchemas'
import {createTargetForType} from '@/dal/targets'

const REVALIDATE_MATERIAL = '/departments/engineering/material'
const REVALIDATE_INVENTORY = '/departments/warehouse/inventory'

async function generateBeNumber() {
  const materials = await prismaClient.material.findMany({
    select: {beNumber: true},
  })

  const START_NUMBER = 1000000

  const numericBeNumbers = materials
    .map(({beNumber}) => (beNumber ?? '').trim()) // Ensure beNumber is always a string
    .filter(beNumber => /^\d+$/.test(beNumber))
    .map(Number)

  if (numericBeNumbers.length === 0) {
    return String(START_NUMBER)
  }

  const maxBeNumber = Math.max(...numericBeNumbers)
  return String(Math.max(maxBeNumber + 1, START_NUMBER))
}

export const createMaterialAction = protectedFormAction({
  schema: createMaterialSchema,
  functionName: 'Create material',
  globalErrorMessage: 'Could not create the material, please try again.',
  serverFn: async ({data, profile, logger}) => {
    const target = await createTargetForType('Company', profile.id)
    const {brandOrderNr, ...restData} = data
    let beNumber = data.beNumber?.trim()
    const preferredSupplierCompanyId = data.preferredSupplierCompanyId ?? null
    const supplierCompanyIds = Array.from(
      new Set([
        ...(data.supplierCompanyIds ?? []),
        ...(preferredSupplierCompanyId ? [preferredSupplierCompanyId] : []),
      ]),
    )

    if (!beNumber) {
      beNumber = await generateBeNumber()
    }

    const material = await createMaterial({
      ...restData,
      id: data.id || randomUUID(),
      beNumber,
      brandOrderNr: brandOrderNr ?? null,
      preferredSupplierCompanyId,
      preferredSupplierOrderId: data.preferredSupplierOrderId ?? null,
      preferredSupplierShortDescription: data.preferredSupplierShortDescription ?? null,
      supplierCompanyIds,
      bePartDoc: data.bePartDoc != null ? Number(data.bePartDoc) : null,
      materialGroupIdA: data.materialGroupIdA,
      materialGroupIdB: data.materialGroupIdB ?? null,
      materialGroupIdC: data.materialGroupIdC ?? null,
      materialGroupIdD: data.materialGroupIdD ?? null,
      createdBy: profile.id,
      targetId: target.id,
    })

    if (!material) {
      return {
        success: false,
        errors: {global: ['Material could not be created. Please try again.']},
      }
    }
    logger.info(`Material created: ${material.id}`)
    revalidatePath(REVALIDATE_MATERIAL)
    revalidatePath(REVALIDATE_INVENTORY)
  },
})

export const updateMaterialAction = protectedFormAction({
  schema: updateMaterialSchema,
  functionName: 'Update material',
  globalErrorMessage: 'Could not update the material, please try again.',
  serverFn: async ({data, logger}) => {
    const {id, ...rest} = data
    const preferredSupplierCompanyId = rest.preferredSupplierCompanyId ?? null
    const supplierCompanyIds = Array.from(
      new Set([
        ...(rest.supplierCompanyIds ?? []),
        ...(preferredSupplierCompanyId ? [preferredSupplierCompanyId] : []),
      ]),
    )

    const updated = await updateMaterial(id, {
      ...rest,
      brandOrderNr: rest.brandOrderNr ?? null,
      preferredSupplierCompanyId,
      supplierCompanyIds,
      bePartDoc: rest.bePartDoc != null ? Number(rest.bePartDoc) : rest.bePartDoc,
    })
    logger.info(`Material updated: ${updated.id}`)
    revalidatePath(REVALIDATE_MATERIAL)
    revalidatePath(REVALIDATE_INVENTORY)
    revalidatePath(`${REVALIDATE_MATERIAL}/${updated.id}`)
  },
})

export const deleteMaterialAction = protectedFormAction({
  schema: deleteMaterialSchema,
  functionName: 'Delete material',
  globalErrorMessage: 'Could not delete the material, please try again.',
  serverFn: async ({data, profile, logger}) => {
    await softDeleteMaterial(data.id, profile.id)
    logger.info(`Material soft-deleted: ${data.id}`)
    revalidatePath(REVALIDATE_MATERIAL)
    revalidatePath(REVALIDATE_INVENTORY)
    revalidatePath(`${REVALIDATE_MATERIAL}/${data.id}`)
  },
})

export const restoreMaterialAction = protectedFormAction({
  schema: deleteMaterialSchema,
  functionName: 'Restore material',
  globalErrorMessage: 'Could not restore the material, please try again.',
  serverFn: async ({data, logger}) => {
    await restoreMaterial(data.id)
    logger.info(`Material restored: ${data.id}`)
    revalidatePath(REVALIDATE_MATERIAL)
    revalidatePath(REVALIDATE_INVENTORY)
    revalidatePath(`${REVALIDATE_MATERIAL}/${data.id}`)
  },
})

export const cloneMaterialAction = protectedFormAction({
  schema: updateMaterialSchema, // Accepts an id for the material to clone
  functionName: 'Clone material',
  globalErrorMessage: 'Could not clone the material, please try again.',
  serverFn: async ({data, profile, logger}) => {
    const {id} = data
    const cloned = await cloneMaterial(id)
    logger.info(`Material cloned: ${cloned.id} from ${id}`)
    revalidatePath(REVALIDATE_MATERIAL)
    revalidatePath(REVALIDATE_INVENTORY)
    return {success: true, id: cloned.id}
  },
})
