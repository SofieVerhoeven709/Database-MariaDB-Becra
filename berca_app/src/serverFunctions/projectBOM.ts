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
} from '@/schemas/projectBOMSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'

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
    await prismaClient.projectBOM.update({where: {id}, data})
    logger.info(`Project BOM updated: ${id}`)
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
