'use server'
import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'
import {prismaClient} from '@/dal/prismaClient'
import {
  updateWorkOrderSchema,
  createWorkOrderSchema,
  workOrderIdSchema,
  createTimeRegistrySchema,
  createWorkOrderStructureSchema,
} from '@/schemas/workOrderSchemas'
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

// ─── Time Registry ────────────────────────────────────────────────────────────
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
    revalidatePath(`/departments/project/project/${data.workOrderId}`)
  },
})

// ─── Work Order Structure ─────────────────────────────────────────────────────
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
