import {z} from 'zod'

const dateSchema = z.preprocess(val => (typeof val === 'string' || val instanceof Date ? new Date(val) : val), z.date())

const idSchema = z.string().length(36)

const auditFields = {
  createdAt: dateSchema,
  createdBy: idSchema,
  deleted: z.boolean(),
  deletedAt: dateSchema.nullable(),
  deletedBy: idSchema.nullable(),
}

export const roleSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(100),

  ...auditFields,
})

export type Role = z.infer<typeof roleSchema>
export const rolesSchema = z.array(roleSchema)

export const subRoleSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(100),

  ...auditFields,
})

export type SubRole = z.infer<typeof subRoleSchema>
export const subRolesSchema = z.array(subRoleSchema)

export const roleLevelSchema = z.object({
  id: idSchema,
  level: z.number().int(),

  roleId: idSchema,
  subRoleId: idSchema,

  ...auditFields,

  Role: roleSchema,
  SubRole: subRoleSchema,
})

export type RoleLevel = z.infer<typeof roleLevelSchema>
export const roleLevelsSchema = z.array(roleLevelSchema)

export const roleContextSchema = roleLevelSchema
  .pick({
    level: true,
    Role: true,
    SubRole: true,
  })
  .transform(data => ({
    level: data.level,
    role: data.Role.name,
    subRole: data.SubRole.name,
  }))

export type RoleContext = z.infer<typeof roleContextSchema>

export const roleContextInputSchema = z.object({
  roleLevelIds: z.array(z.string()),
})

export type RoleContextInput = z.infer<typeof roleContextInputSchema>
