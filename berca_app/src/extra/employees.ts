import {EmergencyContact, Employee, Prisma} from '@/generated/prisma/client'
import type {EmployeeDetailData, MappedEmployee, UnifiedRecord} from '@/types/employee'

type EmployeeWithRelations = Employee & {
  RoleLevel_Employee_roleLevelIdToRoleLevel: {
    Role: {name: string}
    SubRole: {name: string}
  } | null
  Title_Employee_titleIdToTitle: {name: string} | null
  EmergencyContact: EmergencyContact[]
  Employee: {id: string} | null
  Employee_Employee_deletedByToEmployee: {id: string} | null
}

export function mapEmployee(prismaEmp: EmployeeWithRelations): MappedEmployee {
  return {
    id: prismaEmp.id,
    firstName: prismaEmp.firstName,
    lastName: prismaEmp.lastName,
    mail: prismaEmp.mail,
    username: prismaEmp.username,
    phoneNumber: prismaEmp.phoneNumber,
    birthDate: prismaEmp.birthDate?.toISOString() ?? null,
    startDate: prismaEmp.startDate?.toISOString(),
    endDate: prismaEmp.endDate?.toISOString() ?? null,
    info: prismaEmp.info,
    street: prismaEmp.street,
    houseNumber: prismaEmp.houseNumber,
    busNumber: prismaEmp.busNumber,
    zipCode: prismaEmp.zipCode,
    place: prismaEmp.place,
    permanentEmployee: prismaEmp.permanentEmployee,
    checkInfo: prismaEmp.checkInfo,
    newYearCard: prismaEmp.newYearCard,
    active: prismaEmp.active,
    createdAt: prismaEmp.createdAt.toISOString(),
    createdBy: prismaEmp.Employee?.id ?? null,
    passwordCreatedAt: prismaEmp.passwordCreatedAt.toISOString(),
    pictureId: prismaEmp.pictureId,
    deleted: prismaEmp.deleted,
    deletedAt: prismaEmp.deletedAt?.toISOString() ?? null,
    deletedBy: prismaEmp.Employee_Employee_deletedByToEmployee?.id ?? null,
    roleLevelId: prismaEmp.roleLevelId,
    titleId: prismaEmp.titleId,
    roleName: prismaEmp.RoleLevel_Employee_roleLevelIdToRoleLevel
      ? `${prismaEmp.RoleLevel_Employee_roleLevelIdToRoleLevel.Role.name.replace(' Role', '')} / ${prismaEmp.RoleLevel_Employee_roleLevelIdToRoleLevel.SubRole.name}`
      : '-',
    titleName: prismaEmp.Title_Employee_titleIdToTitle?.name ?? '-',
    emergencyContacts: prismaEmp.EmergencyContact ?? [],
  }
}

