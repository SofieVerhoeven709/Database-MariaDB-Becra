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
  validUntil: z.string().nullable().optional(),
  // Accept numeric input from form fields for delivery time.
  deliveryTimeDays: z.coerce.number().int().nullable().optional(),
  paymentConditionId: z.string().nullable().optional(),
  createdBy: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: z.date().nullable().optional(),
  deletedBy: z.string().nullable().optional(),
})

export const createQuoteSupplierSchema = quoteSupplierSchema
  .omit({
    id: true,
    createdBy: true,
    deleted: true,
    deletedAt: true,
    deletedBy: true,
  })
  .extend({
    initialMaterialId: z.string().uuid().optional(),
    initialMaterialDemandId: z.string().uuid().optional(),
    // Optional initial line quantity when creating from a material context.
    initialQuantity: z.coerce.number().int().positive().optional(),
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
  validUntil: true,
  deliveryTimeDays: true,
  paymentConditionId: true,
})

export const quoteSupplierIdSchema = quoteSupplierSchema.pick({id: true})

export const paymentConditionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
})

export const createPaymentConditionSchema = paymentConditionSchema.pick({name: true})
export const updatePaymentConditionSchema = paymentConditionSchema
export const paymentConditionIdSchema = paymentConditionSchema.pick({id: true})

export const quoteSupplierSentSchema = z.object({
  id: z.string().uuid(),
  sent: z.boolean(),
})

export const quoteSupplierReceivedSchema = z.object({
  id: z.string().uuid(),
  received: z.boolean(),
})

// ── Misc line schemas ─────────────────────────────────────────────────────────

export const createQuoteSupplierMiscLineSchema = z.object({
  quoteSupplierId: z.string().uuid(),
  description: z.string().min(1).max(255),
  unitPrice: z.number().positive(),
})

export const updateQuoteSupplierMiscLineSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1).max(255).optional(),
  unitPrice: z.number().positive().optional(),
})

export const quoteSupplierMiscLineIdSchema = z.object({
  id: z.string().uuid(),
})
