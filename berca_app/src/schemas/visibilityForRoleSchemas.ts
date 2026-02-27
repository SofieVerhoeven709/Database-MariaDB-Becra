import {z} from 'zod/v4'

export const upsertVisibilitySchema = z.object({
  targetId: z.string(),
  roleLevelId: z.string(),
  visible: z.boolean(),
  revalidate: z.string().min(1),
})

// ─── Shared input type used when persisting visibility alongside any entity ───
export const visibilityInputSchema = z.object({
  roleLevelId: z.string(),
  visible: z.boolean(),
})

export type VisibilityInput = z.infer<typeof visibilityInputSchema>
