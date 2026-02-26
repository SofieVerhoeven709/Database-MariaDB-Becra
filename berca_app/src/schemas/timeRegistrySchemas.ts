import {z} from 'zod/v4'
import {dateSchema, requiredDateSchema} from './schemaHelpers'

export const timeRegistryIdSchema = z.object({id: z.string()})

export const createTimeRegistrySchema = z.object({
  activityDescription: z.string().nullable().optional(),
  additionalInfo: z.string().nullable().optional(),
  invoiceInfo: z.string().nullable().optional(),
  workDate: requiredDateSchema,
  startTime: requiredDateSchema,
  endTime: dateSchema.optional(),
  startBreak: dateSchema.optional(),
  endBreak: dateSchema.optional(),
  invoiceTime: z.boolean().default(false),
  onSite: z.boolean().default(false),
  workOrderId: z.string(),
  hourTypeId: z.string(),
  employeeIds: z.array(z.string()).default([]),
})

export const updateTimeRegistrySchema = createTimeRegistrySchema.extend({id: z.string()})
