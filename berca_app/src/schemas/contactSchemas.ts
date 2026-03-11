import {z} from 'zod/v4'
import {dateSchema, requiredDateSchema} from '@/schemas/schemaHelpers'
import {visibilityInputSchema} from '@/schemas/visibilityForRoleSchemas'

export const contactSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  mail1: z.string().max(100).nullable().optional(),
  mail2: z.string().max(100).nullable().optional(),
  mail3: z.string().max(100).nullable().optional(),
  generalPhone: z.string().max(100).nullable().optional(),
  homePhone: z.string().max(100).nullable().optional(),
  mobilePhone: z.string().max(100).nullable().optional(),
  info: z.string().nullable().optional(),
  birthDate: dateSchema.optional(),
  trough: z.string().max(100).nullable().optional(),
  description: z.string().nullable().optional(),
  infoCorrect: z.boolean().default(false),
  checkInfo: z.boolean().default(false),
  newYearCard: z.boolean().default(false),
  active: z.boolean().default(true),
  newsLetter: z.boolean().default(false),
  mailing: z.boolean().default(false),
  trainingAdvice: z.boolean().default(false),
  contactForTrainingAndAdvice: z.boolean().default(false),
  customerTrainingAndAdvice: z.boolean().default(false),
  potentialCustomerTrainingAndAdvice: z.boolean().default(false),
  potentialTeacherTrainingAndAdvice: z.boolean().default(false),
  teacherTrainingAndAdvice: z.boolean().default(false),
  participantTrainingAndAdvice: z.boolean().default(false),
  createdAt: requiredDateSchema,
  createdBy: z.string(),
  functionId: z.string().nullable().optional(),
  departmentExternId: z.string().nullable().optional(),
  titleId: z.string().nullable().optional(),
  businessCardId: z.string().nullable().optional(),
  targetId: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})

export const createContactSchema = contactSchema
  .omit({
    id: true,
    createdAt: true,
    createdBy: true,
    targetId: true,
    deleted: true,
    deletedAt: true,
    deletedBy: true,
  })
  .extend({
    visibilityForRoles: z.array(visibilityInputSchema).default([]),
    initialCompanyId: z.string().nullable().optional(),
    initialRoleWithCompany: z.string().nullable().optional(),
    initialProjectId: z.string().nullable().optional(),
  })

export const updateContactSchema = contactSchema
  .omit({
    createdAt: true,
    createdBy: true,
    targetId: true,
    deleted: true,
    deletedAt: true,
    deletedBy: true,
  })
  .extend({
    visibilityForRoles: z.array(visibilityInputSchema).default([]),
  })

export const contactIdSchema = contactSchema.pick({id: true})
