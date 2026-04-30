import {z} from 'zod/v4'

const optionalStringSchema = z
  .string()
  .trim()
  .transform(value => (value === '' ? null : value))
  .nullable()

const optionalIdSchema = z
  .string()
  .trim()
  .transform(value => (value === '' ? null : value))
  .nullable()

const optionalMoneySchema = z
  .union([z.coerce.number().min(0).max(99999999), z.literal('').transform(() => null), z.null()])
  .nullable()

export const createHrFacilityVehicleSchema = z.object({
  departmentId: z.string().min(1),
  serialTrackedId: optionalIdSchema,
  assignedEmployeeId: optionalIdSchema,
  licensePlate: optionalStringSchema,
  brand: optionalStringSchema,
  model: optionalStringSchema,
  vin: optionalStringSchema,
  status: z.string().trim().min(1).max(30),
  conditionStatus: optionalStringSchema,
  signedVehicleDocument: z.boolean(),
  signedDocumentFileId: optionalStringSchema,
  monthlyFuelBudget: optionalMoneySchema,
  notes: optionalStringSchema,
})

export const updateHrFacilityVehicleSchema = createHrFacilityVehicleSchema.extend({
  id: z.string().min(1),
})

export const deleteHrFacilityVehicleSchema = z.object({
  id: z.string().min(1),
  departmentId: z.string().min(1),
})

export const createHrFacilityFuelCardSchema = z.object({
  departmentId: z.string().min(1),
  vehicleId: optionalIdSchema,
  employeeId: optionalIdSchema,
  cardNumber: z.string().trim().min(1).max(100),
  provider: optionalStringSchema,
  monthlyBudget: optionalMoneySchema,
  currentMonthSpend: z.coerce.number().min(0).max(99999999),
  active: z.boolean(),
  notes: optionalStringSchema,
})

export const updateHrFacilityFuelCardSchema = createHrFacilityFuelCardSchema.extend({
  id: z.string().min(1),
})

export const deleteHrFacilityFuelCardSchema = z.object({
  id: z.string().min(1),
  departmentId: z.string().min(1),
})

export const createHrFacilityFineSchema = z.object({
  departmentId: z.string().min(1),
  vehicleId: optionalIdSchema,
  employeeId: optionalIdSchema,
  fineDate: z.coerce.date(),
  amount: z.coerce.number().positive().max(99999999),
  referenceNumber: optionalStringSchema,
  description: optionalStringSchema,
  paidByEmployee: z.boolean(),
  paidAt: z.coerce.date().nullable(),
})

export const updateHrFacilityFineSchema = createHrFacilityFineSchema.extend({
  id: z.string().min(1),
})

export const deleteHrFacilityFineSchema = z.object({
  id: z.string().min(1),
  departmentId: z.string().min(1),
})
