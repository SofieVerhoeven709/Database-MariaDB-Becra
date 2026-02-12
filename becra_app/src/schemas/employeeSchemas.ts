import { z } from "zod";

export const employeeSchemas = z.object({
  id: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  mail: z.string(),
  password_hash: z.string().min(8).max(100),
  phoneNumber: z.string().nullable().optional(),
  startDate: z.preprocess((arg) => new Date(arg as string), z.date()),
  endDate: z
    .preprocess(
      (arg) => (arg ? new Date(arg as string) : null),
      z.date().nullable(),
    )
    .optional(),
  info: z.string().nullable().optional(),
  birthDate: z
    .preprocess(
      (arg) => (arg ? new Date(arg as string) : null),
      z.date().nullable(),
    )
    .optional(),
  street: z.string().nullable().optional(),
  houseNumber: z.string().nullable().optional(),
  busNumber: z.string().nullable().optional(),
  zipCode: z.string().nullable().optional(),
  place: z.string().nullable().optional(),
  userName: z.string().min(3),
  createdAt: z.preprocess((arg) => new Date(arg as string), z.date()),
  permanentEmployee: z.boolean().optional(),
  checkInfo: z.boolean().optional(),
  newYearCard: z.boolean().optional(),
  active: z.boolean().optional(),
  passwordCreatedAt: z.preprocess((arg) => new Date(arg as string), z.date()),
  createdBy: z.string().uuid(),
  roleId: z.string(),
  functionId: z.string(),
  departmentId: z.string(),
  titleId: z.string(),
  pictureId: z.string().nullable().optional(),
});

export const signInSchema = employeeSchemas.omit({
  id: true,
  roleId: true,
  userName: true,
});

export const registerSchema = employeeSchemas
  .omit({ id: true, createdAt: true, passwordCreatedAt: true })
  // Via extend kunnen we een bestaand schema uitbreiden met extra velden.
  .extend({
    passwordConfirmation: z.string(),
  })
  // De refine methode, die beschikbaar is op properties en het schema zelf, kan gebruikt worden om extra validatie toe
  // te voegen die niet standaard aanwezig is in Zod.
  .refine((data) => data.password_hash === data.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "The password and confirmation do not match.",
  });

export const updateEmployeeSchema = employeeSchemas.pick({ userName: true });
export const updateRoleSchema = employeeSchemas.pick({
  roleId: true,
  id: true,
});
