'use server'

import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {createFunctionSchema, updateFunctionSchema, functionIdSchema} from '@/schemas/functionSchemas'

const revalidate = () => revalidatePath('/contacts')

const _createFunctionAction = protectedServerFunction({
  schema: createFunctionSchema,
  functionName: 'Create function action',
  serverFn: async ({data, profile, logger}) => {
    await prismaClient.function.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name,
        createdBy: profile.id,
        createdAt: new Date(),
      },
    })
    logger.info('Function created')
    revalidate()
  },
})

export async function createFunctionAction(data: {name: string}): Promise<{id: string; name: string}> {
  await _createFunctionAction(data)
  return prismaClient.function.findFirstOrThrow({
    where: {name: data.name},
    orderBy: {createdAt: 'desc'},
    select: {id: true, name: true},
  })
}

export const updateFunctionAction = protectedServerFunction({
  schema: updateFunctionSchema,
  functionName: 'Update function action',
  serverFn: async ({data: {id, name}, logger}) => {
    await prismaClient.function.update({where: {id}, data: {name}})
    logger.info(`Function updated: ${id}`)
    revalidate()
  },
})

export const softDeleteFunctionAction = protectedServerFunction({
  schema: functionIdSchema,
  functionName: 'Soft delete function action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.function.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Function soft deleted: ${id}`)
    revalidate()
  },
})

export const hardDeleteFunctionAction = protectedServerFunction({
  schema: functionIdSchema,
  functionName: 'Hard delete function action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.function.delete({where: {id}})
    logger.info(`Function hard deleted: ${id}`)
    revalidate()
  },
})

export const undeleteFunctionAction = protectedServerFunction({
  schema: functionIdSchema,
  functionName: 'Undelete function action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.function.update({where: {id}, data: {deleted: false, deletedAt: null, deletedBy: null}})
    logger.info(`Function undeleted: ${id}`)
    revalidate()
  },
})
