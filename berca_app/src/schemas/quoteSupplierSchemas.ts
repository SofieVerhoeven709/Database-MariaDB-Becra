import {z} from 'zod/v4'

export const quoteSupplierSchema = z.object({
  id: z.string(),
  quoteNumber: z.string().max(255),
  quotationNumber: z.string().max(255).nullable().optional(),
  companyId: z.string(),
  description: z.string().nullable().optional(),
  rejected: z.boolean().default(false),
  additionalInfo: z.string().max(255).nullable().optional(),
  acceptedForPOB: z.boolean().default(false),
  validUntill: z.string().nullable().optional(),
  deliveryTimeDays: z.coerce.number().int().nullable().optional(),
  paymentConditionId: z.string().nullable().optional(),
  createdBy: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: z.date().nullable().optional(),
  deletedBy: z.string().nullable().optional(),
})

export const createQuoteSupplierSchema = quoteSupplierSchema.omit({
  id: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})

export const updateQuoteSupplierSchema = quoteSupplierSchema.pick({
  id: true,
  quoteNumber: true,
  quotationNumber: true,
  companyId: true,
  description: true,
  rejected: true,
  additionalInfo: true,
  acceptedForPOB: true,
  validUntill: true,
  deliveryTimeDays: true,
  paymentConditionId: true,
})

export const quoteSupplierIdSchema = quoteSupplierSchema.pick({id: true})

