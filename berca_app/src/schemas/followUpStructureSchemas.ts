import {z} from 'zod/v4'
import {dateSchema, requiredDateSchema} from '@/schemas/schemaHelpers'
import {visibilityInputSchema} from '@/schemas/visibilityForRoleSchemas'

// ─── Base ─────────────────────────────────────────────────────────────────────

export const followUpStructureSchema = z.object({
  id: z.string(),
  activityDescription: z.string().nullable().optional(),
  additionalInfo: z.string().nullable().optional(),
  actionAgenda: dateSchema.optional(),
  closedAgenda: dateSchema.optional(),
  recurringItem: z.string().max(100).nullable().optional(),
  item: z.string().max(100).nullable().optional(),
  contactDate: requiredDateSchema,
  taskDescription: z.string().nullable().optional(),
  taskStartDate: dateSchema.optional(),
  taskCompleteDate: dateSchema.optional(),
  createdAt: z.coerce.date(),
  recurringActive: z.boolean().default(false),
  createdBy: z.string(),
  ownedBy: z.string(),
  executedBy: z.string(),
  taskFor: z.string(),
  statusId: z.string(),
  urgencyTypeId: z.string(),
  followUpId: z.string(),
  documentId: z.string().nullable().optional(),
  contactId: z.string(),
  targetId: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})

// ─── Create ───────────────────────────────────────────────────────────────────

export const createFollowUpStructureSchema = followUpStructureSchema
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
  })

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateFollowUpStructureSchema = followUpStructureSchema
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

// ─── ID only ──────────────────────────────────────────────────────────────────

export const followUpStructureIdSchema = followUpStructureSchema.pick({id: true})
