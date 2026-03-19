import {z} from 'zod/v4'

export const createCountrySchema = z.object({
  name: z.string().min(1).max(100),
})

export const countryIdSchema = z.object({
  id: z.string(),
})
