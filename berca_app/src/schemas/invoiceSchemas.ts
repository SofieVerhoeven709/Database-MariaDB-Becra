import {z} from 'zod/v4'
import {requiredDateSchema, dateSchema} from '@/schemas/schemaHelpers'

// ─── InvoiceOut ───────────────────────────────────────────────────────────────
export const invoiceOutSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string().min(1).max(255),
  poNumber: z.string().max(255).nullable().optional(),
  humanId: z.string().max(255).nullable().optional(),
  invoiceDate: requiredDateSchema,
  createdAt: requiredDateSchema,
  dueDate: requiredDateSchema,
  sentDate: dateSchema.optional(),
  deletedAt: dateSchema.optional(),
  modifiedAt: dateSchema.optional(),
  reminderSent: z.boolean().default(false),
  outstanding: z.boolean().default(false),
  deleted: z.boolean().default(false),
  deletedBy: z.string().nullable().optional(),
  createdBy: z.string(),
  modifiedBy: z.string().nullable().optional(),
  invoiceTypeId: z.string(),
  targetId: z.string(),
  paymentMethodId: z.string(),
  invoiceSentTypeId: z.string(),
  invoiceStatusId: z.string(),
  // Optional price list applied to billing line calculations.
  priceListId: z.string().nullable().optional(), // ← new
})

export const createInvoiceOutSchema = invoiceOutSchema
  .omit({
    id: true,
    createdAt: true,
    invoiceNumber: true,
    createdBy: true,
    deleted: true,
    deletedAt: true,
    deletedBy: true,
    modifiedAt: true,
    modifiedBy: true,
    targetId: true,
  })
  .extend({
    // Allow user-supplied invoice number on create; server may override.
    invoiceNumber: z.string().min(1).max(255).optional(),
  })

export const updateInvoiceOutSchema = invoiceOutSchema.omit({
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
  targetId: true,
})

export const invoiceOutIdSchema = invoiceOutSchema.pick({id: true})

// ─── InvoiceIn ────────────────────────────────────────────────────────────────
export const invoiceInSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string().min(1).max(255),
  poNumber: z.string().nullable().optional(),
  clientInvoiceNumber: z.string().max(255).nullable().optional(),
  description: z.string().nullable().optional(),
  invoiceDate: requiredDateSchema,
  createdAt: requiredDateSchema,
  dueDate: requiredDateSchema,
  deletedAt: dateSchema.optional(),
  modifiedAt: dateSchema.optional(),
  reminderSent: z.boolean().default(false),
  outstanding: z.boolean().default(false),
  deleted: z.boolean().default(false),
  deletedBy: z.string().nullable().optional(),
  createdBy: z.string(),
  modifiedBy: z.string().nullable().optional(),
  invoiceTypeId: z.string(),
  targetId: z.string(),
  paymentMethodId: z.string(),
  invoiceSentTypeId: z.string(),
  invoiceStatusId: z.string(),
  vatMarginId: z.string(),
  companyId: z.string(),
})

export const createInvoiceInSchema = invoiceInSchema
  .omit({
    id: true,
    createdAt: true,
    invoiceNumber: true,
    createdBy: true,
    deleted: true,
    deletedAt: true,
    deletedBy: true,
    modifiedAt: true,
    modifiedBy: true,
    targetId: true,
  })
  .extend({
    // Allow user-supplied invoice number on create; server may override.
    invoiceNumber: z.string().min(1).max(255).optional(),
  })

export const updateInvoiceInSchema = invoiceInSchema.omit({
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
  targetId: true,
})

export const invoiceInIdSchema = invoiceInSchema.pick({id: true})
