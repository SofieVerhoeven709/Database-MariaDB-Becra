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
import {createTargetForType} from '@/dal/targets'
import {createPurchaseBOMAction} from '@/serverFunctions/purchaseBoms'

// ─── ProjectBOM CRUD ───────────────────────────────────────────────────────────

export const createProjectBOMAction = protectedServerFunction({
  schema: createProjectBOMSchema,
  functionName: 'Create project BOM action',
  serverFn: async ({data, logger, profile}) => {
    const id = crypto.randomUUID()
    const target = await createTargetForType('ProjectBom', profile.id)
    logger.info(`Creating project BOM for project ${data.projectId}, createdBy: ${profile.id}`)
    await prismaClient.projectBOM.create({
      data: {
        ...data,
        id,
        createdBy: profile.id,
        createdAt: new Date(),
        targetId: target.id,
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
    const wasReadyForPurchase = data.readyForPurchase

    await prismaClient.projectBOM.update({where: {id}, data})
    logger.info(`Project BOM updated: ${id}`)

    if (wasReadyForPurchase) {
      const now = new Date()
      await prismaClient.projectBOMStructure.updateMany({
        where: {projectBOMId: id, deleted: false},
        data: {readyForPurchase: true, readyForPurchaseDate: now},
      })
      logger.info(`Cascaded readyForPurchase=true to structures of BOM: ${id}`)

      const descendantIds = await getDescendantBOMIds(id)
      if (descendantIds.length > 0) {
        await prismaClient.projectBOM.updateMany({
          where: {id: {in: descendantIds}},
          data: {readyForPurchase: true},
        })
        await prismaClient.projectBOMStructure.updateMany({
          where: {projectBOMId: {in: descendantIds}, deleted: false},
          data: {readyForPurchase: true, readyForPurchaseDate: now},
        })
        logger.info(`Cascaded readyForPurchase=true to ${descendantIds.length} descendant BOM(s): ${id}`)
      }
    }

    const purchaseExists = await prismaClient.purchaseBOM.findFirst({
      where: {projectBOMId: id},
    })

    if (data.readyForPurchase && !purchaseExists) {
      const bom = await prismaClient.purchaseBOM.findFirst({
        where: {projectBOMId: data.projectBomId!},
      })
      let payload
      if (bom) {
        payload = {
          projectId: data.projectId,
          projectBOMId: id,
          description: data.description,
          shortDescription: data.shortDescription,
          purchaseBomId: bom.purchaseBomId,
          purchaseBomNumber: data.projectBomNumber,
          additionalInfo: data.additionalInfo,
          startDate: data.startDate,
          endDate: data.endDate,
          closed: data.closed,
          materialClosed: data.materialClosed,
        }
      } else {
        payload = {
          projectId: data.projectId,
          projectBOMId: id,
          description: data.description,
          shortDescription: data.shortDescription,
          purchaseBomNumber: data.projectBomNumber,
          additionalInfo: data.additionalInfo,
          startDate: data.startDate,
          endDate: data.endDate,
          closed: data.closed,
          materialClosed: data.materialClosed,
        }
      }

      await createPurchaseBOMAction(payload)
    }

    revalidatePath('/projectBOMs')
    revalidatePath('/purchaseBOMs')
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
    const bom = await prismaClient.projectBOM.findUniqueOrThrow({
      where: {id: data.projectBOMId},
      select: {materialClosed: true, readyForPurchase: true, projectId: true},
    })

    if (bom.materialClosed) {
      throw new Error('Cannot add structures to a material-closed BOM.')
    }

    const id = crypto.randomUUID()
    const structure = await prismaClient.projectBOMStructure.create({
      data: {
        ...data,
        id,
        createdBy: profile.id,
        createdAt: new Date(),
      },
    })
    logger.info(`Project BOM structure created: ${id}`)

    // ── Reset readyForPurchase upward ────────────────────────────────────────
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
    revalidatePath('/purchaseBOMs')
  },
})

export const updateProjectBOMStructureAction = protectedServerFunction({
  schema: updateProjectBOMStructureSchema,
  functionName: 'Update project BOM structure action',
  serverFn: async ({data: {id, ...data}, logger, profile}) => {
    // Fetch the current structure so we can check what's changing
    const existing = await prismaClient.projectBOMStructure.findUniqueOrThrow({
      where: {id},
      select: {
        projectBOMId: true,
        ProjectBOM: {select: {projectId: true}},
      },
    })

    await prismaClient.projectBOMStructure.update({where: {id}, data})
    logger.info(`Project BOM structure updated: ${id}`)

    revalidatePath('/projectBOMs')
    revalidatePath('/purchaseBOMs')
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
    revalidatePath('/purchaseBOMs')
  },
})

export const hardDeleteProjectBOMStructureAction = protectedServerFunction({
  schema: projectBOMStructureIdSchema,
  functionName: 'Hard delete project BOM structure action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.projectBOMStructure.delete({where: {id}})
    logger.info(`Project BOM structure hard deleted: ${id}`)
    revalidatePath('/projectBOMs')
    revalidatePath('/purchaseBOMs')
  },
})

export const restoreProjectBOMStructureAction = protectedServerFunction({
  schema: projectBOMStructureIdSchema,
  functionName: 'Restore project BOM structure action',
  serverFn: async ({data: {id}, logger, profile}) => {
    await prismaClient.projectBOMStructure.update({
      where: {id},
      data: {deleted: false, deletedAt: null, deletedBy: null},
    })
    logger.info(`Project BOM structure restored: ${id}`)

    revalidatePath('/projectBOMs')
    revalidatePath('/purchaseBOMs')
  },
})

// ─── Project search ────────────────────────────────────────────────────────────
export async function searchProjectsAction(query: string): Promise<ProjectOption[]> {
  return searchProjects(query)
}
