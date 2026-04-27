'use server'
import {prismaClient} from '@/dal/prismaClient'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {revalidatePath} from 'next/cache'
import {
  upsertVisibilityDepartmentSchema,
  bulkUpsertVisibilityDepartmentSchema,
} from '@/schemas/visibilityForDepartmentSchemas'

export const upsertVisibilityForDepartmentAction = protectedServerFunction({
  schema: upsertVisibilityDepartmentSchema,
  functionName: 'Upsert visibility for department action',
  serverFn: async ({data: {targetId, departmentId, visible, revalidate}, logger}) => {
    const existing = await prismaClient.visibilityForDepartment.findFirst({
      where: {targetId, departmentId},
    })

    if (existing) {
      await prismaClient.visibilityForDepartment.update({
        where: {id: existing.id},
        data: {visible},
      })
      logger.info(`VisibilityForDepartment updated: ${existing.id} visible=${visible}`)
    } else if (visible) {
      await prismaClient.visibilityForDepartment.create({
        data: {
          id: crypto.randomUUID(),
          targetId,
          departmentId,
          visible: true,
        },
      })
      logger.info(`VisibilityForDepartment created for targetId=${targetId} departmentId=${departmentId}`)
    }

    revalidatePath(revalidate)
  },
})

export const bulkUpsertVisibilityForDepartmentAction = protectedServerFunction({
  schema: bulkUpsertVisibilityDepartmentSchema,
  functionName: 'Bulk upsert visibility for department action',
  serverFn: async ({data: {targetId, rows, revalidate}, logger}) => {
    const existing = await prismaClient.visibilityForDepartment.findMany({
      where: {targetId},
      select: {id: true, departmentId: true, visible: true},
    })

    const toUpdate: {id: string; visible: boolean}[] = []
    const toCreate: {departmentId: string}[] = []

    for (const row of rows) {
      const found = existing.find(e => e.departmentId === row.departmentId)
      if (found) {
        if (found.visible !== row.visible) {
          toUpdate.push({id: found.id, visible: row.visible})
        }
      } else if (row.visible) {
        toCreate.push({departmentId: row.departmentId})
      }
    }

    await prismaClient.$transaction([
      ...toUpdate.map(u =>
        prismaClient.visibilityForDepartment.update({
          where: {id: u.id},
          data: {visible: u.visible},
        }),
      ),
      ...toCreate.map(c =>
        prismaClient.visibilityForDepartment.create({
          data: {
            id: crypto.randomUUID(),
            targetId,
            departmentId: c.departmentId,
            visible: true,
          },
        }),
      ),
    ])

    logger.info(
      `BulkUpsertVisibilityDepartment: targetId=${targetId} updated=${toUpdate.length} created=${toCreate.length} skipped=${rows.length - toUpdate.length - toCreate.length}`,
    )

    revalidatePath(revalidate)
  },
})

// ─── Visibility helper (not exported — internal use only) ─────────────────────
export async function upsertVisibilityDepartmentRows(
  targetId: string,
  rows: {departmentId: string; visible: boolean}[],
) {
  await Promise.all(
    rows.map(async ({departmentId, visible}) => {
      const existing = await prismaClient.visibilityForDepartment.findFirst({
        where: {targetId, departmentId},
        select: {id: true},
      })
      if (existing) {
        await prismaClient.visibilityForDepartment.update({
          where: {id: existing.id},
          data: {visible},
        })
      } else if (visible) {
        await prismaClient.visibilityForDepartment.create({
          data: {id: crypto.randomUUID(), targetId, departmentId, visible: true},
        })
      }
    }),
  )
}
