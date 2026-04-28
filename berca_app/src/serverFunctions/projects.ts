'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {
  upsertProjectSchema,
  updateProjectSchema,
  updateProjectEmployeeSchema,
  createProjectEmployeeSchema,
  deleteProjectEmployeeSchema,
} from '@/schemas/projectSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {generateProjectNumber} from '@/lib/utils'
import {createTargetForType} from '@/dal/targets'

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
        if (err.code === 'P2002') {
          attempts++
          projectNumber = generateProjectNumber()
          continue
        }
        throw err
      }
    }

    if (!project) throw new Error('Failed to generate unique project number')

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
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Project soft deleted: ${id} by ${profile.id}`)
    revalidatePath('/projects')
  },
})

export const hardDeleteProjectAction = protectedServerFunction({
  schema: updateProjectSchema,
  functionName: 'Hard delete project action',
  serverFn: async ({data: {id}, logger}) => {
    const dependentCounts = await prismaClient.$transaction([
      prismaClient.materialSerialTrack.count({where: {projectId: id}}),
      prismaClient.projectContact.count({where: {projectId: id}}),
      prismaClient.projectBOM.count({where: {projectId: id}}),
      prismaClient.purchaseBOM.count({where: {projectId: id}}),
      prismaClient.workOrder.count({where: {projectId: id}}),
    ])

    if (dependentCounts.some(c => c > 0)) {
      throw new Error(
        `Cannot hard delete project: it has ${dependentCounts.reduce((a, c) => a + c, 0)} dependent record(s)`,
      )
    }

    await prismaClient.project.delete({where: {id}})
    logger.info(`Project hard deleted: ${id}`)
    revalidatePath('/projects')
  },
})

export const undeleteProjectAction = protectedServerFunction({
  schema: updateProjectSchema,
  functionName: 'Undelete project action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.project.update({where: {id}, data: {deleted: false}})
    logger.info(`Project undeleted: ${id}`)
    revalidatePath('/projects')
  },
})

export const createProjectEmployeeAction = protectedServerFunction({
  schema: createProjectEmployeeSchema,
  functionName: 'Create project employee action',
  serverFn: async ({data, logger}) => {
    await prismaClient.projectEmployee.create({
      data: {
        id: crypto.randomUUID(),
        projectId: data.projectId,
        employeeId: data.employeeId,
        additionalInfo: data.additionalInfo ?? null,
        manager: data.manager,
        supervisor: data.supervisor,
      },
    })
    logger.info(`ProjectEmployee created for project ${data.projectId}, employee ${data.employeeId}`)
    revalidatePath('/projects')
  },
})

export const updateProjectEmployeeAction = protectedServerFunction({
  schema: updateProjectEmployeeSchema,
  functionName: 'Update project employee action',
  serverFn: async ({data: {id, ...rest}, logger}) => {
    await prismaClient.projectEmployee.update({
      where: {id},
      data: rest,
    })
    logger.info(`ProjectEmployee updated: ${id}`)
    revalidatePath('/projects')
  },
})

export const deleteProjectEmployeeAction = protectedServerFunction({
  schema: deleteProjectEmployeeSchema,
  functionName: 'Delete project employee action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.projectEmployee.delete({where: {id}})
    logger.info(`ProjectEmployee deleted: ${id}`)
    revalidatePath('/projects')
  },
})
