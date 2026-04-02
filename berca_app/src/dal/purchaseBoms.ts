import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

// ─── Shared include ────────────────────────────────────────────────────────────
const purchaseBOMInclude = {
  Employee_PurchaseBOM_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  Employee_PurchaseBOM_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  Project: {select: {id: true, projectNumber: true, projectName: true}},
  // Direct child BOMs (one level — we don't need to recurse in the include;
  // cascade logic is handled in server actions)
  other_PurchaseBOM: {
    select: {
      id: true,
      purchaseBomNumber: true,
      description: true,
      shortDescription: true,
      closed: true,
      materialClosed: true,
      readyForPurchase: true,
      deleted: true,
      PurchaseBOMStructure: {
        where: {deleted: false},
        select: {id: true},
      },
    },
  },
  PurchaseBOMStructure: {
    include: {
      Material: {select: {id: true, name: true, beNumber: true, shortDescription: true}},
      Employee_PurchaseBOMStructure_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
      Employee_PurchaseBOMStructure_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
    },
    orderBy: {createdAt: 'asc' as const},
  },
}

// ─── Queries ───────────────────────────────────────────────────────────────────
export async function getPurchaseBOMs(projectId?: string) {
  return prismaClient.purchaseBOM.findMany({
    where: projectId ? {projectId} : undefined,
    include: purchaseBOMInclude,
    orderBy: {createdAt: 'desc'},
  })
}

export async function getPurchaseBOMById(id: string) {
  return prismaClient.purchaseBOM.findUniqueOrThrow({
    where: {id},
    include: purchaseBOMInclude,
  })
}

export async function getMaterialOptions() {
  return prismaClient.material.findMany({
    where: {deleted: false},
    select: {id: true, name: true, beNumber: true, shortDescription: true},
    orderBy: {beNumber: 'asc'},
  })
}

export async function searchProjects(query: string) {
  const q = query.trim()
  return prismaClient.project.findMany({
    where: {
      deleted: false,
      ...(q
        ? {
            OR: [{projectName: {contains: q}}, {projectNumber: {contains: q}}],
          }
        : {}),
    },
    select: {id: true, projectNumber: true, projectName: true},
    orderBy: {projectName: 'asc'},
    ...(q ? {take: 20} : {}),
  })
}

// ─── Cascade helpers (used by server actions) ─────────────────────────────────

/**
 * Recursively collect all descendant BOM ids (children, grandchildren, …).
 * Used when cascading readyForPurchase=true downward.
 */
export async function getDescendantBOMIds(parentId: string): Promise<string[]> {
  const children = await prismaClient.purchaseBOM.findMany({
    where: {purchaseBomId: parentId, deleted: false},
    select: {id: true},
  })
  if (children.length === 0) return []
  const childIds = children.map(c => c.id)
  const deeper = await Promise.all(childIds.map(id => getDescendantBOMIds(id)))
  return [...childIds, ...deeper.flat()]
}

/**
 * Recursively collect all ancestor BOM ids (parent, grandparent, …).
 * Used when cascading readyForPurchase=false upward after a new structure is added.
 */
export async function getAncestorBOMIds(bomId: string): Promise<string[]> {
  const bom = await prismaClient.purchaseBOM.findUnique({
    where: {id: bomId},
    select: {purchaseBomId: true},
  })
  if (!bom?.purchaseBomId) return []
  const ancestors = await getAncestorBOMIds(bom.purchaseBomId)
  return [bom.purchaseBomId, ...ancestors]
}
