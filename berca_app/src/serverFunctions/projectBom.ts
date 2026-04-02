'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {
  createProjectBOMSchema,
  updateProjectBOMSchema,
  projectBOMIdSchema,
  createProjectBOMStructureSchema,
  updateProjectBOMStructureSchema,
  projectBOMStructureIdSchema,
} from '@/schemas/projectBomSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {searchProjects, getDescendantBOMIds, getAncestorBOMIds} from '@/dal/projectBoms'
import type {ProjectOption} from '@/types/projectBom'

// ─── ProjectBOM CRUD ───────────────────────────────────────────────────────────

export const createProjectBOMAction = protectedServerFunction({
  schema: createProjectBOMSchema,
  functionName: 'Create project BOM action',
  serverFn: async ({data, logger, profile}) => {
    const id = crypto.randomUUID()
    logger.info(`Creating project BOM for project ${data.projectId}, createdBy: ${profile.id}`)
    await prismaClient.projectBOM.create({
      data: {
        ...data,
        id,
        createdBy: profile.id,
        createdAt: new Date(),
      },
    })
    logger.info(`Project BOM created: ${id}`)
    revalidatePath('/projectBOMs')
  },
})

export const updateProjectBOMAction = protectedServerFunction({
  schema: updateProjectBOMSchema,
  functionName: 'Update project BOM action',
  serverFn: async ({data: {id, ...data}, logger}) => {
    // Check if readyForPurchase is being set to true
    const wasReadyForPurchase = data.readyForPurchase

    await prismaClient.projectBOM.update({where: {id}, data})
    logger.info(`Project BOM updated: ${id}`)

    if (wasReadyForPurchase) {
      // ── Cascade readyForPurchase=true to all structures of this BOM ──────────
      const now = new Date()
      await prismaClient.projectBOMStructure.updateMany({
        where: {projectBOMId: id, deleted: false},
        data: {
          readyForPurchase: true,
          readyForPurchaseDate: now,
        },
      })
      logger.info(`Cascaded readyForPurchase=true to structures of BOM: ${id}`)

      // ── Cascade readyForPurchase=true to all descendant BOMs + their structures
      const descendantIds = await getDescendantBOMIds(id)
      if (descendantIds.length > 0) {
        await prismaClient.projectBOM.updateMany({
          where: {id: {in: descendantIds}},
          data: {readyForPurchase: true},
        })
        await prismaClient.projectBOMStructure.updateMany({
          where: {projectBOMId: {in: descendantIds}, deleted: false},
          data: {
            readyForPurchase: true,
            readyForPurchaseDate: now,
          },
        })
        logger.info(`Cascaded readyForPurchase=true to ${descendantIds.length} descendant BOM(s): ${id}`)
      }
    }

    revalidatePath('/projectBOMs')
  },
})

export const softDeleteProjectBOMAction = protectedServerFunction({
  schema: projectBOMIdSchema,
  functionName: 'Soft delete project BOM action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.projectBOM.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Project BOM soft deleted: ${id}`)
    revalidatePath('/projectBOMs')
  },
})

export const hardDeleteProjectBOMAction = protectedServerFunction({
  schema: projectBOMIdSchema,
  functionName: 'Hard delete project BOM action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.projectBOM.delete({where: {id}})
    logger.info(`Project BOM hard deleted: ${id}`)
    revalidatePath('/projectBOMs')
  },
})

export const undeleteProjectBOMAction = protectedServerFunction({
  schema: projectBOMIdSchema,
  functionName: 'Undelete project BOM action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.projectBOM.update({
      where: {id},
      data: {deleted: false, deletedAt: null, deletedBy: null},
    })
    logger.info(`Project BOM undeleted: ${id}`)
    revalidatePath('/projectBOMs')
  },
})

// ─── ProjectBOMStructure CRUD ──────────────────────────────────────────────────

export const createProjectBOMStructureAction = protectedServerFunction({
  schema: createProjectBOMStructureSchema,
  functionName: 'Create project BOM structure action',
  serverFn: async ({data, logger, profile}) => {
    // ── Guard: block creation if the BOM is materialClosed ───────────────────
    const bom = await prismaClient.projectBOM.findUniqueOrThrow({
      where: {id: data.projectBOMId},
      select: {materialClosed: true, readyForPurchase: true},
    })

    if (bom.materialClosed) {
      throw new Error('Cannot add structures to a material-closed BOM.')
    }

    const id = crypto.randomUUID()
    await prismaClient.projectBOMStructure.create({
      data: {
        ...data,
        id,
        createdBy: profile.id,
        createdAt: new Date(),
      },
    })
    logger.info(`Project BOM structure created: ${id}`)

    // ── If the BOM (or any ancestor) was readyForPurchase=true, flip it back ─
    // We reset the BOM itself and all its ancestors.
    const bomIdsToReset: string[] = [data.projectBOMId]
    const ancestorIds = await getAncestorBOMIds(data.projectBOMId)
    bomIdsToReset.push(...ancestorIds)

    if (bomIdsToReset.length > 0) {
      await prismaClient.projectBOM.updateMany({
        where: {id: {in: bomIdsToReset}, readyForPurchase: true},
        data: {readyForPurchase: false},
      })
      logger.info(`Reset readyForPurchase=false on BOM(s) [${bomIdsToReset.join(', ')}] after new structure added`)
    }

    revalidatePath('/projectBOMs')
  },
})

export const updateProjectBOMStructureAction = protectedServerFunction({
  schema: updateProjectBOMStructureSchema,
  functionName: 'Update project BOM structure action',
  serverFn: async ({data: {id, ...data}, logger}) => {
    await prismaClient.projectBOMStructure.update({where: {id}, data})
    logger.info(`Project BOM structure updated: ${id}`)
    revalidatePath('/projectBOMs')
  },
})

export const softDeleteProjectBOMStructureAction = protectedServerFunction({
  schema: projectBOMStructureIdSchema,
  functionName: 'Soft delete project BOM structure action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.projectBOMStructure.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Project BOM structure soft deleted: ${id}`)
    revalidatePath('/projectBOMs')
  },
})

export const hardDeleteProjectBOMStructureAction = protectedServerFunction({
  schema: projectBOMStructureIdSchema,
  functionName: 'Hard delete project BOM structure action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.projectBOMStructure.delete({where: {id}})
    logger.info(`Project BOM structure hard deleted: ${id}`)
    revalidatePath('/projectBOMs')
  },
})

export const restoreProjectBOMStructureAction = protectedServerFunction({
  schema: projectBOMStructureIdSchema,
  functionName: 'Restore project BOM structure action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.projectBOMStructure.update({
      where: {id},
      data: {deleted: false, deletedAt: null, deletedBy: null},
    })
    logger.info(`Project BOM structure restored: ${id}`)
    revalidatePath('/projectBOMs')
  },
})

// ─── Project search ────────────────────────────────────────────────────────────
export async function searchProjectsAction(query: string): Promise<ProjectOption[]> {
  return searchProjects(query)
}
