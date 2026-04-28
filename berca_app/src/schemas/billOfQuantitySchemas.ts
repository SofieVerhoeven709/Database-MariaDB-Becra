import {z} from 'zod/v4'
import {requiredDateSchema, dateSchema} from '@/schemas/schemaHelpers'

// ─── BillOfQuantities ─────────────────────────────────────────────────────────
export const boqSchema = z.object({
  id: z.string(),
  boqNumber: z.string().min(1).max(255),
  poNumber: z.string().max(255).nullable().optional(),
  clientReference: z.string().max(255).nullable().optional(),
  boqDate: requiredDateSchema,
  createdAt: requiredDateSchema,
  dueDate: requiredDateSchema,
  sentDate: dateSchema.optional(),
  deletedAt: dateSchema.optional(),
  modifiedAt: dateSchema.optional(),
  reminderSent: z.boolean().default(false),
  outstanding: z.boolean().default(true),
  deleted: z.boolean().default(false),
  deletedBy: z.string().nullable().optional(),
  createdBy: z.string(),
  modifiedBy: z.string().nullable().optional(),
  boqTypeId: z.string(),
  targetId: z.string(),
  paymentMethodId: z.string(),
  boqSentTypeId: z.string(),
  boqStatusId: z.string(),
  priceListId: z.string().nullable().optional(),
})

export const createBoqSchema = boqSchema
  .omit({
    id: true,
    createdAt: true,
    boqNumber: true,
    createdBy: true,
    deleted: true,
    deletedAt: true,
    deletedBy: true,
    modifiedAt: true,
    modifiedBy: true,
    targetId: true,
  })
  .extend({
    boqNumber: z.string().min(1).max(255).optional(),
    workOrderIds: z.array(z.string()).default([]),
  })

export const updateBoqSchema = boqSchema.omit({
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
  targetId: true,
})

export const boqIdSchema = boqSchema.pick({id: true})
