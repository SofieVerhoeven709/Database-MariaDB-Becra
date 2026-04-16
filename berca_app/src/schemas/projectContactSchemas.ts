import {z} from 'zod/v4'

// Payload for creating a project-contact link.
export const createProjectContactSchema = z.object({
  projectId: z.string(),
  contactId: z.string(),
  description: z.string().nullable().optional(),
  extraInfo: z.string().nullable().optional(),
  isValid: z.boolean().default(true),
})

// Payload for updating a link row.
export const updateProjectContactSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  description: z.string().nullable().optional(),
  extraInfo: z.string().nullable().optional(),
  isValid: z.boolean(),
})

// Id envelope for delete/restore actions.
export const projectContactIdSchema = z.object({
  id: z.string(),
  projectId: z.string(),
})
