'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {upsertProjectSchema, updateProjectSchema} from '@/schemas/projectSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {createTargetForType} from '@/dal/targets'
import {generateProjectNumber} from '@/lib/utils'

export const createProjectAction = protectedServerFunction({
  schema: upsertProjectSchema,
  functionName: 'Create project action',
  serverFn: async ({data, logger, profile}) => {
    logger.info(`Creating project, createdBy: ${profile.id}`)

    const target = await createTargetForType('Project', profile.id)

    let projectNumber = data.projectNumber || generateProjectNumber()

    let attempts = 0
    let project

    while (attempts < 5) {
      try {
        project = await prismaClient.project.create({
          data: {
            ...data,
            projectNumber,
            id: crypto.randomUUID(),
            createdBy: profile.id,
            createdAt: new Date(),
            targetId: target.id,
          },
        })
        break
      } catch (err: any) {
        // Prisma unique constraint
        if (err.code === 'P2002') {
          attempts++
          projectNumber = generateProjectNumber()
          continue
        }
        throw err
      }
    }

    if (!project) {
      throw new Error('Failed to generate unique project number')
    }

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
