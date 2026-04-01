import {z} from 'zod/v4'

// ─── ProjectBOM ────────────────────────────────────────────────────────────────
export const projectBOMSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  parentPart: z.string().max(255).nullable().optional(),
  additionalInfo: z.string().max(255).nullable().optional(),
  description: z.string().max(255).nullable().optional(),
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
  parentPart: true,
  additionalInfo: true,
  description: true,
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
  reservedQuantity: z.number().int().nullable().optional(),
  issuedQuantity: z.number().int().nullable().optional(),
  readyForPurchaseDate: z.date().nullable().optional(),
  createdAt: z.date(),
  createdBy: z.string(),
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
  reservedQuantity: true,
  issuedQuantity: true,
  readyForPurchaseDate: true,
})

export const projectBOMStructureIdSchema = projectBOMStructureSchema.pick({id: true})
