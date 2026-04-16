'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {createQuoteBecraSchema, updateQuoteBecraSchema, quoteBecraIdSchema} from '@/schemas/quoteBecraSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'

// ─── Create ───────────────────────────────────────────────────────────────────

export const createQuoteBecraAction = protectedServerFunction({
  schema: createQuoteBecraSchema,
  functionName: 'Create QuoteBecra action',
  serverFn: async ({data, logger, profile}) => {
    // QuoteBecra records are simple sales headers, so creation just normalizes optional fields and stamps the creator.
    await prismaClient.quoteBecra.create({
      data: {
        id: data.id,
        description: data.description ?? null,
        validDate: data.validDate ?? false,
        date: data.date ?? null,
        createdBy: profile.id,
        deleted: false,
      },
    })
    logger.info(`QuoteBecra created: ${data.id}`)
    revalidatePath('/departments/sales/quoteBecra')
  },
})

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateQuoteBecraAction = protectedServerFunction({
  schema: updateQuoteBecraSchema,
  functionName: 'Update QuoteBecra action',
  serverFn: async ({data: {id, originalId, ...rest}, logger}) => {
    // Updating can also rename the record, so the original row is addressed by originalId.
    await prismaClient.quoteBecra.update({
      where: {id: originalId},
      data: {
        id,
        description: rest.description ?? null,
        validDate: rest.validDate ?? false,
        date: rest.date ?? null,
      },
    })
    logger.info(`QuoteBecra updated: ${originalId} -> ${id}`)
    revalidatePath('/departments/sales/quoteBecra')
  },
})

// ─── Soft delete ──────────────────────────────────────────────────────────────

export const softDeleteQuoteBecraAction = protectedServerFunction({
  schema: quoteBecraIdSchema,
  functionName: 'Soft delete QuoteBecra action',
  serverFn: async ({data: {id}, profile, logger}) => {
    // Soft delete preserves the row for recovery while removing it from the active sales list.
    await prismaClient.quoteBecra.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`QuoteBecra soft deleted: ${id}`)
    revalidatePath('/departments/sales/quoteBecra')
  },
})

// ─── Hard delete ──────────────────────────────────────────────────────────────

export const hardDeleteQuoteBecraAction = protectedServerFunction({
  schema: quoteBecraIdSchema,
  functionName: 'Hard delete QuoteBecra action',
  serverFn: async ({data: {id}, logger}) => {
    // Hard delete is reserved for removing a sales record entirely.
    await prismaClient.quoteBecra.delete({where: {id}})
    logger.info(`QuoteBecra hard deleted: ${id}`)
    revalidatePath('/departments/sales/quoteBecra')
  },
})

// ─── Undelete ─────────────────────────────────────────────────────────────────

export const undeleteQuoteBecraAction = protectedServerFunction({
  schema: quoteBecraIdSchema,
  functionName: 'Undelete QuoteBecra action',
  serverFn: async ({data: {id}, logger}) => {
    // Undelete simply clears the soft-delete metadata so the quote reappears in the list.
    await prismaClient.quoteBecra.update({
      where: {id},
      data: {deleted: false, deletedAt: null, deletedBy: null},
    })
    logger.info(`QuoteBecra undeleted: ${id}`)
    revalidatePath('/departments/sales/quoteBecra')
  },
})

