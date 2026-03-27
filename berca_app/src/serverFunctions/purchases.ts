'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {
  createPurchaseSchema,
  updatePurchaseSchema,
  purchaseIdSchema,
  createPurchaseDetailSchema,
  updatePurchaseDetailSchema,
  purchaseDetailIdSchema,
} from '@/schemas/purchaseSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'

const REVALIDATE_PATH = '/departments/purchasing/orders'

function revalidateDetail(purchaseId: string) {
  revalidatePath(`${REVALIDATE_PATH}/${purchaseId}`)
  revalidatePath(REVALIDATE_PATH)
}

function toDate(val: string | null | undefined): Date | null {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

export const createPurchaseAction = protectedServerFunction({
  schema: createPurchaseSchema,
  functionName: 'Create purchase action',
  serverFn: async ({data, profile, logger}) => {
    const d = data
    logger.info(`Creating purchase, createdBy: ${profile.id}`)
    await prismaClient.purchase.create({
      data: {
        id: crypto.randomUUID(),
        orderNumber: d.orderNumber ?? null,
        brandName: d.brandName ?? null,
        brandOrderNumber: d.brandOrderNumber ?? null,
        purchaseDate: toDate(d.purchaseDate),
        status: d.status ?? null,
        companyId: d.companyId ?? null,
        projectId: d.projectId ?? null,
        preferredSupplier: d.preferredSupplier ?? null,
        shortDescription: d.shortDescription ?? null,
        description: d.description ?? null,
        additionalInfo: d.additionalInfo ?? null,
        createdBy: profile.id,
      },
    })
    revalidatePath(REVALIDATE_PATH)
  },
})

export const updatePurchaseAction = protectedServerFunction({
  schema: updatePurchaseSchema,
  functionName: 'Update purchase action',
  serverFn: async ({data, logger}) => {
    const {id, purchaseDate, ...rest} = data
    await prismaClient.purchase.update({
      where: {id},
      data: {
        ...rest,
        purchaseDate: toDate(purchaseDate),
        updatedAt: new Date(),
      },
    })
    logger.info(`Purchase updated: ${id}`)
    revalidatePath(REVALIDATE_PATH)
  },
})

export const softDeletePurchaseAction = protectedServerFunction({
  schema: purchaseIdSchema,
  functionName: 'Soft delete purchase action',
  serverFn: async ({data, profile, logger}) => {
    const {id} = data as {id: string}
    await prismaClient.purchase.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Purchase soft deleted: ${id}`)
    revalidatePath(REVALIDATE_PATH)
  },
})

export const hardDeletePurchaseAction = protectedServerFunction({
  schema: purchaseIdSchema,
  functionName: 'Hard delete purchase action',
  serverFn: async ({data, logger}) => {
    const {id} = data as {id: string}
    await prismaClient.purchase.delete({where: {id}})
    logger.info(`Purchase hard deleted: ${id}`)
    revalidatePath(REVALIDATE_PATH)
  },
})

export const undeletePurchaseAction = protectedServerFunction({
  schema: purchaseIdSchema,
  functionName: 'Undelete purchase action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.purchase.update({where: {id}, data: {deleted: false}})
    logger.info(`Purchase undeleted: ${id}`)
    revalidatePath('/departments/purchasing')
  },
})

// ─── PurchaseDetail ──────────────────────────────────────────────────────────

export const createPurchaseDetailAction = protectedServerFunction({
  schema: createPurchaseDetailSchema,
  functionName: 'Create purchase detail action',
  serverFn: async ({data, profile, logger}) => {
    logger.info(`Creating purchase detail for purchase: ${data.purchaseId}`)
    await prismaClient.purchaseDetail.create({
      data: {
        id: crypto.randomUUID(),
        purchaseId: data.purchaseId,
        projectId: data.projectId ?? null,
        beNumber: data.beNumber ?? null,
        unitPrice: data.unitPrice ?? null,
        quantity: data.quantity ?? null,
        totalCost: data.totalCost ?? null,
        status: data.status ?? null,
        additionalInfo: data.additionalInfo ?? null,
        createdBy: profile.id,
      },
    })
    revalidateDetail(data.purchaseId)
  },
})

export const updatePurchaseDetailAction = protectedServerFunction({
  schema: updatePurchaseDetailSchema,
  functionName: 'Update purchase detail action',
  serverFn: async ({data, logger}) => {
    const {id, purchaseId, ...rest} = data
    await prismaClient.purchaseDetail.update({
      where: {id},
      data: {...rest, updatedAt: new Date()},
    })
    logger.info(`Purchase detail updated: ${id}`)
    revalidateDetail(purchaseId)
  },
})

export const softDeletePurchaseDetailAction = protectedServerFunction({
  schema: purchaseDetailIdSchema,
  functionName: 'Soft delete purchase detail action',
  serverFn: async ({data, profile, logger}) => {
    const {id, purchaseId} = data as {id: string; purchaseId: string}
    await prismaClient.purchaseDetail.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Purchase detail soft deleted: ${id}`)
    revalidateDetail(purchaseId)
  },
})

export const hardDeletePurchaseDetailAction = protectedServerFunction({
  schema: purchaseDetailIdSchema,
  functionName: 'Hard delete purchase detail action',
  serverFn: async ({data, logger}) => {
    const {id, purchaseId} = data as {id: string; purchaseId: string}
    await prismaClient.purchaseDetail.delete({where: {id}})
    logger.info(`Purchase detail hard deleted: ${id}`)
    revalidateDetail(purchaseId)
  },
})
