import {z} from 'zod'

const dateSchema = z.preprocess(val => (typeof val === 'string' || val instanceof Date ? new Date(val) : val), z.date())

export const employeeSchemas = z.object({
  id: z.string(),

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

  username: z.string().min(3).max(100),

  createdAt: dateSchema,

  permanentEmployee: z.boolean(),
  checkInfo: z.boolean(),
  newYearCard: z.boolean(),
  active: z.boolean(),

  passwordCreatedAt: dateSchema,

  createdBy: z.string().nullable(),
  roleId: z.string().nullable(),
  functionId: z.string().nullable(),
  departmentId: z.string().nullable(),
  titleId: z.string().nullable(),
  pictureId: z.string().nullable(),
})

export const signInSchema = employeeSchemas.pick({
  username: true,
  password_hash: true,
})

export const registerSchema = employeeSchemas
  .extend({
    passwordConfirmation: z.string(),
  })
  .refine(data => data.password_hash === data.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'The password and confirmation do not match',
  })

export const updateEmployeeSchema = employeeSchemas.pick({username: true})
export const updateRoleSchema = employeeSchemas.pick({
  roleId: true,
  id: true,
})
