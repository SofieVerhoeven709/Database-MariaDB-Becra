import {z} from 'zod/v4'
import {dateSchema, requiredDateSchema} from '@/schemas/schemaHelpers'
import {visibilityInputSchema} from '@/schemas/visibilityForRoleSchemas'

// ─── Certificate Type ─────────────────────────────────────────────────────────

export const certificateTypeSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  createdAt: requiredDateSchema,
  createdBy: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})

export const createCertificateTypeSchema = certificateTypeSchema.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})

export const updateCertificateTypeSchema = certificateTypeSchema.omit({
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})

export const certificateTypeIdSchema = certificateTypeSchema.pick({id: true})

// ─── Certificate ──────────────────────────────────────────────────────────────

export const certificateSchema = z.object({
  id: z.string(),
  description: z.string().nullable().optional(),
  descriptionShort: z.string().nullable().optional(),
  createdAt: requiredDateSchema,
  createdBy: z.string(),
  certificateTypeId: z.string(),
  targetId: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})

export const createCertificateSchema = certificateSchema
  .omit({id: true, createdAt: true, createdBy: true, targetId: true, deleted: true, deletedAt: true, deletedBy: true})
  .extend({visibilityForRoles: z.array(visibilityInputSchema).default([])})

export const updateCertificateSchema = certificateSchema
  .omit({createdAt: true, createdBy: true, targetId: true, deleted: true, deletedAt: true, deletedBy: true})
  .extend({visibilityForRoles: z.array(visibilityInputSchema).default([])})

export const certificateIdSchema = certificateSchema.pick({id: true})

// ─── Training Standard ────────────────────────────────────────────────────────

export const trainingStandardSchema = z.object({
  id: z.string(),
  description: z.string().nullable().optional(),
  descriptionShort: z.string().nullable().optional(),
  location: z.string().max(100).nullable().optional(),
  certificate: z.boolean().default(true),
  repeat: z.boolean().default(false),
  createdAt: requiredDateSchema,
  createdBy: z.string(),
  certificateId: z.string(),
  targetId: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})

export const createTrainingStandardSchema = trainingStandardSchema
  .omit({id: true, createdAt: true, createdBy: true, targetId: true, deleted: true, deletedAt: true, deletedBy: true})
  .extend({visibilityForRoles: z.array(visibilityInputSchema).default([])})

export const updateTrainingStandardSchema = trainingStandardSchema
  .omit({createdAt: true, createdBy: true, targetId: true, deleted: true, deletedAt: true, deletedBy: true})
  .extend({visibilityForRoles: z.array(visibilityInputSchema).default([])})

export const trainingStandardIdSchema = trainingStandardSchema.pick({id: true})

// ─── Training ─────────────────────────────────────────────────────────────────

export const trainingSchema = z.object({
  id: z.string(),
  trainingNumber: z.string().max(100).nullable().optional(),
  trainingDate: requiredDateSchema,
  closed: z.boolean().default(true),
  createdAt: requiredDateSchema,
  createdBy: z.string(),
  workOrderId: z.string(),
  trainingStandardId: z.string(),
  targetId: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})

export const createTrainingSchema = trainingSchema
  .omit({id: true, createdAt: true, createdBy: true, targetId: true, deleted: true, deletedAt: true, deletedBy: true})
  .extend({visibilityForRoles: z.array(visibilityInputSchema).default([])})

export const updateTrainingSchema = trainingSchema
  .omit({createdAt: true, createdBy: true, targetId: true, deleted: true, deletedAt: true, deletedBy: true})
  .extend({visibilityForRoles: z.array(visibilityInputSchema).default([])})

export const trainingIdSchema = trainingSchema.pick({id: true})

// ─── Training Contact ─────────────────────────────────────────────────────────

export const trainingContactSchema = z.object({
  id: z.string(),
  clientNumber: z.string().max(100).nullable().optional(),
  certSentDate: dateSchema.optional(),
  succeeded: z.boolean().default(false),
  attended: z.boolean().default(false),
  certificateSent: z.boolean().default(false),
  createdAt: requiredDateSchema,
  createdBy: z.string(),
  contactId: z.string(),
  trainingId: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})

export const addTrainingContactSchema = trainingContactSchema.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})

export const updateTrainingContactSchema = trainingContactSchema.pick({
  id: true,
  clientNumber: true,
  succeeded: true,
  attended: true,
  certificateSent: true,
  certSentDate: true,
})

export const trainingContactIdSchema = trainingContactSchema.pick({id: true})
