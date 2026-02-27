import {z} from 'zod/v4'

export const upsertVisibilitySchema = z.object({
  targetId: z.string(),
  roleLevelId: z.string(),
  visible: z.boolean(),
  revalidate: z.string().min(1),
})
