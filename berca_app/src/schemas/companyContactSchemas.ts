import {z} from 'zod/v4'
import {dateSchema, requiredDateSchema} from '@/schemas/schemaHelpers'

export const companyContactSchema = z.object({
  id: z.string(),
  startedDate: requiredDateSchema,
  endDate: dateSchema.optional(),
  roleWithCompany: z.string().max(100).nullable().optional(),
  createdAt: requiredDateSchema,
  createdBy: z.string(),
  contactId: z.string(),
  companyId: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})

export const addCompanyContactSchema = companyContactSchema
  .omit({
    id: true,
    createdAt: true,
    createdBy: true,
    deleted: true,
    deletedAt: true,
    deletedBy: true,
  })
  .extend({
    endPreviousActive: z.boolean().default(true),
  })

export const updateCompanyContactSchema = companyContactSchema.omit({
  createdAt: true,
  createdBy: true,
  contactId: true,
  companyId: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})

export const companyContactIdSchema = companyContactSchema.pick({id: true})
