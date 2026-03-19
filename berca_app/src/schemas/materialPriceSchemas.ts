import {z} from 'zod/v4'

const nullableNumberInput = z.preprocess(value => {
  if (value === '' || value == null) return null
  return value
}, z.coerce.number().nullable().optional())

export const createMaterialPriceSchema = z.object({
  beNumber: z.string().max(255).nullable().optional(),
  orderNr: z.string().max(255).nullable().optional(),
  quoteBecra: z.string().nullable().optional(),
  supplierOrderNr: z.string().max(255).nullable().optional(),
  brandOrderNr: z.string().max(255).nullable().optional(),
  shortDescription: z.string().max(255).nullable().optional(),
  longDescription: z.string().nullable().optional(),
  brandName: z.string().max(255).nullable().optional(),
  rejected: z.boolean().nullable().optional(),
  additionalInfo: z.string().max(255).nullable().optional(),
  unitPrice: nullableNumberInput,
  quantityPrice: nullableNumberInput.refine(
    value => value == null || (value > 0 && Number.isInteger(value * 1000)),
    'Unit quantity moet groter zijn dan 0 en max 3 cijfers na de komma hebben',
  ),
  packingUnits: nullableNumberInput.refine(value => value == null || (Number.isInteger(value) && value >= 1), {
    message: 'Packing units moet een geheel getal van minstens 1 zijn',
  }),
  companyId: z.string(),
})

export const updateMaterialPriceSchema = createMaterialPriceSchema.extend({
  id: z.string(),
})

export const materialPriceIdSchema = z.object({id: z.string()})
