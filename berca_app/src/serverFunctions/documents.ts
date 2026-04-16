'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {
  createDocumentStructureSchema,
  updateDocumentStructureSchema,
  documentStructureIdSchema,
  copyDocumentStructureSchema,
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
  createDocumentGroupSchema,
  updateDocumentGroupSchema,
  documentGroupIdSchema,
  createDocumentPlaceSchema,
  updateDocumentPlaceSchema,
  documentPlaceIdSchema,
  createDocumentStatusSchema,
  updateDocumentStatusSchema,
  documentStatusIdSchema,
  createDocumentRevisionSchema,
  updateDocumentRevisionSchema,
  documentRevisionIdSchema,
} from '@/schemas/documentSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {createTargetForType} from '@/dal/targets'
import {upsertVisibilityRows} from '@/serverFunctions/visibilityForRoles'
import {generateDocumentNumber} from '@/lib/utils'

const REVALIDATE = '/documents'

// ════════════════════════════════════════════════════════════════════════════
// DocumentStructure
// ════════════════════════════════════════════════════════════════════════════

export const createDocumentAction = protectedServerFunction({
  schema: createDocumentStructureSchema,
  functionName: 'Create document',
  serverFn: async ({
    data: {visibilityForRoles, documentTargetId, documentTargetTypeName, targetAssignments, ...data},
    logger,
    profile,
  }) => {
    logger.info(`Creating document, createdBy: ${profile.id}`)

    const target = await createTargetForType('DocumentStructure', profile.id)
    const id = crypto.randomUUID()
    const now = new Date()

    // Retry loop for unique document number
    let documentNumber = data.documentNumber
    let attempts = 0

    while (attempts < 5) {
      try {
        await prismaClient.$transaction(async tx => {
          await tx.documentStructure.create({
            data: {...data, documentNumber, id, createdBy: profile.id, createdAt: now, targetId: target.id},
          })

          // Link all selected targets (explicit + primary) in the same transaction.
          const allAssignments = [
            ...(targetAssignments ?? []),
            ...(documentTargetId ? [{targetId: documentTargetId}] : []),
          ]
          if (allAssignments.length > 0) {
            await Promise.all(
              allAssignments.map(a =>
                tx.documentStructureTarget.create({
                  data: {id: crypto.randomUUID(), documentStructureId: id, targetId: a.targetId},
                }),
              ),
            )
          }
        })
        break
      } catch (err: unknown) {
        const prismaErr = err as {code?: string}
        if (prismaErr.code === 'P2002') {
          // Collision on unique documentNumber; regenerate and retry.
          attempts++
          documentNumber = generateDocumentNumber()
          continue
        }
        throw err
      }
    }

    if (attempts >= 5) throw new Error('Failed to generate a unique document number after 5 attempts')

    if (visibilityForRoles.length > 0) {
      // Apply default visibility rows after the document + target exist.
      await upsertVisibilityRows(target.id, visibilityForRoles)
    }

    logger.info(`Document created: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const updateDocumentAction = protectedServerFunction({
  schema: updateDocumentStructureSchema,
  functionName: 'Update document',
  serverFn: async ({data: {id, visibilityForRoles, targetAssignments, ...data}, logger}) => {
    const {targetId} = await prismaClient.documentStructure.findUniqueOrThrow({
      where: {id},
      select: {targetId: true},
    })

    // Only touch referenceDocId when it is provided by the form.
    const {referenceDocId, ...restData} = data
    let updateData = {...restData}
    if (typeof referenceDocId !== 'undefined') {
      Object.assign(updateData, {
        DocumentStructure: referenceDocId ? {connect: {id: referenceDocId}} : {disconnect: true},
      })
    }

    await Promise.all([
      prismaClient.documentStructure.update({
        where: {id},
        data: {
          ...data,
          revisedById: data.revisedById ?? null,
          managedById: data.managedById ?? null,
        },
      }),
      // Replace visibility rows for the target linked to this document.
      upsertVisibilityRows(targetId, visibilityForRoles),
    ])

    if (targetAssignments && targetAssignments.length > 0) {
      // Add only missing target links (keeps existing links intact).
      for (const a of targetAssignments) {
        const exists = await prismaClient.documentStructureTarget.findFirst({
          where: {documentStructureId: id, targetId: a.targetId},
        })
        if (!exists) {
          await prismaClient.documentStructureTarget.create({
            data: {id: crypto.randomUUID(), documentStructureId: id, targetId: a.targetId},
          })
        }
      }
    }

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

export const copyDocumentAction = protectedServerFunction({
  schema: copyDocumentStructureSchema,
  functionName: 'Copy document',
  serverFn: async ({data: {sourceId, documentNumber, descriptionShort}, profile, logger}) => {
    const source = await prismaClient.documentStructure.findUniqueOrThrow({
      where: {id: sourceId},
      select: {
        description: true,
        expiryDate: true,
        revisionNumber: true,
        revisionDetail: true,
        valid: true,
        process: true,
        canCopy: true,
        additionalInfo: true,
        referenceDocId: true,
        revisedById: true,
        managedById: true,
        documentGroupId: true,
        documentPlaceId: true,
        documentStatusId: true,
      },
    })

    if (!source.canCopy) throw new Error('This document is not marked as copyable')

    const target = await createTargetForType('DocumentStructure', profile.id)
    const id = crypto.randomUUID()

    await prismaClient.documentStructure.create({
      data: {
        ...source,
        id,
        documentNumber,
        descriptionShort,
        createdBy: profile.id,
        createdAt: new Date(),
        targetId: target.id,
        // Reset revision + deletion metadata for the new copy.
        revisionNumber: null,
        revisionDetail: null,
        deleted: false,
        deletedAt: null,
        deletedBy: null,
      },
    })

    logger.info(`Document copied from ${sourceId} to ${id}`)
    revalidatePath(REVALIDATE)
  },
})

// ════════════════════════════════════════════════════════════════════════════
// DocumentRevision
// ════════════════════════════════════════════════════════════════════════════

export const createDocumentRevisionAction = protectedServerFunction({
  schema: createDocumentRevisionSchema,
  functionName: 'Create document revision',
  serverFn: async ({data, profile, logger}) => {
    const id = crypto.randomUUID()
    await prismaClient.documentRevision.create({
      data: {...data, id, createdBy: profile.id, createdAt: new Date()},
    })
    logger.info(`DocumentRevision created: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const updateDocumentRevisionAction = protectedServerFunction({
  schema: updateDocumentRevisionSchema,
  functionName: 'Update document revision',
  serverFn: async ({data: {id, ...data}, logger}) => {
    await prismaClient.documentRevision.update({where: {id}, data})
    logger.info(`DocumentRevision updated: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const softDeleteDocumentRevisionAction = protectedServerFunction({
  schema: documentRevisionIdSchema,
  functionName: 'Soft delete document revision',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.documentRevision.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`DocumentRevision soft deleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const hardDeleteDocumentRevisionAction = protectedServerFunction({
  schema: documentRevisionIdSchema,
  functionName: 'Hard delete document revision',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.documentRevision.delete({where: {id}})
    logger.info(`DocumentRevision hard deleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const undeleteDocumentRevisionAction = protectedServerFunction({
  schema: documentRevisionIdSchema,
  functionName: 'Undelete document revision',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.documentRevision.update({
      where: {id},
      data: {deleted: false, deletedAt: null, deletedBy: null},
    })
    logger.info(`DocumentRevision undeleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

// ════════════════════════════════════════════════════════════════════════════
// DocumentGroup (junction A+B+C+D)
// ════════════════════════════════════════════════════════════════════════════

export const createDocumentGroupAction = protectedServerFunction({
  schema: createDocumentGroupSchema,
  functionName: 'Create document group',
  serverFn: async ({data, logger}) => {
    const id = crypto.randomUUID()
    await prismaClient.documentGroup.create({data: {...data, id}})
    logger.info(`DocumentGroup created: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const updateDocumentGroupAction = protectedServerFunction({
  schema: updateDocumentGroupSchema,
  functionName: 'Update document group',
  serverFn: async ({data: {id, ...data}, logger}) => {
    await prismaClient.documentGroup.update({where: {id}, data})
    logger.info(`DocumentGroup updated: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const deleteDocumentGroupAction = protectedServerFunction({
  schema: documentGroupIdSchema,
  functionName: 'Delete document group',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.documentGroup.delete({where: {id}})
    logger.info(`DocumentGroup deleted: ${id}`)
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
    await prismaClient.documentGroupA.create({data: {...data, id, createdBy: profile.id, createdAt: new Date()}})
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
    await prismaClient.documentGroupA.update({where: {id}, data: {deleted: false, deletedAt: null, deletedBy: null}})
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
    await prismaClient.documentGroupB.create({data: {...data, id, createdBy: profile.id, createdAt: new Date()}})
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
    await prismaClient.documentGroupB.update({where: {id}, data: {deleted: false, deletedAt: null, deletedBy: null}})
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
    await prismaClient.documentGroupC.create({data: {...data, id, createdBy: profile.id, createdAt: new Date()}})
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
    await prismaClient.documentGroupC.update({where: {id}, data: {deleted: false, deletedAt: null, deletedBy: null}})
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
    await prismaClient.documentGroupD.create({data: {...data, id, createdBy: profile.id, createdAt: new Date()}})
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
    await prismaClient.documentGroupD.update({where: {id}, data: {deleted: false, deletedAt: null, deletedBy: null}})
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
    await prismaClient.documentPlace.create({data: {...data, id, createdBy: profile.id, createdAt: new Date()}})
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
    await prismaClient.documentPlace.update({where: {id}, data: {deleted: false, deletedAt: null, deletedBy: null}})
    logger.info(`DocumentPlace undeleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

// ════════════════════════════════════════════════════════════════════════════
// DocumentStatus
// ════════════════════════════════════════════════════════════════════════════

export const createDocumentStatusAction = protectedServerFunction({
  schema: createDocumentStatusSchema,
  functionName: 'Create document status',
  serverFn: async ({data, profile, logger}) => {
    const id = crypto.randomUUID()
    await prismaClient.documentStatus.create({data: {...data, id, createdBy: profile.id, createdAt: new Date()}})
    logger.info(`DocumentStatus created: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const updateDocumentStatusAction = protectedServerFunction({
  schema: updateDocumentStatusSchema,
  functionName: 'Update document status',
  serverFn: async ({data: {id, ...data}, logger}) => {
    await prismaClient.documentStatus.update({where: {id}, data})
    logger.info(`DocumentStatus updated: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const softDeleteDocumentStatusAction = protectedServerFunction({
  schema: documentStatusIdSchema,
  functionName: 'Soft delete document status',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.documentStatus.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`DocumentStatus soft deleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const hardDeleteDocumentStatusAction = protectedServerFunction({
  schema: documentStatusIdSchema,
  functionName: 'Hard delete document status',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.documentStatus.delete({where: {id}})
    logger.info(`DocumentStatus hard deleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})

export const undeleteDocumentStatusAction = protectedServerFunction({
  schema: documentStatusIdSchema,
  functionName: 'Undelete document status',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.documentStatus.update({where: {id}, data: {deleted: false, deletedAt: null, deletedBy: null}})
    logger.info(`DocumentStatus undeleted: ${id}`)
    revalidatePath(REVALIDATE)
  },
})
