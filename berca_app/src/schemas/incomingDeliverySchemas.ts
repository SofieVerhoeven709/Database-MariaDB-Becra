import {z} from 'zod/v4'

export const incomingDeliverySchema = z.object({
  id: z.string(),
  incomingDeliveryNumber: z.string().max(255),
  purchaseId: z.string().nullable().optional(),
  additionalInfo: z.string().max(255).nullable().optional(),
  description: z.string().max(255).nullable().optional(),
  status: z.string().max(50).default('DRAFT'),
  deliveryDate: z.string(),
  receivedAt: z.string().nullable().optional(),
})

export const createIncomingDeliverySchema = incomingDeliverySchema.omit({
  id: true,
})

export const updateIncomingDeliverySchema = incomingDeliverySchema

export const incomingDeliveryIdSchema = z.object({id: z.string()})

export const incomingDeliveryLineSchema = z.object({
  id: z.string(),
  incomingDeliveryId: z.string(),
  purchaseDetailId: z.string().nullable().optional(),
  materialId: z.string(),
  orderedQty: z.coerce.number().int().min(0),
  deliveredQty: z.coerce.number().int().min(0),
  acceptedQty: z.coerce.number().int().min(0),
  rejectedQty: z.coerce.number().int().min(0).optional(),
  backorderQty: z.coerce.number().int().min(0).optional(),
  unitPrice: z.union([z.string(), z.number()]).nullable().optional(),
  lineStatus: z.string().max(50).optional(),
})

export const createIncomingDeliveryLineSchema = incomingDeliveryLineSchema.omit({
  id: true,
})

export const updateIncomingDeliveryLineSchema = incomingDeliveryLineSchema

export const incomingDeliveryLineIdSchema = z.object({id: z.string(), incomingDeliveryId: z.string()})

export const incomingDeliveryLineAllocationSchema = z.object({
  id: z.string(),
  incomingDeliveryLineId: z.string(),
  materialDemandSourceId: z.string(),
  allocatedQty: z.coerce.number().int().min(1),
})

export const createIncomingDeliveryLineAllocationSchema = incomingDeliveryLineAllocationSchema.omit({id: true})

export const updateIncomingDeliveryLineAllocationSchema = incomingDeliveryLineAllocationSchema

export const incomingDeliveryLineAllocationIdSchema = z.object({
  id: z.string(),
  incomingDeliveryLineId: z.string(),
  incomingDeliveryId: z.string(),
})

