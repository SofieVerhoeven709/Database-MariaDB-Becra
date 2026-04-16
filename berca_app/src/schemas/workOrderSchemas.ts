import {z} from 'zod/v4'
import {dateSchema, requiredDateSchema} from './schemaHelpers'

export const workOrderSchema = z.object({
  id: z.string(),
  workOrderNumber: z.string(),
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

export const createWorkOrderSchema = workOrderSchema
  .omit({
    // Server-managed fields are set on create.
    id: true,
    createdAt: true,
    createdBy: true,
    deleted: true,
    deletedAt: true,
    deletedBy: true,
  })
  .extend({
    // Allow UI to redirect back to project detail after creation.
    redirectToProject: z.boolean().default(false),
  })

export const updateWorkOrderSchema = workOrderSchema.pick({
  // Only mutable fields are allowed on update.
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
