import {z} from 'zod'

const dateSchema = z.preprocess(val => (typeof val === 'string' || val instanceof Date ? new Date(val) : val), z.date())

const bytesSchema = z.instanceof(Uint8Array<ArrayBuffer>)

export const employeeSchemas = z.object({
  id: bytesSchema,

  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  mail: z.string().max(100).nullable(),

  password_hash: z.string().min(8).max(100),

  phoneNumber: z.string().max(100).nullable(),

  startDate: dateSchema,
  endDate: dateSchema.nullable(),

  info: z.string().nullable(),

  birthDate: dateSchema.nullable(),

  street: z.string().max(100).nullable(),
  houseNumber: z.string().max(100).nullable(),
  busNumber: z.string().max(100).nullable(),
  zipCode: z.string().max(100).nullable(),
  place: z.string().max(100).nullable(),

  userName: z.string().min(3).max(100),

  createdAt: dateSchema,

  permanentEmployee: z.boolean(),
  checkInfo: z.boolean(),
  newYearCard: z.boolean(),
  active: z.boolean(),

  passwordCreatedAt: dateSchema,

  createdBy: bytesSchema.nullable(),
  roleId: bytesSchema.nullable(),
  functionId: bytesSchema.nullable(),
  departmentId: bytesSchema.nullable(),
  titleId: bytesSchema.nullable(),
  pictureId: bytesSchema.nullable(),
})

export const signInSchema = employeeSchemas.omit({
  id: true,
  roleId: true,
  userName: true,
})

export const registerSchema = employeeSchemas
  .extend({
    passwordConfirmation: z.string(),
  })
  .refine(data => data.password_hash === data.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'The password and confirmation do not match',
  })

export const updateEmployeeSchema = employeeSchemas.pick({userName: true})
export const updateRoleSchema = employeeSchemas.pick({
  roleId: true,
  id: true,
})
