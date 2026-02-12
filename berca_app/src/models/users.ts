import type {Prisma} from '@/generated/prisma/client'

export const profileOmit = {
  password_hash: true,
} satisfies Prisma.EmployeeOmit

export type Profile = Prisma.EmployeeGetPayload<{
  omit: typeof profileOmit
  include: {Role_Employee_roleIdToRole: true}
}>

export const sessionWithProfileInclude = {
  Employee: {
    omit: profileOmit,
    include: {Role_Employee_roleIdToRole: true},
  },
} satisfies Prisma.SessionInclude

export type SessionWithProfile = Prisma.SessionGetPayload<{
  include: typeof sessionWithProfileInclude
}>