type EmployeeDetailPayload = Prisma.EmployeeGetPayload<{
  include: {
    RoleLevel_Employee_roleLevelIdToRoleLevel: {include: {Role: true; SubRole: true}}
    Title_Employee_titleIdToTitle: true
    EmergencyContact: true
    Employee: {select: {id: true; firstName: true; lastName: true}}
    Employee_Employee_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    FollowUp_FollowUp_ownedByToEmployee: {
      include: {
        Status: {select: {name: true}}
        FollowUpType: {select: {name: true}}
        UrgencyType: {select: {name: true}}
      }
    }
    FollowUp_FollowUp_executedByToEmployee: {
      include: {
        Status: {select: {name: true}}
        FollowUpType: {select: {name: true}}
        UrgencyType: {select: {name: true}}
      }
    }
    FollowUpStructure_FollowUpStructure_ownedByToEmployee: {
      include: {Status: {select: {name: true}}; UrgencyType: {select: {name: true}}}
    }
    FollowUpStructure_FollowUpStructure_executedByToEmployee: {
      include: {Status: {select: {name: true}}; UrgencyType: {select: {name: true}}}
    }
    FollowUpStructure_FollowUpStructure_taskForToEmployee: {
      include: {Status: {select: {name: true}}; UrgencyType: {select: {name: true}}}
    }
    DocumentStructure_DocumentStructure_managedByIdToEmployee: {
      select: {id: true; documentNumber: true; descriptionShort: true; valid: true; createdAt: true}
    }
    DocumentStructure_DocumentStructure_revisedByIdToEmployee: {
      select: {id: true; documentNumber: true; descriptionShort: true; valid: true; createdAt: true}
    }
    TimeRegistryEmployee: {
      include: {
        TimeRegistry: {
          select: {
            id: true
            workDate: true
            startTime: true
            endTime: true
            activityDescription: true
            deleted: true
            WorkOrder: {select: {id: true; workOrderNumber: true}}
          }
        }
      }
    }
    Contact: {
      select: {
        id: true
        firstName: true
        lastName: true
        createdAt: true
        active: true
        Function: {select: {name: true}}
      }
    }
    Company: {select: {id: true; name: true; number: true; createdAt: true; companyActive: true}}
    Project: {
      select: {
        id: true
        projectNumber: true
        projectName: true
        createdAt: true
        isOpen: true
        isClosed: true
        Company: {select: {name: true}}
        ProjectType: {select: {name: true}}
      }
    }
    Training: {
      select: {
        id: true
        trainingNumber: true
        trainingDate: true
        createdAt: true
        closed: true
        TrainingStandard: {select: {descriptionShort: true}}
      }
    }
    WorkOrder: {
      select: {
        id: true
        workOrderNumber: true
        description: true
        startDate: true
        endDate: true
        createdAt: true
        completed: true
        Project: {select: {projectName: true; projectNumber: true}}
      }
    }
    InvoiceIn: {
      select: {
        id: true
        invoiceNumber: true
        invoiceDate: true
        createdAt: true
        completed: true
        amountWithoutVat: true
        InvoiceType: {select: {name: true}}
      }
    }
    InvoiceOut: {
      select: {
        id: true
        invoiceNumber: true
        invoiceDate: true
        createdAt: true
        completed: true
        amountWithoutVat: true
        InvoiceType: {select: {name: true}}
      }
    }
    Purchase: {
      select: {
        id: true
        orderNumber: true
        shortDescription: true
        purchaseDate: true
        status: true
        Company: {select: {name: true}}
        Project: {select: {projectName: true}}
      }
    }
    TimeRegistry: {
      select: {
        id: true
        workDate: true
        startTime: true
        endTime: true
        activityDescription: true
        WorkOrder: {select: {workOrderNumber: true; Project: {select: {projectName: true}}}}
      }
    }
    Contact_Contact_deletedByToEmployee: {
      select: {id: true; firstName: true; lastName: true; deletedAt: true; Function: {select: {name: true}}}
    }
    Company_Company_deletedByToEmployee: {select: {id: true; name: true; number: true; deletedAt: true}}
    Project_Project_deletedByToEmployee: {
      select: {id: true; projectNumber: true; projectName: true; deletedAt: true; Company: {select: {name: true}}}
    }
    Training_Training_deletedByToEmployee: {
      select: {
        id: true
        trainingNumber: true
        trainingDate: true
        deletedAt: true
        TrainingStandard: {select: {descriptionShort: true}}
      }
    }
    WorkOrder_WorkOrder_deletedByToEmployee: {
      select: {id: true; workOrderNumber: true; deletedAt: true; Project: {select: {projectName: true}}}
    }
    InvoiceIn_InvoiceIn_deletedByToEmployee: {
      select: {id: true; invoiceNumber: true; invoiceDate: true; deletedAt: true; amountWithoutVat: true}
    }
    InvoiceOut_InvoiceOut_deletedByToEmployee: {
      select: {id: true; invoiceNumber: true; invoiceDate: true; deletedAt: true; amountWithoutVat: true}
    }
  }
}>

