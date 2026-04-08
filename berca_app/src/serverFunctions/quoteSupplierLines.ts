'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {
  createQuoteSupplierLineSchema,
  updateQuoteSupplierLineSchema,
  selectQuoteSupplierLineSchema,
  quoteSupplierLineIdSchema,
} from '@/schemas/quoteSupplierLineSchemas'

const REVALIDATE_PATH = '/departments/purchasing'

// ─── Actions ───────────────────────────────────────────────────────────────────


/**
 * Create a QuoteSupplierLine linking a quote to material demand.
 * If selected=true, updates MaterialDemandSource reserved quantities.
 */
export const createQuoteSupplierLineAction = protectedServerFunction({
  schema: createQuoteSupplierLineSchema,
  functionName: 'Create quote supplier line action',
  serverFn: async ({data, logger, profile}) => {
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

    revalidatePath(REVALIDATE_PATH)
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
  serverFn: async ({data: {id, selected, materialDemandId}, logger}) => {
    // Fetch the quote line to get quantity info
    const quoteLine = await prismaClient.quoteSupplierLine.findUniqueOrThrow({
      where: {id},
      select: {quantity: true, materialDemandId: true},
    })

    const demandId = materialDemandId || quoteLine.materialDemandId
    if (!demandId) {
      logger.warn(`Cannot select quote line ${id}: no materialDemandId associated`)
      return
    }

    // Update the selected flag
    await prismaClient.quoteSupplierLine.update({
      where: {id},
      data: {selected},
    })

    // Update MaterialDemandSource reserved qty based on selection status
    if (selected) {
      // When selecting, get the ProjectBOMStructure ID from the quote (if available)
      // and update the MaterialDemandSource for that source
      const quoteLineWithSource = await prismaClient.quoteSupplierLine.findUnique({
        where: {id},
        include: {
          QuoteSupplier: {
            select: {
              // If needed, include project/source reference here
              id: true,
            },
          },
        },
      })

      // For now, update all MaterialDemandSource records for this material demand
      // In a more sophisticated system, you'd track which source this quote line fulfills
      await prismaClient.materialDemandSource.updateMany({
        where: {materialDemandId: demandId},
        data: {
          reservedQty: {
            increment: quoteLine.quantity,
          },
        },
      })

      logger.info(
        `Selected QuoteSupplierLine ${id}: reserved ${quoteLine.quantity} units ` +
        `for MaterialDemand ${demandId}`,
      )
    } else {
      // When deselecting, decrement the reserved qty
      await prismaClient.materialDemandSource.updateMany({
        where: {materialDemandId: demandId},
        data: {
          reservedQty: {
            decrement: quoteLine.quantity,
          },
        },
      })

      logger.info(
        `Deselected QuoteSupplierLine ${id}: freed ${quoteLine.quantity} units ` +
        `for MaterialDemand ${demandId}`,
      )
    }

    revalidatePath(REVALIDATE_PATH)
  },
})

/**
 * Update a QuoteSupplierLine's quantity and pricing.
 * If quantity changed and line is selected, updates MaterialDemandSource allocations.
 */
export const updateQuoteSupplierLineAction = protectedServerFunction({
  schema: updateQuoteSupplierLineSchema,
  functionName: 'Update quote supplier line action',
  serverFn: async ({data: {id, ...updates}, logger}) => {
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

    // If quantity changed and line is selected, update MaterialDemandSource
    if (updates.quantity && updates.quantity !== current.quantity && current.selected) {
      const demandId = current.materialDemandId
      if (demandId) {
        const quantityDelta = updates.quantity - current.quantity

        await prismaClient.materialDemandSource.updateMany({
          where: {materialDemandId: demandId},
          data: {
            reservedQty: {
              increment: quantityDelta,
            },
          },
        })

        logger.info(
          `Quantity changed for selected QuoteSupplierLine ${id}: ` +
          `adjusted MaterialDemandSource reservation by ${quantityDelta} units`,
        )
      }
    }

    revalidatePath(REVALIDATE_PATH)
  },
})

/**
 * Delete a QuoteSupplierLine.
 * If selected, clears any MaterialDemandSource reservations.
 */
export const deleteQuoteSupplierLineAction = protectedServerFunction({
  schema: quoteSupplierLineIdSchema,
  functionName: 'Delete quote supplier line action',
  serverFn: async ({data: {id}, logger}) => {
    // Fetch to check if it's selected and has a demand
    const quoteLine = await prismaClient.quoteSupplierLine.findUniqueOrThrow({
      where: {id},
      select: {selected: true, quantity: true, materialDemandId: true},
    })

    // Clear any reservations if this line was selected
    if (quoteLine.selected && quoteLine.materialDemandId) {
      await prismaClient.materialDemandSource.updateMany({
        where: {materialDemandId: quoteLine.materialDemandId},
        data: {
          reservedQty: {
            decrement: quoteLine.quantity,
          },
        },
      })

      logger.info(
        `Cleared ${quoteLine.quantity} unit reservation from MaterialDemandSource ` +
        `for deleted QuoteSupplierLine ${id}`,
      )
    }

    // Delete the line
    await prismaClient.quoteSupplierLine.delete({where: {id}})
    logger.info(`Deleted QuoteSupplierLine: ${id}`)

    revalidatePath(REVALIDATE_PATH)
  },
})

