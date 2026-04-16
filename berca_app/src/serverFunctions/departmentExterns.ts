'use server'

import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {createTargetForType} from '@/dal/targets'
import {
  createDepartmentExternSchema,
  updateDepartmentExternSchema,
  departmentExternIdSchema,
} from '@/schemas/departmentExternSchemas'

const revalidate = () => revalidatePath('/contacts')

const _createDepartmentExternAction = protectedServerFunction({
  schema: createDepartmentExternSchema,
  functionName: 'Create external department action',
  serverFn: async ({data, profile, logger}) => {
    const target = await createTargetForType('DepartmentExtern', profile.id)
    await prismaClient.departmentExtern.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name,
        createdBy: profile.id,
        createdAt: new Date(),
        targetId: target.id,
      },
    })
    logger.info('External department created')
    revalidate()
  },
})

export async function createDepartmentExternAction(data: {name: string}): Promise<{id: string; name: string}> {
  await _createDepartmentExternAction(data)
  return prismaClient.departmentExtern.findFirstOrThrow({
    where: {name: data.name},
    orderBy: {createdAt: 'desc'},
    select: {id: true, name: true},
  })
}

export const updateDepartmentExternAction = protectedServerFunction({
  schema: updateDepartmentExternSchema,
  functionName: 'Update external department action',
  serverFn: async ({data: {id, name}, logger}) => {
    await prismaClient.departmentExtern.update({where: {id}, data: {name}})
    logger.info(`External department updated: ${id}`)
    revalidate()
  },
})

export const softDeleteDepartmentExternAction = protectedServerFunction({
  schema: departmentExternIdSchema,
  functionName: 'Soft delete external department action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.departmentExtern.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`External department soft deleted: ${id}`)
    revalidate()
  },
})

export const hardDeleteDepartmentExternAction = protectedServerFunction({
  schema: departmentExternIdSchema,
  functionName: 'Hard delete external department action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.departmentExtern.delete({where: {id}})
    logger.info(`External department hard deleted: ${id}`)
    revalidate()
  },
})

export const undeleteDepartmentExternAction = protectedServerFunction({
  schema: departmentExternIdSchema,
  functionName: 'Undelete external department action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.departmentExtern.update({where: {id}, data: {deleted: false, deletedAt: null, deletedBy: null}})
    logger.info(`External department undeleted: ${id}`)
    revalidate()
  },
})
