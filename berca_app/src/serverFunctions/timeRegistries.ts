'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {createTimeRegistrySchema, timeRegistryIdSchema, updateTimeRegistrySchema} from '@/schemas/timeRegistrySchemas'

function revalidateTimeRegistryPaths(workOrderId?: string) {
  revalidatePath('/departments/timeregistries')
  if (workOrderId) {
    revalidatePath(`/departments/project/project/${workOrderId}`)
  }
}

export const createTimeRegistryAction = protectedServerFunction({
  schema: createTimeRegistrySchema,
  functionName: 'Create time registry action',
  serverFn: async ({data: {employeeIds, ...data}, logger, profile}) => {
    const timeRegistry = await prismaClient.timeRegistry.create({
      data: {
        ...data,
        id: crypto.randomUUID(),
        createdBy: profile.id,
        createdAt: new Date(),
        TimeRegistryEmployee: {
          create: employeeIds.map(employeeId => ({
            id: crypto.randomUUID(),
            employeeId,
          })),
        },
      },
    })

    logger.info(`Time registry created: ${timeRegistry.id}`)
    revalidateTimeRegistryPaths(data.workOrderId)
  },
})

export const updateTimeRegistryAction = protectedServerFunction({
  schema: updateTimeRegistrySchema,
  functionName: 'Update time registry action',
  serverFn: async ({data: {id, employeeIds, ...data}, logger}) => {
    await prismaClient.timeRegistry.update({
      where: {id},
      data: {
        ...data,
        TimeRegistryEmployee: {
          deleteMany: {},
          create: employeeIds.map(employeeId => ({
            id: crypto.randomUUID(),
            employeeId,
          })),
        },
      },
    })

    logger.info(`Time registry updated: ${id}`)
    revalidateTimeRegistryPaths(data.workOrderId)
  },
})

export const softDeleteTimeRegistryAction = protectedServerFunction({
  schema: timeRegistryIdSchema,
  functionName: 'Soft delete time registry action',
  serverFn: async ({data: {id}, profile, logger}) => {
    const tr = await prismaClient.timeRegistry.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
      select: {workOrderId: true},
    })

    logger.info(`Time registry soft deleted: ${id}`)
    revalidateTimeRegistryPaths(tr.workOrderId)
  },
})

export const hardDeleteTimeRegistryAction = protectedServerFunction({
  schema: timeRegistryIdSchema,
  functionName: 'Hard delete time registry action',
  serverFn: async ({data: {id}, logger}) => {
    const tr = await prismaClient.timeRegistry.findUniqueOrThrow({
      where: {id},
      select: {workOrderId: true},
    })
    await prismaClient.timeRegistryEmployee.deleteMany({
      where: {timeRegistryId: id},
    })
    await prismaClient.timeRegistry.delete({where: {id}})
    logger.info(`Time registry hard deleted: ${id}`)
    revalidateTimeRegistryPaths(tr.workOrderId)
  },
})

export const undeleteTimeRegistryAction = protectedServerFunction({
  schema: timeRegistryIdSchema,
  functionName: 'Undelete time registry action',
  serverFn: async ({data: {id}, logger}) => {
    const tr = await prismaClient.timeRegistry.update({
      where: {id},
      data: {deleted: false},
      select: {workOrderId: true},
    })
    logger.info(`Time registry undeleted: ${id}`)
    revalidateTimeRegistryPaths(tr.workOrderId)
  },
})
