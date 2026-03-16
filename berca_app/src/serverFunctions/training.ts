'use server'

import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {createTargetForType} from '@/dal/targets'
import {upsertVisibilityRows} from '@/serverFunctions/visibilityForRoles'
import {
  createCertificateTypeSchema,
  updateCertificateTypeSchema,
  certificateTypeIdSchema,
  createCertificateSchema,
  updateCertificateSchema,
  certificateIdSchema,
  createTrainingStandardSchema,
  updateTrainingStandardSchema,
  trainingStandardIdSchema,
  createTrainingSchema,
  updateTrainingSchema,
  trainingIdSchema,
  addTrainingContactSchema,
  updateTrainingContactSchema,
  trainingContactIdSchema,
} from '@/schemas/trainingSchemas'
import {generateTrainingNumber} from '@/lib/utils'

const revalidate = () => revalidatePath('/training')

// ─── Certificate Type ─────────────────────────────────────────────────────────

export const createCertificateTypeAction = protectedServerFunction({
  schema: createCertificateTypeSchema,
  functionName: 'Create certificate type action',
  serverFn: async ({data, profile, logger}) => {
    await prismaClient.certificateType.create({
      data: {id: crypto.randomUUID(), ...data, createdBy: profile.id, createdAt: new Date()},
    })
    logger.info('Certificate type created')
    revalidate()
  },
})

export const updateCertificateTypeAction = protectedServerFunction({
  schema: updateCertificateTypeSchema,
  functionName: 'Update certificate type action',
  serverFn: async ({data: {id, ...data}, logger}) => {
    await prismaClient.certificateType.update({where: {id}, data})
    logger.info(`Certificate type updated: ${id}`)
    revalidate()
  },
})

export const softDeleteCertificateTypeAction = protectedServerFunction({
  schema: certificateTypeIdSchema,
  functionName: 'Soft delete certificate type action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.certificateType.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Certificate type soft deleted: ${id}`)
    revalidate()
  },
})

export const hardDeleteCertificateTypeAction = protectedServerFunction({
  schema: certificateTypeIdSchema,
  functionName: 'Hard delete certificate type action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.certificateType.delete({where: {id}})
    logger.info(`Certificate type hard deleted: ${id}`)
    revalidate()
  },
})

export const undeleteCertificateTypeAction = protectedServerFunction({
  schema: certificateTypeIdSchema,
  functionName: 'Undelete certificate type action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.certificateType.update({where: {id}, data: {deleted: false, deletedAt: null, deletedBy: null}})
    logger.info(`Certificate type undeleted: ${id}`)
    revalidate()
  },
})

// ─── Certificate ──────────────────────────────────────────────────────────────

export const createCertificateAction = protectedServerFunction({
  schema: createCertificateSchema,
  functionName: 'Create certificate action',
  serverFn: async ({data: {visibilityForRoles, ...data}, profile, logger}) => {
    const target = await createTargetForType('Certificate', profile.id)
    await prismaClient.certificate.create({
      data: {id: crypto.randomUUID(), ...data, createdBy: profile.id, createdAt: new Date(), targetId: target.id},
    })
    if (visibilityForRoles.length > 0) await upsertVisibilityRows(target.id, visibilityForRoles)
    logger.info('Certificate created')
    revalidate()
  },
})

export const updateCertificateAction = protectedServerFunction({
  schema: updateCertificateSchema,
  functionName: 'Update certificate action',
  serverFn: async ({data: {id, visibilityForRoles, ...data}, logger}) => {
    const {targetId} = await prismaClient.certificate.findUniqueOrThrow({where: {id}, select: {targetId: true}})
    await Promise.all([
      prismaClient.certificate.update({where: {id}, data}),
      upsertVisibilityRows(targetId, visibilityForRoles),
    ])
    logger.info(`Certificate updated: ${id}`)
    revalidate()
  },
})

