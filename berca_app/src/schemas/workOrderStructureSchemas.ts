import {z} from 'zod/v4'

export const workOrderStructureIdSchema = z.object({id: z.string()})

export const createWorkOrderStructureSchema = z.object({
  clientNumber: z.string().max(100).nullable().optional(),
  tag: z.string().max(100).nullable().optional(),
  quantity: z.number().int().nullable().optional(),
  shortDescription: z.string().max(100).nullable().optional(),
  longDescription: z.string().nullable().optional(),
  additionalInfo: z.string().nullable().optional(),
  workOrderId: z.string(),
  materialId: z.string(),
})

export const updateWorkOrderStructureSchema = createWorkOrderStructureSchema.extend({id: z.string()})
