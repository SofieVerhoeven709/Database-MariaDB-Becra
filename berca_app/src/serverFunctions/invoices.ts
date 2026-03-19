'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {
  createInvoiceOutSchema,
  updateInvoiceOutSchema,
  invoiceOutIdSchema,
  createInvoiceInSchema,
  updateInvoiceInSchema,
  invoiceInIdSchema,
} from '@/schemas/invoiceSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {createTargetForType} from '@/dal/targets'
import {z} from 'zod/v4'

// ─── Work order lookup (called client-side from dialog) ────────────────────────
export async function getActiveWorkOrdersForProjectAction(projectId: string) {
  return prismaClient.workOrder.findMany({
    where: {deleted: false, completed: false, projectId},
    select: {id: true, workOrderNumber: true, description: true},
    orderBy: {workOrderNumber: 'asc'},
  })
}

// ─── InvoiceOut ────────────────────────────────────────────────────────────────
export const createInvoiceOutAction = protectedServerFunction({
  schema: createInvoiceOutSchema.extend({
    workOrderIds: z.array(z.string()).default([]),
  }),
  functionName: 'Create invoice out action',
  serverFn: async ({data: {workOrderIds, ...data}, logger, profile}) => {
    logger.info(`Creating invoice out, createdBy: ${profile.id}`)
    const target = await createTargetForType('InvoiceOut', profile.id)
    const id = crypto.randomUUID()
    const now = new Date()

    await prismaClient.invoiceOut.create({
      data: {
        ...data,
        id,
        targetId: target.id,
        createdBy: profile.id,
        createdAt: now,
        invoiceDate: new Date(data.invoiceDate),
        dueDate: new Date(data.dueDate),
        sentDate: data.sentDate ? new Date(data.sentDate) : null,
      },
    })

    if (workOrderIds.length > 0) {
      await prismaClient.workOrderInvoice.createMany({
        data: workOrderIds.map((workOrderId: string) => ({
          id: crypto.randomUUID(),
          invoiceOutId: id,
          workOrderId,
        })),
      })

      // Close hours/materials on all linked work orders
      await prismaClient.workOrder.updateMany({
        where: {id: {in: workOrderIds}},
        data: {hoursMaterialClosed: true},
      })
    }

    logger.info(`Invoice out created: ${id} with ${workOrderIds.length} work order(s)`)
    revalidatePath('/invoicesOut')
  },
})

export const updateInvoiceOutAction = protectedServerFunction({
  schema: updateInvoiceOutSchema,
  functionName: 'Update invoice out action',
  serverFn: async ({data: {id, ...data}, logger, profile}) => {
    await prismaClient.invoiceOut.update({
      where: {id},
      data: {
        ...data,
        invoiceDate: new Date(data.invoiceDate),
        dueDate: new Date(data.dueDate),
        sentDate: data.sentDate ? new Date(data.sentDate) : null,
        modifiedBy: profile.id,
        modifiedAt: new Date(),
      },
    })
    logger.info(`Invoice out updated: ${id}`)
    revalidatePath('/invoicesOut')
  },
})

export const softDeleteInvoiceOutAction = protectedServerFunction({
  schema: invoiceOutIdSchema,
  functionName: 'Soft delete invoice out action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.invoiceOut.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Invoice out soft deleted: ${id}`)
    revalidatePath('/invoicesOut')
  },
})

export const hardDeleteInvoiceOutAction = protectedServerFunction({
  schema: invoiceOutIdSchema,
  functionName: 'Hard delete invoice out action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.invoiceOut.delete({where: {id}})
    logger.info(`Invoice out hard deleted: ${id}`)
    revalidatePath('/invoicesOut')
  },
})

export const undeleteInvoiceOutAction = protectedServerFunction({
  schema: invoiceOutIdSchema,
  functionName: 'Undelete invoice out action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.invoiceOut.update({where: {id}, data: {deleted: false, deletedAt: null, deletedBy: null}})
    logger.info(`Invoice out undeleted: ${id}`)
    revalidatePath('/invoicesOut')
  },
})

// ─── InvoiceOut contacts ───────────────────────────────────────────────────────
export async function addInvoiceOutContactDirectAction(invoiceOutId: string, contactId: string) {
  await prismaClient.invoiceOutContact.create({
    data: {id: crypto.randomUUID(), invoiceOutId, contactId},
  })
  revalidatePath('/invoicesOut')
}

export async function removeInvoiceOutContactDirectAction(invoiceOutContactId: string) {
  await prismaClient.invoiceOutContact.delete({where: {id: invoiceOutContactId}})
  revalidatePath('/invoicesOut')
}

// ─── InvoiceIn ─────────────────────────────────────────────────────────────────
export const createInvoiceInAction = protectedServerFunction({
  schema: createInvoiceInSchema,
  functionName: 'Create invoice in action',
  serverFn: async ({data, logger, profile}) => {
    logger.info(`Creating invoice in, createdBy: ${profile.id}`)
    const target = await createTargetForType('InvoiceIn', profile.id)
    const id = crypto.randomUUID()
    const now = new Date()

    await prismaClient.invoiceIn.create({
      data: {
        ...data,
        id,
        targetId: target.id,
        createdBy: profile.id,
        createdAt: now,
        invoiceDate: new Date(data.invoiceDate),
        dueDate: new Date(data.dueDate),
      },
    })

    logger.info(`Invoice in created: ${id}`)
    revalidatePath('/invoicesIn')
  },
})

export const updateInvoiceInAction = protectedServerFunction({
  schema: updateInvoiceInSchema,
  functionName: 'Update invoice in action',
  serverFn: async ({data: {id, ...data}, logger, profile}) => {
    await prismaClient.invoiceIn.update({
      where: {id},
      data: {
        ...data,
        invoiceDate: new Date(data.invoiceDate),
        dueDate: new Date(data.dueDate),
        modifiedBy: profile.id,
        modifiedAt: new Date(),
      },
    })
    logger.info(`Invoice in updated: ${id}`)
    revalidatePath('/invoicesIn')
  },
})

export const softDeleteInvoiceInAction = protectedServerFunction({
  schema: invoiceInIdSchema,
  functionName: 'Soft delete invoice in action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.invoiceIn.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Invoice in soft deleted: ${id}`)
    revalidatePath('/invoicesIn')
  },
})

export const hardDeleteInvoiceInAction = protectedServerFunction({
  schema: invoiceInIdSchema,
  functionName: 'Hard delete invoice in action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.invoiceIn.delete({where: {id}})
    logger.info(`Invoice in hard deleted: ${id}`)
    revalidatePath('/invoicesIn')
  },
})

export const undeleteInvoiceInAction = protectedServerFunction({
  schema: invoiceInIdSchema,
  functionName: 'Undelete invoice in action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.invoiceIn.update({where: {id}, data: {deleted: false, deletedAt: null, deletedBy: null}})
    logger.info(`Invoice in undeleted: ${id}`)
    revalidatePath('/invoicesIn')
  },
})
