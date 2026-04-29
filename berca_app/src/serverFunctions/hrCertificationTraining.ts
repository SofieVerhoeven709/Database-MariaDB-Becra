'use server'

import {revalidatePath} from 'next/cache'
import {
  createHrAbsence,
  createHrCertificationTraining,
  softDeleteHrAbsence,
  softDeleteHrCertificationTraining,
  updateHrAbsence,
  updateHrCertificationTraining,
} from '@/dal/hrCertificationTraining'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {
  createHrAbsenceSchema,
  createHrCertificationTrainingSchema,
  hrAbsenceIdSchema,
  hrCertificationTrainingIdSchema,
  updateHrAbsenceSchema,
  updateHrCertificationTrainingSchema,
} from '@/schemas/hrCertificationTrainingSchemas'

function revalidateHrCertificationTrainingViews(departmentId: string) {
  revalidatePath(`/departments/${departmentId}/certificationTraining`)
}

export const createHrCertificationTrainingAction = protectedServerFunction({
  schema: createHrCertificationTrainingSchema,
  functionName: 'Create HR certification training',
  serverFn: async ({data, profile, logger}) => {
    const {departmentId, ...certificationData} = data

    await createHrCertificationTraining({...certificationData, profileId: profile.id})

    logger.info(`HR certification training created for employee ${data.employeeId}`)
    revalidateHrCertificationTrainingViews(departmentId)
  },
})

export const updateHrCertificationTrainingAction = protectedServerFunction({
  schema: updateHrCertificationTrainingSchema,
  functionName: 'Update HR certification training',
  serverFn: async ({data, profile, logger}) => {
    const {id, departmentId, ...certificationData} = data

    await updateHrCertificationTraining(id, {...certificationData, profileId: profile.id})

    logger.info(`HR certification training updated: ${id}`)
    revalidateHrCertificationTrainingViews(departmentId)
  },
})

export const deleteHrCertificationTrainingAction = protectedServerFunction({
  schema: hrCertificationTrainingIdSchema,
  functionName: 'Delete HR certification training',
  serverFn: async ({data, profile, logger}) => {
    await softDeleteHrCertificationTraining(data.id, profile.id)

    logger.info(`HR certification training deleted: ${data.id}`)
    revalidateHrCertificationTrainingViews(data.departmentId)
  },
})

export const createHrAbsenceAction = protectedServerFunction({
  schema: createHrAbsenceSchema,
  functionName: 'Create HR absence',
  serverFn: async ({data, profile, logger}) => {
    const {departmentId, ...absenceData} = data

    await createHrAbsence({...absenceData, profileId: profile.id})

    logger.info(`HR absence created for employee ${data.employeeId}`)
    revalidateHrCertificationTrainingViews(departmentId)
  },
})

export const updateHrAbsenceAction = protectedServerFunction({
  schema: updateHrAbsenceSchema,
  functionName: 'Update HR absence',
  serverFn: async ({data, profile, logger}) => {
    const {id, departmentId, ...absenceData} = data

    await updateHrAbsence(id, {...absenceData, profileId: profile.id})

    logger.info(`HR absence updated: ${id}`)
    revalidateHrCertificationTrainingViews(departmentId)
  },
})

export const deleteHrAbsenceAction = protectedServerFunction({
  schema: hrAbsenceIdSchema,
  functionName: 'Delete HR absence',
  serverFn: async ({data, profile, logger}) => {
    await softDeleteHrAbsence(data.id, profile.id)

    logger.info(`HR absence deleted: ${data.id}`)
    revalidateHrCertificationTrainingViews(data.departmentId)
  },
})
