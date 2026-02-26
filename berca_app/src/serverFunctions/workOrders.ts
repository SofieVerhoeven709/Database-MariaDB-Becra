'use server'
import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'
import {prismaClient} from '@/dal/prismaClient'
import {updateWorkOrderSchema, createWorkOrderSchema, workOrderIdSchema} from '@/schemas/workOrderSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {createTargetForType} from '@/dal/targets'
import type {Route} from 'next'

export const createWorkOrderAction = protectedServerFunction({
  schema: createWorkOrderSchema,
  functionName: 'Create work order action',
  serverFn: async ({data, logger, profile}) => {
    logger.info(`Creating work order for project: ${data.projectId}`)

    const target = await createTargetForType('WorkOrder', profile.id)

    const workOrder = await prismaClient.workOrder.create({
      data: {
        ...data,
        id: crypto.randomUUID(),
        createdBy: profile.id,
        createdAt: new Date(),
        targetId: target.id,
      },
    })

    logger.info(`Work order created: ${workOrder.id}`)
    redirect(`/departments/project/project/${data.projectId}/workOrder/${workOrder.id}` as Route)
  },
})

export const updateWorkOrderAction = protectedServerFunction({
  schema: updateWorkOrderSchema,
  functionName: 'Update work order action',
  serverFn: async ({data: {id, ...data}, logger}) => {
    await prismaClient.workOrder.update({
      where: {id},
      data,
    })

    logger.info(`Work order updated: ${id}`)
    revalidatePath(`/departments/project/project/${data.projectId}/workOrder/${id}`)
  },
})

export const softDeleteWorkOrderAction = protectedServerFunction({
  schema: workOrderIdSchema,
  functionName: 'Soft delete work order action',
  serverFn: async ({data: {id}, profile, logger}) => {
    const wo = await prismaClient.workOrder.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
      select: {projectId: true},
    })

    logger.info(`Work order soft deleted: ${id}`)
    revalidatePath(`/departments/project/project/${wo.projectId}`)
  },
})

export const hardDeleteWorkOrderAction = protectedServerFunction({
  schema: workOrderIdSchema,
  functionName: 'Hard delete work order action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.workOrder.delete({where: {id}})

    logger.info(`Work order hard deleted: ${id}`)
  },
})
