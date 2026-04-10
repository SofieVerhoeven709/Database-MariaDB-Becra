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

function toDecimalString(val: string | number | null | undefined): string {
  if (val == null || val === '') return '0.00'
  const n = typeof val === 'number' ? val : Number.parseFloat(val)
  if (!Number.isFinite(n)) return '0.00'
  return n.toFixed(2)
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
        purchaseNumber: d.purchaseNumber,
        purchaseDate: toDate(d.purchaseDate) ?? new Date(),
        status: d.status ?? 'DRAFT',
        companyId: d.companyId,
        quoteSupplierId: d.quoteSupplierId ?? null,
        paymentConditionId: d.paymentConditionId ?? null,
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
        purchaseDate: toDate(purchaseDate) ?? new Date(),
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
        quoteSupplierLineId: data.quoteSupplierLineId ?? null,
        materialId: data.materialId,
        materialDemandId: data.materialDemandId ?? null,
        unitPrice: toDecimalString(data.unitPrice),
        quantity: data.quantity,
        minQuantity: data.minQuantity ?? null,
        lineStatus: data.lineStatus ?? 'OPEN',
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
      data: {
        ...rest,
        unitPrice: toDecimalString(rest.unitPrice),
      },
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
