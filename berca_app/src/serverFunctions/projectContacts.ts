'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {
  createProjectContactSchema,
  updateProjectContactSchema,
  projectContactIdSchema,
} from '@/schemas/projectContactSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'

export const createProjectContactAction = protectedServerFunction({
  schema: createProjectContactSchema,
  functionName: 'Create project contact action',
  serverFn: async ({data: {projectId, contactId, description, extraInfo, idValid}, profile, logger}) => {
    logger.info(`Linking contact ${contactId} to project ${projectId}`)
    const now = new Date()
    await prismaClient.projectContact.create({
      data: {
        id: crypto.randomUUID(),
        projectId,
        contactId,
        description: description ?? null,
        extraInfo: extraInfo ?? null,
        idValid: idValid ?? true,
        createdBy: profile.id,
        moddifiedBy: profile.id,
        createdAt: now,
      },
    })
    logger.info(`ProjectContact created: contact ${contactId} → project ${projectId}`)
    revalidatePath(`/departments/project/project/${projectId}`)
  },
})

export const updateProjectContactAction = protectedServerFunction({
  schema: updateProjectContactSchema,
  functionName: 'Update project contact action',
  serverFn: async ({data: {id, projectId, description, extraInfo, idValid}, profile, logger}) => {
    await prismaClient.projectContact.update({
      where: {id},
      data: {
        description: description ?? null,
        extraInfo: extraInfo ?? null,
        idValid,
        moddifiedBy: profile.id,
        moddifiedAt: new Date(),
      },
    })
    logger.info(`ProjectContact updated: ${id}`)
    revalidatePath(`/departments/project/project/${projectId}`)
  },
})

export const softDeleteProjectContactAction = protectedServerFunction({
  schema: projectContactIdSchema,
  functionName: 'Soft delete project contact action',
  serverFn: async ({data: {id, projectId}, profile, logger}) => {
    await prismaClient.projectContact.update({
      where: {id},
      data: {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: profile.id,
      },
    })
    logger.info(`ProjectContact soft deleted: ${id}`)
    revalidatePath(`/departments/project/project/${projectId}`)
  },
})

export const hardDeleteProjectContactAction = protectedServerFunction({
  schema: projectContactIdSchema,
  functionName: 'Hard delete project contact action',
  serverFn: async ({data: {id, projectId}, logger}) => {
    await prismaClient.projectContact.delete({where: {id}})
    logger.info(`ProjectContact hard deleted: ${id}`)
    revalidatePath(`/departments/project/project/${projectId}`)
  },
})
