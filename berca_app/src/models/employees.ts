import type {Prisma} from '@/generated/prisma/client'

export const profileOmit = {
  password_hash: true,
} satisfies Prisma.EmployeeOmit

export type Profile = Prisma.EmployeeGetPayload<{
  omit: typeof profileOmit
  include: {
    RoleLevelEmployee: {
      // This is the Employee → RoleLevel relation
      include: {
        RoleLevel: {
          include: {
            Role: true // RoleLevel → Role
            SubRole: true // RoleLevel → SubRole
          }
        }
      }
    }
  }
}>

export const sessionWithProfileInclude = {
  Employee: {
    omit: profileOmit,
    include: {
      RoleLevelEmployee: {
        // This is the Employee → RoleLevel relation
        include: {
          RoleLevel: {
            include: {
              Role: true, // RoleLevel → Role
              SubRole: true, // RoleLevel → SubRole
            },
          },
        },
      },
    },
  },
} satisfies Prisma.SessionInclude

export type SessionWithProfile = Prisma.SessionGetPayload<{
  include: typeof sessionWithProfileInclude
}>
