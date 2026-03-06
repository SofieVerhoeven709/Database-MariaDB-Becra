'use server'
import {prismaClient} from '@/dal/prismaClient'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {revalidatePath} from 'next/cache'
import {upsertVisibilitySchema, bulkUpsertVisibilitySchema} from '@/schemas/visibilityForRoleSchemas'

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

export const bulkUpsertVisibilityForRoleAction = protectedServerFunction({
  schema: bulkUpsertVisibilitySchema,
  functionName: 'Bulk upsert visibility for role action',
  serverFn: async ({data: {targetId, rows, revalidate}, logger}) => {
    // Fetch all existing rows for this target in one query
    const existing = await prismaClient.visibilityForRole.findMany({
      where: {targetId},
      select: {id: true, roleLevelId: true, visible: true},
    })

    const toUpdate: {id: string; visible: boolean}[] = []
    const toCreate: {roleLevelId: string}[] = []

    for (const row of rows) {
      const found = existing.find(e => e.roleLevelId === row.roleLevelId)
      if (found) {
        // Only update if value actually changed
        if (found.visible !== row.visible) {
          toUpdate.push({id: found.id, visible: row.visible})
        }
      } else if (row.visible) {
        // Only create if visible=true; absence means hidden
        toCreate.push({roleLevelId: row.roleLevelId})
      }
    }

    await prismaClient.$transaction([
      ...toUpdate.map(u =>
        prismaClient.visibilityForRole.update({
          where: {id: u.id},
          data: {visible: u.visible},
        }),
      ),
      ...toCreate.map(c =>
        prismaClient.visibilityForRole.create({
          data: {
            id: crypto.randomUUID(),
            targetId,
            roleLevelId: c.roleLevelId,
            visible: true,
          },
        }),
      ),
    ])

    logger.info(
      `BulkUpsertVisibility: targetId=${targetId} updated=${toUpdate.length} created=${toCreate.length} skipped=${rows.length - toUpdate.length - toCreate.length}`,
    )

    revalidatePath(revalidate)
  },
})

// ─── Visibility helper (not exported — internal use only) ─────────────────────
export async function upsertVisibilityRows(targetId: string, rows: {roleLevelId: string; visible: boolean}[]) {
  await Promise.all(
    rows.map(async ({roleLevelId, visible}) => {
      const existing = await prismaClient.visibilityForRole.findFirst({
        where: {targetId, roleLevelId},
        select: {id: true},
      })
      if (existing) {
        await prismaClient.visibilityForRole.update({
          where: {id: existing.id},
          data: {visible},
        })
      } else if (visible) {
        // Only create a row when visible=true; absence means hidden
        await prismaClient.visibilityForRole.create({
          data: {id: crypto.randomUUID(), targetId, roleLevelId, visible: true},
        })
      }
    }),
  )
}
