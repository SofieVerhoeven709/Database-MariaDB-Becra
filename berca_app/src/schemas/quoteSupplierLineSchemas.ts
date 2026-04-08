import {z} from 'zod/v4'

export const createQuoteSupplierLineSchema = z.object({
  quoteSupplierId: z.string().uuid(),
  materialId: z.string().uuid(),
  materialDemandId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  minQuantity: z.number().int().nonnegative().optional(),
})

export const updateQuoteSupplierLineSchema = z.object({
  id: z.string().uuid(),
  quantity: z.number().int().positive().optional(),
  unitPrice: z.number().positive().optional(),
  minQuantity: z.number().int().nonnegative().optional(),
  selected: z.boolean().optional(),
  materialDemandId: z.string().uuid().optional(),
})

export const selectQuoteSupplierLineSchema = z.object({
  id: z.string().uuid(),
  selected: z.boolean(),
  materialDemandId: z.string().uuid(),
})

export const quoteSupplierLineIdSchema = z.object({
  id: z.string().uuid(),
})

