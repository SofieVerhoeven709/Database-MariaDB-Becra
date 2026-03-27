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

export const createQuoteBecraSchema = quoteBecraSchema.omit({
  id: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
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

