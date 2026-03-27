import {z} from 'zod/v4'

export const createQuoteSupplierSchema = z.object({
  description: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  rejected: z.boolean().default(false),
  additionalInfo: z.string().max(255).nullable().optional(),
  link: z.string().max(255).nullable().optional(),
  payementCondition: z.string().max(255).nullable().optional(),
  acceptedForPOB: z.boolean().nullable().optional(),
  validUntill: z.string().nullable().optional(),
  deliveryTimeDays: z.coerce.number().int().nullable().optional(),
})

export const updateQuoteSupplierSchema = createQuoteSupplierSchema.extend({
  id: z.string(),
})

export const quoteSupplierIdSchema = z.object({id: z.string()})

