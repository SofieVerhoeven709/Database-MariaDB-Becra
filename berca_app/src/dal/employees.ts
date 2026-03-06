import 'server-only'
import {prismaClient} from './prismaClient'
import type {Prisma, Employee, EmergencyContact} from '@/generated/prisma/client'
import {cache} from 'react'
import {hashPassword} from '@/lib/passwordUtils'
import type {Profile, SessionWithProfile} from '@/models/employees'
import {profileOmit, sessionWithProfileInclude} from '@/models/employees'
import {DEFAULT_SESSION_DURATION, SessionDuration} from '@/constants'
import {randomUUID} from 'crypto'
import {logger} from '@/lib/logger'

export type CreateEmployeeParams = Prisma.EmployeeCreateInput

/**
 * Create a new user with the "User" role.
 *
 * @param data The user's profile data.
 */
export async function createEmployee(data: CreateEmployeeParams): Promise<Profile> {
  return prismaClient.employee.create({
    data: {
      ...data,
      password_hash: hashPassword(data.password_hash),
    },
    omit: profileOmit,
    include: {
      RoleLevel_Employee_roleLevelIdToRoleLevel: {
        // This is the Employee → RoleLevel relation
        include: {
          Role: true, // RoleLevel → Role
          SubRole: true, // RoleLevel → SubRole
        },
      },
    },
  })
}

/**
 * Retrieve a user's information based on their email.
 * DO NOT USE ON THE CLIENT, the response includes the user's hashed password.
 *
 * @param username The email of the user to retrieve.
 */
export async function getEmployeeByUsername(username: string): Promise<Employee | null> {
  return prismaClient.employee.findFirst({where: {username}})
}

export async function getEmployees(): Promise<
  (Employee & {
    RoleLevel_Employee_roleLevelIdToRoleLevel: {
      Role: {name: string}
      SubRole: {name: string}
    } | null
    Title_Employee_titleIdToTitle: {name: string} | null
    EmergencyContact: EmergencyContact[]
    Employee: {id: string} | null // createdBy
    Employee_Employee_deletedByToEmployee: {id: string} | null
  })[]
> {
  return prismaClient.employee.findMany({
    include: {
      RoleLevel_Employee_roleLevelIdToRoleLevel: {
        include: {
          Role: true,
          SubRole: true,
        },
      },
      Title_Employee_titleIdToTitle: true,
      EmergencyContact: true,
      Employee: true, // createdBy
      Employee_Employee_deletedByToEmployee: true, // deletedBy
    },
  })
}

/**
 * Start a new session.
 *
 * @param employeeId The id of the user for whom to start a new session.
 * @param role The role of the user for whom to start the session.
 */
export async function startSession(employeeId: string, subRole: {name: string}): Promise<SessionWithProfile> {
  const duration = SessionDuration[subRole.name.toLowerCase()] ?? DEFAULT_SESSION_DURATION

  logger.warn(subRole.name)

  return prismaClient.session.create({
    data: {
      id: randomUUID(),
      employeeId,
      activeUntil: new Date(Date.now() + duration),
    },
    include: sessionWithProfileInclude,
  })
}

/**
 * Retrieve a specific session and the corresponding session.
 *
 * @param id The id of the session to retrieve.
 */
export const getSessionProfile = cache((id: string): Promise<SessionWithProfile | null> => {
  return prismaClient.session.findUnique({
    where: {
      id,
      activeUntil: {
        gt: new Date(),
      },
    },
    include: sessionWithProfileInclude,
  })
})

/**
 * Stop a given session.
 *
 * @param id The id of the session to stop.
 */
export async function stopSession(id: string): Promise<void> {
  await prismaClient.session.update({
    where: {id},
    data: {
      activeUntil: new Date(),
    },
  })
}

export type UpdateEmployeeParams = Prisma.EmployeeUpdateInput & {
  id: string
}

/**
 * Update a user's profile.
 *
 * @param id The id of the user to update.
 * @param data The updated profile data.
 */
