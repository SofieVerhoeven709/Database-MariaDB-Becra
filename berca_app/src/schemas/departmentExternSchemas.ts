import {z} from 'zod'

const idSchema = z.string().length(36)

export const createDepartmentExternSchema = z.object({
  name: z.string().min(1).max(100),
})

export const updateDepartmentExternSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(100),
})

export const departmentExternIdSchema = z.object({
  id: idSchema,
})

