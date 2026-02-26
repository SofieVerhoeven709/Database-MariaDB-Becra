import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

export async function getCompanies() {
  return prismaClient.company.findMany({
    include: {
      Company: true,
      Employee: {select: {id: true, firstName: true, lastName: true}},
      Employee_Company_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
      CompanyAdress: true,
    },
  })
}

export async function getCompanyById(id: string) {
  return prismaClient.company.findUniqueOrThrow({
    where: {id},
    include: {
      Company: true,
      Employee: {select: {id: true, firstName: true, lastName: true}},
      Employee_Company_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
      CompanyAdress: true,
    },
  })
}
