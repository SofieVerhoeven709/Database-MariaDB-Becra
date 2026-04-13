'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {syncMaterialDemandReservations} from '@/dal/materialDemands'
import {
  createQuoteSupplierLineSchema,
  updateQuoteSupplierLineSchema,
  selectQuoteSupplierLineSchema,
  quoteSupplierLineIdSchema,
} from '@/schemas/quoteSupplierLineSchemas'

const REVALIDATE_DEPARTMENTS_PATH = '/departments'

function getHighestRoleLevel(profile: {RoleLevelEmployee: Array<{RoleLevel: {SubRole: {level: number}}}>}): number {
  return Math.max(0, ...profile.RoleLevelEmployee.map(row => row.RoleLevel.SubRole.level))
}

function assertCanEditApprovedQuote(profile: {RoleLevelEmployee: Array<{RoleLevel: {SubRole: {level: number}}}>}) {
  if (getHighestRoleLevel(profile) < 80) {
    throw new Error('Only managers can edit an approved quote.')
  }
}

async function assertQuoteLineMutationAllowedByQuoteId(
  quoteSupplierId: string,
  profile: {RoleLevelEmployee: Array<{RoleLevel: {SubRole: {level: number}}}>},
) {
  const quote = await prismaClient.quoteSupplier.findUnique({
    where: {id: quoteSupplierId},
    select: {acceptedForPOB: true},
  })
  if (!quote) throw new Error('Quote supplier not found.')
  if (quote.acceptedForPOB) assertCanEditApprovedQuote(profile)
}

async function assertQuoteLineMutationAllowedByLineId(
  lineId: string,
  profile: {RoleLevelEmployee: Array<{RoleLevel: {SubRole: {level: number}}}>},
) {
  const line = await prismaClient.quoteSupplierLine.findUnique({
    where: {id: lineId},
    select: {QuoteSupplier: {select: {acceptedForPOB: true}}},
  })
  if (!line) throw new Error('Quote line not found.')
  if (line.QuoteSupplier.acceptedForPOB) assertCanEditApprovedQuote(profile)
}

async function assertMaterialIsSupplierLinked(quoteSupplierId: string, materialId: string) {
  const quote = await prismaClient.quoteSupplier.findUnique({
    where: {id: quoteSupplierId},
    select: {id: true, companyId: true, sent: true},
  })

  if (!quote) {
    throw new Error('Quote supplier not found.')
  }

  if (quote.sent) {
    throw new Error('Cannot add new lines after the quote is sent.')
  }

  const supplierLink = await prismaClient.materialSupplier.findFirst({
    where: {
      materialId,
      companyId: quote.companyId,
    },
    select: {id: true},
  })

  if (!supplierLink) {
    throw new Error('Selected material is not linked to this quote supplier.')
  }
}

async function resyncMaterialDemand(materialDemandId: string | null | undefined, logger: {warn: (message: string) => void}) {
  if (!materialDemandId) return

  const result = await syncMaterialDemandReservations(materialDemandId)
  if (result.unallocatedQty > 0 && result.sourceCount > 0) {
    logger.warn(
      `MaterialDemand ${materialDemandId} has ${result.unallocatedQty} selected unit(s) without enough source capacity to distribute them.`,
    )
  }
}

// ─── Actions ───────────────────────────────────────────────────────────────────


/**
 * Create a QuoteSupplierLine linking a quote to material demand.
 * If selected=true, updates MaterialDemandSource reserved quantities.
 */
export const createQuoteSupplierLineAction = protectedServerFunction({
  schema: createQuoteSupplierLineSchema,
  functionName: 'Create quote supplier line action',
  serverFn: async ({data, logger, profile}) => {
    await assertQuoteLineMutationAllowedByQuoteId(data.quoteSupplierId, profile)
    await assertMaterialIsSupplierLinked(data.quoteSupplierId, data.materialId)

    if (data.materialDemandId) {
      const existingForDemand = await prismaClient.quoteSupplierLine.findMany({
        where: {materialDemandId: data.materialDemandId},
        select: {
          QuoteSupplier: {
            select: {
              deleted: true,
              sent: true,
              acceptedForPOB: true,
            },
          },
        },
      })
      if (existingForDemand.some(line => !line.QuoteSupplier.deleted && !(line.QuoteSupplier.sent && line.QuoteSupplier.acceptedForPOB))) {
        throw new Error('A quote line already exists for this material demand.')
      }
    }

    const id = crypto.randomUUID()

    const created = await prismaClient.quoteSupplierLine.create({
      data: {
        id,
        quoteSupplierId: data.quoteSupplierId,
        materialId: data.materialId,
        materialDemandId: data.materialDemandId ?? null,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        minQuantity: data.minQuantity ?? null,
        selected: false,
      },
      include: {
        QuoteSupplier: {select: {id: true}},
        Material: {select: {id: true}},
      },
    })

    logger.info(
      `Created QuoteSupplierLine: ${id} ` +
      `for material ${created.Material.id} ` +
      `under quote ${created.QuoteSupplier.id}`,
    )

    revalidatePath(REVALIDATE_DEPARTMENTS_PATH, 'layout')
  },
})

