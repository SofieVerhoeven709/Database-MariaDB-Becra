import {z} from 'zod/v4'

const dateSchema = z.preprocess(
  // Treat empty values as null for optional dates.
  val => (val === '' || val === null || val === undefined ? null : new Date(val as string)),
  z.date().nullable(),
)

const requiredDateSchema = z.preprocess(
  // Coerce strings into Date instances for required timestamps.
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
  roleLevelIds: z.array(z.string()).optional().default([]),
  titleId: z.string().nullable().optional(),
  pictureId: z.string().nullable().optional(),
  photoFileId: z.string().max(255).nullable().optional(),
  bankAccountNumber: z.string().max(100).nullable().optional(),
  rrn: z.string().max(100).nullable().optional(),
  idExpirationDate: dateSchema.optional(),
  driversLicense: z.boolean().default(false),
  maritalStatus: z.string().max(100).nullable().optional(),
  dependents: z.coerce.number().int().min(0).nullable().optional(),
  employmentStatus: z.string().max(100).nullable().optional(),
  contractType: z.string().max(255).nullable().optional(),
  contractDuration: z.string().max(255).nullable().optional(),
  grossSalary: z.string().max(100).nullable().optional(),
  mealVouchers: z.boolean().default(false),
  ecoVouchers: z.boolean().default(false),
  companyCar: z.boolean().default(false),
  companyCarDescription: z.string().max(255).nullable().optional(),
  fuelCard: z.boolean().default(false),
  bikeLease: z.boolean().default(false),
  mobilePhone: z.boolean().default(false),
  laptop: z.boolean().default(false),
  fixedExpenseAllowance: z.boolean().default(false),
  homeWorkInternetAllowance: z.boolean().default(false),
  extraLegalBenefits: z.string().nullable().optional(),
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
  // employeeId is populated server-side when persisting contacts.
  employeeId: z.string().optional(),
})

export const employeeManagedOptionSchema = z.object({
  name: z.string().max(255).nullable().optional(),
})

export const updateEmployeeManagedOptionSchema = employeeManagedOptionSchema.extend({
  id: z.string(),
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
  // Ensure the confirmation matches the chosen password on registration.
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
