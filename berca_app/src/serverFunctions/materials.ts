'use server'

import {revalidatePath} from 'next/cache'
import {randomUUID} from 'crypto'
import {createMaterial, updateMaterial, softDeleteMaterial} from '@/dal/materials'
import {prismaClient} from '@/dal/prismaClient'
import {protectedFormAction} from '@/lib/serverFunctions'
import {createMaterialSchema, updateMaterialSchema, deleteMaterialSchema} from '@/schemas/materialSchemas'

const REVALIDATE_MATERIAL = '/departments/engineering/material'
const REVALIDATE_INVENTORY = '/departments/warehouse/inventory'
const REVALIDATE_WAREHOUSE_PLACE = '/departments/warehouse/place'

async function assignWarehousePlaceToMaterial(
  warehousePlaceId: string | null | undefined,
  materialBeNumber: string,
  previousMaterialBeNumber?: string,
) {
  const beNumbersToClear = Array.from(new Set([materialBeNumber, previousMaterialBeNumber].filter(Boolean))) as string[]

  // Keep a single place assignment per material by clearing prior links first.
  await prismaClient.warehousePlace.updateMany({
    where: {beNumber: {in: beNumbersToClear}},
    data: {beNumber: null},
  })

  if (!warehousePlaceId) return

  const target = await prismaClient.warehousePlace.findFirst({
    where: {id: warehousePlaceId, deleted: false},
    select: {id: true, beNumber: true, abbreviation: true, place: true},
  })

  if (!target) {
    throw new Error('Selected warehouse place was not found.')
  }

  if (target.beNumber && target.beNumber !== materialBeNumber) {
    const label = target.place ? `${target.abbreviation} (${target.place})` : target.abbreviation
    throw new Error(`Selected warehouse place ${label} is already assigned to BE ${target.beNumber}.`)
  }

  await prismaClient.warehousePlace.update({
    where: {id: warehousePlaceId},
    data: {beNumber: materialBeNumber},
  })
}

async function generateBeNumber() {
  const materials = await prismaClient.material.findMany({
    select: {beNumber: true},
  })

  const START_NUMBER = 1000000

  const numericBeNumbers = materials
    .map(({beNumber}) => beNumber.trim())
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
    const {brandOrderNr, warehousePlaceId, ...restData} = data
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
    })

    await assignWarehousePlaceToMaterial(warehousePlaceId, beNumber)

    logger.info(`Material created: ${material.id}`)
    revalidatePath(REVALIDATE_MATERIAL)
    revalidatePath(REVALIDATE_INVENTORY)
    revalidatePath(REVALIDATE_WAREHOUSE_PLACE)
  },
})

export const updateMaterialAction = protectedFormAction({
  schema: updateMaterialSchema,
  functionName: 'Update material',
  globalErrorMessage: 'Could not update the material, please try again.',
  serverFn: async ({data, logger}) => {
    const {id, warehousePlaceId, ...rest} = data
    const existingMaterial = await prismaClient.material.findUnique({
      where: {id},
      select: {beNumber: true},
    })

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

    await assignWarehousePlaceToMaterial(warehousePlaceId, updated.beNumber, existingMaterial?.beNumber)

    logger.info(`Material updated: ${updated.id}`)
    revalidatePath(REVALIDATE_MATERIAL)
    revalidatePath(REVALIDATE_INVENTORY)
    revalidatePath(REVALIDATE_WAREHOUSE_PLACE)
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
