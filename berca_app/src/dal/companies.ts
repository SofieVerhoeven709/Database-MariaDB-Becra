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

export async function getCompanyDetail(id: string) {
  return prismaClient.company.findUniqueOrThrow({
    where: {id},
    include: {
      Employee: {select: {id: true, firstName: true, lastName: true}},
      Company: {select: {id: true, name: true}},
      other_Company: {
        where: {deleted: false},
        select: {id: true, name: true, number: true, companyActive: true},
      },
      CompanyAdress: {
        where: {deleted: false},
        orderBy: {createdAt: 'asc'},
      },
      CompanyContact: {
        where: {deleted: false},
        include: {
          Contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              mail1: true,
              mail2: true,
              mail3: true,
              generalPhone: true,
              mobilePhone: true,
              homePhone: true,
              active: true,
            },
          },
          Employee: {select: {firstName: true, lastName: true}},
        },
        orderBy: {startedDate: 'desc'},
      },
      Project: {
        where: {deleted: false},
        include: {
          ProjectType: {select: {name: true}},
          Employee: {select: {firstName: true, lastName: true}},
        },
        orderBy: {createdAt: 'desc'},
      },
      Target: {
        include: {
          VisibilityForRole: {
            include: {
              RoleLevel: {include: {Role: true, SubRole: true}},
            },
          },
        },
      },
    },
  })
}
