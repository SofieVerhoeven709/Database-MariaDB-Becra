import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

const companyInclude = {
  Company: true,
  Employee: {select: {id: true, firstName: true, lastName: true}},
  Employee_Company_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  CompanyAdress: true,
  Target: {
    include: {
      VisibilityForRole: {
        include: {
          RoleLevel: {
            include: {
              Role: true,
              SubRole: true,
            },
          },
        },
      },
    },
  },
} as const

export async function getCompanies() {
  return prismaClient.company.findMany({include: companyInclude})
}

export async function getCompanyById(id: string) {
  return prismaClient.company.findUniqueOrThrow({where: {id}, include: companyInclude})
}
