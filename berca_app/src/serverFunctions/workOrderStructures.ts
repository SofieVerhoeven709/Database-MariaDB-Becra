'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'

import {protectedServerFunction} from '@/lib/serverFunctions'
import {createTargetForType} from '@/dal/targets'
import {
  createWorkOrderStructureSchema,
  updateWorkOrderStructureSchema,
  workOrderStructureIdSchema,
} from '@/schemas/workOrderStructureSchemas'

export const createWorkOrderStructureAction = protectedServerFunction({
  schema: createWorkOrderStructureSchema,
  functionName: 'Create work order structure action',
  serverFn: async ({data, logger, profile}) => {
    const target = await createTargetForType('WorkOrderStructure', profile.id)

    const structure = await prismaClient.workOrderStructure.create({
      data: {
        ...data,
        id: crypto.randomUUID(),
        createdBy: profile.id,
        createdAt: new Date(),
        targetId: target.id,
      },
    })

    logger.info(`Work order structure created: ${structure.id}`)
    revalidatePath(`/departments/project/project/${data.workOrderId}`)
  },
})

export const updateWorkOrderStructureAction = protectedServerFunction({
  schema: updateWorkOrderStructureSchema,
  functionName: 'Update work order structure action',
  serverFn: async ({data: {id, ...data}, logger}) => {
    await prismaClient.workOrderStructure.update({
      where: {id},
      data,
    })

    logger.info(`Work order structure updated: ${id}`)
    revalidatePath(`/departments/project/project/${data.workOrderId}`)
  },
})

export const softDeleteWorkOrderStructureAction = protectedServerFunction({
  schema: workOrderStructureIdSchema,
  functionName: 'Soft delete work order structure action',
  serverFn: async ({data: {id}, profile, logger}) => {
    const structure = await prismaClient.workOrderStructure.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
      select: {workOrderId: true},
    })

    logger.info(`Work order structure soft deleted: ${id}`)
    revalidatePath(`/departments/project/project/${structure.workOrderId}`)
  },
})

export const hardDeleteWorkOrderStructureAction = protectedServerFunction({
  schema: workOrderStructureIdSchema,
  functionName: 'Hard delete work order structure action',
  serverFn: async ({data: {id}, logger}) => {
    const structure = await prismaClient.workOrderStructure.findUniqueOrThrow({
      where: {id},
      select: {workOrderId: true},
    })
    await prismaClient.workOrderStructure.delete({where: {id}})
    logger.info(`Work order structure hard deleted: ${id}`)
    revalidatePath(`/departments/project/project/${structure.workOrderId}`)
  },
})

export const undeleteWorkOrderStructureAction = protectedServerFunction({
  schema: workOrderStructureIdSchema,
  functionName: 'Undelete work order structure action',
  serverFn: async ({data: {id}, logger}) => {
    const structure = await prismaClient.workOrderStructure.update({
      where: {id},
      data: {deleted: false},
      select: {workOrderId: true},
    })
    logger.info(`Work order structure undeleted: ${id}`)
    revalidatePath(`/departments/project/project/${structure.workOrderId}`)
  },
})