export async function updateEmployee({id, ...data}: UpdateEmployeeParams): Promise<Profile> {
  return prismaClient.employee.update({
    where: {id},
    data: {
      ...data,
    },
    omit: profileOmit,
    include: {
      RoleLevel_Employee_roleLevelIdToRoleLevel: {
        // This is the Employee → RoleLevel relation
        include: {
          Role: true, // RoleLevel → Role
          SubRole: true, // RoleLevel → SubRole
        },
      },
    },
  })
}

/**
 * Extend the given session so that is remains active for another 24 hours.
 *
 * @param id The id of the session to extend.
 * @param role The role of the user for whom to start the session.
 */
export async function extendSession(id: string, subRole: {name: string}): Promise<SessionWithProfile> {
  const duration = SessionDuration[subRole.name.toLowerCase()] ?? DEFAULT_SESSION_DURATION

  return prismaClient.session.update({
    where: {id},
    data: {
      activeUntil: new Date(Date.now() + duration),
    },
    include: sessionWithProfileInclude,
  })
}

export async function getEmployeeDetail(id: string) {
  const [employee, createdEmployees, deletedEmployees] = await Promise.all([
    prismaClient.employee.findUniqueOrThrow({
      where: {id},
      include: {
        RoleLevel_Employee_roleLevelIdToRoleLevel: {
          include: {Role: true, SubRole: true},
        },
        Title_Employee_titleIdToTitle: true,
        EmergencyContact: true,
        Employee: {select: {id: true, firstName: true, lastName: true}},
        Employee_Employee_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},

        // ── Section 1: Assigned ──────────────────────────────────────────────

        FollowUp_FollowUp_ownedByToEmployee: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          include: {
            Status: {select: {name: true}},
            FollowUpType: {select: {name: true}},
            UrgencyType: {select: {name: true}},
          },
        },
        FollowUp_FollowUp_executedByToEmployee: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          include: {
            Status: {select: {name: true}},
            FollowUpType: {select: {name: true}},
            UrgencyType: {select: {name: true}},
          },
        },
        FollowUpStructure_FollowUpStructure_ownedByToEmployee: {
          where: {deleted: false},
          orderBy: {contactDate: 'desc'},
          take: 50,
          include: {
            Status: {select: {name: true}},
            UrgencyType: {select: {name: true}},
          },
        },
        FollowUpStructure_FollowUpStructure_executedByToEmployee: {
          where: {deleted: false},
          orderBy: {contactDate: 'desc'},
          take: 50,
          include: {
            Status: {select: {name: true}},
            UrgencyType: {select: {name: true}},
          },
        },
        FollowUpStructure_FollowUpStructure_taskForToEmployee: {
          where: {deleted: false},
          orderBy: {contactDate: 'desc'},
          take: 50,
          include: {
            Status: {select: {name: true}},
            UrgencyType: {select: {name: true}},
          },
        },
        DocumentStructure_DocumentStructure_managedByIdToEmployee: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, documentNumber: true, descriptionShort: true, valid: true, createdAt: true},
        },
        DocumentStructure_DocumentStructure_revisedByIdToEmployee: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, documentNumber: true, descriptionShort: true, valid: true, createdAt: true},
        },
        TimeRegistryEmployee: {
          orderBy: {TimeRegistry: {workDate: 'desc'}},
          take: 50,
          include: {
            TimeRegistry: {
              select: {
                id: true,
                workDate: true,
                startTime: true,
                endTime: true,
                activityDescription: true,
                deleted: true,
                WorkOrder: {select: {id: true, workOrderNumber: true}},
              },
            },
          },
        },

        // ── Section 2: Created (Main) ────────────────────────────────────────

        Contact: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            active: true,
            Function: {select: {name: true}},
          },
        },
        Company: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, name: true, number: true, createdAt: true, companyActive: true},
        },
        Project: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {
            id: true,
            projectNumber: true,
            projectName: true,
            createdAt: true,
            isOpen: true,
            isClosed: true,
            Company: {select: {name: true}},
            ProjectType: {select: {name: true}},
          },
        },
        Training: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {
            id: true,
            trainingNumber: true,
            trainingDate: true,
            createdAt: true,
            closed: true,
            TrainingStandard: {select: {descriptionShort: true}},
          },
        },
        WorkOrder: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {
            id: true,
            workOrderNumber: true,
            description: true,
            startDate: true,
            endDate: true,
            createdAt: true,
            completed: true,
            Project: {select: {projectName: true, projectNumber: true}},
          },
        },
        InvoiceIn: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            createdAt: true,
            completed: true,
            amountWithoutVat: true,
            InvoiceType: {select: {name: true}},
          },
        },
        InvoiceOut: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            createdAt: true,
            completed: true,
            amountWithoutVat: true,
            InvoiceType: {select: {name: true}},
          },
        },
        Purchase: {
          where: {deleted: false},
          orderBy: {purchaseDate: 'desc'},
          take: 50,
          select: {
            id: true,
            orderNumber: true,
            shortDescription: true,
            purchaseDate: true,
            status: true,
            Company: {select: {name: true}},
            Project: {select: {projectName: true}},
          },
        },
        TimeRegistry: {
          where: {deleted: false},
          orderBy: {workDate: 'desc'},
          take: 50,
          select: {
            id: true,
            workDate: true,
            startTime: true,
            endTime: true,
            activityDescription: true,
            WorkOrder: {select: {workOrderNumber: true, Project: {select: {projectName: true}}}},
          },
        },
        DocumentStructure_DocumentStructure_createdByToEmployee: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, documentNumber: true, descriptionShort: true, createdAt: true, valid: true},
        },
        FollowUp_FollowUp_createdByToEmployee: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          include: {
            Status: {select: {name: true}},
            FollowUpType: {select: {name: true}},
            UrgencyType: {select: {name: true}},
          },
        },
        FollowUpStructure_FollowUpStructure_createdByToEmployee: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          include: {
            Status: {select: {name: true}},
            UrgencyType: {select: {name: true}},
          },
        },
        TrainingStandard: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, descriptionShort: true, createdAt: true},
        },
        DeliveryNoteSupplier: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {
            id: true,
            supplierNN: true,
            information: true,
            createdAt: true,
            Company: {select: {name: true}},
          },
        },
        QuoteSupplier: {
          where: {deleted: false},
          orderBy: {id: 'desc'},
          take: 50,
          select: {
            id: true,
            description: true,
            Project: {select: {projectName: true, projectNumber: true}},
          },
        },
        WorkOrderStructure: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {
            id: true,
            shortDescription: true,
            createdAt: true,
            WorkOrder: {select: {workOrderNumber: true}},
          },
        },

        // ── Section 2: Created (Other) ───────────────────────────────────────

        Certificate: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {
            id: true,
            descriptionShort: true,
            createdAt: true,
            CertificateType: {select: {name: true}},
          },
        },
        CertificateType: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, name: true, createdAt: true},
        },
        CompanyAdress: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {
            id: true,
            street: true,
            houseNumber: true,
            place: true,
            createdAt: true,
            Company: {select: {name: true}},
          },
        },
        CompanyContact: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {
            id: true,
            createdAt: true,
            roleWithCompany: true,
            Contact: {select: {firstName: true, lastName: true}},
            Company: {select: {name: true}},
          },
        },
        Department_Department_createdByToEmployee: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, name: true, createdAt: true},
        },
        Function_Function_createdByToEmployee: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, name: true, createdAt: true},
        },
        HourType: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, name: true, createdAt: true},
        },
        Inventory: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, beNumber: true, shortDescription: true, createdAt: true},
        },
        InventoryChange: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {
            id: true,
            changeDescription: true,
            createdAt: true,
            Inventory: {select: {beNumber: true, shortDescription: true}},
          },
        },
        InventoryOrder: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, orderNumber: true, shortDescription: true, createdAt: true},
        },
        InventoryStructure: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {
            id: true,
            shortDescription: true,
            createdAt: true,
            Inventory: {select: {beNumber: true}},
          },
        },
        InvoiceType: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, name: true, createdAt: true},
        },
        Material: {
          where: {deleted: false},
          orderBy: {id: 'desc'},
          take: 50,
          select: {id: true, beNumber: true, shortDescription: true},
        },
        MaterialAssembly: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, name: true, shortDescription: true, createdAt: true},
        },
        MaterialCode: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, name: true, createdAt: true},
        },
        MaterialFamily: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, name: true, createdAt: true},
        },
        MaterialOther: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {
            id: true,
            name: true,
            shortDescription: true,
            createdAt: true,
            Material: {select: {beNumber: true}},
          },
        },
        MaterialPrice: {
          where: {deleted: false},
          orderBy: {updatedAt: 'desc'},
          take: 50,
          select: {id: true, beNumber: true, shortDescription: true},
        },
        MaterialSerialTrack: {
          where: {deleted: false},
          orderBy: {updatedAt: 'desc'},
          take: 50,
          select: {id: true, beNumber: true, shortDescription: true},
        },
        Part: {
          where: {deleted: false},
          orderBy: {date: 'desc'},
          take: 50,
          select: {id: true, name: true, shortDescription: true},
        },
        Phantom: {
          where: {deleted: false},
          orderBy: {date: 'desc'},
          take: 50,
          select: {id: true, description: true},
        },
        Product: {
          where: {deleted: false},
          orderBy: {updatedAt: 'desc'},
          take: 50,
          select: {id: true, shortDescription: true, status: true},
        },
        ProjectContact_ProjectContact_createdByToEmployee: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {
            id: true,
            createdAt: true,
            Contact: {select: {firstName: true, lastName: true}},
            Project: {select: {projectNumber: true, projectName: true}},
          },
        },
        ProjectType: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, name: true, createdAt: true},
        },
        PurchaseDetail: {
          where: {deleted: false},
          orderBy: {updatedAt: 'desc'},
          take: 50,
          select: {
            id: true,
            beNumber: true,
            status: true,
            Purchase: {select: {orderNumber: true}},
          },
        },
        PurchaseOrderBecra: {
          where: {deleted: false},
          orderBy: {date: 'desc'},
          take: 50,
          select: {id: true, description: true, date: true},
        },
        QouteBecra: {
          where: {deleted: false},
          orderBy: {date: 'desc'},
          take: 50,
          select: {id: true, description: true, date: true},
        },
        Role_Role_createdByToEmployee: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, name: true, createdAt: true},
        },
        RoleLevel_RoleLevel_createdByToEmployee: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {
            id: true,
            createdAt: true,
            Role: {select: {name: true}},
            SubRole: {select: {name: true}},
          },
        },
        Status: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, name: true, createdAt: true},
        },
        SubRole_SubRole_createdByToEmployee: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, name: true, createdAt: true},
        },
        SupplierDeliveryNoteFollowUp: {
          where: {deleted: false},
          orderBy: {deliveryDate: 'desc'},
          take: 50,
          select: {
            id: true,
            information: true,
            deliveryDate: true,
            DeliveryNoteSupplier: {select: {supplierNN: true}},
          },
        },
        Target: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {
            id: true,
            createdAt: true,
            TargetType: {select: {name: true}},
          },
        },
        TargetType: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, name: true, createdAt: true},
        },
        TestProcedure: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, name: true, shortDescription: true, createdAt: true},
        },
        Title_Title_createdByToEmployee: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, name: true, createdAt: true},
        },
        TrainingContact: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {
            id: true,
            createdAt: true,
            Contact: {select: {firstName: true, lastName: true}},
            Training: {select: {trainingNumber: true}},
          },
        },
        Unit: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, unitName: true, abbreviation: true, createdAt: true},
        },
        UrgencyType: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, name: true, createdAt: true},
        },
        WarehousePlace: {
          where: {deleted: false},
          orderBy: {createdAt: 'desc'},
          take: 50,
          select: {id: true, place: true, shelf: true, createdAt: true},
        },

        // ── Section 3: Deleted (Main) ────────────────────────────────────────

        Contact_Contact_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            deletedAt: true,
            Function: {select: {name: true}},
          },
        },
        Company_Company_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, name: true, number: true, deletedAt: true},
        },
        Project_Project_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {
            id: true,
            projectNumber: true,
            projectName: true,
            deletedAt: true,
            Company: {select: {name: true}},
          },
        },
        Training_Training_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {
            id: true,
            trainingNumber: true,
            trainingDate: true,
            deletedAt: true,
            TrainingStandard: {select: {descriptionShort: true}},
          },
        },
        WorkOrder_WorkOrder_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {
            id: true,
            workOrderNumber: true,
            deletedAt: true,
            Project: {select: {projectName: true}},
          },
        },
        InvoiceIn_InvoiceIn_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, invoiceNumber: true, invoiceDate: true, deletedAt: true, amountWithoutVat: true},
        },
        InvoiceOut_InvoiceOut_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, invoiceNumber: true, invoiceDate: true, deletedAt: true, amountWithoutVat: true},
        },
        Purchase_Purchase_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {
            id: true,
            orderNumber: true,
            shortDescription: true,
            deletedAt: true,
            purchaseDate: true,
            Company: {select: {name: true}},
            Project: {select: {projectName: true}},
          },
        },
        TimeRegistry_TimeRegistry_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {
            id: true,
            workDate: true,
            deletedAt: true,
            activityDescription: true,
            WorkOrder: {select: {workOrderNumber: true, Project: {select: {projectName: true}}}},
          },
        },
        DocumentStructure_DocumentStructure_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, documentNumber: true, descriptionShort: true, deletedAt: true},
        },
        FollowUp_FollowUp_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          include: {
            Status: {select: {name: true}},
            FollowUpType: {select: {name: true}},
            UrgencyType: {select: {name: true}},
          },
        },
        FollowUpStructure_FollowUpStructure_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          include: {
            Status: {select: {name: true}},
            UrgencyType: {select: {name: true}},
          },
        },
        TrainingStandard_TrainingStandard_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, descriptionShort: true, deletedAt: true},
        },
        DeliveryNoteSupplier_DeliveryNoteSupplier_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {
            id: true,
            supplierNN: true,
            information: true,
            deletedAt: true,
            Company: {select: {name: true}},
          },
        },
        QuoteSupplier_QuoteSupplier_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {
            id: true,
            description: true,
            deletedAt: true,
            Project: {select: {projectName: true, projectNumber: true}},
          },
        },
        WorkOrderStructure_WorkOrderStructure_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {
            id: true,
            shortDescription: true,
            deletedAt: true,
            WorkOrder: {select: {workOrderNumber: true}},
          },
        },

        // ── Section 3: Deleted (Other) ───────────────────────────────────────

        Certificate_Certificate_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {
            id: true,
            descriptionShort: true,
            deletedAt: true,
            CertificateType: {select: {name: true}},
          },
        },
        CertificateType_CertificateType_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, name: true, deletedAt: true},
        },
        CompanyAdress_CompanyAdress_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {
            id: true,
            street: true,
            houseNumber: true,
            place: true,
            deletedAt: true,
            Company: {select: {name: true}},
          },
        },
        CompanyContact_CompanyContact_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {
            id: true,
            deletedAt: true,
            roleWithCompany: true,
            Contact: {select: {firstName: true, lastName: true}},
            Company: {select: {name: true}},
          },
        },
        Department_Department_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, name: true, deletedAt: true},
        },
        Function_Function_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, name: true, deletedAt: true},
        },
        HourType_HourType_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, name: true, deletedAt: true},
        },
        Inventory_Inventory_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, beNumber: true, shortDescription: true, deletedAt: true},
        },
        InventoryChange_InventoryChange_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {
            id: true,
            changeDescription: true,
            deletedAt: true,
            Inventory: {select: {beNumber: true, shortDescription: true}},
          },
        },
        InventoryOrder_InventoryOrder_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, orderNumber: true, shortDescription: true, deletedAt: true},
        },
        InventoryStructure_InventoryStructure_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {
            id: true,
            shortDescription: true,
            deletedAt: true,
            Inventory: {select: {beNumber: true}},
          },
        },
        InvoiceType_InvoiceType_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, name: true, deletedAt: true},
        },
        Material_Material_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, beNumber: true, shortDescription: true, deletedAt: true},
        },
        MaterialAssembly_MaterialAssembly_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, name: true, shortDescription: true, deletedAt: true},
        },
        MaterialCode_MaterialCode_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, name: true, deletedAt: true},
        },
        MaterialFamily_MaterialFamily_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, name: true, deletedAt: true},
        },
        MaterialMovement_MaterialMovement_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, shortDescription: true, deletedAt: true},
        },
        MaterialOther_MaterialOther_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {
            id: true,
            name: true,
            shortDescription: true,
            deletedAt: true,
            Material: {select: {beNumber: true}},
          },
        },
        MaterialPrice_MaterialPrice_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, beNumber: true, shortDescription: true, deletedAt: true},
        },
        MaterialSerialTrack_MaterialSerialTrack_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, beNumber: true, shortDescription: true, deletedAt: true},
        },
        Part_Part_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, name: true, shortDescription: true, deletedAt: true},
        },
        Phantom_Phantom_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, description: true, deletedAt: true},
        },
        Product_Product_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, shortDescription: true, status: true, deletedAt: true},
        },
        ProjectContact_ProjectContact_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {
            id: true,
            deletedAt: true,
            Contact: {select: {firstName: true, lastName: true}},
            Project: {select: {projectNumber: true, projectName: true}},
          },
        },
        ProjectType_ProjectType_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, name: true, deletedAt: true},
        },
        PurchaseDetail_PurchaseDetail_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {
            id: true,
            beNumber: true,
            status: true,
            deletedAt: true,
            Purchase: {select: {orderNumber: true}},
          },
        },
        PurchaseOrderBecra_PurchaseOrderBecra_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, description: true, deletedAt: true},
        },
        QouteBecra_QouteBecra_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, description: true, deletedAt: true},
        },
        Role_Role_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, name: true, deletedAt: true},
        },
        RoleLevel_RoleLevel_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {
            id: true,
            deletedAt: true,
            Role: {select: {name: true}},
            SubRole: {select: {name: true}},
          },
        },
        Status_Status_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, name: true, deletedAt: true},
        },
        SubRole_SubRole_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, name: true, deletedAt: true},
        },
        SupplierDeliveryNoteFollowUp_SupplierDeliveryNoteFollowUp_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {
            id: true,
            information: true,
            deletedAt: true,
            DeliveryNoteSupplier: {select: {supplierNN: true}},
          },
        },
        Target_Target_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {
            id: true,
            deletedAt: true,
            TargetType: {select: {name: true}},
          },
        },
        TargetType_TargetType_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, name: true, deletedAt: true},
        },
        TestProcedure_TestProcedure_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, name: true, shortDescription: true, deletedAt: true},
        },
        Title_Title_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, name: true, deletedAt: true},
        },
        TrainingContact_TrainingContact_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {
            id: true,
            deletedAt: true,
            Contact: {select: {firstName: true, lastName: true}},
            Training: {select: {trainingNumber: true}},
          },
        },
        Unit_Unit_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, unitName: true, abbreviation: true, deletedAt: true},
        },
        UrgencyType_UrgencyType_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, name: true, deletedAt: true},
        },
        WarehousePlace_WarehousePlace_deletedByToEmployee: {
          where: {deleted: true},
          orderBy: {deletedAt: 'desc'},
          take: 50,
          select: {id: true, place: true, shelf: true, deletedAt: true},
        },
      },
    }),
    prismaClient.employee.findMany({
      where: {createdBy: id, deleted: false},
      orderBy: {createdAt: 'desc'},
      take: 50,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        active: true,
        RoleLevel_Employee_roleLevelIdToRoleLevel: {
          include: {Role: true, SubRole: true},
        },
      },
    }),
    prismaClient.employee.findMany({
      where: {deletedBy: id, deleted: true},
      orderBy: {deletedAt: 'desc'},
      take: 50,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        deletedAt: true,
        RoleLevel_Employee_roleLevelIdToRoleLevel: {
          include: {Role: true, SubRole: true},
        },
      },
    }),
  ])

  return {employee, createdEmployees, deletedEmployees}
}
