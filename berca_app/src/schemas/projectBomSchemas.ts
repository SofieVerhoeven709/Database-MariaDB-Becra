import {z} from 'zod/v4'

// ─── ProjectBOM ────────────────────────────────────────────────────────────────
export const projectBOMSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  projectBomId: z.string().nullable().optional(),
  projectBomNumber: z.string(),
  additionalInfo: z.string().max(255).nullable().optional(),
  description: z.string().max(255).nullable().optional(),
  shortDescription: z.string().max(255),
  startDate: z.date(),
  endDate: z.date().nullable().optional(),
  createdAt: z.date(),
  createdBy: z.string(),
  closed: z.boolean().default(false),
  materialClosed: z.boolean().default(false),
  readyForPurchase: z.boolean().default(false),
  deleted: z.boolean().default(false),
  deletedAt: z.date().nullable().optional(),
  deletedBy: z.string().nullable().optional(),
})

export const createProjectBOMSchema = projectBOMSchema.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})

export const updateProjectBOMSchema = projectBOMSchema.pick({
  id: true,
  projectId: true,
  projectBomId: true,
  projectBomNumber: true,
  additionalInfo: true,
  description: true,
  shortDescription: true,
  startDate: true,
  endDate: true,
  closed: true,
  materialClosed: true,
  readyForPurchase: true,
})

export const projectBOMIdSchema = projectBOMSchema.pick({id: true})

// ─── ProjectBOMStructure ───────────────────────────────────────────────────────
export const projectBOMStructureSchema = z.object({
  id: z.string(),
  projectBOMId: z.string(),
  materialId: z.string(),
  shortDescription: z.string().max(255).nullable().optional(),
  additionalInfo: z.string().max(255).nullable().optional(),
  description: z.string().max(255).nullable().optional(),
  tag: z.string().max(255).nullable().optional(),
  requiredQuantity: z.number().int().nullable().optional(),
  readyForPurchaseDate: z.date().nullable().optional(),
  createdAt: z.date(),
  createdBy: z.string(),
  readyForPurchase: z.boolean().default(false),
  deleted: z.boolean().default(false),
  deletedAt: z.date().nullable().optional(),
  deletedBy: z.string().nullable().optional(),
})

export const createProjectBOMStructureSchema = projectBOMStructureSchema.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})

export const updateProjectBOMStructureSchema = projectBOMStructureSchema.pick({
  id: true,
  materialId: true,
  shortDescription: true,
  additionalInfo: true,
  description: true,
  tag: true,
  requiredQuantity: true,
  readyForPurchaseDate: true,
  readyForPurchase: true,
})

export const projectBOMStructureIdSchema = projectBOMStructureSchema.pick({id: true})
