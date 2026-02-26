'use server'
import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'
import {prismaClient} from '@/dal/prismaClient'
import {updateWorkOrderSchema, createWorkOrderSchema, workOrderIdSchema} from '@/schemas/workOrderSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {createTargetForType} from '@/dal/targets'
import type {Route} from 'next'
import {generateWorkOrderNumber} from '@/lib/utils'

export const createWorkOrderAction = protectedServerFunction({
  schema: createWorkOrderSchema,
  functionName: 'Create work order action',
  serverFn: async ({data, logger, profile}) => {
    logger.info(`Creating work order for project: ${data.projectId}`)

    const target = await createTargetForType('WorkOrder', profile.id)

    let workOrderNumber = data.workOrderNumber || generateWorkOrderNumber()

    let attempts = 0
    let workOrder

    while (attempts < 5) {
      try {
        workOrder = await prismaClient.workOrder.create({
          data: {
            ...data,
            workOrderNumber,
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
          workOrderNumber = generateWorkOrderNumber()
          continue
        }
        throw err
      }
    }

    if (!workOrder) {
      throw new Error('Failed to generate unique work order number')
    }

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
