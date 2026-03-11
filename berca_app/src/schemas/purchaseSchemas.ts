import {z} from 'zod/v4'

export const createPurchaseSchema = z.object({
  orderNumber: z.string().max(255).nullable().optional(),
  brandName: z.string().max(255).nullable().optional(),
  brandOrderNumber: z.string().max(255).nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
  status: z.string().max(255).nullable().optional(),
  companyId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  preferedSupplier: z.string().max(255).nullable().optional(),
  shortDescription: z.string().max(255).nullable().optional(),
  description: z.string().max(255).nullable().optional(),
  additionalInfo: z.string().max(255).nullable().optional(),
})

export const updatePurchaseSchema = createPurchaseSchema.extend({
  id: z.string(),
})

export const purchaseIdSchema = z.object({id: z.string()})

export const createPurchaseDetailSchema = z.object({
  purchaseId: z.string(),
  projectId: z.string().nullable().optional(),
  beNumber: z.string().max(255).nullable().optional(),
  unitPrice: z.string().nullable().optional(),
  quantity: z.number().int().nullable().optional(),
  totalCost: z.string().nullable().optional(),
  status: z.string().max(255).nullable().optional(),
  additionalInfo: z.string().max(255).nullable().optional(),
})

export const updatePurchaseDetailSchema = createPurchaseDetailSchema.extend({
  id: z.string(),
})

export const purchaseDetailIdSchema = z.object({id: z.string(), purchaseId: z.string()})