export const softDeleteCertificateAction = protectedServerFunction({
  schema: certificateIdSchema,
  functionName: 'Soft delete certificate action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.certificate.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Certificate soft deleted: ${id}`)
    revalidate()
  },
})

export const hardDeleteCertificateAction = protectedServerFunction({
  schema: certificateIdSchema,
  functionName: 'Hard delete certificate action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.certificate.delete({where: {id}})
    logger.info(`Certificate hard deleted: ${id}`)
    revalidate()
  },
})

export const undeleteCertificateAction = protectedServerFunction({
  schema: certificateIdSchema,
  functionName: 'Undelete certificate action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.certificate.update({where: {id}, data: {deleted: false, deletedAt: null, deletedBy: null}})
    logger.info(`Certificate undeleted: ${id}`)
    revalidate()
  },
})

// ─── Training Standard ────────────────────────────────────────────────────────

export const createTrainingStandardAction = protectedServerFunction({
  schema: createTrainingStandardSchema,
  functionName: 'Create training standard action',
  serverFn: async ({data: {visibilityForRoles, ...data}, profile, logger}) => {
    const target = await createTargetForType('TrainingStandard', profile.id)
    await prismaClient.trainingStandard.create({
      data: {id: crypto.randomUUID(), ...data, createdBy: profile.id, createdAt: new Date(), targetId: target.id},
    })
    if (visibilityForRoles.length > 0) await upsertVisibilityRows(target.id, visibilityForRoles)
    logger.info('Training standard created')
    revalidate()
  },
})

export const updateTrainingStandardAction = protectedServerFunction({
  schema: updateTrainingStandardSchema,
  functionName: 'Update training standard action',
  serverFn: async ({data: {id, visibilityForRoles, ...data}, logger}) => {
    const {targetId} = await prismaClient.trainingStandard.findUniqueOrThrow({where: {id}, select: {targetId: true}})
    await Promise.all([
      prismaClient.trainingStandard.update({where: {id}, data}),
      upsertVisibilityRows(targetId, visibilityForRoles),
    ])
    logger.info(`Training standard updated: ${id}`)
    revalidate()
  },
})

export const softDeleteTrainingStandardAction = protectedServerFunction({
  schema: trainingStandardIdSchema,
  functionName: 'Soft delete training standard action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.trainingStandard.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Training standard soft deleted: ${id}`)
    revalidate()
  },
})

export const hardDeleteTrainingStandardAction = protectedServerFunction({
  schema: trainingStandardIdSchema,
  functionName: 'Hard delete training standard action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.trainingStandard.delete({where: {id}})
    logger.info(`Training standard hard deleted: ${id}`)
    revalidate()
  },
})

export const undeleteTrainingStandardAction = protectedServerFunction({
  schema: trainingStandardIdSchema,
  functionName: 'Undelete training standard action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.trainingStandard.update({where: {id}, data: {deleted: false, deletedAt: null, deletedBy: null}})
    logger.info(`Training standard undeleted: ${id}`)
    revalidate()
  },
})

// ─── Training ─────────────────────────────────────────────────────────────────

export const createTrainingAction = protectedServerFunction({
  schema: createTrainingSchema,
  functionName: 'Create training action',
  serverFn: async ({data: {visibilityForRoles, ...data}, profile, logger}) => {
    const target = await createTargetForType('Training', profile.id)
    const trainingId = crypto.randomUUID()
    const now = new Date()

    let trainingNumber = data.trainingNumber || generateTrainingNumber()
    let attempts = 0

    while (attempts < 5) {
      try {
        await prismaClient.training.create({
          data: {
            ...data,
            trainingNumber,
            id: trainingId,
            createdBy: profile.id,
            createdAt: now,
            targetId: target.id,
          },
        })
        break
      } catch (err: unknown) {
        const prismaErr = err as {code?: string}
        if (prismaErr.code === 'P2002') {
          attempts++
          trainingNumber = generateTrainingNumber()
          continue
        }
        throw err
      }
    }

    if (attempts >= 5) throw new Error('Failed to generate a unique training number after 5 attempts')

    if (visibilityForRoles.length > 0) await upsertVisibilityRows(target.id, visibilityForRoles)

    logger.info(`Training created: ${trainingId} with number ${trainingNumber}`)
    revalidate()
  },
})

