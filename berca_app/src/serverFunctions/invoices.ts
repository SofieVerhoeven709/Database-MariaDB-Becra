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
import {generateInvoiceInNumber, generateInvoiceOutNumber} from '@/lib/utils'

export async function getActiveWorkOrdersForProjectAction(projectId: string) {
  return prismaClient.workOrder.findMany({
    where: {
      deleted: false,
      completed: false,
      projectId,
      WorkOrderInvoice: {
        none: {deleted: false},
      },
    },
    select: {id: true, workOrderNumber: true, description: true},
    orderBy: {workOrderNumber: 'asc'},
  })
}

export async function getNextInvoiceOutNumberAction(): Promise<string> {
  const year = new Date().getFullYear()
  const last = await prismaClient.invoiceOut.findFirst({
    where: {invoiceNumber: {startsWith: String(year)}},
    orderBy: {invoiceNumber: 'desc'},
    select: {invoiceNumber: true},
  })
  const lastSeq = last ? parseInt(last.invoiceNumber.slice(4)) - 100 : 0
  return generateInvoiceOutNumber(year, lastSeq + 1)
}

export async function getNextInvoiceInNumberAction(): Promise<string> {
  const year = new Date().getFullYear()
  const last = await prismaClient.invoiceIn.findFirst({
    where: {invoiceNumber: {startsWith: String(year)}},
    orderBy: {invoiceNumber: 'desc'},
    select: {invoiceNumber: true},
  })
  const lastSeq = last ? parseInt(last.invoiceNumber.slice(4)) : 0
  return generateInvoiceInNumber(year, lastSeq + 1)
}

