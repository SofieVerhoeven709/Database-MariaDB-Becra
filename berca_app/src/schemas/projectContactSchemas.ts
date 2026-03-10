import {z} from 'zod/v4'

export const createProjectContactSchema = z.object({
  projectId: z.string(),
  contactId: z.string(),
  description: z.string().nullable().optional(),
  extraInfo: z.string().nullable().optional(),
  idValid: z.boolean().default(true),
})

export const updateProjectContactSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  description: z.string().nullable().optional(),
  extraInfo: z.string().nullable().optional(),
  idValid: z.boolean(),
})

export const projectContactIdSchema = z.object({
  id: z.string(),
  projectId: z.string(),
})
