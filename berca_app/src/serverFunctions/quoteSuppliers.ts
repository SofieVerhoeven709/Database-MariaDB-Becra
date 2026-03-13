'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {
  createQuoteSupplierSchema,
  updateQuoteSupplierSchema,
  quoteSupplierIdSchema,
} from '@/schemas/quoteSupplierSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'

const REVALIDATE_PATH = '/departments/purchasing/orderQuote'

function toDate(val: string | null | undefined): Date | null {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

export const createQuoteSupplierAction = protectedServerFunction({
  schema: createQuoteSupplierSchema,
  functionName: 'Create quote supplier action',
  serverFn: async ({data, profile, logger}) => {
    logger.info(`Creating quote supplier, createdBy: ${profile.id}`)
    await prismaClient.quoteSupplier.create({
      data: {
        id: crypto.randomUUID(),
        description: data.description ?? null,
        projectId: data.projectId ?? null,
        rejected: data.rejected ?? false,
        additionalInfo: data.additionalInfo ?? null,
        link: data.link ?? null,
        payementCondition: data.payementCondition ?? null,
        acceptedForPOB: data.acceptedForPOB ?? null,
        validUntill: toDate(data.validUntill),
        deliveryTimeDays: data.deliveryTimeDays ?? null,
        createdBy: profile.id,
      },
    })
    revalidatePath(REVALIDATE_PATH)
  },
})

export const updateQuoteSupplierAction = protectedServerFunction({
  schema: updateQuoteSupplierSchema,
  functionName: 'Update quote supplier action',
  serverFn: async ({data, logger}) => {
    const {id, ...rest} = data
    await prismaClient.quoteSupplier.update({
      where: {id},
      data: {
        description: rest.description ?? null,
        projectId: rest.projectId ?? null,
        rejected: rest.rejected ?? false,
        additionalInfo: rest.additionalInfo ?? null,
        link: rest.link ?? null,
        payementCondition: rest.payementCondition ?? null,
        acceptedForPOB: rest.acceptedForPOB ?? null,
        validUntill: toDate(rest.validUntill),
        deliveryTimeDays: rest.deliveryTimeDays ?? null,
      },
    })
    logger.info(`Quote supplier updated: ${id}`)
    revalidatePath(REVALIDATE_PATH)
  },
})

export const softDeleteQuoteSupplierAction = protectedServerFunction({
  schema: quoteSupplierIdSchema,
  functionName: 'Soft delete quote supplier action',
  serverFn: async ({data, profile, logger}) => {
    const {id} = data
    await prismaClient.quoteSupplier.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Quote supplier soft deleted: ${id}`)
    revalidatePath(REVALIDATE_PATH)
  },
})

export const hardDeleteQuoteSupplierAction = protectedServerFunction({
  schema: quoteSupplierIdSchema,
  functionName: 'Hard delete quote supplier action',
  serverFn: async ({data, logger}) => {
    const {id} = data
    await prismaClient.quoteSupplier.delete({where: {id}})
    logger.info(`Quote supplier hard deleted: ${id}`)
    revalidatePath(REVALIDATE_PATH)
  },
})

