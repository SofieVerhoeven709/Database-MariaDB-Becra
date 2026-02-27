'use server'
import {prismaClient} from '@/dal/prismaClient'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {revalidatePath} from 'next/cache'
import {upsertVisibilitySchema} from '@/schemas/visibilityForRoleSchemas'

export const upsertVisibilityForRoleAction = protectedServerFunction({
  schema: upsertVisibilitySchema,
  functionName: 'Upsert visibility for role action',
  serverFn: async ({data: {targetId, roleLevelId, visible, revalidate}, logger}) => {
    const existing = await prismaClient.visibilityForRole.findFirst({
      where: {targetId, roleLevelId},
    })

    if (existing) {
      await prismaClient.visibilityForRole.update({
        where: {id: existing.id},
        data: {visible},
      })
      logger.info(`VisibilityForRole updated: ${existing.id} visible=${visible}`)
    } else if (visible) {
      await prismaClient.visibilityForRole.create({
        data: {
          id: crypto.randomUUID(),
          targetId,
          roleLevelId,
          visible: true,
        },
      })
      logger.info(`VisibilityForRole created for targetId=${targetId} roleLevelId=${roleLevelId}`)
    }

    revalidatePath(revalidate)
  },
})
