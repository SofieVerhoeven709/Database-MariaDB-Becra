import 'server-only'
import {prismaClient} from '@/dal/prismaClient'
import {Prisma} from '@/generated/prisma/client'

// ─── Shared include ────────────────────────────────────────────────────────────
export const projectBOMInclude = {
  Employee_ProjectBOM_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  Employee_ProjectBOM_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  Project: {select: {id: true, projectNumber: true, projectName: true}},
  other_ProjectBOM: {
    select: {
      id: true,
      projectBomNumber: true,
      description: true,
      shortDescription: true,
      closed: true,
      materialClosed: true,
      readyForPurchase: true,
      deleted: true,
      ProjectBOMStructure: {
        where: {deleted: false},
        select: {id: true},
      },
    },
  },
  ProjectBOMStructure: {
    include: {
      Material: {select: {id: true, name: true, beNumber: true, shortDescription: true}},
      Employee_ProjectBOMStructure_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
      Employee_ProjectBOMStructure_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
      // ── Include BOMExecution so the project side can display execution status ──
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
    orderBy: {createdAt: 'asc' as const},
  },
} as const

// ─── Queries ───────────────────────────────────────────────────────────────────
export async function getProjectBOMs(projectId?: string) {
  const boms = await prismaClient.projectBOM.findMany({
    where: projectId ? {projectId} : undefined,
    include: projectBOMInclude,
    orderBy: {createdAt: 'desc'},
  })
  return withCanCopy(boms)
}

export async function getProjectBOMById(id: string) {
  const bom = await prismaClient.projectBOM.findUniqueOrThrow({
    where: {id},
    include: projectBOMInclude,
  })
  const [mapped] = await withCanCopy([bom])
  return mapped
}

async function withCanCopy<T extends {id: string}>(boms: T[]): Promise<(T & {canCopy: boolean})[]> {
  if (boms.length === 0) return []
  try {
    const rows = await prismaClient.$queryRaw<Array<{id: string; canCopy: boolean | number | bigint}>>(
      Prisma.sql`SELECT id, canCopy FROM ProjectBOM WHERE id IN (${Prisma.join(boms.map(bom => bom.id))})`,
    )
    const byId = new Map(rows.map(row => [row.id, Boolean(row.canCopy)]))
    return boms.map(bom => ({...bom, canCopy: byId.get(bom.id) ?? false}))
  } catch {
    return boms.map(bom => ({...bom, canCopy: false}))
  }
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

export async function getDescendantBOMIds(parentId: string): Promise<string[]> {
  const children = await prismaClient.projectBOM.findMany({
    where: {projectBomId: parentId, deleted: false},
    select: {id: true},
  })
  if (children.length === 0) return []
  const childIds = children.map(c => c.id)
  const deeper = await Promise.all(childIds.map(id => getDescendantBOMIds(id)))
  return [...childIds, ...deeper.flat()]
}

export async function getAncestorBOMIds(bomId: string): Promise<string[]> {
  const bom = await prismaClient.projectBOM.findUnique({
    where: {id: bomId},
    select: {projectBomId: true},
  })
  if (!bom?.projectBomId) return []
  const ancestors = await getAncestorBOMIds(bom.projectBomId)
  return [bom.projectBomId, ...ancestors]
}
