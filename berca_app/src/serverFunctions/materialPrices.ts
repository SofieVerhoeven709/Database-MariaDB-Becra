'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {
  createMaterialPriceSchema,
  updateMaterialPriceSchema,
  materialPriceIdSchema,
} from '@/schemas/materialPriceSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {softDeleteMaterialPrice, hardDeleteMaterialPrice, restoreMaterialPrice} from '@/dal/materialPrices'

const REVALIDATE_PATH = '/departments/purchasing/materialPrice'

export const createMaterialPriceAction = protectedServerFunction({
  schema: createMaterialPriceSchema,
  functionName: 'Create material price action',
  serverFn: async ({data, profile, logger}) => {
    logger.info(`Creating material price, createdBy: ${profile.id}`)

    let quantityPrice = data.quantityPrice ?? null
    const normalizedBeNumber = data.beNumber?.trim() || null

    // If unit quantity is omitted, copy default from preferred supplier for this BE number.
    if (normalizedBeNumber && quantityPrice == null) {
      const material = await prismaClient.material.findFirst({
        where: {beNumber: normalizedBeNumber, deleted: false},
        select: {preferredSupplierCompanyId: true},
      })

      if (material?.preferredSupplierCompanyId) {
        const preferredSupplierPrice = await prismaClient.materialPrice.findFirst({
          where: {
            beNumber: normalizedBeNumber,
            companyId: material.preferredSupplierCompanyId,
            deleted: false,
          },
          select: {quantityPrice: true},
          orderBy: {updatedAt: 'desc'},
        })

        if (preferredSupplierPrice) {
          quantityPrice ??= preferredSupplierPrice.quantityPrice != null
            ? Number(preferredSupplierPrice.quantityPrice.toString())
            : null
        }
      }
    }

    await prismaClient.materialPrice.create({
      data: {
        id: crypto.randomUUID(),
        beNumber: normalizedBeNumber,
        orderNr: data.orderNr ?? null,
        quoteBecra: data.quoteBecra ?? null,
        supplierOrderNr: data.supplierOrderNr ?? null,
        brandOrderNr: data.brandOrderNr ?? null,
        shortDescription: data.shortDescription ?? null,
        longDescription: data.longDescription ?? null,
        brandName: data.brandName ?? null,
        rejected: data.rejected ?? null,
        additionalInfo: data.additionalInfo ?? null,
        unitPrice: data.unitPrice ?? null,
        quantityPrice,
        companyId: data.companyId,
        createdBy: profile.id,
        updatedAt: new Date(),
      },
    })
    revalidatePath(REVALIDATE_PATH)
  },
})

export const updateMaterialPriceAction = protectedServerFunction({
  schema: updateMaterialPriceSchema,
  functionName: 'Update material price action',
  serverFn: async ({data, logger}) => {
    const {id, ...rest} = data
    await prismaClient.materialPrice.update({
      where: {id},
      data: {
        beNumber: rest.beNumber ?? null,
        orderNr: rest.orderNr ?? null,
        quoteBecra: rest.quoteBecra ?? null,
        supplierOrderNr: rest.supplierOrderNr ?? null,
        brandOrderNr: rest.brandOrderNr ?? null,
        shortDescription: rest.shortDescription ?? null,
        longDescription: rest.longDescription ?? null,
        brandName: rest.brandName ?? null,
        rejected: rest.rejected ?? null,
        additionalInfo: rest.additionalInfo ?? null,
        unitPrice: rest.unitPrice ?? null,
        quantityPrice: rest.quantityPrice ?? null,
        companyId: rest.companyId,
        updatedAt: new Date(),
      },
    })
    logger.info(`Material price updated: ${id}`)
    revalidatePath(REVALIDATE_PATH)
  },
})

export const softDeleteMaterialPriceAction = protectedServerFunction({
  schema: materialPriceIdSchema,
  functionName: 'Soft delete material price action',
  serverFn: async ({data, profile, logger}) => {
    const {id} = data
    await softDeleteMaterialPrice(id, profile.id)
    logger.info(`Material price soft deleted: ${id}`)
    revalidatePath(REVALIDATE_PATH)
  },
})

export const restoreMaterialPriceAction = protectedServerFunction({
  schema: materialPriceIdSchema,
  functionName: 'Restore material price action',
  serverFn: async ({data, logger}) => {
    const {id} = data
    await restoreMaterialPrice(id)
    logger.info(`Material price restored: ${id}`)
    revalidatePath(REVALIDATE_PATH)
  },
})

export const hardDeleteMaterialPriceAction = protectedServerFunction({
  schema: materialPriceIdSchema,
  functionName: 'Hard delete material price action',
  serverFn: async ({data, logger}) => {
    const {id} = data
    await hardDeleteMaterialPrice(id)
    logger.info(`Material price hard deleted: ${id}`)
    revalidatePath(REVALIDATE_PATH)
  },
})
