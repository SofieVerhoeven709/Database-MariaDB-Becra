import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

// ─── Shared include ────────────────────────────────────────────────────────────
const projectBOMInclude = {
  Employee_ProjectBOM_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  Employee_ProjectBOM_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  Project: {select: {id: true, projectNumber: true, projectName: true}},
  ProjectBOMStructure: {
    include: {
      Material: {select: {id: true, name: true, beNumber: true, shortDescription: true}},
      Employee_ProjectBOMStructure_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
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
            OR: [
              {
                projectName: {
                  contains: q,
                },
              },
              {
                projectNumber: {
                  contains: q,
                },
              },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      projectNumber: true,
      projectName: true,
    },
    orderBy: {
      projectName: 'asc',
    },
    ...(q ? {take: 20} : {}),
  })
}
