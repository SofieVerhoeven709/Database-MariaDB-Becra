import {z} from 'zod/v4'
import {dateSchema, requiredDateSchema} from './schemaHelpers'

export const workOrderSchema = z.object({
  id: z.string(),
  workOrderNumber: z.string().max(100).nullable().optional(),
  description: z.string().nullable().optional(),
  additionalInfo: z.string().nullable().optional(),
  startDate: requiredDateSchema,
  endDate: dateSchema.optional(),
  createdAt: requiredDateSchema,
  hoursMaterialClosed: z.boolean().default(false),
  invoiceSent: z.boolean().default(false),
  completed: z.boolean().default(false),
  createdBy: z.string(),
  projectId: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})

export const createWorkOrderSchema = workOrderSchema.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})

export const updateWorkOrderSchema = workOrderSchema.pick({
  id: true,
  workOrderNumber: true,
  description: true,
  additionalInfo: true,
  startDate: true,
  endDate: true,
  projectId: true,
  hoursMaterialClosed: true,
  invoiceSent: true,
  completed: true,
})

export const workOrderIdSchema = workOrderSchema.pick({id: true})
