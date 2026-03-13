import {z} from 'zod/v4'

export const createPurchaseBomSchema = z.object({
  description: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
})

export const updatePurchaseBomSchema = createPurchaseBomSchema.extend({
  id: z.string(),
})

export const purchaseBomIdSchema = z.object({
  id: z.string(),
})
