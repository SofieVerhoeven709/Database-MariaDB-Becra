import {z} from 'zod/v4'
const booleanFromString = z.preprocess(
  val => (val === 'false' || val === false || val === 0 ? false : Boolean(val)),
  z.boolean(),
)
export const inventorySchema = z.object({
  id: z.string().uuid(),
  materialId: z.string().uuid(),
  beNumber: z.string().min(1).max(255),
  place: z.string().min(1).max(255),
  shortDescription: z.string().min(1).max(255),
  longDescription: z.string().min(1),
  serieNumber: z.string().min(1).max(255),
  quantityInStock: z.coerce.number().int(),
  minQuantityInStock: z.coerce.number().int(),
  maxQuantityInStock: z.coerce.number().int(),
  information: z.string().min(1),
  valid: booleanFromString,
  noValidDate: z.coerce.date(),
})
export const createInventorySchema = inventorySchema
export const updateInventorySchema = inventorySchema.partial().extend({
  id: z.string().uuid(),
})
export const deleteInventorySchema = z.object({
  id: z.string().uuid(),
})
