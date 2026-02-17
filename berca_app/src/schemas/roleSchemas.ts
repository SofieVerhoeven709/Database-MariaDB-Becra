import {z} from 'zod'

const dateSchema = z.preprocess(val => (typeof val === 'string' || val instanceof Date ? new Date(val) : val), z.date())

export const roleSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  level: z.number().int(),
  createdAt: dateSchema,
  createdBy: z.string(),
})

export type Role = z.infer<typeof roleSchema>
export const rolesSchema = z.array(roleSchema)
export type Roles = z.infer<typeof rolesSchema>
