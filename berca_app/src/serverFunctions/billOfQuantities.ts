'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {createBoqSchema, updateBoqSchema, boqIdSchema} from '@/schemas/billOfQuantitySchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {createTargetForType} from '@/dal/targets'
import {generateBoqNumber, generateInvoiceOutNumber} from '@/lib/utils'

export async function getActiveWorkOrdersForProjectAction(projectId: string) {
  return prismaClient.workOrder.findMany({
    where: {
      deleted: false,
      completed: false,
      projectId,
      WorkOrderBoQ: {
        none: {deleted: false},
      },
    },
    select: {id: true, workOrderNumber: true, description: true},
    orderBy: {workOrderNumber: 'asc'},
  })
}

export async function getNextBoqNumberAction(): Promise<string> {
  const year = new Date().getFullYear()
  const last = await prismaClient.billOfQuantities.findFirst({
    where: {boqNumber: {startsWith: String(year)}},
    orderBy: {boqNumber: 'desc'},
    select: {boqNumber: true},
  })
  const lastSeq = last ? parseInt(last.boqNumber.slice(4)) : 0
  return generateBoqNumber(year, lastSeq + 1)
}

// ─── BillOfQuantities CRUD ────────────────────────────────────────────────────
export const createBoqAction = protectedServerFunction({
  schema: createBoqSchema,
  functionName: 'Create BoQ action',
  serverFn: async ({data: {workOrderIds, boqNumber: suppliedNumber, ...data}, logger, profile}) => {
    logger.info(`Creating BoQ, createdBy: ${profile.id}`)

    const target = await createTargetForType('BillOfQuantities', profile.id)
    const id = crypto.randomUUID()
    const now = new Date()
    const year = now.getFullYear()

    let attempts = 0
    let boqNumber = ''

    const numbersToTry: Array<() => Promise<string>> = []
    if (suppliedNumber) numbersToTry.push(async () => suppliedNumber)
    numbersToTry.push(async () => {
      const last = await prismaClient.billOfQuantities.findFirst({
        where: {boqNumber: {startsWith: String(year)}},
        orderBy: {boqNumber: 'desc'},
        select: {boqNumber: true},
      })
      const lastSeq = last ? parseInt(last.boqNumber.slice(4)) : 0
      return generateBoqNumber(year, lastSeq + 1)
    })

    while (attempts < 5) {
      try {
        const candidateFn = numbersToTry[Math.min(attempts, numbersToTry.length - 1)]
        boqNumber = await candidateFn()

        await prismaClient.billOfQuantities.create({
          data: {
            ...data,
            id,
            boqNumber,
            targetId: target.id,
            createdBy: profile.id,
            createdAt: now,
            boqDate: new Date(data.boqDate),
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

    if (attempts >= 5) throw new Error('Failed to generate a unique BoQ number after 5 attempts')

    if (workOrderIds.length > 0) {
      const availableWorkOrders = await prismaClient.workOrder.findMany({
        where: {
          id: {in: workOrderIds},
          deleted: false,
          WorkOrderBoQ: {none: {deleted: false}},
        },
        select: {id: true},
      })
      const availableIds = availableWorkOrders.map(r => r.id)

      if (availableIds.length > 0) {
        await prismaClient.workOrderBoQ.createMany({
          data: availableIds.map((workOrderId: string) => ({
            id: crypto.randomUUID(),
            billOfQuantitiesId: id,
            workOrderId,
          })),
        })

        // Auto-assign contacts from companies of linked work orders
        const projects = await prismaClient.workOrder.findMany({
          where: {id: {in: availableIds}},
          select: {Project: {select: {companyId: true}}},
        })
        const companyIds = [...new Set(projects.map(p => p.Project.companyId))]

        const boqContacts = await prismaClient.companyContact.findMany({
          where: {
            deleted: false,
            companyId: {in: companyIds},
            endDate: null,
            roleWithCompany: 'Invoice',
          },
          select: {contactId: true},
        })

        if (boqContacts.length > 0) {
          await prismaClient.boqContact.createMany({
            data: boqContacts.map(c => ({
              id: crypto.randomUUID(),
              billOfQuantitiesId: id,
              contactId: c.contactId,
            })),
            skipDuplicates: true,
          })
        }
      }
    }

    const boqStatus = await prismaClient.billOfQuantitiesStatus.findUnique({
      where: {id: data.boqStatusId},
      select: {name: true},
    })
    if (boqStatus?.name.toLowerCase() === 'approved') {
      await createInvoiceFromApprovedBoq(id, profile.id)
      revalidatePath('/invoicesOut')
    }

    logger.info(`BoQ created: ${id} (${boqNumber}) with ${workOrderIds.length} work order(s)`)
    revalidatePath('/boq')
  },
})

export const updateBoqAction = protectedServerFunction({
  schema: updateBoqSchema,
  functionName: 'Update BoQ action',
  serverFn: async ({data: {id, ...data}, logger, profile}) => {
    await prismaClient.billOfQuantities.update({
      where: {id},
      data: {
        ...data,
        boqDate: new Date(data.boqDate),
        dueDate: new Date(data.dueDate),
        sentDate: data.sentDate ? new Date(data.sentDate) : null,
        modifiedBy: profile.id,
        modifiedAt: new Date(),
      },
    })
    const boqStatus = await prismaClient.billOfQuantitiesStatus.findUnique({
      where: {id: data.boqStatusId},
      select: {name: true},
    })
    if (boqStatus?.name.toLowerCase() === 'approved') {
      await createInvoiceFromApprovedBoq(id, profile.id)
      revalidatePath('/invoicesOut')
    }

    logger.info(`BoQ updated: ${id}`)
    revalidatePath('/boq')
  },
})

export async function addWorkOrdersToBoqAction(billOfQuantitiesId: string, workOrderIds: string[]) {
  if (workOrderIds.length === 0) return

  const availableWorkOrders = await prismaClient.workOrder.findMany({
    where: {
      id: {in: workOrderIds},
      deleted: false,
      WorkOrderBoQ: {none: {deleted: false}},
    },
    select: {id: true},
  })
  const availableIds = availableWorkOrders.map(r => r.id)
  if (availableIds.length === 0) return

  await prismaClient.workOrderBoQ.createMany({
    data: availableIds.map(workOrderId => ({
      id: crypto.randomUUID(),
      billOfQuantitiesId,
      workOrderId,
    })),
  })
  revalidatePath('/boq')
}

export const softDeleteBoqAction = protectedServerFunction({
  schema: boqIdSchema,
  functionName: 'Soft delete BoQ action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.billOfQuantities.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`BoQ soft deleted: ${id}`)
    revalidatePath('/boq')
  },
})

export const hardDeleteBoqAction = protectedServerFunction({
  schema: boqIdSchema,
  functionName: 'Hard delete BoQ action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.billOfQuantities.delete({where: {id}})
    logger.info(`BoQ hard deleted: ${id}`)
    revalidatePath('/boq')
  },
})

export const undeleteBoqAction = protectedServerFunction({
  schema: boqIdSchema,
  functionName: 'Undelete BoQ action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.billOfQuantities.update({where: {id}, data: {deleted: false, deletedAt: null, deletedBy: null}})
    logger.info(`BoQ undeleted: ${id}`)
    revalidatePath('/boq')
  },
})

export async function addBoqContactDirectAction(billOfQuantitiesId: string, contactId: string) {
  await prismaClient.boqContact.create({
    data: {id: crypto.randomUUID(), billOfQuantitiesId, contactId},
  })
  revalidatePath('/boq')
}

export async function removeBoqContactDirectAction(boqContactId: string) {
  await prismaClient.boqContact.delete({where: {id: boqContactId}})
  revalidatePath('/boq')
}

export async function assignPriceListToBoqAction(billOfQuantitiesId: string, priceListId: string | null) {
  await prismaClient.billOfQuantities.update({
    where: {id: billOfQuantitiesId},
    data: {priceListId},
  })
  revalidatePath('/boq')
}

export async function getAvailableVatMarginsAction() {
  const rows = await prismaClient.vatMargin.findMany({
    where: {deleted: false},
    select: {id: true, vat: true, countryId: true, Country: {select: {id: true, name: true}}},
    orderBy: {vat: 'asc'},
  })

  const grouped = new Map<
    string | null,
    {countryId: string | null; countryName: string; rates: Array<{id: string; vat: number}>}
  >()

  for (const row of rows) {
    const key = row.countryId ?? null
    const countryName = row.Country?.name ?? 'Global'
    if (!grouped.has(key)) {
      grouped.set(key, {countryId: key, countryName, rates: []})
    }
    grouped.get(key)!.rates.push({id: row.id, vat: row.vat})
  }

  return Array.from(grouped.values())
}

export async function updateWorkOrderStructureVatAction({
  workOrderStructureId,
  vatMarginId,
}: {
  workOrderStructureId: string
  vatMarginId: string | null
}) {
  await prismaClient.workOrderStructure.update({
    where: {id: workOrderStructureId},
    data: {vatMarginId},
  })
  revalidatePath('/boq')
}

export async function updateTimeRegistryVatMarginAction({
  timeRegistryIds,
  vatMarginId,
}: {
  timeRegistryIds: string[]
  vatMarginId: string | null
}) {
  await prismaClient.timeRegistry.updateMany({
    where: {id: {in: timeRegistryIds}},
    data: {vatMarginId},
  })
  revalidatePath('/boq')
}

export async function updateTrainingVatMarginAction({
  trainingId,
  vatMarginId,
}: {
  trainingId: string
  vatMarginId: string | null
}) {
  await prismaClient.training.update({
    where: {id: trainingId},
    data: {vatMarginId},
  })
  revalidatePath('/boq')
}

async function createInvoiceFromApprovedBoq(boqId: string, profileId: string) {
  const boq = await prismaClient.billOfQuantities.findUniqueOrThrow({
    where: {id: boqId},
    include: {
      BillOfQuantitiesType: {select: {name: true}},
      BillOfQuantitiesSentType: {select: {name: true}},
      WorkOrderBoQ: {where: {deleted: false}, select: {workOrderId: true}},
      BoqContact: {select: {contactId: true}},
    },
  })

  // Check if an invoice already exists for this BoQ to avoid duplicates
  const existingInvoice = await prismaClient.invoiceOut.findFirst({
    where: {boqId, deleted: false},
  })
  if (existingInvoice) return

  const [allInvoiceStatuses, allInvoiceTypes, allInvoiceSentTypes] = await Promise.all([
    prismaClient.invoiceStatus.findMany({select: {id: true, name: true}}),
    prismaClient.invoiceType.findMany({select: {id: true, name: true}}),
    prismaClient.invoiceSentType.findMany({select: {id: true, name: true}}),
  ])

  const draftStatus =
    allInvoiceStatuses.find(s => s.name.toLowerCase() === 'draft') ??
    (() => {
      throw new Error('No draft invoice status found')
    })()

  const invoiceType =
    allInvoiceTypes.find(t => t.name.toLowerCase() === boq.BillOfQuantitiesType.name.toLowerCase()) ??
    (() => {
      throw new Error(`No invoice type matching "${boq.BillOfQuantitiesType.name}" found`)
    })()

  const invoiceSentType =
    allInvoiceSentTypes.find(t => t.name.toLowerCase() === boq.BillOfQuantitiesSentType.name.toLowerCase()) ??
    (() => {
      throw new Error(`No invoice sent type matching "${boq.BillOfQuantitiesSentType.name}" found`)
    })()

  const target = await createTargetForType('InvoiceOut', profileId)
  const id = crypto.randomUUID()
  const now = new Date()
  const year = now.getFullYear()

  let attempts = 0
  while (attempts < 5) {
    try {
      const last = await prismaClient.invoiceOut.findFirst({
        where: {invoiceNumber: {startsWith: String(year)}},
        orderBy: {invoiceNumber: 'desc'},
        select: {invoiceNumber: true},
      })
      const lastSeq = last ? parseInt(last.invoiceNumber.slice(4)) - 100 : 0
      const invoiceNumber = generateInvoiceOutNumber(year, lastSeq + 1)

      await prismaClient.invoiceOut.create({
        data: {
          id,
          invoiceNumber,
          boqId: boq.id,
          poNumber: boq.poNumber,
          clientReference: boq.clientReference,
          invoiceDate: boq.boqDate,
          dueDate: boq.dueDate,
          sentDate: boq.sentDate,
          paymentMethodId: boq.paymentMethodId,
          priceListId: boq.priceListId,
          invoiceTypeId: invoiceType.id,
          invoiceSentTypeId: invoiceSentType.id,
          invoiceStatusId: draftStatus.id,
          reminderSent: false,
          outstanding: true,
          deleted: false,
          targetId: target.id,
          createdBy: profileId,
          createdAt: now,
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

  if (attempts >= 5) throw new Error('Failed to generate a unique invoice number after 5 attempts')

  // Copy work order links
  const workOrderIds = boq.WorkOrderBoQ.map(r => r.workOrderId)
  if (workOrderIds.length > 0) {
    const available = await prismaClient.workOrder.findMany({
      where: {id: {in: workOrderIds}, deleted: false, WorkOrderInvoice: {none: {deleted: false}}},
      select: {id: true},
    })
    const availableIds = available.map(r => r.id)
    if (availableIds.length > 0) {
      await prismaClient.workOrderInvoice.createMany({
        data: availableIds.map(workOrderId => ({id: crypto.randomUUID(), invoiceOutId: id, workOrderId})),
      })
      await prismaClient.workOrder.updateMany({
        where: {id: {in: availableIds}},
        data: {hoursMaterialClosed: true},
      })
    }
  }

  // Copy contacts
  if (boq.BoqContact.length > 0) {
    await prismaClient.invoiceOutContact.createMany({
      data: boq.BoqContact.map(c => ({id: crypto.randomUUID(), invoiceOutId: id, contactId: c.contactId})),
      skipDuplicates: true,
    })
  }
}
