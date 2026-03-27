'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {upsertProjectSchema, updateProjectSchema} from '@/schemas/projectSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {createTargetForType} from '@/dal/targets'
import {generateProjectNumber} from '@/lib/utils'
import {upsertVisibilityRows} from '@/serverFunctions/visibilityForRoles'

export const createProjectAction = protectedServerFunction({
  schema: upsertProjectSchema,
  functionName: 'Create project action',
  serverFn: async ({data, logger, profile}) => {
    logger.info(`Creating project, createdBy: ${profile.id}`)

    const {visibilityForRoles, ...projectData} = data

    const target = await createTargetForType('Project', profile.id)

    let projectNumber = projectData.projectNumber || generateProjectNumber()

    let attempts = 0
    let project

    while (attempts < 5) {
      try {
        project = await prismaClient.project.create({
          data: {
            ...projectData,
            projectNumber,
            id: crypto.randomUUID(),
            createdBy: profile.id,
            createdAt: new Date(),
            targetId: target.id,
          },
        })
        break
      } catch (err: any) {
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

    // Set visibility
    await upsertVisibilityRows(target.id, visibilityForRoles)

    logger.info(`Project created: ${project.id}`)
    revalidatePath('/projects')
  },
})

export const updateProjectAction = protectedServerFunction({
  schema: upsertProjectSchema,
  functionName: 'Update project action',
  serverFn: async ({data: {id, visibilityForRoles, ...data}, logger}) => {
    const project = await prismaClient.project.update({
      where: {id},
      data,
      select: {targetId: true},
    })

    // Sync visibility — delete all existing then recreate (same pattern as company)
    await prismaClient.visibilityForRole.deleteMany({
      where: {targetId: project.targetId},
    })

    await upsertVisibilityRows(project.targetId, visibilityForRoles)

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
    // Check for dependent records
    const dependentCounts = await prismaClient.$transaction([
      prismaClient.materialSerialTrack.count({where: {projectId: id}}),
      prismaClient.projectContact.count({where: {projectId: id}}),
      prismaClient.purchase.count({where: {projectId: id}}),
      prismaClient.purchaseDetail.count({where: {projectId: id}}),
      prismaClient.quoteSupplier.count({where: {projectId: id}}),
      prismaClient.workOrder.count({where: {projectId: id}}),
      // Add other tables referencing projectId if needed
    ])

    if (dependentCounts.some(c => c > 0)) {
      throw new Error(
        `Cannot hard delete project: it has ${dependentCounts.reduce((acc, c) => acc + c, 0)} dependent record(s)`,
      )
    }

    // Safe to delete
    await prismaClient.project.delete({where: {id}})
    logger.info(`Project hard deleted: ${id}`)
    revalidatePath('/projects')
  },
})

export const undeleteProjectAction = protectedServerFunction({
  schema: updateProjectSchema,
  functionName: 'Undelete contact action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.project.update({where: {id}, data: {deleted: false}})
    logger.info(`Project undeleted: ${id}`)
    revalidatePath('/projects')
  },
})