// ─── InvoiceOut ────────────────────────────────────────────────────────────────
export const createInvoiceOutAction = protectedServerFunction({
  schema: createInvoiceOutSchema.extend({
    workOrderIds: z.array(z.string()).default([]),
  }),
  functionName: 'Create invoice out action',
  serverFn: async ({data: {workOrderIds, invoiceNumber: suppliedNumber, ...data}, logger, profile}) => {
    logger.info(`Creating invoice out, createdBy: ${profile.id}`)

    const target = await createTargetForType('InvoiceOut', profile.id)
    const id = crypto.randomUUID()
    const now = new Date()
    const year = now.getFullYear()

    let attempts = 0
    let invoiceNumber = ''

    const numbersToTry: Array<() => Promise<string>> = []
    if (suppliedNumber) numbersToTry.push(async () => suppliedNumber)
    numbersToTry.push(async () => {
      const last = await prismaClient.invoiceOut.findFirst({
        where: {invoiceNumber: {startsWith: String(year)}},
        orderBy: {invoiceNumber: 'desc'},
        select: {invoiceNumber: true},
      })
      const lastSeq = last ? parseInt(last.invoiceNumber.slice(4)) - 100 : 0
      return generateInvoiceOutNumber(year, lastSeq + 1)
    })

    while (attempts < 5) {
      try {
        const candidateFn = numbersToTry[Math.min(attempts, numbersToTry.length - 1)]
        invoiceNumber = await candidateFn()

        await prismaClient.invoiceOut.create({
          data: {
            ...data,
            id,
            invoiceNumber,
            targetId: target.id,
            createdBy: profile.id,
            createdAt: now,
            invoiceDate: new Date(data.invoiceDate),
            dueDate: new Date(data.dueDate),
            sentDate: data.sentDate ? new Date(data.sentDate) : null,
          },
        })
        break
      } catch (err: unknown) {
        const prismaErr = err as {code?: string}
        if (prismaErr.code === 'P2002') {
          attempts++
          continue
        }
        throw err
      }
    }

    if (attempts >= 5) throw new Error('Failed to generate a unique invoice OUT number after 5 attempts')

    if (workOrderIds.length > 0) {
      const availableWorkOrders = await prismaClient.workOrder.findMany({
        where: {
          id: {in: workOrderIds},
          deleted: false,
          WorkOrderInvoice: {
            none: {deleted: false},
          },
        },
        select: {id: true},
      })
      const availableWorkOrderIds = availableWorkOrders.map(row => row.id)

      if (availableWorkOrderIds.length > 0) {
      await prismaClient.workOrderInvoice.createMany({
        data: availableWorkOrderIds.map((workOrderId: string) => ({
          id: crypto.randomUUID(),
          invoiceOutId: id,
          workOrderId,
        })),
      })
      await prismaClient.workOrder.updateMany({
        where: {id: {in: availableWorkOrderIds}},
        data: {hoursMaterialClosed: true},
      })

      // Auto-assign invoice contacts from the companies of the linked work orders' projects
      const projects = await prismaClient.workOrder.findMany({
        where: {id: {in: availableWorkOrderIds}},
        select: {Project: {select: {companyId: true}}},
      })
      const companyIds = [...new Set(projects.map(p => p.Project.companyId))]

      const invoiceContacts = await prismaClient.companyContact.findMany({
        where: {
          deleted: false,
          companyId: {in: companyIds},
          endDate: null,
          roleWithCompany: 'Invoice',
        },
        select: {contactId: true},
      })

      if (invoiceContacts.length > 0) {
        await prismaClient.invoiceOutContact.createMany({
          data: invoiceContacts.map(c => ({
            id: crypto.randomUUID(),
            invoiceOutId: id,
            contactId: c.contactId,
          })),
          skipDuplicates: true,
        })
      }
      }
    }

    logger.info(`Invoice out created: ${id} (${invoiceNumber}) with ${workOrderIds.length} work order(s)`)
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

export async function addWorkOrdersToInvoiceAction(invoiceOutId: string, workOrderIds: string[]) {
  if (workOrderIds.length === 0) return

  const availableWorkOrders = await prismaClient.workOrder.findMany({
    where: {
      id: {in: workOrderIds},
      deleted: false,
      WorkOrderInvoice: {
        none: {deleted: false},
      },
    },
    select: {id: true},
  })
  const availableWorkOrderIds = availableWorkOrders.map(row => row.id)
  if (availableWorkOrderIds.length === 0) return

  await prismaClient.workOrderInvoice.createMany({
    data: availableWorkOrderIds.map(workOrderId => ({
      id: crypto.randomUUID(),
      invoiceOutId,
      workOrderId,
    })),
  })
  await prismaClient.workOrder.updateMany({
    where: {id: {in: availableWorkOrderIds}},
    data: {hoursMaterialClosed: true},
  })
  revalidatePath('/invoicesOut')
}

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

// ─── Server action: assign price list to invoice ───────────────────────────────
export async function assignPriceListToInvoiceAction(invoiceOutId: string, priceListId: string | null) {
  await prismaClient.invoiceOut.update({
    where: {id: invoiceOutId},
    data: {priceListId},
  })
  revalidatePath('/invoicesOut')
}

// ─── InvoiceIn ────────────────────────────────────────────────────────────────
export const createInvoiceInAction = protectedServerFunction({
  schema: createInvoiceInSchema,
  functionName: 'Create invoice in action',
  serverFn: async ({data: {invoiceNumber: suppliedNumber, ...data}, logger, profile}) => {
    logger.info(`Creating invoice in, createdBy: ${profile.id}`)

    const target = await createTargetForType('InvoiceIn', profile.id)
    const id = crypto.randomUUID()
    const now = new Date()
    const year = now.getFullYear()

    let attempts = 0
    let invoiceNumber = ''

    const numbersToTry: Array<() => Promise<string>> = []
    if (suppliedNumber) numbersToTry.push(async () => suppliedNumber)
    numbersToTry.push(async () => {
      const last = await prismaClient.invoiceIn.findFirst({
        where: {invoiceNumber: {startsWith: String(year)}},
        orderBy: {invoiceNumber: 'desc'},
        select: {invoiceNumber: true},
      })
      const lastSeq = last ? parseInt(last.invoiceNumber.slice(4)) : 0
      return generateInvoiceInNumber(year, lastSeq + 1)
    })

    while (attempts < 5) {
      try {
        const candidateFn = numbersToTry[Math.min(attempts, numbersToTry.length - 1)]
        invoiceNumber = await candidateFn()
        await prismaClient.invoiceIn.create({
          data: {
            ...data,
            id,
            invoiceNumber,
            targetId: target.id,
            createdBy: profile.id,
            createdAt: now,
            invoiceDate: new Date(data.invoiceDate),
            dueDate: new Date(data.dueDate),
          },
        })
        break
      } catch (err: unknown) {
        const prismaErr = err as {code?: string}
        if (prismaErr.code === 'P2002') {
          attempts++
          continue
        }
        throw err
      }
    }

    if (attempts >= 5) throw new Error('Failed to generate a unique invoice IN number after 5 attempts')

    logger.info(`Invoice in created: ${id} (${invoiceNumber})`)
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

// ─── VatMargin ─────────────────────────────────────────────────────────────────
const createVatMarginSchema = z.object({
  vat: z.number().min(0).max(100),
  countryId: z.string().uuid().nullable(),
})

const updateVatMarginSchema = z.object({
  id: z.string().uuid(),
  vat: z.number().min(0).max(100),
  countryId: z.string().uuid().nullable(),
})

const vatMarginIdSchema = z.object({
  id: z.string().uuid(),
})

export const createVatMarginAction = protectedServerFunction({
  schema: createVatMarginSchema,
  functionName: 'Create VAT margin',
  serverFn: async ({data, logger, profile}) => {
    const id = crypto.randomUUID()
    await prismaClient.vatMargin.create({
      data: {
        id,
        vat: data.vat,
        countryId: data.countryId,
        createdBy: profile.id,
        createdAt: new Date(),
      },
    })
    logger.info(`VAT margin created: ${id}`)
    revalidatePath('/invoicesOut')
    revalidatePath('/invoicesIn')
  },
})

export const updateVatMarginAction = protectedServerFunction({
  schema: updateVatMarginSchema,
  functionName: 'Update VAT margin',
  serverFn: async ({data: {id, ...data}, logger, profile}) => {
    await prismaClient.vatMargin.update({
      where: {id},
      data: {
        ...data,
      },
    })
    logger.info(`VAT margin updated: ${id}`)
    revalidatePath('/invoicesOut')
    revalidatePath('/invoicesIn')
  },
})

export const softDeleteVatMarginAction = protectedServerFunction({
  schema: vatMarginIdSchema,
  functionName: 'Soft delete VAT margin',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.vatMargin.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`VAT margin soft deleted: ${id}`)
    revalidatePath('/invoicesOut')
    revalidatePath('/invoicesIn')
  },
})

export const hardDeleteVatMarginAction = protectedServerFunction({
  schema: vatMarginIdSchema,
  functionName: 'Hard delete VAT margin',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.vatMargin.delete({where: {id}})
    logger.info(`VAT margin hard deleted: ${id}`)
    revalidatePath('/invoicesOut')
    revalidatePath('/invoicesIn')
  },
})

export const undeleteVatMarginAction = protectedServerFunction({
  schema: vatMarginIdSchema,
  functionName: 'Undelete VAT margin',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.vatMargin.update({where: {id}, data: {deleted: false, deletedAt: null, deletedBy: null}})
    logger.info(`VAT margin undeleted: ${id}`)
    revalidatePath('/invoicesOut')
    revalidatePath('/invoicesIn')
  },
})

// ─── WorkOrderStructure VAT Assignment ─────────────────────────────────────
export async function getAvailableVatMarginsAction() {
  const vatMargins = await prismaClient.vatMargin.findMany({
    where: {deleted: false},
    select: {id: true, vat: true, countryId: true, Country: {select: {id: true, name: true}}},
    orderBy: [{countryId: 'asc'}, {vat: 'asc'}],
  })

  // Group by country
  const grouped: {[countryId: string]: {countryName: string; countryId: string | null; rates: Array<{id: string; vat: number}>}} = {}
  const noCountryRates: Array<{id: string; vat: number}> = []

  for (const vm of vatMargins) {
    if (!vm.countryId) {
      noCountryRates.push({id: vm.id, vat: vm.vat})
    } else {
      const key = vm.countryId
      if (!grouped[key]) {
        grouped[key] = {
          countryId: vm.countryId,
          countryName: vm.Country?.name ?? 'Unknown',
          rates: [],
        }
      }
      grouped[key].rates.push({id: vm.id, vat: vm.vat})
    }
  }

  // Sort by country name
  const sorted = Object.values(grouped).sort((a, b) => a.countryName.localeCompare(b.countryName))

  // Add no-country rates at the end if any
  if (noCountryRates.length > 0) {
    sorted.push({
      countryId: null,
      countryName: 'Belgium / Global',
      rates: noCountryRates,
    })
  }

  return sorted
}

export const updateWorkOrderStructureVatAction = protectedServerFunction({
  schema: z.object({
    workOrderStructureId: z.string(),
    vatMarginId: z.string().nullable(),
  }),
  functionName: 'Update work order structure VAT',
  serverFn: async ({data: {workOrderStructureId, vatMarginId}, logger}) => {
    await prismaClient.workOrderStructure.update({
      where: {id: workOrderStructureId},
      data: {vatMarginId},
    })
    logger.info(`Work order structure VAT updated: ${workOrderStructureId} -> ${vatMarginId}`)
    revalidatePath('/invoicesOut')
    revalidatePath('/invoicesIn')
  },
})
