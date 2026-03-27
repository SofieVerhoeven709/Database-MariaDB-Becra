import {z} from 'zod/v4'

export const createInventoryOrderSchema = z.object({
  inventoryId: z.string().min(1),
  orderNumber: z.string().min(1).max(255),
  orderDate: z.string().min(1),
  shortDescription: z.string().min(1).max(255),
  longDescription: z.string().nullable().optional(),
})

export const updateInventoryOrderSchema = createInventoryOrderSchema.extend({
  id: z.string(),
})

export const inventoryOrderIdSchema = z.object({id: z.string()})

