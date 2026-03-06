import {z} from 'zod/v4'

export const warehousePlaceSchema = z.object({
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

export const createWarehousePlaceSchema = warehousePlaceSchema
export const updateWarehousePlaceSchema = warehousePlaceSchema.partial().extend({
  id: z.string().uuid(),
})
export const deleteWarehousePlaceSchema = z.object({
  id: z.string().uuid(),
})
