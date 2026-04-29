import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

const invoiceOutInclude = {
  // Shared include bundle for invoice-out list/detail.
  InvoiceType: {select: {id: true, name: true}},
  Employee: {select: {id: true, firstName: true, lastName: true}},
  PaymentMethod: {select: {id: true, name: true}},
  InvoiceSentType: {select: {id: true, name: true}},
  InvoiceStatus: {select: {id: true, name: true}},
  Target: true,
  Employee_InvoiceOut_deletedByToEmployee: true,
  Employee_InvoiceOut_modifiedByToEmployee: true,
  // ← Price list at invoice level
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
  InvoiceOutContact: {
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
  WorkOrderInvoice: {
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
              // No PriceList here anymore — it's on the invoice
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
              VatMargin: {
                select: {
                  id: true,
                  vat: true,
                },
              },
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

const invoiceInInclude = {
  // Shared include bundle for invoice-in list/detail.
  InvoiceType: {select: {id: true, name: true}},
  Employee: {select: {id: true, firstName: true, lastName: true}},
  PaymentMethod: {select: {id: true, name: true}},
  InvoiceSentType: {select: {id: true, name: true}},
  InvoiceStatus: {select: {id: true, name: true}},
  VatMargin: {select: {id: true, vat: true}},
  Company: {select: {id: true, name: true}},
  Purchase: {select: {id: true, description: true, purchaseNumber: true}},
} as const

// ─── InvoiceOut ────────────────────────────────────────────────────────────────
export async function getInvoicesOut() {
  return prismaClient.invoiceOut.findMany({
    include: invoiceOutInclude,
    orderBy: {invoiceDate: 'desc'},
  })
}

export async function getInvoiceOutById(id: string) {
  return prismaClient.invoiceOut.findUniqueOrThrow({
    where: {id},
    include: invoiceOutInclude,
  })
}

// ─── InvoiceIn ─────────────────────────────────────────────────────────────────
export async function getInvoicesIn() {
  return prismaClient.invoiceIn.findMany({
    include: invoiceInInclude,
    orderBy: {invoiceDate: 'desc'},
  })
}

export async function getInvoiceInById(id: string) {
  return prismaClient.invoiceIn.findUniqueOrThrow({
    where: {id},
    include: invoiceInInclude,
  })
}

// ─── Price lists available for a set of companies (via PriceListCompany) ──────
// Returns all non-deleted price lists assigned to any of the given companies.
// Deduped — if multiple companies share the same list, it appears once.
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

// ─── Company contacts for invoice ──────────────────────────────────────────────
export async function getCompanyContactsForInvoice(companyIds: string[]) {
  if (companyIds.length === 0) return []
  return prismaClient.companyContact.findMany({
    where: {
      deleted: false,
      companyId: {in: companyIds},
      endDate: null,
    },
    // Active contacts ordered by contact last name for dropdowns.
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

// ─── Lookup tables ─────────────────────────────────────────────────────────────
export async function getInvoiceTypes() {
  return prismaClient.invoiceType.findMany({
    where: {deleted: false},
    select: {id: true, name: true},
    // Stable ordering for select inputs.
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

export async function getInvoiceSentTypes() {
  return prismaClient.invoiceSentType.findMany({
    where: {deleted: false},
    select: {id: true, name: true},
    orderBy: {name: 'asc'},
  })
}

export async function getInvoiceStatuses() {
  return prismaClient.invoiceStatus.findMany({
    where: {deleted: false},
    select: {id: true, name: true},
    orderBy: {name: 'asc'},
  })
}

export async function getVatMargins() {
  return prismaClient.vatMargin.findMany({
    where: {deleted: false},
    select: {id: true, vat: true, countryId: true, Country: {select: {id: true, name: true}}},
    orderBy: {vat: 'asc'},
  })
}

export async function getAllVatMargins() {
  const rows = await prismaClient.vatMargin.findMany({
    orderBy: {vat: 'asc'},
  })

  const countryIds = [...new Set(rows.map(r => r.countryId).filter((id): id is string => !!id))]
  const employeeIds = [...new Set(rows.flatMap(r => [r.createdBy, r.deletedBy]).filter((id): id is string => !!id))]

  const [countries, employees] = await Promise.all([
    countryIds.length
      ? prismaClient.country.findMany({
          where: {id: {in: countryIds}},
          select: {id: true, name: true},
        })
      : Promise.resolve([]),
    employeeIds.length
      ? prismaClient.employee.findMany({
          where: {id: {in: employeeIds}},
          select: {id: true, firstName: true, lastName: true},
        })
      : Promise.resolve([]),
  ])

  const countryById = new Map(countries.map(c => [c.id, c]))
  const employeeById = new Map(employees.map(e => [e.id, e]))

  return rows.map(r => ({
    ...r,
    countryName: r.countryId ? (countryById.get(r.countryId)?.name ?? null) : null,
    createdByName: employeeById.get(r.createdBy)
      ? `${employeeById.get(r.createdBy)!.firstName} ${employeeById.get(r.createdBy)!.lastName}`
      : r.createdBy,
    deletedByName: r.deletedBy
      ? employeeById.get(r.deletedBy)
        ? `${employeeById.get(r.deletedBy)!.firstName} ${employeeById.get(r.deletedBy)!.lastName}`
        : r.deletedBy
      : null,
  }))
}

export async function getCountries() {
  return prismaClient.country.findMany({
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

export async function getActiveWorkOrdersForProject(projectId: string) {
  return prismaClient.workOrder.findMany({
    where: {
      deleted: false,
      completed: false,
      projectId,
      WorkOrderInvoice: {
        none: {deleted: false},
      },
    },
    select: {id: true, workOrderNumber: true, description: true},
    orderBy: {workOrderNumber: 'asc'},
  })
}

export async function getMaterialPricesForBeNumbers(beNumbers: string[]): Promise<Map<string, number>> {
  if (beNumbers.length === 0) return new Map()

  const rows = await prismaClient.materialPrice.findMany({
    where: {
      deleted: false,
      beNumber: {in: beNumbers},
      unitPrice: {not: null},
    },
    select: {beNumber: true, unitPrice: true},
  })

  const map = new Map<string, number>()
  for (const row of rows) {
    if (!row.beNumber || row.unitPrice == null) continue
    const price = Number(row.unitPrice.toString())
    const existing = map.get(row.beNumber)
    if (existing === undefined || price < existing) {
      map.set(row.beNumber, price)
    }
  }
  return map
}
