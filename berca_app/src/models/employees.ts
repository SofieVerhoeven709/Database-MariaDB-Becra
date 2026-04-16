import type {Prisma} from '@/generated/prisma/client'

export const profileOmit = {
  // Never expose password hashes in profile payloads.
  password_hash: true,
} satisfies Prisma.EmployeeOmit

export type Profile = Prisma.EmployeeGetPayload<{
  omit: typeof profileOmit
  include: {
    // Include role level info for auth/permission checks.
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

// Shared include shape for session queries that need the full employee profile.
export const sessionWithProfileInclude = {
  Employee: {
    omit: profileOmit,
    include: {
      // Include role level info on session fetches.
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
