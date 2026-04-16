import {z} from 'zod/v4'
import {visibilityInputSchema} from '@/schemas/visibilityForRoleSchemas'

const dateSchema = z.preprocess(
  // Treat empty values as null for optional dates.
  val => (val === '' || val === null || val === undefined ? null : new Date(val as string)),
  z.date().nullable(),
)

const requiredDateSchema = z.preprocess(
  // Coerce strings into Date instances for required timestamps.
  val => (typeof val === 'string' || val instanceof Date ? new Date(val) : val),
  z.date(),
)

export const projectSchema = z.object({
  id: z.string(),
  projectNumber: z.string().min(1).max(255),
  projectName: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  extraInfo: z.string().nullable().optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  closingDate: dateSchema.optional(),
  engineeringStartDate: dateSchema.optional(),
  createdAt: requiredDateSchema,
  isMainProject: z.boolean().default(true),
  isIntern: z.boolean().default(false),
  isOpen: z.boolean().default(true),
  isClosed: z.boolean().default(false),
  createdBy: z.string(),
  companyId: z.string(),
  projectTypeId: z.string(),
  parentProjectId: z.string().nullable().optional(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})

export const upsertProjectSchema = projectSchema.extend({
  // Visibility rows are managed separately from the project record.
  visibilityForRoles: z.array(visibilityInputSchema).default([]),
})

export const updateProjectSchema = projectSchema.pick({id: true})
