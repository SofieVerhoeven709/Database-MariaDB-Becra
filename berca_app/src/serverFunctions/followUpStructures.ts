'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {
  createFollowUpStructureSchema,
  updateFollowUpStructureSchema,
  followUpStructureIdSchema,
} from '@/schemas/followUpStructureSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {createTargetForType} from '@/dal/targets'
import {upsertVisibilityRows} from '@/serverFunctions/visibilityForRoles'

// ─── Create ───────────────────────────────────────────────────────────────────

export const createFollowUpStructureAction = protectedServerFunction({
  schema: createFollowUpStructureSchema,
  functionName: 'Create follow-up structure action',
  serverFn: async ({data: {visibilityForRoles, documentId, ...data}, logger, profile}) => {
    logger.info(`Creating follow-up structure, createdBy: ${profile.id}`)

    const target = await createTargetForType('FollowUpStructure', profile.id)
    const structureId = crypto.randomUUID()
    const now = new Date()

    await prismaClient.followUpStructure.create({
      data: {
        ...data,
        id: structureId,
        createdBy: profile.id,
        createdAt: now,
        targetId: target.id,
        // documentId intentionally left as empty string until document module is implemented
        documentId: documentId ?? null,
      },
    })

    if (visibilityForRoles.length > 0) {
      await upsertVisibilityRows(target.id, visibilityForRoles)
    }

    logger.info(`Follow-up structure created: ${structureId} under follow-up: ${data.followUpId}`)
    revalidatePath('/followupstructures')
  },
})

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateFollowUpStructureAction = protectedServerFunction({
  schema: updateFollowUpStructureSchema,
  functionName: 'Update follow-up structure action',
  serverFn: async ({data: {id, visibilityForRoles, documentId, ...data}, logger}) => {
    const {targetId} = await prismaClient.followUpStructure.findUniqueOrThrow({
      where: {id},
      select: {targetId: true},
    })

    await Promise.all([
      prismaClient.followUpStructure.update({where: {id}, data}),
      upsertVisibilityRows(targetId, visibilityForRoles),
    ])

    logger.info(`Follow-up structure updated: ${id} with ${visibilityForRoles.length} visibility row(s)`)
    revalidatePath('/followupstructures')
  },
})

// ─── Soft delete ──────────────────────────────────────────────────────────────

export const softDeleteFollowUpStructureAction = protectedServerFunction({
  schema: followUpStructureIdSchema,
  functionName: 'Soft delete follow-up structure action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.followUpStructure.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Follow-up structure soft deleted: ${id}`)
    revalidatePath('/followupstructures')
  },
})

// ─── Hard delete ──────────────────────────────────────────────────────────────

export const hardDeleteFollowUpStructureAction = protectedServerFunction({
  schema: followUpStructureIdSchema,
  functionName: 'Hard delete follow-up structure action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.followUpStructure.delete({where: {id}})
    logger.info(`Follow-up structure hard deleted: ${id}`)
    revalidatePath('/followupstructures')
  },
})

// ─── Undelete ─────────────────────────────────────────────────────────────────

export const undeleteFollowUpStructureAction = protectedServerFunction({
  schema: followUpStructureIdSchema,
  functionName: 'Undelete follow-up structure action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.followUpStructure.update({
      where: {id},
      data: {deleted: false, deletedAt: null, deletedBy: null},
    })
    logger.info(`Follow-up structure undeleted: ${id}`)
    revalidatePath('/followupstructures')
  },
})
