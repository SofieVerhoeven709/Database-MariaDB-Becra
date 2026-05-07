'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'

import {protectedServerFunction} from '@/lib/serverFunctions'
import {createTargetForType} from '@/dal/targets'
import {createDepartmentSchema, updateDepartmentSchema, departmentIdSchema} from '@/schemas/departmentSchemas'

export const createDepartmentAction = protectedServerFunction({
  schema: createDepartmentSchema,
  functionName: 'Create department action',
  serverFn: async ({data, logger, profile}) => {
    // Create a target row to scope visibility for this department.
    const target = await createTargetForType('Department', profile.id)

    const department = await prismaClient.department.create({
      data: {
        ...data,
        id: crypto.randomUUID(),
        createdBy: profile.id,
        createdAt: new Date(),
        targetId: target.id,
      },
    })

    logger.info(`Department created: ${department.id}`)
    revalidatePath('/departments')
  },
})

export const updateDepartmentAction = protectedServerFunction({
  schema: updateDepartmentSchema,
  functionName: 'Update department action',
  serverFn: async ({data: {id, ...data}, logger}) => {
    await prismaClient.department.update({
      where: {id},
      data,
    })

    logger.info(`Department updated: ${id}`)
    revalidatePath('/departments')
  },
})

export const softDeleteDepartmentAction = protectedServerFunction({
  schema: departmentIdSchema,
  functionName: 'Soft delete department action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.department.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })

    logger.info(`Department soft deleted: ${id}`)
    revalidatePath('/departments')
  },
})

export const hardDeleteDepartmentAction = protectedServerFunction({
  schema: departmentIdSchema,
  functionName: 'Hard delete department action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.department.delete({where: {id}})
    logger.info(`Department hard deleted: ${id}`)
    revalidatePath('/departments')
  },
})

export const undeleteDepartmentAction = protectedServerFunction({
  schema: departmentIdSchema,
  functionName: 'Undelete department action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.department.update({
      where: {id},
      data: {deleted: false, deletedAt: null, deletedBy: null},
    })
    logger.info(`Department undeleted: ${id}`)
    revalidatePath('/departments')
  },
})