export const updateTrainingAction = protectedServerFunction({
  schema: updateTrainingSchema,
  functionName: 'Update training action',
  serverFn: async ({data: {id, visibilityForRoles, ...data}, logger}) => {
    const {targetId} = await prismaClient.training.findUniqueOrThrow({where: {id}, select: {targetId: true}})
    await Promise.all([
      prismaClient.training.update({where: {id}, data}),
      upsertVisibilityRows(targetId, visibilityForRoles),
    ])
    logger.info(`Training updated: ${id}`)
    revalidate()
  },
})

export const softDeleteTrainingAction = protectedServerFunction({
  schema: trainingIdSchema,
  functionName: 'Soft delete training action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.training.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Training soft deleted: ${id}`)
    revalidate()
  },
})

export const hardDeleteTrainingAction = protectedServerFunction({
  schema: trainingIdSchema,
  functionName: 'Hard delete training action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.training.delete({where: {id}})
    logger.info(`Training hard deleted: ${id}`)
    revalidate()
  },
})

export const undeleteTrainingAction = protectedServerFunction({
  schema: trainingIdSchema,
  functionName: 'Undelete training action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.training.update({where: {id}, data: {deleted: false, deletedAt: null, deletedBy: null}})
    logger.info(`Training undeleted: ${id}`)
    revalidate()
  },
})

// ─── Training Contact ─────────────────────────────────────────────────────────

export const addTrainingContactAction = protectedServerFunction({
  schema: addTrainingContactSchema,
  functionName: 'Add training contact action',
  serverFn: async ({data, profile, logger}) => {
    await prismaClient.trainingContact.create({
      data: {
        id: crypto.randomUUID(),
        contactId: data.contactId,
        trainingId: data.trainingId,
        attendeeNumber: data.attendeeNumber ?? null,
        succeeded: data.succeeded ?? false,
        attended: data.attended ?? false,
        certificateSent: data.certificateSent ?? false,
        certSentDate: data.certSentDate ?? null,
        createdBy: profile.id,
        createdAt: new Date(),
      },
    })
    logger.info(`Training contact added: contact ${data.contactId} → training ${data.trainingId}`)
    revalidate()
  },
})

export const updateTrainingContactAction = protectedServerFunction({
  schema: updateTrainingContactSchema,
  functionName: 'Update training contact action',
  serverFn: async ({data: {id, ...data}, logger}) => {
    await prismaClient.trainingContact.update({
      where: {id},
      data: {
        attendeeNumber: data.attendeeNumber ?? null,
        succeeded: data.succeeded,
        attended: data.attended,
        certificateSent: data.certificateSent,
        certSentDate: data.certSentDate ?? null,
      },
    })
    logger.info(`Training contact updated: ${id}`)
    revalidate()
  },
})

export const softDeleteTrainingContactAction = protectedServerFunction({
  schema: trainingContactIdSchema,
  functionName: 'Soft delete training contact action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.trainingContact.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Training contact soft deleted: ${id}`)
    revalidate()
  },
})

export const hardDeleteTrainingContactAction = protectedServerFunction({
  schema: trainingContactIdSchema,
  functionName: 'Hard delete training contact action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.trainingContact.delete({where: {id}})
    logger.info(`Training contact hard deleted: ${id}`)
    revalidate()
  },
})

export const undeleteTrainingContactAction = protectedServerFunction({
  schema: trainingContactIdSchema,
  functionName: 'Undelete training contact action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.trainingContact.update({
      where: {id},
      data: {deleted: false, deletedAt: null, deletedBy: null},
    })
    logger.info(`Training contact undeleted: ${id}`)
    revalidate()
  },
})
