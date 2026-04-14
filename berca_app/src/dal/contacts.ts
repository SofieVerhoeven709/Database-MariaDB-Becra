import {prismaClient} from '@/dal/prismaClient'

export async function getContacts() {
  return prismaClient.contact.findMany({
    include: {
      Employee: {select: {id: true, firstName: true, lastName: true}},
      Employee_Contact_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
      Function: {select: {id: true, name: true}},
      DepartmentExtern: {select: {id: true, name: true}},
      Title: {select: {id: true, name: true}},
      // Current company: active link = no endDate or endDate in future
      CompanyContact: {
        where: {deleted: false},
        select: {
          endDate: true,
          roleWithCompany: true,
          Company: {select: {name: true}},
        },
      },
      Target: {
        select: {
          id: true,
          VisibilityForRole: {
            include: {RoleLevel: {include: {Role: true, SubRole: true}}},
          },
        },
      },
    },
    orderBy: [{lastName: 'asc'}, {firstName: 'asc'}],
  })
}

export async function getContactOptions() {
  return prismaClient.contact.findMany({
    where: {deleted: false},
    select: {id: true, firstName: true, lastName: true},
    orderBy: [{lastName: 'asc'}, {firstName: 'asc'}],
  })
}

export async function getCompanyContactOptions(companyId: string) {
  return prismaClient.contact.findMany({
    where: {
      deleted: false,
      CompanyContact: {
        none: {
          companyId,
          deleted: false,
        },
      },
      NOT: {
        CompanyContact: {
          some: {
            deleted: false,
            OR: [
              {roleWithCompany: 'Invoice'},
              {roleWithCompany: 'INVOICE'},
              {roleWithCompany: 'invoice'},
            ],
          },
        },
      },
    },
    select: {id: true, firstName: true, lastName: true},
    orderBy: [{lastName: 'asc'}, {firstName: 'asc'}],
  })
}

export async function getContactDetail(id: string) {
  return prismaClient.contact.findUniqueOrThrow({
    where: {id},
    include: {
      Employee: {select: {id: true, firstName: true, lastName: true}},
      Function: {select: {id: true, name: true}},
      DepartmentExtern: {select: {id: true, name: true}},
      Title: {select: {id: true, name: true}},

      // Companies tab
      CompanyContact: {
        orderBy: {startedDate: 'desc'},
        include: {
          Company: {
            select: {
              id: true,
              name: true,
              officialName: true,
              number: true,
              idOld: true,
              mail: true,
              businessPhone: true,
              website: true,
              vatNumber: true,
              bankNumber: true,
              iban: true,
              bic: true,
              becraCustomerNumber: true,
              becraWebsiteLogin: true,
              supplier: true,
              preferredSupplier: true,
              companyActive: true,
              newsLetter: true,
              customer: true,
              potentialCustomer: true,
              headQuarters: true,
              potentialSubContractor: true,
              subContractor: true,
              notes: true,
              createdAt: true,
              createdBy: true,
              companyId: true,
              targetId: true,
              deleted: true,
              deletedAt: true,
              deletedBy: true,
            },
          },
          Employee: {select: {firstName: true, lastName: true}},
          CompanyAddress: {
            // ← add this
            include: {Country: {select: {name: true}}},
          },
        },
      },

      // Projects tab — named relation for createdBy
      ProjectContact: {
        orderBy: {createdAt: 'desc'},
        include: {
          Project: {
            select: {
              id: true,
              projectNumber: true,
              projectName: true,
              startDate: true,
              endDate: true,
              isOpen: true,
              isClosed: true,
              ProjectType: {select: {name: true}},
            },
          },
          Employee_ProjectContact_createdByToEmployee: {
            select: {firstName: true, lastName: true},
          },
        },
      },

      // Trainings tab
      TrainingContact: {
        orderBy: {createdAt: 'desc'},
        include: {
          Employee: {select: {firstName: true, lastName: true}},
          Training: {
            select: {
              id: true,
              trainingNumber: true,
              trainingDate: true,
              TrainingStandard: {select: {descriptionShort: true}},
            },
          },
        },
      },

      // Follow-ups tab — FollowUpStructure has contactDate and activityDescription
      FollowUpStructure: {
        orderBy: {contactDate: 'desc'},
        include: {
          Employee_FollowUpStructure_createdByToEmployee: {
            select: {firstName: true, lastName: true},
          },
        },
      },

      // Visibility
      Target: {
        include: {
          VisibilityForRole: {
            include: {RoleLevel: {include: {Role: true, SubRole: true}}},
          },
        },
      },
    },
  })
}
