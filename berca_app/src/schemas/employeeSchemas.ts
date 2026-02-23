import {z} from 'zod/v4'

const dateSchema = z.preprocess(
  val => (val === '' || val === null || val === undefined ? null : new Date(val as string)),
  z.date().nullable(),
)

const requiredDateSchema = z.preprocess(
  val => (typeof val === 'string' || val instanceof Date ? new Date(val) : val),
  z.date(),
)

export const employeeSchemas = z.object({
  id: z.string(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  mail: z.string().max(100).nullable().optional(),
  password_hash: z.string().min(8).max(100),
  phoneNumber: z.string().max(100).nullable().optional(),
  startDate: requiredDateSchema,
  endDate: dateSchema.optional(),
  info: z.string().nullable().optional(),
  birthDate: dateSchema.optional(),
  street: z.string().max(100).nullable().optional(),
  houseNumber: z.string().max(100).nullable().optional(),
  busNumber: z.string().max(100).nullable().optional(),
  zipCode: z.string().max(100).nullable().optional(),
  place: z.string().max(100).nullable().optional(),
  username: z.string().min(3).max(100),
  createdAt: requiredDateSchema,
  permanentEmployee: z.boolean().default(false),
  checkInfo: z.boolean().default(false),
  newYearCard: z.boolean().default(false),
  active: z.boolean().default(true),
  passwordCreatedAt: requiredDateSchema,
  createdBy: z.string().nullable().optional(),
  roleLevelId: z.string().nullable().optional(),
  titleId: z.string().nullable().optional(),
  pictureId: z.string().nullable().optional(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})

export const emergencyContactSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  relationship: z.string(),
  mail: z.string(),
  phoneNumber: z.string(),
  employeeId: z.string().optional(), // filled server-side
})

export const signInSchema = employeeSchemas.pick({
  username: true,
  password_hash: true,
})

export const registerSchema = employeeSchemas
  .extend({
    emergencyContacts: z.array(emergencyContactSchema).optional(),
    passwordConfirmation: z.string().optional(),
  })
  .refine(data => data.password_hash === data.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'The password and confirmation do not match',
  })

// Used for admin create/update of any employee
export const upsertEmployeeSchema = employeeSchemas.extend({
  password_hash: z.string().min(8).max(100).optional(), // optional on edit
  emergencyContacts: z.array(emergencyContactSchema).optional(),
})

export const updateEmployeeSchema = employeeSchemas.pick({id: true})