/**
 * Select/deselect a QuoteSupplierLine and update MaterialDemandSource allocations.
 * When selected=true, reserves quantity at the supplier level.
 * When selected=false, clears the reservation.
 */
export const selectQuoteSupplierLineAction = protectedServerFunction({
  schema: selectQuoteSupplierLineSchema,
  functionName: 'Select quote supplier line action',
  serverFn: async ({data: {id, selected, materialDemandId}, logger, profile}) => {
    await assertQuoteLineMutationAllowedByLineId(id, profile)
    const quoteLine = await prismaClient.quoteSupplierLine.findUniqueOrThrow({
      where: {id},
      select: {quantity: true, materialDemandId: true},
    })

    const demandId = quoteLine.materialDemandId || materialDemandId
    if (!demandId) {
      logger.warn(`Cannot select quote line ${id}: no materialDemandId associated`)
      return
    }

    // Update the selected flag
    await prismaClient.quoteSupplierLine.update({
      where: {id},
      data: {selected},
    })

    await resyncMaterialDemand(demandId, logger)

    logger.info(
      `${selected ? 'Selected' : 'Deselected'} QuoteSupplierLine ${id} for MaterialDemand ${demandId}`,
    )

    revalidatePath(REVALIDATE_DEPARTMENTS_PATH, 'layout')
  },
})

/**
 * Update a QuoteSupplierLine's quantity and pricing.
 * If quantity changed and line is selected, updates MaterialDemandSource allocations.
 */
export const updateQuoteSupplierLineAction = protectedServerFunction({
  schema: updateQuoteSupplierLineSchema,
  functionName: 'Update quote supplier line action',
  serverFn: async ({data: {id, ...updates}, logger, profile}) => {
    await assertQuoteLineMutationAllowedByLineId(id, profile)
    // Fetch current state to detect changes
    const current = await prismaClient.quoteSupplierLine.findUniqueOrThrow({
      where: {id},
      select: {quantity: true, selected: true, materialDemandId: true},
    })

    const updated = await prismaClient.quoteSupplierLine.update({
      where: {id},
      data: updates,
    })

    logger.info(`Updated QuoteSupplierLine: ${id}`)

    const affectedDemandIds = new Set<string>()
    if (current.materialDemandId) affectedDemandIds.add(current.materialDemandId)
    if (updated.materialDemandId && updated.materialDemandId !== current.materialDemandId) {
      affectedDemandIds.add(updated.materialDemandId)
    }

    if (current.selected || updates.selected !== undefined || updates.quantity !== undefined || updates.materialDemandId !== undefined) {
      for (const demandId of affectedDemandIds) {
        await resyncMaterialDemand(demandId, logger)
      }
    }

    revalidatePath(REVALIDATE_DEPARTMENTS_PATH, 'layout')
  },
})

/**
 * Delete a QuoteSupplierLine.
 * If selected, clears any MaterialDemandSource reservations.
 */
export const deleteQuoteSupplierLineAction = protectedServerFunction({
  schema: quoteSupplierLineIdSchema,
  functionName: 'Delete quote supplier line action',
  serverFn: async ({data: {id}, logger, profile}) => {
    await assertQuoteLineMutationAllowedByLineId(id, profile)
    // Fetch to check if it's selected and has a demand
    const quoteLine = await prismaClient.quoteSupplierLine.findUniqueOrThrow({
      where: {id},
      select: {selected: true, quantity: true, materialDemandId: true},
    })

    const demandId = quoteLine.materialDemandId

    // Delete the line
    await prismaClient.quoteSupplierLine.delete({where: {id}})
    if (quoteLine.selected && demandId) {
      await resyncMaterialDemand(demandId, logger)
    }
    logger.info(`Deleted QuoteSupplierLine: ${id}`)

    revalidatePath(REVALIDATE_DEPARTMENTS_PATH, 'layout')
  },
})

