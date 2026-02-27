import {z} from 'zod/v4'
import {dateSchema, requiredDateSchema} from '@/schemas/schemaHelpers'
import {visibilityInputSchema} from '@/schemas/visibilityForRoleSchemas'

export const companySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  number: z.string().min(1).max(100),
  mail: z.string().max(100).nullable().optional(),
  businessPhone: z.string().max(100).nullable().optional(),
  website: z.string().max(100).nullable().optional(),
  vatNumber: z.string().max(100).nullable().optional(),
  bankNumber: z.string().max(100).nullable().optional(),
  iban: z.string().max(100).nullable().optional(),
  bic: z.string().max(100).nullable().optional(),
  becraCustomerNumber: z.string().max(100).nullable().optional(),
  becraWebsiteLogin: z.string().max(100).nullable().optional(),
  supplier: z.boolean().default(false),
  prefferedSupplier: z.boolean().default(false),
  companyActive: z.boolean().default(true),
  newsLetter: z.boolean().default(false),
  customer: z.boolean().default(false),
  potentialCustomer: z.boolean().default(false),
  headQuarters: z.boolean().default(false),
  potentialSubContractor: z.boolean().default(false),
  subContractor: z.boolean().default(false),
  notes: z.string().nullable().optional(),
  createdAt: requiredDateSchema,
  createdBy: z.string(),
  companyId: z.string().nullable().optional(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})

const addressInputSchema = z.object({
  street: z.string().max(100).nullable().optional(),
  houseNumber: z.string().max(100).nullable().optional(),
  busNumber: z.string().max(100).nullable().optional(),
  zipCode: z.string().max(100).nullable().optional(),
  place: z.string().max(100).nullable().optional(),
  typeAdress: z.string().max(100).nullable().optional(),
})

export const createCompanySchema = companySchema
  .omit({
    id: true,
    createdAt: true,
    createdBy: true,
    deleted: true,
    deletedAt: true,
    deletedBy: true,
  })
  .extend({
    addresses: z.array(addressInputSchema).default([]),
    visibilityForRoles: z.array(visibilityInputSchema).default([]),
  })

export const updateCompanySchema = companySchema
  .omit({
    createdAt: true,
    createdBy: true,
    deleted: true,
    deletedAt: true,
    deletedBy: true,
  })
  .extend({
    visibilityForRoles: z.array(visibilityInputSchema).default([]),
  })

export const companyIdSchema = companySchema.pick({id: true})

// ─── Company Address ──────────────────────────────────────────────────────────
export const companyAddressSchema = z.object({
  id: z.string(),
  street: z.string().max(100).nullable().optional(),
  houseNumber: z.string().max(100).nullable().optional(),
  busNumber: z.string().max(100).nullable().optional(),
  zipCode: z.string().max(100).nullable().optional(),
  place: z.string().max(100).nullable().optional(),
  typeAdress: z.string().max(100).nullable().optional(),
  createdAt: requiredDateSchema,
  createdBy: z.string(),
  companyId: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})

export const createCompanyAddressSchema = companyAddressSchema.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})

export const updateCompanyAddressSchema = companyAddressSchema.omit({
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})

export const companyAddressIdSchema = companyAddressSchema.pick({id: true})
