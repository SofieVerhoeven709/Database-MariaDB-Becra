import {z} from 'zod/v4'
import {dateSchema} from '@/schemas/schemaHelpers'
import {visibilityInputSchema} from '@/schemas/visibilityForRoleSchemas'

// ─── Base ─────────────────────────────────────────────────────────────────────

export const followUpSchema = z.object({
  id: z.string(),
  activityDescription: z.string().nullable().optional(),
  additionalInfo: z.string().nullable().optional(),
  actionAgenda: dateSchema.optional(),
  closedAgenda: dateSchema.optional(),
  recurringCallDays: z.number().int().positive().nullable().optional(),
  itemClosed: z.boolean().default(false),
  salesFollowUp: z.boolean().default(false),
  nonConform: z.boolean().default(false),
  periodicControl: z.boolean().default(false),
  recurringActive: z.boolean().default(false),
  review: z.boolean().default(false),
  createdAt: z.coerce.date(),
  createdBy: z.string(),
  ownedBy: z.string(),
  executedBy: z.string(),
  statusId: z.string(),
  urgencyTypeId: z.string(),
  followUpTypeId: z.string(),
  documentId: z.string().nullable().optional(),
  targetId: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})

// ─── Create ───────────────────────────────────────────────────────────────────

export const createFollowUpSchema = followUpSchema
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
    // Optional: link this follow-up to a target at creation time
    followUpTargetId: z.string().nullable().optional(),
  })

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateFollowUpSchema = followUpSchema
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

export const followUpIdSchema = followUpSchema.pick({id: true})
