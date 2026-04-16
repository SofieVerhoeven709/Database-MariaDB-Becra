import {z} from 'zod/v4'

// Payload for creating a new country entry.
export const createCountrySchema = z.object({
  name: z.string().min(1).max(100),
})

// Generic id envelope for country actions.
export const countryIdSchema = z.object({
  id: z.string(),
})
