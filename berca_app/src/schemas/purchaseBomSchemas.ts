import {z} from 'zod/v4'

// ─── PurchaseBOM ────────────────────────────────────────────────────────────────
export const purchaseBOMSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  purchaseBomId: z.string().nullable().optional(),
  projectBOMId: z.string(),
  purchaseBomNumber: z.string(),
  additionalInfo: z.string().max(255).nullable().optional(),
  description: z.string().max(255).nullable().optional(),
  shortDescription: z.string().max(255),
  startDate: z.date(),
  endDate: z.date().nullable().optional(),
  createdAt: z.date(),
  createdBy: z.string(),
  closed: z.boolean().default(false),
  materialClosed: z.boolean().default(false),
  purchased: z.boolean().default(false),
  deleted: z.boolean().default(false),
  deletedAt: z.date().nullable().optional(),
  deletedBy: z.string().nullable().optional(),
})

export const createPurchaseBOMSchema = purchaseBOMSchema.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})

export const updatePurchaseBOMSchema = purchaseBOMSchema.pick({
  id: true,
  purchaseBomId: true,
  purchaseBomNumber: true,
  additionalInfo: true,
  description: true,
  shortDescription: true,
  startDate: true,
  endDate: true,
  closed: true,
  materialClosed: true,
  purchased: true,
})

export const purchaseBOMIdSchema = purchaseBOMSchema.pick({id: true})

// ─── PurchaseBOMStructure ───────────────────────────────────────────────────────
export const purchaseBOMStructureSchema = z.object({
  id: z.string(),
  purchaseBOMId: z.string(),
  projectBOMStructureId: z.string(),
  materialId: z.string(),
  shortDescription: z.string().max(255).nullable().optional(),
  additionalInfo: z.string().max(255).nullable().optional(),
  description: z.string().max(255).nullable().optional(),
  tag: z.string().max(255).nullable().optional(),
  requiredQuantity: z.number().int().nullable().optional(),
  reservedQuantity: z.number().int().nullable().optional(),
  issuedQuantity: z.number().int().nullable().optional(),
  readyForPurchaseDate: z.date().nullable().optional(),
  notDeliverable: z.boolean().default(false),
  purchased: z.boolean().default(false),
  createdAt: z.date(),
  createdBy: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: z.date().nullable().optional(),
  deletedBy: z.string().nullable().optional(),
})

export const createPurchaseBOMStructureSchema = purchaseBOMStructureSchema.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
  reservedQuantity: true,
  issuedQuantity: true,
  notDeliverable: true,
})

// ── Purchase structures are NEVER created directly from the purchase side ──────
// They are created automatically when a ProjectBOMStructure is marked readyForPurchase=true.
// The purchase side can only update the execution fields below.

export const updatePurchaseBOMStructureSchema = purchaseBOMStructureSchema.pick({
  id: true,
  // ── Only execution fields are editable on the purchase side ─────────────────
  reservedQuantity: true,
  issuedQuantity: true,
  notDeliverable: true,
  projectBOMStructureId: true,
  purchased: true,
})

export const purchaseBOMStructureIdSchema = purchaseBOMStructureSchema.pick({id: true})
