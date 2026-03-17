'use server'

import {revalidatePath} from 'next/cache'
import {randomUUID} from 'crypto'
import {createMaterial, updateMaterial, softDeleteMaterial} from '@/dal/materials'
import {prismaClient} from '@/dal/prismaClient'
import {protectedFormAction} from '@/lib/serverFunctions'
import {createMaterialSchema, updateMaterialSchema, deleteMaterialSchema} from '@/schemas/materialSchemas'

const REVALIDATE_MATERIAL = '/departments/engineering/material'
const REVALIDATE_INVENTORY = '/departments/warehouse/inventory'

async function generateBeNumber() {
  const materials = await prismaClient.material.findMany({
    select: {beNumber: true},
  })

  const START_NUMBER = 1000000

  const numericBeNumbers = materials
    .map(({beNumber}) => Number(beNumber))
    .filter((num): num is number => Number.isFinite(num))

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
    let beNumber = data.beNumber?.trim()
    const preferredSupplierCompanyId = data.preferredSupplierCompanyId ?? null
    const supplierCompanyIds = Array.from(
      new Set([...(data.supplierCompanyIds ?? []), ...(preferredSupplierCompanyId ? [preferredSupplierCompanyId] : [])]),
    )

    if (!beNumber) {
      beNumber = await generateBeNumber()
    }

    const material = await createMaterial({
      ...data,
      id: data.id || randomUUID(),
      beNumber,
      brandOrderNr: data.brandOrderNr,
      preferredSupplierCompanyId,
      supplierCompanyIds,
      bePartDoc: data.bePartDoc != null ? Number(data.bePartDoc) : null,
      createdBy: profile.id,
    })

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
      new Set([...(rest.supplierCompanyIds ?? []), ...(preferredSupplierCompanyId ? [preferredSupplierCompanyId] : [])]),
    )

    const updated = await updateMaterial(id, {
      ...rest,
      brandOrderNr: rest.brandOrderNr,
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
