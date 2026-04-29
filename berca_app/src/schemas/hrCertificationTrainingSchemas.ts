import {z} from 'zod/v4'

const trainingTypeSchema = z.enum(['one_time', 'recurring', 'certification'])
const recurrenceIntervalSchema = z.enum(['5y', '10y', 'none'])
const absenceTypeSchema = z.enum(['ADV', 'VACATION', 'SICKNESS', 'SMALL_LEAVE', 'HOLIDAY'])

export const hrCertificationTrainingIdSchema = z.object({
  id: z.string().min(1),
  departmentId: z.string().min(1),
})

export const createHrCertificationTrainingSchema = z.object({
  departmentId: z.string().min(1),
  employeeId: z.string().min(1),
  trainingName: z.string().trim().min(1).max(255),
  trainingType: trainingTypeSchema,
  recurrenceInterval: recurrenceIntervalSchema,
  trainingDate: z.coerce.date(),
  certificateValidUntil: z.coerce.date().nullable(),
  providerName: z.string().trim().min(1).max(255),
  additionalInfo: z.string().trim().nullable(),
})

export const updateHrCertificationTrainingSchema = createHrCertificationTrainingSchema.extend({
  id: z.string().min(1),
})

export const hrAbsenceIdSchema = z.object({
  id: z.string().min(1),
  departmentId: z.string().min(1),
})

export const createHrAbsenceSchema = z.object({
  departmentId: z.string().min(1),
  employeeId: z.string().min(1),
  year: z.coerce.number().int().min(2000).max(2100),
  absenceType: absenceTypeSchema,
  days: z.coerce.number().min(0).max(366),
  additionalInfo: z.string().trim().nullable(),
})

export const updateHrAbsenceSchema = createHrAbsenceSchema.extend({
  id: z.string().min(1),
})
