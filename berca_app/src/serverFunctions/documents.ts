'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {
  createDocumentStructureSchema,
  updateDocumentStructureSchema,
  documentStructureIdSchema,
  createDocumentGroupASchema,
  updateDocumentGroupASchema,
  documentGroupAIdSchema,
  createDocumentGroupBSchema,
  updateDocumentGroupBSchema,
  documentGroupBIdSchema,
  createDocumentGroupCSchema,
  updateDocumentGroupCSchema,
  documentGroupCIdSchema,
  createDocumentGroupDSchema,
  updateDocumentGroupDSchema,
  documentGroupDIdSchema,
  createDocumentPlaceSchema,
  updateDocumentPlaceSchema,
  documentPlaceIdSchema,
} from '@/schemas/documentSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {createTargetForType} from '@/dal/targets'
import {upsertVisibilityRows} from '@/serverFunctions/visibilityForRoles'

const REVALIDATE = '/documents'

// ════════════════════════════════════════════════════════════════════════════
// DocumentStructure
// ════════════════════════════════════════════════════════════════════════════

export const createDocumentAction = protectedServerFunction({
  schema: createDocumentStructureSchema,
  functionName: 'Create document',
  serverFn: async ({data: {visibilityForRoles, ...data}, logger, profile}) => {
    logger.info(`Creating document, createdBy: ${profile.id}`)

    const target = await createTargetForType('DocumentStructure', profile.id)
    const id = crypto.randomUUID()

    await prismaClient.documentStructure.create({
      data: {
        ...data,
        id,
        createdBy: profile.id,
        createdAt: new Date(),
        targetId: target.id,
      },
    })

    if (visibilityForRoles.length > 0) {
      await upsertVisibilityRows(target.id, visibilityForRoles)
    }

    logger.info(`Document created: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const updateDocumentAction = protectedServerFunction({
  schema: updateDocumentStructureSchema,
  functionName: 'Update document',
  serverFn: async ({data: {id, visibilityForRoles, ...data}, logger}) => {
    const {targetId} = await prismaClient.documentStructure.findUniqueOrThrow({
      where: {id},
      select: {targetId: true},
    })


    // Fix: Only add DocumentStructure relation if referenceDocId is defined
    const { referenceDocId, ...restData } = data;
    let updateData = { ...restData };
    if (typeof referenceDocId !== 'undefined') {
      Object.assign(updateData, {
        DocumentStructure: referenceDocId
          ? { connect: { id: referenceDocId } }
          : { disconnect: true },
      });
    }

    await Promise.all([
      prismaClient.documentStructure.update({ where: { id }, data: updateData }),
      upsertVisibilityRows(targetId, visibilityForRoles),
    ]);

    logger.info(`Document updated: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const softDeleteDocumentAction = protectedServerFunction({
  schema: documentStructureIdSchema,
  functionName: 'Soft delete document',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.documentStructure.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Document soft deleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const hardDeleteDocumentAction = protectedServerFunction({
  schema: documentStructureIdSchema,
  functionName: 'Hard delete document',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.documentStructure.delete({where: {id}})
    logger.info(`Document hard deleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const undeleteDocumentAction = protectedServerFunction({
  schema: documentStructureIdSchema,
  functionName: 'Undelete document',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.documentStructure.update({
      where: {id},
      data: {deleted: false, deletedAt: null, deletedBy: null},
    })
    logger.info(`Document undeleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

// ════════════════════════════════════════════════════════════════════════════
// DocumentGroupA
// ════════════════════════════════════════════════════════════════════════════

export const createDocumentGroupAAction = protectedServerFunction({
  schema: createDocumentGroupASchema,
  functionName: 'Create document group A',
  serverFn: async ({data, profile, logger}) => {
    const id = crypto.randomUUID()
    await prismaClient.documentGroupA.create({
      data: {...data, id, createdBy: profile.id, createdAt: new Date()},
    })
    logger.info(`DocumentGroupA created: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const updateDocumentGroupAAction = protectedServerFunction({
  schema: updateDocumentGroupASchema,
  functionName: 'Update document group A',
  serverFn: async ({data: {id, ...data}, logger}) => {
    await prismaClient.documentGroupA.update({where: {id}, data})
    logger.info(`DocumentGroupA updated: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const softDeleteDocumentGroupAAction = protectedServerFunction({
  schema: documentGroupAIdSchema,
  functionName: 'Soft delete document group A',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.documentGroupA.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`DocumentGroupA soft deleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const hardDeleteDocumentGroupAAction = protectedServerFunction({
  schema: documentGroupAIdSchema,
  functionName: 'Hard delete document group A',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.documentGroupA.delete({where: {id}})
    logger.info(`DocumentGroupA hard deleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const undeleteDocumentGroupAAction = protectedServerFunction({
  schema: documentGroupAIdSchema,
  functionName: 'Undelete document group A',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.documentGroupA.update({
      where: {id},
      data: {deleted: false, deletedAt: null, deletedBy: null},
    })
    logger.info(`DocumentGroupA undeleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

// ════════════════════════════════════════════════════════════════════════════
// DocumentGroupB
// ════════════════════════════════════════════════════════════════════════════

export const createDocumentGroupBAction = protectedServerFunction({
  schema: createDocumentGroupBSchema,
  functionName: 'Create document group B',
  serverFn: async ({data, profile, logger}) => {
    const id = crypto.randomUUID()
    await prismaClient.documentGroupB.create({
      data: {...data, id, createdBy: profile.id, createdAt: new Date()},
    })
    logger.info(`DocumentGroupB created: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const updateDocumentGroupBAction = protectedServerFunction({
  schema: updateDocumentGroupBSchema,
  functionName: 'Update document group B',
  serverFn: async ({data: {id, ...data}, logger}) => {
    await prismaClient.documentGroupB.update({where: {id}, data})
    logger.info(`DocumentGroupB updated: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const softDeleteDocumentGroupBAction = protectedServerFunction({
  schema: documentGroupBIdSchema,
  functionName: 'Soft delete document group B',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.documentGroupB.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`DocumentGroupB soft deleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const hardDeleteDocumentGroupBAction = protectedServerFunction({
  schema: documentGroupBIdSchema,
  functionName: 'Hard delete document group B',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.documentGroupB.delete({where: {id}})
    logger.info(`DocumentGroupB hard deleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const undeleteDocumentGroupBAction = protectedServerFunction({
  schema: documentGroupBIdSchema,
  functionName: 'Undelete document group B',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.documentGroupB.update({
      where: {id},
      data: {deleted: false, deletedAt: null, deletedBy: null},
    })
    logger.info(`DocumentGroupB undeleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

// ════════════════════════════════════════════════════════════════════════════
// DocumentGroupC
// ════════════════════════════════════════════════════════════════════════════

export const createDocumentGroupCAction = protectedServerFunction({
  schema: createDocumentGroupCSchema,
  functionName: 'Create document group C',
  serverFn: async ({data, profile, logger}) => {
    const id = crypto.randomUUID()
    await prismaClient.documentGroupC.create({
      data: {...data, id, createdBy: profile.id, createdAt: new Date()},
    })
    logger.info(`DocumentGroupC created: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const updateDocumentGroupCAction = protectedServerFunction({
  schema: updateDocumentGroupCSchema,
  functionName: 'Update document group C',
  serverFn: async ({data: {id, ...data}, logger}) => {
    await prismaClient.documentGroupC.update({where: {id}, data})
    logger.info(`DocumentGroupC updated: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const softDeleteDocumentGroupCAction = protectedServerFunction({
  schema: documentGroupCIdSchema,
  functionName: 'Soft delete document group C',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.documentGroupC.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`DocumentGroupC soft deleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const hardDeleteDocumentGroupCAction = protectedServerFunction({
  schema: documentGroupCIdSchema,
  functionName: 'Hard delete document group C',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.documentGroupC.delete({where: {id}})
    logger.info(`DocumentGroupC hard deleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const undeleteDocumentGroupCAction = protectedServerFunction({
  schema: documentGroupCIdSchema,
  functionName: 'Undelete document group C',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.documentGroupC.update({
      where: {id},
      data: {deleted: false, deletedAt: null, deletedBy: null},
    })
    logger.info(`DocumentGroupC undeleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

// ════════════════════════════════════════════════════════════════════════════
// DocumentGroupD
// ════════════════════════════════════════════════════════════════════════════

export const createDocumentGroupDAction = protectedServerFunction({
  schema: createDocumentGroupDSchema,
  functionName: 'Create document group D',
  serverFn: async ({data, profile, logger}) => {
    const id = crypto.randomUUID()
    await prismaClient.documentGroupD.create({
      data: {...data, id, createdBy: profile.id, createdAt: new Date()},
    })
    logger.info(`DocumentGroupD created: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const updateDocumentGroupDAction = protectedServerFunction({
  schema: updateDocumentGroupDSchema,
  functionName: 'Update document group D',
  serverFn: async ({data: {id, ...data}, logger}) => {
    await prismaClient.documentGroupD.update({where: {id}, data})
    logger.info(`DocumentGroupD updated: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const softDeleteDocumentGroupDAction = protectedServerFunction({
  schema: documentGroupDIdSchema,
  functionName: 'Soft delete document group D',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.documentGroupD.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`DocumentGroupD soft deleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const hardDeleteDocumentGroupDAction = protectedServerFunction({
  schema: documentGroupDIdSchema,
  functionName: 'Hard delete document group D',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.documentGroupD.delete({where: {id}})
    logger.info(`DocumentGroupD hard deleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const undeleteDocumentGroupDAction = protectedServerFunction({
  schema: documentGroupDIdSchema,
  functionName: 'Undelete document group D',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.documentGroupD.update({
      where: {id},
      data: {deleted: false, deletedAt: null, deletedBy: null},
    })
    logger.info(`DocumentGroupD undeleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

// ════════════════════════════════════════════════════════════════════════════
// DocumentPlace
// ════════════════════════════════════════════════════════════════════════════

export const createDocumentPlaceAction = protectedServerFunction({
  schema: createDocumentPlaceSchema,
  functionName: 'Create document place',
  serverFn: async ({data, profile, logger}) => {
    const id = crypto.randomUUID()
    await prismaClient.documentPlace.create({
      data: {...data, id, createdBy: profile.id, createdAt: new Date()},
    })
    logger.info(`DocumentPlace created: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const updateDocumentPlaceAction = protectedServerFunction({
  schema: updateDocumentPlaceSchema,
  functionName: 'Update document place',
  serverFn: async ({data: {id, ...data}, logger}) => {
    await prismaClient.documentPlace.update({where: {id}, data})
    logger.info(`DocumentPlace updated: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const softDeleteDocumentPlaceAction = protectedServerFunction({
  schema: documentPlaceIdSchema,
  functionName: 'Soft delete document place',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.documentPlace.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`DocumentPlace soft deleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const hardDeleteDocumentPlaceAction = protectedServerFunction({
  schema: documentPlaceIdSchema,
  functionName: 'Hard delete document place',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.documentPlace.delete({where: {id}})
    logger.info(`DocumentPlace hard deleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const undeleteDocumentPlaceAction = protectedServerFunction({
  schema: documentPlaceIdSchema,
  functionName: 'Undelete document place',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.documentPlace.update({
      where: {id},
      data: {deleted: false, deletedAt: null, deletedBy: null},
    })
    logger.info(`DocumentPlace undeleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})
