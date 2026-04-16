import {z} from 'zod'

const idSchema = z.string().length(36)

export const createFunctionSchema = z.object({
  name: z.string().min(1).max(100),
})

export const updateFunctionSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(100),
})

export const functionIdSchema = z.object({
  id: idSchema,
})

