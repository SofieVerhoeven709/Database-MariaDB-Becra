import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

// ─── Shared includes ───────────────────────────────────────────────────────────
const priceListInclude = {
  Employee_PriceList_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  PriceListItem: {
    include: {
      Employee_PriceListItem_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
    },
    orderBy: [{isCostMargin: 'desc' as const}, {createdAt: 'asc' as const}] as {
      isCostMargin?: 'asc' | 'desc'
      createdAt?: 'asc' | 'desc'
    }[],
  },
  Project: {
    where: {deleted: false},
    select: {
      id: true,
      projectNumber: true,
      projectName: true,
      companyId: true,
      Company: {select: {id: true, name: true}},
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

// Projects that are open (isClosed = false) and have no pricelist assigned yet
export async function getUnassignedOpenProjects() {
  return prismaClient.project.findMany({
    where: {
      deleted: false,
      isClosed: false,
      priceListId: null,
    },
    select: {
      id: true,
      projectNumber: true,
      projectName: true,
      Company: {select: {name: true}},
    },
    orderBy: {projectNumber: 'asc'},
  })
}
