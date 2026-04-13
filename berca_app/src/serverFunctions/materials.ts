'use server'

import {revalidatePath} from 'next/cache'
import {randomUUID} from 'crypto'
import {createMaterial, updateMaterial, softDeleteMaterial, hardDeleteMaterial, restoreMaterial} from '@/dal/materials'
import {prismaClient} from '@/dal/prismaClient'
import {protectedFormAction} from '@/lib/serverFunctions'
import {createMaterialSchema, updateMaterialSchema, deleteMaterialSchema} from '@/schemas/materialSchemas'
import {createTargetForType} from '@/dal/targets'
import {z} from 'zod/v4'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getLogger} from '@/lib/logger'
import {Prisma} from '@/generated/prisma/client'

const REVALIDATE_MATERIAL = '/departments/engineering/material'
const REVALIDATE_INVENTORY = '/departments/warehouse/inventory'
const REVALIDATE_WAREHOUSE_PLACE = '/departments/[departmentId]/place'
const REVALIDATE_INVENTORY_PLACE = '/departments/[departmentId]/inventoryPlace'

const createMaterialForPlaceSchema = z.object({
  id: z.string().uuid(),
  beNumber: z
    .string()
    .trim()
    .regex(/^(1\d{6}|4\d{6})$/, 'Number has to be in the 1000000 (BE) or 4000000 (IOS)'),
  shortDescription: z.string().trim().min(1).max(255),
  name: z.string().trim().max(255).optional(),
})

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

async function resolveValidWarehousePlaceId(warehousePlaceId: string | null | undefined) {
  if (!warehousePlaceId) return null

  const place = await prismaClient.warehousePlace.findUnique({
    where: {id: warehousePlaceId},
    select: {id: true},
  })

  return place ? warehousePlaceId : null
}

function isWarehousePlaceForeignKeyError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false
  if (error.code !== 'P2003') return false
  return /warehousePlaceId/i.test(error.message)
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

    const warehousePlaceId = await resolveValidWarehousePlaceId(data.warehousePlace ?? null)
    if (data.warehousePlace && !warehousePlaceId) {
      return {
        success: false,
        errors: {warehousePlace: ['Selected warehouse place does not exist anymore. Please select a valid one.']},
      }
    }

    if (!beNumber) {
      beNumber = await generateBeNumber()
    }

    let material
    try {
      material = await createMaterial({
        ...restData,
        id: data.id || randomUUID(),
        beNumber,
        brandOrderNr: brandOrderNr ?? null,
        preferredSupplierCompanyId,
        preferredSupplierOrderId: data.preferredSupplierOrderId ?? null,
        preferredSupplierShortDescription: data.preferredSupplierShortDescription ?? null,
        supplierCompanyIds,
        warehousePlace: warehousePlaceId,
        leadTimeValue: data.longLeadTime ? (data.leadTimeValue ?? null) : null,
        leadTimeUnit: data.longLeadTime ? (data.leadTimeUnit ?? null) : null,
        materialGroupIdA: data.materialGroupIdA,
        materialGroupIdB: data.materialGroupIdB ?? null,
        materialGroupIdC: data.materialGroupIdC ?? null,
        materialGroupIdD: data.materialGroupIdD ?? null,
        createdBy: profile.id,
        targetId: target.id,
      })
    } catch (error) {
      if (isWarehousePlaceForeignKeyError(error)) {
        return {
          success: false,
          errors: {warehousePlace: ['Selected warehouse place is invalid. Please choose another place.']},
        }
      }
      throw error
    }

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

    const warehousePlaceId = await resolveValidWarehousePlaceId(rest.warehousePlace ?? null)
    if (rest.warehousePlace && !warehousePlaceId) {
      return {
        success: false,
        errors: {warehousePlace: ['Selected warehouse place does not exist anymore. Please select a valid one.']},
      }
    }

    let updated
    try {
      updated = await updateMaterial(id, {
        ...rest,
        brandOrderNr: rest.brandOrderNr ?? null,
        preferredSupplierCompanyId,
        supplierCompanyIds,
        warehousePlace: warehousePlaceId,
        leadTimeValue: rest.longLeadTime ? (rest.leadTimeValue ?? null) : null,
        leadTimeUnit: rest.longLeadTime ? (rest.leadTimeUnit ?? null) : null,
      })
    } catch (error) {
      if (isWarehousePlaceForeignKeyError(error)) {
        return {
          success: false,
          errors: {warehousePlace: ['Selected warehouse place is invalid. Please choose another place.']},
        }
      }
      throw error
    }
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

export const hardDeleteMaterialAction = protectedFormAction({
  schema: deleteMaterialSchema,
  functionName: 'Hard delete material',
  globalErrorMessage: 'Could not permanently delete the material, please try again.',
  serverFn: async ({data, logger}) => {
    await hardDeleteMaterial(data.id)
    logger.info(`Material hard-deleted: ${data.id}`)
    revalidatePath(REVALIDATE_MATERIAL)
    revalidatePath(REVALIDATE_INVENTORY)
    revalidatePath(`${REVALIDATE_MATERIAL}/${data.id}`)
  },
})

export async function createMaterialForPlaceAction(unvalidatedData: z.infer<typeof createMaterialForPlaceSchema>) {
  const logger = await getLogger()
  const profile = await getSessionProfileFromCookieOrThrow()
  const data = createMaterialForPlaceSchema.parse(unvalidatedData)

  const [defaultUnit, defaultMaterialGroup] = await Promise.all([
    prismaClient.unit.findFirst({
      where: {deleted: false, valid: true},
      select: {id: true},
      orderBy: {unitName: 'asc'},
    }),
    prismaClient.materialGroup.findFirst({
      where: {deleted: false},
      select: {id: true},
      orderBy: [{groupA: 'asc'}, {groupB: 'asc'}, {groupC: 'asc'}, {groupD: 'asc'}],
    }),
  ])

  if (!defaultUnit || !defaultMaterialGroup) {
    throw new Error('No standard unit of material group found for creating material.')
  }

  const target = await createTargetForType('Company', profile.id)
  const material = await createMaterial({
    id: data.id,
    beNumber: data.beNumber,
    shortDescription: data.shortDescription,
    name: data.name || null,
    materialGroupIdA: defaultMaterialGroup.id,
    unitId: defaultUnit.id,
    createdBy: profile.id,
    targetId: target.id,
    isSerialTracked: false,
  })

  logger.info(`Material quick-created for place: ${material.id}`)
  revalidatePath(REVALIDATE_MATERIAL)
  revalidatePath(REVALIDATE_INVENTORY)
  revalidatePath(REVALIDATE_WAREHOUSE_PLACE, 'page')
  revalidatePath(REVALIDATE_INVENTORY_PLACE, 'page')

  return {
    id: material.id,
    beNumber: material.beNumber,
    name: material.name,
    shortDescription: material.shortDescription,
  }
}
