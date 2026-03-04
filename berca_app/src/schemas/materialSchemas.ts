import {z} from 'zod/v4'

// FormData sends booleans as strings; "false" must map to false, not true.
const booleanFromString = z.preprocess(
  val =>
    val === 'false' || val === false || val === 0
      ? false
      : val === 'true' || val === true || val === 1
        ? true
        : undefined,
  z.boolean().nullable().optional(),
)

export const materialSchema = z.object({
  id: z.string().uuid(),
  beNumber: z.string().min(1).max(255),
  name: z.string().max(255).nullable().optional(),
  brandOrderNr: z.coerce.number().int(),
  shortDescription: z.string().min(1).max(255),
  longDescription: z.string().nullable().optional(),
  preferredSupplier: z.string().max(255).nullable().optional(),
  brandName: z.string().max(255).nullable().optional(),
  documentationPlace: z.string().max(255).nullable().optional(),
  bePartDoc: z.coerce.number().int().nullable().optional(),
  rejected: booleanFromString,
  materialGroupId: z.string().uuid(),
  unitId: z.string().uuid(),
})

export const createMaterialSchema = materialSchema

export const updateMaterialSchema = materialSchema.partial().extend({
  id: z.string().uuid(),
})

export const deleteMaterialSchema = z.object({
  id: z.string().uuid(),
})
