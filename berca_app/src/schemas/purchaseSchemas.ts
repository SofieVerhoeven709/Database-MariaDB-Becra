import {z} from 'zod/v4'

export const createPurchaseSchema = z.object({
  purchaseNumber: z.string().max(255),
  purchaseDate: z.string(),
  status: z.string().max(50).optional(),
  companyId: z.string(),
  quoteSupplierId: z.string().nullable().optional(),
  paymentConditionId: z.string().nullable().optional(),
  shortDescription: z.string().max(255).nullable().optional(),
  description: z.string().nullable().optional(),
  additionalInfo: z.string().max(255).nullable().optional(),
})

export const updatePurchaseSchema = createPurchaseSchema.extend({
  id: z.string(),
})

export const purchaseIdSchema = z.object({id: z.string()})

export const createPurchaseDetailSchema = z.object({
  purchaseId: z.string(),
  quoteSupplierLineId: z.string().nullable().optional(),
  materialId: z.string(),
  materialDemandId: z.string().nullable().optional(),
  unitPrice: z.union([z.string(), z.number()]),
  quantity: z.number().int().min(1),
  minQuantity: z.number().int().min(0).nullable().optional(),
  lineStatus: z.string().max(50).optional(),
  additionalInfo: z.string().max(255).nullable().optional(),
})

export const updatePurchaseDetailSchema = createPurchaseDetailSchema.extend({
  id: z.string(),
})

export const purchaseDetailIdSchema = z.object({id: z.string(), purchaseId: z.string()})
