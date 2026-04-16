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

// Payloads for create/update actions.
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

// Clone uses a source id and new metadata.
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

// ─── Company assignment ────────────────────────────────────────────────────────
export const assignCompanySchema = z.object({
  priceListId: z.string(),
  companyId: z.string(),
})

export const unassignCompanySchema = z.object({
  priceListCompanyId: z.string(),
})

// ─── Company search ────────────────────────────────────────────────────────────
export const searchCompaniesSchema = z.object({
  query: z.string(),
  excludeIds: z.array(z.string()).optional(),
})

// ─── PriceListItemTarget ───────────────────────────────────────────────────────
export const linkPriceListItemTargetSchema = z.object({
  priceListItemId: z.string(),
  targetId: z.string(),
})
