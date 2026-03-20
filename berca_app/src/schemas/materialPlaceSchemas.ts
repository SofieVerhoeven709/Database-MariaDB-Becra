import {z} from 'zod/v4'

export const materialPlaceSchema = z.object({
  id: z.string().uuid(),
  abbreviation: z.string().max(255),
  beNumber: z.string().max(255).optional(),
  serialTrackedId: z.string().optional(),
  place: z.string().max(255).optional(),
  shelf: z.string().max(255).optional(),
  column: z.string().max(255).optional(),
  layer: z.string().max(255).optional(),
  layerPlace: z.string().max(255).optional(),
  information: z.string().max(255).optional(),
  quantityInStock: z.coerce.number().int().min(0),
})

export const createMaterialPlaceSchema = materialPlaceSchema
export const updateMaterialPlaceSchema = materialPlaceSchema.partial().extend({
  id: z.string().uuid(),
})
export const deleteMaterialPlaceSchema = z.object({
  id: z.string().uuid(),
})

