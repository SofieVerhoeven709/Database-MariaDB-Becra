'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {createFollowUpSchema, updateFollowUpSchema, followUpIdSchema} from '@/schemas/followUpSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {createTargetForType} from '@/dal/targets'
import {upsertVisibilityRows} from '@/serverFunctions/visibilityForRoles'

// ─── Create ───────────────────────────────────────────────────────────────────

export const createFollowUpAction = protectedServerFunction({
  schema: createFollowUpSchema,
  functionName: 'Create follow-up action',
  serverFn: async ({data: {visibilityForRoles, followUpTargetId, documentId, ...data}, logger, profile}) => {
    logger.info(`Creating follow-up, createdBy: ${profile.id}`)

    const target = await createTargetForType('FollowUp', profile.id)
    const followUpId = crypto.randomUUID()
    const now = new Date()

    await prismaClient.followUp.create({
      data: {
        ...data,
        id: followUpId,
        createdBy: profile.id,
        createdAt: now,
        targetId: target.id,
        // documentId intentionally left null until document module is implemented
        documentId: documentId ?? null,
      },
    })

    // Link to target (what this follow-up is about)
    if (followUpTargetId) {
      await prismaClient.followUpTarget.create({
        data: {
          id: crypto.randomUUID(),
          followUpId,
          targetId: followUpTargetId,
        },
      })
    }

    if (visibilityForRoles.length > 0) {
      await upsertVisibilityRows(target.id, visibilityForRoles)
    }

    logger.info(`Follow-up created: ${followUpId}${followUpTargetId ? ` linked to target ${followUpTargetId}` : ''}`)
    revalidatePath('/followups')
  },
})

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateFollowUpAction = protectedServerFunction({
  schema: updateFollowUpSchema,
  functionName: 'Update follow-up action',
  serverFn: async ({data: {id, visibilityForRoles, documentId, ...data}, logger}) => {
    const {targetId} = await prismaClient.followUp.findUniqueOrThrow({
      where: {id},
      select: {targetId: true},
    })

    await Promise.all([
      prismaClient.followUp.update({where: {id}, data}),
      upsertVisibilityRows(targetId, visibilityForRoles),
    ])

    logger.info(`Follow-up updated: ${id} with ${visibilityForRoles.length} visibility row(s)`)
    revalidatePath('/followups')
  },
})

// ─── Soft delete ──────────────────────────────────────────────────────────────

export const softDeleteFollowUpAction = protectedServerFunction({
  schema: followUpIdSchema,
  functionName: 'Soft delete follow-up action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.followUp.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Follow-up soft deleted: ${id}`)
    revalidatePath('/followups')
  },
})

// ─── Hard delete ──────────────────────────────────────────────────────────────

export const hardDeleteFollowUpAction = protectedServerFunction({
  schema: followUpIdSchema,
  functionName: 'Hard delete follow-up action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.followUp.delete({where: {id}})
    logger.info(`Follow-up hard deleted: ${id}`)
    revalidatePath('/followups')
  },
})

// ─── Undelete ─────────────────────────────────────────────────────────────────

export const undeleteFollowUpAction = protectedServerFunction({
  schema: followUpIdSchema,
  functionName: 'Undelete follow-up action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.followUp.update({
      where: {id},
      data: {deleted: false, deletedAt: null, deletedBy: null},
    })
    logger.info(`Follow-up undeleted: ${id}`)
    revalidatePath('/followups')
  },
})
