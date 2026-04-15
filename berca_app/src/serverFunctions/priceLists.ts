'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {searchLinkableTargets, searchCompanies} from '@/dal/priceLists'
import {
  createPriceListSchema,
  updatePriceListSchema,
  priceListIdSchema,
  clonePriceListSchema,
  createPriceListItemSchema,
  updatePriceListItemSchema,
  priceListItemIdSchema,
  linkPriceListItemTargetSchema,
  assignCompanySchema,
  unassignCompanySchema,
} from '@/schemas/priceListSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {createTargetForType} from '@/dal/targets'
import type {LinkableTargetType, LinkableTargetResult, CompanySearchResult} from '@/types/priceList'

const COST_MARGIN_DESCRIPTION = 'Cost Margin'
const COST_MARGIN_UNIT = '%'

// ─── PriceList CRUD ────────────────────────────────────────────────────────────
export const createPriceListAction = protectedServerFunction({
  schema: createPriceListSchema,
  functionName: 'Create price list action',
  serverFn: async ({data, logger, profile}) => {
    logger.info(`Creating price list, createdBy: ${profile.id}`)

    // Create a visibility target for price list items.
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

    // Seed a cost margin line so calculations always have a baseline.
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
        PriceListItem: {
          where: {deleted: false},
          include: {PriceListItemTarget: true},
        },
      },
    })

    // New target to keep cloned list visibility distinct.
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

    if (source.PriceListItem.length > 0) {
      // Re-key items so linked targets can be re-attached.
      const itemIdMap = new Map<string, string>()
      for (const item of source.PriceListItem) {
        itemIdMap.set(item.id, crypto.randomUUID())
      }

      await prismaClient.priceListItem.createMany({
        data: source.PriceListItem.map(item => ({
          id: itemIdMap.get(item.id)!,
          priceListId: newId,
          description: item.description,
          unit: item.unit,
          price: item.price,
          isCostMargin: item.isCostMargin,
          createdBy: profile.id,
          createdAt: now,
        })),
      })

      // Re-create target links using the new item ids.
      const targetLinks = source.PriceListItem.filter(item => item.PriceListItemTarget !== null).map(item => ({
        id: crypto.randomUUID(),
        priceListItemId: itemIdMap.get(item.id)!,
        targetId: item.PriceListItemTarget!.targetId,
      }))

      if (targetLinks.length > 0) {
        await prismaClient.priceListItemTarget.createMany({data: targetLinks})
      }
    } else {
      // Ensure every price list has a cost margin entry.
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
    await prismaClient.priceList.update({where: {id}, data})
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

export async function createPriceListItemAndReturnIdAction(
  data: Parameters<typeof createPriceListItemAction>[0],
): Promise<{id: string}> {
  await createPriceListItemAction(data)
  // Read back the newest match to get the generated id.
  const record = await prismaClient.priceListItem.findFirstOrThrow({
    where: {description: data.description},
    orderBy: {createdAt: 'desc'},
    select: {id: true},
  })
  return record
}

export const updatePriceListItemAction = protectedServerFunction({
  schema: updatePriceListItemSchema,
  functionName: 'Update price list item action',
  serverFn: async ({data: {id, ...data}, logger}) => {
    await prismaClient.priceListItem.update({where: {id}, data})
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

// ─── PriceListItemTarget ───────────────────────────────────────────────────────
export const linkPriceListItemTargetAction = protectedServerFunction({
  schema: linkPriceListItemTargetSchema,
  functionName: 'Link price list item target action',
  serverFn: async ({data: {priceListItemId, targetId}, logger}) => {
    await prismaClient.priceListItemTarget.create({
      data: {id: crypto.randomUUID(), priceListItemId, targetId},
    })
    logger.info(`Price list item ${priceListItemId} linked to target ${targetId}`)
    revalidatePath('/priceLists')
  },
})

export async function searchLinkableTargetsAction(
  type: LinkableTargetType,
  query: string,
): Promise<LinkableTargetResult[]> {
  const results = await searchLinkableTargets(type, query)

  if (type === 'HourType') {
    return (results as {id: string; name: string; info: string | null; targetId: string | null}[]).map(r => ({
      targetId: r.targetId ?? r.id,
      targetType: 'HourType' as const,
      displayLabel: r.name,
      subLabel: r.info ?? null,
    }))
  }

  if (type === 'Material') {
    return (
      results as {
        id: string
        name: string | null
        shortDescription: string
        beNumber: string
        targetId: string | null
      }[]
    ).map(r => ({
      targetId: r.targetId ?? r.id,
      targetType: 'Material' as const,
      displayLabel: r.name ?? r.shortDescription,
      subLabel: r.beNumber,
    }))
  }

  if (type === 'Training') {
    return (results as {id: string; trainingNumber: string | null; targetId: string}[]).map(r => ({
      targetId: r.targetId,
      targetType: 'Training' as const,
      displayLabel: r.trainingNumber ?? r.id,
      subLabel: null,
    }))
  }

  if (type === 'TrainingStandard') {
    return (results as {id: string; descriptionShort: string | null; targetId: string}[]).map(r => ({
      targetId: r.targetId,
      targetType: 'TrainingStandard' as const,
      displayLabel: r.descriptionShort ?? r.id,
      subLabel: null,
    }))
  }

  return []
}

// ─── Company assignment ────────────────────────────────────────────────────────
export const assignCompanyToPriceListAction = protectedServerFunction({
  schema: assignCompanySchema,
  functionName: 'Assign company to price list action',
  serverFn: async ({data: {priceListId, companyId}, logger}) => {
    await prismaClient.priceListCompany.create({
      data: {id: crypto.randomUUID(), priceListId, companyId},
    })
    logger.info(`Company ${companyId} assigned to price list ${priceListId}`)
    revalidatePath('/priceLists')
  },
})

export const unassignCompanyFromPriceListAction = protectedServerFunction({
  schema: unassignCompanySchema,
  functionName: 'Unassign company from price list action',
  serverFn: async ({data: {priceListCompanyId}, logger}) => {
    await prismaClient.priceListCompany.delete({where: {id: priceListCompanyId}})
    logger.info(`PriceListCompany row ${priceListCompanyId} deleted`)
    revalidatePath('/priceLists')
  },
})

export async function searchCompaniesAction(query: string, excludeIds: string[]): Promise<CompanySearchResult[]> {
  return searchCompanies(query, excludeIds)
}
