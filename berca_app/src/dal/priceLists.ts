import 'server-only'
import {prismaClient} from '@/dal/prismaClient'
import type {LinkableTargetType} from '@/types/priceList'

// ─── Shared includes ───────────────────────────────────────────────────────────
const priceListInclude = {
  Employee_PriceList_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  PriceListItem: {
    include: {
      Employee_PriceListItem_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
      PriceListItemTarget: {
        select: {id: true, priceListItemId: true, targetId: true},
      },
    },
    orderBy: [{isCostMargin: 'desc' as const}, {createdAt: 'asc' as const}] as {
      isCostMargin?: 'asc' | 'desc'
      createdAt?: 'asc' | 'desc'
    }[],
  },
  PriceListCompany: {
    where: {Company: {deleted: false}},
    select: {
      id: true,
      companyId: true,
      Company: {select: {id: true, number: true, name: true}},
    },
  },
}

// ─── Queries ───────────────────────────────────────────────────────────────────
export async function getPriceLists() {
  return prismaClient.priceList.findMany({
    include: priceListInclude,
    orderBy: {createdAt: 'desc'},
  })
}

export async function getPriceListById(id: string) {
  return prismaClient.priceList.findUniqueOrThrow({
    where: {id},
    include: priceListInclude,
  })
}

// Search companies by name or number, excluding already-assigned ones
export async function searchCompanies(query: string, excludeIds: string[] = []) {
  const q = query.trim()
  return prismaClient.company.findMany({
    where: {
      deleted: false,
      id: {notIn: excludeIds},
      ...(q
        ? {
            OR: [{name: {contains: q}}, {number: {contains: q}}],
          }
        : {}),
    },
    select: {id: true, number: true, name: true},
    orderBy: {name: 'asc'},
    take: 20,
  })
}

// ─── Enrich linked target labels ───────────────────────────────────────────────
export async function enrichLinkedTargets(
  targetIds: string[],
): Promise<Map<string, {targetType: LinkableTargetType; displayLabel: string}>> {
  if (targetIds.length === 0) return new Map()

  const result = new Map<string, {targetType: LinkableTargetType; displayLabel: string}>()

  const [hourTypes, materials, trainings] = await Promise.all([
    prismaClient.hourType.findMany({
      where: {targetId: {in: targetIds}},
      select: {name: true, targetId: true},
    }),
    prismaClient.material.findMany({
      where: {targetId: {in: targetIds}},
      select: {name: true, shortDescription: true, beNumber: true, targetId: true},
    }),
    prismaClient.training.findMany({
      where: {targetId: {in: targetIds}},
      select: {trainingNumber: true, targetId: true},
    }),
  ])

  for (const r of hourTypes) {
    if (r.targetId) result.set(r.targetId, {targetType: 'HourType', displayLabel: r.name})
  }
  for (const r of materials) {
    if (r.targetId) {
      result.set(r.targetId, {targetType: 'Material', displayLabel: r.name ?? r.shortDescription ?? r.beNumber})
    }
  }
  for (const r of trainings) {
    if (r.targetId) {
      result.set(r.targetId, {targetType: 'Training', displayLabel: r.trainingNumber ?? r.targetId})
    }
  }

  return result
}

// ─── Linkable target search ────────────────────────────────────────────────────
export async function searchLinkableTargets(type: LinkableTargetType, query: string) {
  const q = query.trim()

  if (type === 'HourType') {
    return prismaClient.hourType.findMany({
      where: {deleted: false, ...(q ? {name: {contains: q}} : {})},
      select: {id: true, name: true, info: true, targetId: true},
      orderBy: {name: 'asc'},
      take: 20,
    })
  }

  if (type === 'Material') {
    return prismaClient.material.findMany({
      where: {
        deleted: false,
        ...(q ? {OR: [{name: {contains: q}}, {shortDescription: {contains: q}}, {beNumber: {contains: q}}]} : {}),
      },
      select: {id: true, name: true, shortDescription: true, beNumber: true, targetId: true},
      orderBy: {beNumber: 'asc'},
      take: 20,
    })
  }

  if (type === 'Training') {
    return prismaClient.training.findMany({
      where: {deleted: false, ...(q ? {trainingNumber: {contains: q}} : {})},
      select: {id: true, trainingNumber: true, targetId: true},
      orderBy: {trainingNumber: 'asc'},
      take: 20,
    })
  }

  return []
}
