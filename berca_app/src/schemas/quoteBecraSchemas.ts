import {z} from 'zod/v4'
import {dateSchema} from '@/schemas/schemaHelpers'

// ─── Base ─────────────────────────────────────────────────────────────────────

export const quoteBecraSchema = z.object({
  id: z.string(),
  description: z.string().nullable().optional(),
  validDate: z.boolean().default(false),
  date: dateSchema.optional(),
  createdBy: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})

// ─── Create ───────────────────────────────────────────────────────────────────

export const createQuoteBecraSchema = quoteBecraSchema
  .omit({
    id: true,
    createdBy: true,
    deleted: true,
    deletedAt: true,
    deletedBy: true,
  })
  .extend({
    id: z.string().trim().regex(/^\d{10}$/, 'Quote number must contain exactly 10 digits (YYYYMMDDNN).'),
  })

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateQuoteBecraSchema = quoteBecraSchema.omit({
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})

// ─── ID only ──────────────────────────────────────────────────────────────────

export const quoteBecraIdSchema = quoteBecraSchema.pick({id: true})

