import {z} from 'zod/v4'

// ─── PriceList ─────────────────────────────────────────────────────────────────
export const priceListSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255),
  repeatUse: z.boolean().default(false),
  createdAt: z.date(),
  createdBy: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: z.date().nullable().optional(),
  deletedBy: z.string().nullable().optional(),
  targetId: z.string(),
})

export const createPriceListSchema = priceListSchema.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
  targetId: true,
})

export const updatePriceListSchema = priceListSchema.pick({
  id: true,
  name: true,
  repeatUse: true,
})

export const priceListIdSchema = priceListSchema.pick({id: true})

export const clonePriceListSchema = z.object({
  sourceId: z.string(),
  name: z.string().min(1).max(255),
  repeatUse: z.boolean().default(false),
})

// ─── PriceListItem ─────────────────────────────────────────────────────────────
export const priceListItemSchema = z.object({
  id: z.string(),
  priceListId: z.string(),
  description: z.string().min(1).max(255),
  unit: z.string().min(1).max(100),
  price: z.number(),
  isCostMargin: z.boolean().default(false),
})

export const createPriceListItemSchema = priceListItemSchema.omit({id: true})

export const updatePriceListItemSchema = priceListItemSchema.pick({
  id: true,
  description: true,
  unit: true,
  price: true,
})

export const priceListItemIdSchema = priceListItemSchema.pick({id: true})

// ─── Project assignment ────────────────────────────────────────────────────────
export const assignProjectSchema = z.object({
  priceListId: z.string(),
  projectId: z.string(),
})

export const unassignProjectSchema = z.object({
  projectId: z.string(),
})
