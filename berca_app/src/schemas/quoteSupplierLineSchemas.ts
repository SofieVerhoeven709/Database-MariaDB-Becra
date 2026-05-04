import {z} from 'zod/v4'

export const createQuoteSupplierLineSchema = z.object({
  quoteSupplierId: z.string().uuid(),
  materialId: z.string().uuid(),
  materialDemandId: z.string().uuid().optional(),
  // Line quantities must be positive integers.
  quantity: z.number().int().positive(),
  // Unit price is positive and validated as a numeric value.
  unitPrice: z.number().positive(),
  minQuantity: z.number().int().nonnegative().optional(),
  supplierDescription: z.string().max(1000).optional(),
  notDeliverable: z.boolean().optional(),
})

export const updateQuoteSupplierLineSchema = z.object({
  id: z.string().uuid(),
  quantity: z.number().int().positive().optional(),
  unitPrice: z.number().positive().optional(),
  minQuantity: z.number().int().nonnegative().optional(),
  supplierDescription: z.string().max(1000).nullable().optional(),
  selected: z.boolean().optional(),
  materialDemandId: z.string().uuid().optional(),
  notDeliverable: z.boolean().optional(),
})

export const selectQuoteSupplierLineSchema = z.object({
  id: z.string().uuid(),
  selected: z.boolean(),
  materialDemandId: z.string().uuid().optional(),
})

export const quoteSupplierLineIdSchema = z.object({
  id: z.string().uuid(),
})
