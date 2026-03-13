import {z} from 'zod/v4'

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
  unitPrice: z.coerce.number().nullable().optional(),
  quantityPrice: z.coerce.number().int().nullable().optional(),
  companyId: z.string(),
})

export const updateMaterialPriceSchema = createMaterialPriceSchema.extend({
  id: z.string(),
})

export const materialPriceIdSchema = z.object({id: z.string()})