export function mapEmployeeDetail(e: EmployeeDetailPayload): EmployeeDetailData {
  const roleLevel = e.RoleLevel_Employee_roleLevelIdToRoleLevel
  const ownedFollowUpIds = new Set(e.FollowUp_FollowUp_ownedByToEmployee.map(f => f.id))

  // ── Created records: flat unified rows ──────────────────────────────────────
  const createdRecords: UnifiedRecord[] = [
    ...e.Contact.map(c => ({
      id: c.id,
      type: 'Contact' as const,
      label: `${c.firstName} ${c.lastName}`,
      detail: c.Function?.name ?? null,
      date: c.createdAt.toISOString(),
      deletedAt: null,
      href: `/contacts/${c.id}`,
    })),
    ...e.Company.map(c => ({
      id: c.id,
      type: 'Company' as const,
      label: c.name,
      detail: c.number,
      date: c.createdAt.toISOString(),
      deletedAt: null,
      href: `/companies/${c.id}`,
    })),
    ...e.Project.map(p => ({
      id: p.id,
      type: 'Project' as const,
      label: `${p.projectNumber} — ${p.projectName}`,
      detail: p.Company.name,
      date: p.createdAt.toISOString(),
      deletedAt: null,
      href: `/departments/project/project/${p.id}`,
    })),
    ...e.Training.map(t => ({
      id: t.id,
      type: 'Training' as const,
      label: t.trainingNumber ?? '(no number)',
      detail: t.TrainingStandard.descriptionShort ?? null,
      date: t.trainingDate.toISOString(),
      deletedAt: null,
      href: null,
    })),
    ...e.WorkOrder.map(w => ({
      id: w.id,
      type: 'Work Order' as const,
      label: w.workOrderNumber ?? '(no number)',
      detail: `${w.Project.projectNumber} — ${w.Project.projectName}`,
      date: w.createdAt.toISOString(),
      deletedAt: null,
      href: null,
    })),
    ...e.InvoiceIn.map(i => ({
      id: i.id,
      type: 'Invoice In' as const,
      label: i.invoiceNumber ?? '(no number)',
      detail: `${i.InvoiceType.name} · €${i.amountWithoutVat.toFixed(2)}`,
      date: i.invoiceDate.toISOString(),
      deletedAt: null,
      href: null,
    })),
    ...e.InvoiceOut.map(i => ({
      id: i.id,
      type: 'Invoice Out' as const,
      label: i.invoiceNumber ?? '(no number)',
      detail: `${i.InvoiceType.name} · €${i.amountWithoutVat.toFixed(2)}`,
      date: i.invoiceDate.toISOString(),
      deletedAt: null,
      href: null,
    })),
    ...e.Purchase.map(p => ({
      id: p.id,
      type: 'Purchase' as const,
      label: p.orderNumber ?? p.shortDescription ?? '(no number)',
      detail: [p.Company?.name, p.Project?.projectName].filter(Boolean).join(' · ') || null,
      date: p.purchaseDate?.toISOString() ?? null,
      deletedAt: null,
      href: null,
    })),
    ...e.TimeRegistry.map(t => ({
      id: t.id,
      type: 'Time Registry' as const,
      label: t.WorkOrder.workOrderNumber ?? '(no WO)',
      detail: t.WorkOrder.Project.projectName,
      date: t.workDate.toISOString(),
      deletedAt: null,
      href: null,
    })),
  ]

  // ── Deleted records: flat unified rows ──────────────────────────────────────
  const deletedRecords: UnifiedRecord[] = [
    ...e.Contact_Contact_deletedByToEmployee.map(c => ({
      id: c.id,
      type: 'Contact' as const,
      label: `${c.firstName} ${c.lastName}`,
      detail: c.Function?.name ?? null,
      date: null,
      deletedAt: c.deletedAt?.toISOString() ?? null,
      href: null,
    })),
    ...e.Company_Company_deletedByToEmployee.map(c => ({
      id: c.id,
      type: 'Company' as const,
      label: c.name,
      detail: c.number,
      date: null,
      deletedAt: c.deletedAt?.toISOString() ?? null,
      href: null,
    })),
    ...e.Project_Project_deletedByToEmployee.map(p => ({
      id: p.id,
      type: 'Project' as const,
      label: `${p.projectNumber} — ${p.projectName}`,
      detail: p.Company.name,
      date: null,
      deletedAt: p.deletedAt?.toISOString() ?? null,
      href: null,
    })),
    ...e.Training_Training_deletedByToEmployee.map(t => ({
      id: t.id,
      type: 'Training' as const,
      label: t.trainingNumber ?? '(no number)',
      detail: t.TrainingStandard.descriptionShort ?? null,
      date: t.trainingDate.toISOString(),
      deletedAt: t.deletedAt?.toISOString() ?? null,
      href: null,
    })),
    ...e.WorkOrder_WorkOrder_deletedByToEmployee.map(w => ({
      id: w.id,
      type: 'Work Order' as const,
      label: w.workOrderNumber ?? '(no number)',
      detail: w.Project.projectName,
      date: null,
      deletedAt: w.deletedAt?.toISOString() ?? null,
      href: null,
    })),
    ...e.InvoiceIn_InvoiceIn_deletedByToEmployee.map(i => ({
      id: i.id,
      type: 'Invoice In' as const,
      label: i.invoiceNumber ?? '(no number)',
      detail: `€${i.amountWithoutVat.toFixed(2)}`,
      date: i.invoiceDate.toISOString(),
      deletedAt: i.deletedAt?.toISOString() ?? null,
      href: null,
    })),
    ...e.InvoiceOut_InvoiceOut_deletedByToEmployee.map(i => ({
      id: i.id,
      type: 'Invoice Out' as const,
      label: i.invoiceNumber ?? '(no number)',
      detail: `€${i.amountWithoutVat.toFixed(2)}`,
      date: i.invoiceDate.toISOString(),
      deletedAt: i.deletedAt?.toISOString() ?? null,
      href: null,
    })),
  ]

  return {
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
    mail: e.mail,
    username: e.username,
    phoneNumber: e.phoneNumber,
    birthDate: e.birthDate?.toISOString() ?? null,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate?.toISOString() ?? null,
    info: e.info,
    street: e.street,
    houseNumber: e.houseNumber,
    busNumber: e.busNumber,
    zipCode: e.zipCode,
    place: e.place,
    permanentEmployee: e.permanentEmployee,
    checkInfo: e.checkInfo,
    newYearCard: e.newYearCard,
    active: e.active,
    createdAt: e.createdAt.toISOString(),
    createdByName: e.Employee ? `${e.Employee.firstName} ${e.Employee.lastName}` : null,
    passwordCreatedAt: e.passwordCreatedAt.toISOString(),
    pictureId: e.pictureId,
    deleted: e.deleted,
    deletedAt: e.deletedAt?.toISOString() ?? null,
    deletedByName: e.Employee_Employee_deletedByToEmployee
      ? `${e.Employee_Employee_deletedByToEmployee.firstName} ${e.Employee_Employee_deletedByToEmployee.lastName}`
      : null,
    roleName: roleLevel ? `${roleLevel.Role.name.replace(' Role', '')} / ${roleLevel.SubRole.name}` : '-',
    roleLevelId: e.roleLevelId,
    titleName: e.Title_Employee_titleIdToTitle?.name ?? '-',
    titleId: e.titleId,
    emergencyContacts: e.EmergencyContact,

    // ── Section 1: Assigned ──────────────────────────────────────────────────
    assignedFollowUps: [
      ...e.FollowUp_FollowUp_ownedByToEmployee.map(f => ({
        id: f.id,
        activityDescription: f.activityDescription,
        actionAgenda: f.actionAgenda?.toISOString() ?? null,
        closedAgenda: f.closedAgenda?.toISOString() ?? null,
        createdAt: f.createdAt.toISOString(),
        itemClosed: f.itemClosed,
        statusName: f.Status.name,
        followUpTypeName: f.FollowUpType.name,
        urgencyTypeName: f.UrgencyType.name,
        role: 'owner' as const,
      })),
      ...e.FollowUp_FollowUp_executedByToEmployee.filter(f => !ownedFollowUpIds.has(f.id)).map(f => ({
        id: f.id,
        activityDescription: f.activityDescription,
        actionAgenda: f.actionAgenda?.toISOString() ?? null,
        closedAgenda: f.closedAgenda?.toISOString() ?? null,
        createdAt: f.createdAt.toISOString(),
        itemClosed: f.itemClosed,
        statusName: f.Status.name,
        followUpTypeName: f.FollowUpType.name,
        urgencyTypeName: f.UrgencyType.name,
        role: 'executor' as const,
      })),
    ],

    assignedFollowUpStructures: (() => {
      const seen = new Map<string, 'owner' | 'executor' | 'taskFor'>()
      for (const f of e.FollowUpStructure_FollowUpStructure_ownedByToEmployee) seen.set(f.id, 'owner')
      for (const f of e.FollowUpStructure_FollowUpStructure_executedByToEmployee)
        if (!seen.has(f.id)) seen.set(f.id, 'executor')
      for (const f of e.FollowUpStructure_FollowUpStructure_taskForToEmployee)
        if (!seen.has(f.id)) seen.set(f.id, 'taskFor')
      const all = [
        ...e.FollowUpStructure_FollowUpStructure_ownedByToEmployee,
        ...e.FollowUpStructure_FollowUpStructure_executedByToEmployee,
        ...e.FollowUpStructure_FollowUpStructure_taskForToEmployee,
      ]
      const unique = new Map(all.map(f => [f.id, f]))
      return [...unique.values()].map(f => ({
        id: f.id,
        item: f.item,
        activityDescription: f.activityDescription,
        contactDate: f.contactDate.toISOString(),
        actionAgenda: f.actionAgenda?.toISOString() ?? null,
        closedAgenda: f.closedAgenda?.toISOString() ?? null,
        statusName: f.Status.name,
        urgencyTypeName: f.UrgencyType.name,
        role: seen.get(f.id) ?? 'owner',
      }))
    })(),

    assignedDocuments: [
      ...e.DocumentStructure_DocumentStructure_managedByIdToEmployee.map(d => ({
        id: d.id,
        documentNumber: d.documentNumber,
        descriptionShort: d.descriptionShort,
        valid: d.valid,
        createdAt: d.createdAt.toISOString(),
        role: 'manager' as const,
      })),
      ...e.DocumentStructure_DocumentStructure_revisedByIdToEmployee.filter(
        d => !e.DocumentStructure_DocumentStructure_managedByIdToEmployee.some(m => m.id === d.id),
      ).map(d => ({
        id: d.id,
        documentNumber: d.documentNumber,
        descriptionShort: d.descriptionShort,
        valid: d.valid,
        createdAt: d.createdAt.toISOString(),
        role: 'revisor' as const,
      })),
    ],

    participatedTimeRegistries: e.TimeRegistryEmployee.filter(tre => !tre.TimeRegistry.deleted).map(tre => ({
      id: tre.id,
      timeRegistryId: tre.TimeRegistry.id,
      workDate: tre.TimeRegistry.workDate.toISOString(),
      startTime: tre.TimeRegistry.startTime.toISOString(),
      endTime: tre.TimeRegistry.endTime?.toISOString() ?? null,
      activityDescription: tre.TimeRegistry.activityDescription,
      workOrderNumber: tre.TimeRegistry.WorkOrder.workOrderNumber,
    })),

    // ── Section 2 & 3: flat unified rows ────────────────────────────────────
    createdRecords,
    deletedRecords,
  }
}
