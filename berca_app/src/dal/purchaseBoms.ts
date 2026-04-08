import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

// ─── Shared include ────────────────────────────────────────────────────────────
const purchaseBOMInclude = {
  Employee_PurchaseBOM_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  Employee_PurchaseBOM_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  Project: {select: {id: true, projectNumber: true, projectName: true}},
  other_PurchaseBOM: {
    select: {
      id: true,
      purchaseBomNumber: true,
      description: true,
      shortDescription: true,
      closed: true,
      materialClosed: true,
      approvedForQuote: true,
      purchased: true,
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
      // ── Include the originating ProjectBOMStructure for read-only display fields
      PurchaseBOMStructure: {
        where: {deleted: false},
        select: {id: true},
      },
      ProjectBOMStructure: {
        select: {
          Material: {select: {id: true, name: true, beNumber: true, shortDescription: true}},
          BOMExecution: {
            select: {
              stockReservedQuantity: true,
              issuedQuantity: true,
              notDeliverable: true,
              notCorrect: true,
              notCorrectReason: true,
              completedDate: true,
              requiredQuantity: true,
            },
          },
        },
      },
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

// ─── Cascade helpers ──────────────────────────────────────────────────────────

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

export async function getAncestorBOMIds(bomId: string): Promise<string[]> {
  const bom = await prismaClient.purchaseBOM.findUnique({
    where: {id: bomId},
    select: {purchaseBomId: true},
  })
  if (!bom?.purchaseBomId) return []
  const ancestors = await getAncestorBOMIds(bom.purchaseBomId)
  return [bom.purchaseBomId, ...ancestors]
}
