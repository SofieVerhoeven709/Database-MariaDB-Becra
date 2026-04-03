import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

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
          reservedQuantity: true,
          issuedQuantity: true,
          notDeliverable: true,
          notCorrect: true,
          notCorrectReason: true,
          completedDate: true,
        },
      },
    },
    orderBy: {createdAt: 'asc' as const},
  },
}

// ─── Queries ───────────────────────────────────────────────────────────────────
export async function getProjectBOMs(projectId?: string) {
  return prismaClient.projectBOM.findMany({
    where: projectId ? {projectId} : undefined,
    include: projectBOMInclude,
    orderBy: {createdAt: 'desc'},
  })
}

export async function getProjectBOMById(id: string) {
  return prismaClient.projectBOM.findUniqueOrThrow({
    where: {id},
    include: projectBOMInclude,
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
