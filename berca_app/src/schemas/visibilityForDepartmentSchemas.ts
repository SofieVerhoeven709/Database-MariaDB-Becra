import {z} from 'zod/v4'

export const upsertVisibilityDepartmentSchema = z.object({
  targetId: z.string(),
  departmentId: z.string(),
  visible: z.boolean(),
  revalidate: z.string().min(1),
})

export const bulkUpsertVisibilityDepartmentSchema = z.object({
  targetId: z.string(),
  rows: z.array(
    z.object({
      departmentId: z.string(),
      visible: z.boolean(),
    }),
  ),
  revalidate: z.string().min(1),
})

// ─── Shared input type used when persisting visibility alongside any entity ───
export const visibilityInputDepartmentSchema = z.object({
  departmentId: z.string(),
  visible: z.boolean(),
})

export type VisibilityDepartmentInput = z.infer<typeof visibilityInputDepartmentSchema>
