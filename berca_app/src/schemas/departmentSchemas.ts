import {z} from 'zod'

// Utility to preprocess dates
const dateSchema = z.preprocess(val => (typeof val === 'string' || val instanceof Date ? new Date(val) : val), z.date())

// Department schema
export const departmentSchema = z.object({
  id: z.string(), // 36-char UUID
  name: z.string().min(1).max(100),
  color: z.string().max(10).nullable(),
  icon: z.string().max(255).nullable(),
  description: z.string().max(255).nullable(),
  createdAt: dateSchema,
  createdBy: z.string(),
})

export type Department = z.infer<typeof departmentSchema>
export const departmentsSchema = z.array(departmentSchema)
export type Departments = z.infer<typeof departmentsSchema>
