'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {
  createPriceListSchema,
  updatePriceListSchema,
  priceListIdSchema,
  clonePriceListSchema,
  createPriceListItemSchema,
  updatePriceListItemSchema,
  priceListItemIdSchema,
  assignProjectSchema,
  unassignProjectSchema,
} from '@/schemas/priceListSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {createTargetForType} from '@/dal/targets'

const COST_MARGIN_DESCRIPTION = 'Cost Margin'
const COST_MARGIN_UNIT = '%'

// ─── PriceList CRUD ────────────────────────────────────────────────────────────
export const createPriceListAction = protectedServerFunction({
  schema: createPriceListSchema,
  functionName: 'Create price list action',
  serverFn: async ({data, logger, profile}) => {
    logger.info(`Creating price list, createdBy: ${profile.id}`)

    const target = await createTargetForType('PriceList', profile.id)
    const id = crypto.randomUUID()
    const now = new Date()

    await prismaClient.priceList.create({
      data: {
        ...data,
        id,
        targetId: target.id,
        createdBy: profile.id,
        createdAt: now,
      },
    })

    // Always create the default cost margin item
    await prismaClient.priceListItem.create({
      data: {
        id: crypto.randomUUID(),
        priceListId: id,
        description: COST_MARGIN_DESCRIPTION,
        unit: COST_MARGIN_UNIT,
        price: 0,
        isCostMargin: true,
        createdBy: profile.id,
        createdAt: now,
      },
    })

    logger.info(`Price list created: ${id}`)
    revalidatePath('/priceLists')
  },
})

export const clonePriceListAction = protectedServerFunction({
  schema: clonePriceListSchema,
  functionName: 'Clone price list action',
  serverFn: async ({data: {sourceId, name, repeatUse}, logger, profile}) => {
    logger.info(`Cloning price list ${sourceId}, createdBy: ${profile.id}`)

    const source = await prismaClient.priceList.findUniqueOrThrow({
      where: {id: sourceId},
      include: {
        PriceListItem: {where: {deleted: false}},
      },
    })

    const target = await createTargetForType('PriceList', profile.id)
    const newId = crypto.randomUUID()
    const now = new Date()

    await prismaClient.priceList.create({
      data: {
        id: newId,
        name,
        repeatUse,
        targetId: target.id,
        createdBy: profile.id,
        createdAt: now,
      },
    })

    // Clone all items including cost margin as-is
    if (source.PriceListItem.length > 0) {
      await prismaClient.priceListItem.createMany({
        data: source.PriceListItem.map(item => ({
          id: crypto.randomUUID(),
          priceListId: newId,
          description: item.description,
          unit: item.unit,
          price: item.price,
          isCostMargin: item.isCostMargin,
          createdBy: profile.id,
          createdAt: now,
        })),
      })
    } else {
      // If source somehow has no cost margin item, create the default
      await prismaClient.priceListItem.create({
        data: {
          id: crypto.randomUUID(),
          priceListId: newId,
          description: COST_MARGIN_DESCRIPTION,
          unit: COST_MARGIN_UNIT,
          price: 0,
          isCostMargin: true,
          createdBy: profile.id,
          createdAt: now,
        },
      })
    }

    logger.info(`Price list cloned: ${newId} from ${sourceId}`)
    revalidatePath('/priceLists')
  },
})

export const updatePriceListAction = protectedServerFunction({
  schema: updatePriceListSchema,
  functionName: 'Update price list action',
  serverFn: async ({data: {id, ...data}, logger}) => {
    await prismaClient.priceList.update({
      where: {id},
      data,
    })
    logger.info(`Price list updated: ${id}`)
    revalidatePath('/priceLists')
  },
})

export const softDeletePriceListAction = protectedServerFunction({
  schema: priceListIdSchema,
  functionName: 'Soft delete price list action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.priceList.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Price list soft deleted: ${id}`)
    revalidatePath('/priceLists')
  },
})

export const hardDeletePriceListAction = protectedServerFunction({
  schema: priceListIdSchema,
  functionName: 'Hard delete price list action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.priceList.delete({where: {id}})
    logger.info(`Price list hard deleted: ${id}`)
    revalidatePath('/priceLists')
  },
})

export const undeletePriceListAction = protectedServerFunction({
  schema: priceListIdSchema,
  functionName: 'Undelete price list action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.priceList.update({
      where: {id},
      data: {deleted: false, deletedAt: null, deletedBy: null},
    })
    logger.info(`Price list undeleted: ${id}`)
    revalidatePath('/priceLists')
  },
})

// ─── PriceListItem CRUD ────────────────────────────────────────────────────────
export const createPriceListItemAction = protectedServerFunction({
  schema: createPriceListItemSchema,
  functionName: 'Create price list item action',
  serverFn: async ({data, logger, profile}) => {
    const id = crypto.randomUUID()
    await prismaClient.priceListItem.create({
      data: {
        ...data,
        id,
        createdBy: profile.id,
        createdAt: new Date(),
      },
    })
    logger.info(`Price list item created: ${id}`)
    revalidatePath('/priceLists')
  },
})

export const updatePriceListItemAction = protectedServerFunction({
  schema: updatePriceListItemSchema,
  functionName: 'Update price list item action',
  serverFn: async ({data: {id, ...data}, logger}) => {
    await prismaClient.priceListItem.update({
      where: {id},
      data,
    })
    logger.info(`Price list item updated: ${id}`)
    revalidatePath('/priceLists')
  },
})

export const softDeletePriceListItemAction = protectedServerFunction({
  schema: priceListItemIdSchema,
  functionName: 'Soft delete price list item action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.priceListItem.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Price list item soft deleted: ${id}`)
    revalidatePath('/priceLists')
  },
})

export const hardDeletePriceListItemAction = protectedServerFunction({
  schema: priceListItemIdSchema,
  functionName: 'Hard delete price list item action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.priceListItem.delete({where: {id}})
    logger.info(`Price list item hard deleted: ${id}`)
    revalidatePath('/priceLists')
  },
})

export const restorePriceListItemAction = protectedServerFunction({
  schema: priceListItemIdSchema,
  functionName: 'Restore price list item action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.priceListItem.update({
      where: {id},
      data: {deleted: false, deletedAt: null, deletedBy: null},
    })
    logger.info(`Price list item restored: ${id}`)
    revalidatePath('/priceLists')
  },
})

// ─── Project assignment ────────────────────────────────────────────────────────
export const assignProjectToPriceListAction = protectedServerFunction({
  schema: assignProjectSchema,
  functionName: 'Assign project to price list action',
  serverFn: async ({data: {priceListId, projectId}, logger}) => {
    await prismaClient.project.update({
      where: {id: projectId},
      data: {priceListId},
    })
    logger.info(`Project ${projectId} assigned to price list ${priceListId}`)
    revalidatePath('/priceLists')
  },
})

export const unassignProjectFromPriceListAction = protectedServerFunction({
  schema: unassignProjectSchema,
  functionName: 'Unassign project from price list action',
  serverFn: async ({data: {projectId}, logger}) => {
    await prismaClient.project.update({
      where: {id: projectId},
      data: {priceListId: null},
    })
    logger.info(`Project ${projectId} unassigned from price list`)
    revalidatePath('/priceLists')
  },
})
