import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

const boqInclude = {
  BillOfQuantitiesType: {select: {id: true, name: true}},
  Employee_BillOfQuantities_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  PaymentMethod: {select: {id: true, name: true}},
  BillOfQuantitiesSentType: {select: {id: true, name: true}},
  BillOfQuantitiesStatus: {select: {id: true, name: true}},
  Target: true,
  Employee_BillOfQuantities_deletedByToEmployee: true,
  Employee_BillOfQuantities_modifiedByToEmployee: true,
  PriceList: {
    select: {
      id: true,
      name: true,
      PriceListItem: {
        where: {deleted: false},
        select: {
          id: true,
          description: true,
          unit: true,
          price: true,
          isCostMargin: true,
          PriceListItemTarget: {select: {targetId: true}},
        },
      },
    },
  },
  BoqContact: {
    include: {
      Contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          mail1: true,
          generalPhone: true,
        },
      },
    },
  },
  WorkOrderBoQ: {
    where: {deleted: false},
    include: {
      WorkOrder: {
        select: {
          id: true,
          workOrderNumber: true,
          description: true,
          completed: true,
          hoursMaterialClosed: true,
          projectId: true,
          Project: {
            select: {
              id: true,
              projectNumber: true,
              projectName: true,
              companyId: true,
              Company: {select: {id: true, name: true}},
            },
          },
          TimeRegistry: {
            where: {deleted: false, approved: true},
            select: {
              id: true,
              invoiceTime: true,
              stayOver: true,
              startTime: true,
              endTime: true,
              startBreak: true,
              endBreak: true,
              hourTypeId: true,
              vatMarginId: true,
              HourType: {select: {id: true, name: true, targetId: true}},
              VatMargin: {select: {id: true, vat: true}},
              TimeRegistryEmployee: {select: {id: true, employeeId: true}},
            },
          },
          WorkOrderStructure: {
            where: {deleted: false},
            select: {
              id: true,
              quantity: true,
              shortDescription: true,
              materialId: true,
              vatMarginId: true,
              VatMargin: {select: {id: true, vat: true}},
              Material: {
                select: {
                  id: true,
                  name: true,
                  shortDescription: true,
                  beNumber: true,
                  targetId: true,
                  Unit: {select: {abbreviation: true}},
                },
              },
            },
          },
          Training: {
            where: {deleted: false},
            select: {
              id: true,
              trainingNumber: true,
              targetId: true,
              vatMarginId: true,
              VatMargin: {select: {id: true, vat: true}},
              TrainingStandard: {
                select: {
                  id: true,
                  descriptionShort: true,
                  description: true,
                  location: true,
                  targetId: true,
                  Certificate: {select: {descriptionShort: true}},
                },
              },
            },
          },
        },
      },
    },
  },
} as const

// ─── BillOfQuantities ─────────────────────────────────────────────────────────
export async function getBoqs() {
  return prismaClient.billOfQuantities.findMany({
    include: boqInclude,
    orderBy: {boqDate: 'desc'},
  })
}

export async function getBoqById(id: string) {
  return prismaClient.billOfQuantities.findUniqueOrThrow({
    where: {id},
    include: boqInclude,
  })
}

// ─── Price lists available for a set of companies ────────────────────────────
export async function getPriceListsForCompanies(companyIds: string[]) {
  if (companyIds.length === 0) return []
  const rows = await prismaClient.priceListCompany.findMany({
    where: {
      companyId: {in: companyIds},
      PriceList: {deleted: false},
    },
    select: {
      PriceList: {select: {id: true, name: true}},
    },
    distinct: ['priceListId'],
  })
  return rows.map(r => r.PriceList)
}

// ─── Company contacts for BoQ ─────────────────────────────────────────────────
export async function getCompanyContactsForBoq(companyIds: string[]) {
  if (companyIds.length === 0) return []
  return prismaClient.companyContact.findMany({
    where: {
      deleted: false,
      companyId: {in: companyIds},
      endDate: null,
    },
    select: {
      id: true,
      Contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          mail1: true,
          generalPhone: true,
        },
      },
    },
    orderBy: {Contact: {lastName: 'asc'}},
  })
}

// ─── Lookup tables ────────────────────────────────────────────────────────────
export async function getBoqTypes() {
  return prismaClient.billOfQuantitiesType.findMany({
    where: {deleted: false},
    select: {id: true, name: true},
    orderBy: {name: 'asc'},
  })
}

export async function getBoqSentTypes() {
  return prismaClient.billOfQuantitiesSentType.findMany({
    where: {deleted: false},
    select: {id: true, name: true},
    orderBy: {name: 'asc'},
  })
}

export async function getBoqStatuses() {
  return prismaClient.billOfQuantitiesStatus.findMany({
    where: {deleted: false},
    select: {id: true, name: true},
    orderBy: {name: 'asc'},
  })
}

export async function getPaymentMethods() {
  return prismaClient.paymentMethod.findMany({
    where: {deleted: false},
    select: {id: true, name: true},
    orderBy: {name: 'asc'},
  })
}

export async function getOpenProjects() {
  return prismaClient.project.findMany({
    where: {deleted: false, isOpen: true, isClosed: false},
    select: {
      id: true,
      projectNumber: true,
      projectName: true,
      Company: {select: {name: true}},
    },
    orderBy: {projectNumber: 'asc'},
  })
}
