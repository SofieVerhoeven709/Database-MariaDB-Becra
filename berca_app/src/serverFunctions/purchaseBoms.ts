'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {createPurchaseBomSchema, updatePurchaseBomSchema, purchaseBomIdSchema} from '@/schemas/purchaseBomSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'

const REVALIDATE_PATH = '/departments/purchasing/purchaseBom'

function toDate(val: string | null | undefined): Date | null {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

export const createPurchaseBomAction = protectedServerFunction({
  schema: createPurchaseBomSchema,
  functionName: 'Create purchase BOM action',
  serverFn: async ({data, profile, logger}) => {
    logger.info(`Creating purchase BOM, createdBy: ${profile.id}`)
    await prismaClient.purchaseOrderBecra.create({
      data: {
        id: crypto.randomUUID(),
        description: data.description ?? null,
        date: toDate(data.date),
        createdBy: profile.id,
      },
    })
    revalidatePath(REVALIDATE_PATH)
  },
})

export const updatePurchaseBomAction = protectedServerFunction({
  schema: updatePurchaseBomSchema,
  functionName: 'Update purchase BOM action',
  serverFn: async ({data, logger}) => {
    const {id, ...rest} = data
    await prismaClient.purchaseOrderBecra.update({
      where: {id},
      data: {description: rest.description ?? null, date: toDate(rest.date)},
    })
    logger.info(`Purchase BOM updated: ${id}`)
    revalidatePath(REVALIDATE_PATH)
  },
})

export const softDeletePurchaseBomAction = protectedServerFunction({
  schema: purchaseBomIdSchema,
  functionName: 'Soft delete purchase BOM action',
  serverFn: async ({data, profile, logger}) => {
    const {id} = data
    await prismaClient.purchaseOrderBecra.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Purchase BOM soft deleted: ${id}`)
    revalidatePath(REVALIDATE_PATH)
  },
})

export const hardDeletePurchaseBomAction = protectedServerFunction({
  schema: purchaseBomIdSchema,
  functionName: 'Hard delete purchase BOM action',
  serverFn: async ({data, logger}) => {
    const {id} = data
    await prismaClient.purchaseOrderBecra.delete({where: {id}})
    logger.info(`Purchase BOM hard deleted: ${id}`)
    revalidatePath(REVALIDATE_PATH)
  },
})

