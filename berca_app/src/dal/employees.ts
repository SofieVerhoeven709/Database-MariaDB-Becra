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
  return prismaClient.employee.findUniqueOrThrow({
    where: {id},
    include: {
      RoleLevel_Employee_roleLevelIdToRoleLevel: {
        include: {Role: true, SubRole: true},
      },
      Title_Employee_titleIdToTitle: true,
      EmergencyContact: true,
      Employee: {select: {id: true, firstName: true, lastName: true}}, // createdBy
      Employee_Employee_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}}, // deletedBy

      // ── Section 1: Assigned ──────────────────────────────────────────────

      // FollowUps where employee is owner or executor
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

      // FollowUpStructures where employee is owner, executor, or taskFor
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

      // DocumentStructures where employee is manager or revisor
      DocumentStructure_DocumentStructure_managedByIdToEmployee: {
        where: {deleted: false},
        orderBy: {createdAt: 'desc'},
        take: 50,
        select: {
          id: true,
          documentNumber: true,
          descriptionShort: true,
          valid: true,
          createdAt: true,
        },
      },
      DocumentStructure_DocumentStructure_revisedByIdToEmployee: {
        where: {deleted: false},
        orderBy: {createdAt: 'desc'},
        take: 50,
        select: {
          id: true,
          documentNumber: true,
          descriptionShort: true,
          valid: true,
          createdAt: true,
        },
      },

      // TimeRegistry entries this employee participated in (not created)
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

      // ── Section 2: Created ───────────────────────────────────────────────

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
        select: {
          id: true,
          name: true,
          number: true,
          createdAt: true,
          companyActive: true,
        },
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

      // ── Section 3: Deleted ───────────────────────────────────────────────

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
        select: {
          id: true,
          name: true,
          number: true,
          deletedAt: true,
        },
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
        select: {
          id: true,
          invoiceNumber: true,
          invoiceDate: true,
          deletedAt: true,
          amountWithoutVat: true,
        },
      },
      InvoiceOut_InvoiceOut_deletedByToEmployee: {
        where: {deleted: true},
        orderBy: {deletedAt: 'desc'},
        take: 50,
        select: {
          id: true,
          invoiceNumber: true,
          invoiceDate: true,
          deletedAt: true,
          amountWithoutVat: true,
        },
      },
    },
  })
}
