import {z} from 'zod/v4'

export const materialDemandSchema = z.object({
  id: z.string(),
  materialId: z.string(),
  // Coerce numeric inputs from forms into integer quantities.
  totalRequiredQty: z.coerce.number().int().min(0),
  reservedQty: z.coerce.number().int().min(0),
  createdAt: z.date(),
})

export const createMaterialDemandSchema = materialDemandSchema.omit({
  id: true,
  createdAt: true,
})

export const updateMaterialDemandSchema = materialDemandSchema.pick({
  id: true,
  totalRequiredQty: true,
  reservedQty: true,
})

export const removeMaterialDemandSourceSchema = z.object({
  materialDemandId: z.string(),
  sourceId: z.string(),
})

export const assignMaterialDemandSourceSchema = z.object({
  materialDemandId: z.string(),
  sourceId: z.string(),
  reservedQty: z.coerce.number().int().min(0),
})

export const createManualDemandSourceActionSchema = z.object({
  materialDemandId: z.string(),
  label: z.string().min(1).max(255),
  requiredQty: z.coerce.number().int().min(1),
})
