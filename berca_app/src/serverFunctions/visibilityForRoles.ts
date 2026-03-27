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
    // Fetch always-visible role levels (Administrator + Management)
    const alwaysVisibleRoleLevels = await prismaClient.roleLevel.findMany({
      where: {
        Role: {name: {in: ['Administrator Role', 'Management Role']}},
        deleted: false,
      },
      select: {id: true},
    })

    const alwaysVisibleIds = new Set(alwaysVisibleRoleLevels.map(r => r.id))

    // Merge rows: filter out always-visible from user rows, then add them forced to true
    const mergedRows = [
      ...rows.filter(r => !alwaysVisibleIds.has(r.roleLevelId)),
      ...[...alwaysVisibleIds].map(id => ({roleLevelId: id, visible: true})),
    ]

    // Fetch all existing rows for this target in one query
    const existing = await prismaClient.visibilityForRole.findMany({
      where: {targetId},
      select: {id: true, roleLevelId: true, visible: true},
    })

    const toUpdate: {id: string; visible: boolean}[] = []
    const toCreate: {roleLevelId: string}[] = []

    for (const row of mergedRows) {
      const found = existing.find(e => e.roleLevelId === row.roleLevelId)
      if (found) {
        if (found.visible !== row.visible) {
          toUpdate.push({id: found.id, visible: row.visible})
        }
      } else if (row.visible) {
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
  // Fetch Management and Administrator role levels to force visible=true
  const alwaysVisibleRoleLevels = await prismaClient.roleLevel.findMany({
    where: {
      Role: {
        name: {in: ['Administrator Role', 'Management Role']},
      },
      deleted: false,
    },
    select: {id: true},
  })

  const alwaysVisibleIds = new Set(alwaysVisibleRoleLevels.map(r => r.id))

  // Merge: force visible=true for always-visible roles, keep rows as-is for others
  const mergedRows = [
    ...rows.filter(r => !alwaysVisibleIds.has(r.roleLevelId)),
    ...[...alwaysVisibleIds].map(id => ({roleLevelId: id, visible: true})),
  ]

  await Promise.all(
    mergedRows.map(async ({roleLevelId, visible}) => {
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
        await prismaClient.visibilityForRole.create({
          data: {id: crypto.randomUUID(), targetId, roleLevelId, visible: true},
        })
      }
    }),
  )
}
