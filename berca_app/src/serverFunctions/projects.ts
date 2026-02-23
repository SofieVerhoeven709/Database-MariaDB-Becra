'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {upsertProjectSchema, updateProjectSchema} from '@/schemas/projectSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'

export const createProjectAction = protectedServerFunction({
  schema: upsertProjectSchema,
  functionName: 'Create project action',
  serverFn: async ({data, logger, profile}) => {
    logger.info(`Creating project, createdBy: ${profile.id}`)

    const project = await prismaClient.project.create({
      data: {
        ...data,
        id: crypto.randomUUID(),
        createdBy: profile.id,
        createdAt: new Date(),
      },
    })

    logger.info(`Project created: ${project.id}`)
    revalidatePath('/projects')
  },
})

export const updateProjectAction = protectedServerFunction({
  schema: upsertProjectSchema,
  functionName: 'Update project action',
  serverFn: async ({data: {id, ...data}, logger}) => {
    await prismaClient.project.update({
      where: {id},
      data,
    })

    logger.info(`Project updated: ${id}`)
    revalidatePath('/projects')
  },
})

export const softDeleteProjectAction = protectedServerFunction({
  schema: updateProjectSchema,
  functionName: 'Soft delete project action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.project.update({
      where: {id},
      data: {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: profile.id,
      },
    })

    logger.info(`Project soft deleted: ${id} by ${profile.id}`)
    revalidatePath('/projects')
  },
})

export const hardDeleteProjectAction = protectedServerFunction({
  schema: updateProjectSchema,
  functionName: 'Hard delete project action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.project.delete({where: {id}})

    logger.info(`Project hard deleted: ${id}`)
    revalidatePath('/projects')
  },
})
