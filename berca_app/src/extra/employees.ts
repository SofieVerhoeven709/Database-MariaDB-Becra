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
    DocumentStructure_DocumentStructure_createdByToEmployee: {
      select: {id: true; documentNumber: true; descriptionShort: true; createdAt: true; valid: true}
    }
    FollowUp_FollowUp_createdByToEmployee: {
      include: {
        Status: {select: {name: true}}
        FollowUpType: {select: {name: true}}
        UrgencyType: {select: {name: true}}
      }
    }
    FollowUpStructure_FollowUpStructure_createdByToEmployee: {
      include: {Status: {select: {name: true}}; UrgencyType: {select: {name: true}}}
    }
    TrainingStandard: {select: {id: true; descriptionShort: true; createdAt: true}}
    DeliveryNoteSupplier: {
      select: {id: true; supplierNN: true; information: true; createdAt: true; Company: {select: {name: true}}}
    }
    QuoteSupplier: {select: {id: true; description: true; Project: {select: {projectName: true; projectNumber: true}}}}
    WorkOrderStructure: {
      select: {id: true; shortDescription: true; createdAt: true; WorkOrder: {select: {workOrderNumber: true}}}
    }
    DocumentStructure_DocumentStructure_deletedByToEmployee: {
      select: {id: true; documentNumber: true; descriptionShort: true; deletedAt: true}
    }
    FollowUp_FollowUp_deletedByToEmployee: {
      include: {
        Status: {select: {name: true}}
        FollowUpType: {select: {name: true}}
        UrgencyType: {select: {name: true}}
      }
    }
    FollowUpStructure_FollowUpStructure_deletedByToEmployee: {
      include: {Status: {select: {name: true}}; UrgencyType: {select: {name: true}}}
    }
    Purchase_Purchase_deletedByToEmployee: {
      select: {
        id: true
        orderNumber: true
        shortDescription: true
        deletedAt: true
        purchaseDate: true
        Company: {select: {name: true}}
        Project: {select: {projectName: true}}
      }
    }
    TimeRegistry_TimeRegistry_deletedByToEmployee: {
      select: {
        id: true
        workDate: true
        deletedAt: true
        activityDescription: true
        WorkOrder: {select: {workOrderNumber: true; Project: {select: {projectName: true}}}}
      }
    }
    TrainingStandard_TrainingStandard_deletedByToEmployee: {select: {id: true; descriptionShort: true; deletedAt: true}}
    DeliveryNoteSupplier_DeliveryNoteSupplier_deletedByToEmployee: {
      select: {id: true; supplierNN: true; information: true; deletedAt: true; Company: {select: {name: true}}}
    }
    QuoteSupplier_QuoteSupplier_deletedByToEmployee: {
      select: {
        id: true
        description: true
        deletedAt: true
        Project: {select: {projectName: true; projectNumber: true}}
      }
    }
    WorkOrderStructure_WorkOrderStructure_deletedByToEmployee: {
      select: {id: true; shortDescription: true; deletedAt: true; WorkOrder: {select: {workOrderNumber: true}}}
    }
    // Other created
    Certificate: {select: {id: true; descriptionShort: true; createdAt: true; CertificateType: {select: {name: true}}}}
    CertificateType: {select: {id: true; name: true; createdAt: true}}
    CompanyAdress: {
      select: {id: true; street: true; houseNumber: true; place: true; createdAt: true; Company: {select: {name: true}}}
    }
    CompanyContact: {
      select: {
        id: true
        createdAt: true
        roleWithCompany: true
        Contact: {select: {firstName: true; lastName: true}}
        Company: {select: {name: true}}
      }
    }
    Department_Department_createdByToEmployee: {select: {id: true; name: true; createdAt: true}}
    Function_Function_createdByToEmployee: {select: {id: true; name: true; createdAt: true}}
    HourType: {select: {id: true; name: true; createdAt: true}}
    Inventory: {select: {id: true; beNumber: true; shortDescription: true; createdAt: true}}
    InventoryChange: {
      select: {
        id: true
        changeDescription: true
        createdAt: true
        Inventory: {select: {beNumber: true; shortDescription: true}}
      }
    }
    InventoryOrder: {select: {id: true; orderNumber: true; shortDescription: true; createdAt: true}}
    InventoryStructure: {
      select: {id: true; shortDescription: true; createdAt: true; Inventory: {select: {beNumber: true}}}
    }
    InvoiceType: {select: {id: true; name: true; createdAt: true}}
    Material: {select: {id: true; beNumber: true; shortDescription: true}}
    MaterialAssembly: {select: {id: true; name: true; shortDescription: true; createdAt: true}}
    MaterialCode: {select: {id: true; name: true; createdAt: true}}
    MaterialFamily: {select: {id: true; name: true; createdAt: true}}
    MaterialOther: {
      select: {id: true; name: true; shortDescription: true; createdAt: true; Material: {select: {beNumber: true}}}
    }
    MaterialPrice: {select: {id: true; beNumber: true; shortDescription: true}}
    MaterialSerialTrack: {select: {id: true; beNumber: true; shortDescription: true}}
    Part: {select: {id: true; name: true; shortDescription: true}}
    Phantom: {select: {id: true; description: true}}
    Product: {select: {id: true; shortDescription: true; status: true}}
    ProjectContact_ProjectContact_createdByToEmployee: {
      select: {
        id: true
        createdAt: true
        Contact: {select: {firstName: true; lastName: true}}
        Project: {select: {projectNumber: true; projectName: true}}
      }
    }
    ProjectType: {select: {id: true; name: true; createdAt: true}}
    PurchaseDetail: {select: {id: true; beNumber: true; status: true; Purchase: {select: {orderNumber: true}}}}
    PurchaseOrderBecra: {select: {id: true; description: true; date: true}}
    QouteBecra: {select: {id: true; description: true; date: true}}
    Role_Role_createdByToEmployee: {select: {id: true; name: true; createdAt: true}}
    RoleLevel_RoleLevel_createdByToEmployee: {
      select: {id: true; createdAt: true; Role: {select: {name: true}}; SubRole: {select: {name: true}}}
    }
    Status: {select: {id: true; name: true; createdAt: true}}
    SubRole_SubRole_createdByToEmployee: {select: {id: true; name: true; createdAt: true}}
    SupplierDeliveryNoteFollowUp: {
      select: {id: true; information: true; deliveryDate: true; DeliveryNoteSupplier: {select: {supplierNN: true}}}
    }
    Target: {select: {id: true; createdAt: true; TargetType: {select: {name: true}}}}
    TargetType: {select: {id: true; name: true; createdAt: true}}
    TestProcedure: {select: {id: true; name: true; shortDescription: true; createdAt: true}}
    Title_Title_createdByToEmployee: {select: {id: true; name: true; createdAt: true}}
    TrainingContact: {
      select: {
        id: true
        createdAt: true
        Contact: {select: {firstName: true; lastName: true}}
        Training: {select: {trainingNumber: true}}
      }
    }
    Unit: {select: {id: true; unitName: true; abbreviation: true; createdAt: true}}
    UrgencyType: {select: {id: true; name: true; createdAt: true}}
    WarehousePlace: {select: {id: true; place: true; shelf: true; createdAt: true}}
    // Other deleted
    Certificate_Certificate_deletedByToEmployee: {
      select: {id: true; descriptionShort: true; deletedAt: true; CertificateType: {select: {name: true}}}
    }
    CertificateType_CertificateType_deletedByToEmployee: {select: {id: true; name: true; deletedAt: true}}
    CompanyAdress_CompanyAdress_deletedByToEmployee: {
      select: {id: true; street: true; houseNumber: true; place: true; deletedAt: true; Company: {select: {name: true}}}
    }
    CompanyContact_CompanyContact_deletedByToEmployee: {
      select: {
        id: true
        deletedAt: true
        roleWithCompany: true
        Contact: {select: {firstName: true; lastName: true}}
        Company: {select: {name: true}}
      }
    }
    Department_Department_deletedByToEmployee: {select: {id: true; name: true; deletedAt: true}}
    Function_Function_deletedByToEmployee: {select: {id: true; name: true; deletedAt: true}}
    HourType_HourType_deletedByToEmployee: {select: {id: true; name: true; deletedAt: true}}
    Inventory_Inventory_deletedByToEmployee: {
      select: {id: true; beNumber: true; shortDescription: true; deletedAt: true}
    }
    InventoryChange_InventoryChange_deletedByToEmployee: {
      select: {
        id: true
        changeDescription: true
        deletedAt: true
        Inventory: {select: {beNumber: true; shortDescription: true}}
      }
    }
    InventoryOrder_InventoryOrder_deletedByToEmployee: {
      select: {id: true; orderNumber: true; shortDescription: true; deletedAt: true}
    }
    InventoryStructure_InventoryStructure_deletedByToEmployee: {
      select: {id: true; shortDescription: true; deletedAt: true; Inventory: {select: {beNumber: true}}}
    }
    InvoiceType_InvoiceType_deletedByToEmployee: {select: {id: true; name: true; deletedAt: true}}
    Material_Material_deletedByToEmployee: {select: {id: true; beNumber: true; shortDescription: true; deletedAt: true}}
    MaterialAssembly_MaterialAssembly_deletedByToEmployee: {
      select: {id: true; name: true; shortDescription: true; deletedAt: true}
    }
    MaterialCode_MaterialCode_deletedByToEmployee: {select: {id: true; name: true; deletedAt: true}}
    MaterialFamily_MaterialFamily_deletedByToEmployee: {select: {id: true; name: true; deletedAt: true}}
    MaterialMovement_MaterialMovement_deletedByToEmployee: {select: {id: true; shortDescription: true; deletedAt: true}}
    MaterialOther_MaterialOther_deletedByToEmployee: {
      select: {id: true; name: true; shortDescription: true; deletedAt: true; Material: {select: {beNumber: true}}}
    }
    MaterialPrice_MaterialPrice_deletedByToEmployee: {
      select: {id: true; beNumber: true; shortDescription: true; deletedAt: true}
    }
    MaterialSerialTrack_MaterialSerialTrack_deletedByToEmployee: {
      select: {id: true; beNumber: true; shortDescription: true; deletedAt: true}
    }
    Part_Part_deletedByToEmployee: {select: {id: true; name: true; shortDescription: true; deletedAt: true}}
    Phantom_Phantom_deletedByToEmployee: {select: {id: true; description: true; deletedAt: true}}
    Product_Product_deletedByToEmployee: {select: {id: true; shortDescription: true; status: true; deletedAt: true}}
    ProjectContact_ProjectContact_deletedByToEmployee: {
      select: {
        id: true
        deletedAt: true
        Contact: {select: {firstName: true; lastName: true}}
        Project: {select: {projectNumber: true; projectName: true}}
      }
    }
    ProjectType_ProjectType_deletedByToEmployee: {select: {id: true; name: true; deletedAt: true}}
    PurchaseDetail_PurchaseDetail_deletedByToEmployee: {
      select: {id: true; beNumber: true; status: true; deletedAt: true; Purchase: {select: {orderNumber: true}}}
    }
    PurchaseOrderBecra_PurchaseOrderBecra_deletedByToEmployee: {select: {id: true; description: true; deletedAt: true}}
    QouteBecra_QouteBecra_deletedByToEmployee: {select: {id: true; description: true; deletedAt: true}}
    Role_Role_deletedByToEmployee: {select: {id: true; name: true; deletedAt: true}}
    RoleLevel_RoleLevel_deletedByToEmployee: {
      select: {id: true; deletedAt: true; Role: {select: {name: true}}; SubRole: {select: {name: true}}}
    }
    Status_Status_deletedByToEmployee: {select: {id: true; name: true; deletedAt: true}}
    SubRole_SubRole_deletedByToEmployee: {select: {id: true; name: true; deletedAt: true}}
    SupplierDeliveryNoteFollowUp_SupplierDeliveryNoteFollowUp_deletedByToEmployee: {
      select: {id: true; information: true; deletedAt: true; DeliveryNoteSupplier: {select: {supplierNN: true}}}
    }
    Target_Target_deletedByToEmployee: {select: {id: true; deletedAt: true; TargetType: {select: {name: true}}}}
    TargetType_TargetType_deletedByToEmployee: {select: {id: true; name: true; deletedAt: true}}
    TestProcedure_TestProcedure_deletedByToEmployee: {
      select: {id: true; name: true; shortDescription: true; deletedAt: true}
    }
    Title_Title_deletedByToEmployee: {select: {id: true; name: true; deletedAt: true}}
    TrainingContact_TrainingContact_deletedByToEmployee: {
      select: {
        id: true
        deletedAt: true
        Contact: {select: {firstName: true; lastName: true}}
        Training: {select: {trainingNumber: true}}
      }
    }
    Unit_Unit_deletedByToEmployee: {select: {id: true; unitName: true; abbreviation: true; deletedAt: true}}
    UrgencyType_UrgencyType_deletedByToEmployee: {select: {id: true; name: true; deletedAt: true}}
    WarehousePlace_WarehousePlace_deletedByToEmployee: {select: {id: true; place: true; shelf: true; deletedAt: true}}
  }
}>

type CreatedEmployee = {
  id: string
  firstName: string
  lastName: string
  createdAt: Date
  active: boolean
  RoleLevel_Employee_roleLevelIdToRoleLevel: {Role: {name: string}; SubRole: {name: string}} | null
}

type DeletedEmployee = {
  id: string
  firstName: string
  lastName: string
  deletedAt: Date | null
  RoleLevel_Employee_roleLevelIdToRoleLevel: {Role: {name: string}; SubRole: {name: string}} | null
}

export function mapEmployeeDetail(
  e: EmployeeDetailPayload,
  createdEmployees: CreatedEmployee[],
  deletedEmployees: DeletedEmployee[],
): EmployeeDetailData {
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
    ...e.DocumentStructure_DocumentStructure_createdByToEmployee.map(d => ({
      id: d.id,
      type: 'Document' as const,
      label: d.documentNumber,
      detail: d.descriptionShort,
      date: d.createdAt.toISOString(),
      deletedAt: null,
      href: null,
    })),
    ...e.FollowUp_FollowUp_createdByToEmployee.map(f => ({
      id: f.id,
      type: 'Follow-up' as const,
      label: f.FollowUpType.name,
      detail: f.activityDescription ?? null,
      date: f.createdAt.toISOString(),
      deletedAt: null,
      href: null,
    })),
    ...e.FollowUpStructure_FollowUpStructure_createdByToEmployee.map(f => ({
      id: f.id,
      type: 'Follow-up Structure' as const,
      label: f.item ?? f.activityDescription ?? '(no item)',
      detail: f.Status.name,
      date: f.createdAt.toISOString(),
      deletedAt: null,
      href: null,
    })),
    ...e.TrainingStandard.map(t => ({
      id: t.id,
      type: 'Training Standard' as const,
      label: t.descriptionShort ?? '(no description)',
      detail: null,
      date: t.createdAt.toISOString(),
      deletedAt: null,
      href: null,
    })),
    ...e.DeliveryNoteSupplier.map(d => ({
      id: d.id,
      type: 'Delivery Note' as const,
      label: d.supplierNN ?? d.information ?? '(no label)',
      detail: d.Company?.name ?? null,
      date: d.createdAt.toISOString(),
      deletedAt: null,
      href: null,
    })),
    ...e.QuoteSupplier.map(q => ({
      id: q.id,
      type: 'Quote' as const,
      label: q.Project ? `${q.Project.projectNumber} — ${q.Project.projectName}` : '(no project)',
      detail: q.description ?? null,
      date: null,
      deletedAt: null,
      href: null,
    })),
    ...e.WorkOrderStructure.map(w => ({
      id: w.id,
      type: 'WO Structure' as const,
      label: w.WorkOrder.workOrderNumber ?? '(no WO)',
      detail: w.shortDescription ?? null,
      date: w.createdAt.toISOString(),
      deletedAt: null,
      href: null,
    })),
    ...e.Material.map(r => ({
      id: r.id,
      type: 'Material' as const,
      label: r.beNumber,
      detail: r.shortDescription,
      date: null,
      deletedAt: null,
      href: null,
    })),
    ...createdEmployees.map(emp => ({
      id: emp.id,
      type: 'Employee' as const,
      label: `${emp.firstName} ${emp.lastName}`,
      detail: emp.RoleLevel_Employee_roleLevelIdToRoleLevel
        ? `${emp.RoleLevel_Employee_roleLevelIdToRoleLevel.Role.name.replace(' Role', '')} / ${emp.RoleLevel_Employee_roleLevelIdToRoleLevel.SubRole.name}`
        : null,
      date: emp.createdAt.toISOString(),
      deletedAt: null,
      href: `/employees/${emp.id}`,
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
    ...e.DocumentStructure_DocumentStructure_deletedByToEmployee.map(d => ({
      id: d.id,
      type: 'Document' as const,
      label: d.documentNumber,
      detail: d.descriptionShort,
      date: null,
      deletedAt: d.deletedAt?.toISOString() ?? null,
      href: null,
    })),
    ...e.FollowUp_FollowUp_deletedByToEmployee.map(f => ({
      id: f.id,
      type: 'Follow-up' as const,
      label: f.FollowUpType.name,
      detail: f.activityDescription ?? null,
      date: f.createdAt.toISOString(),
      deletedAt: f.deletedAt?.toISOString() ?? null,
      href: null,
    })),
    ...e.FollowUpStructure_FollowUpStructure_deletedByToEmployee.map(f => ({
      id: f.id,
      type: 'Follow-up Structure' as const,
      label: f.item ?? f.activityDescription ?? '(no item)',
      detail: f.Status.name,
      date: f.createdAt.toISOString(),
      deletedAt: f.deletedAt?.toISOString() ?? null,
      href: null,
    })),
    ...e.Purchase_Purchase_deletedByToEmployee.map(p => ({
      id: p.id,
      type: 'Purchase' as const,
      label: p.orderNumber ?? p.shortDescription ?? '(no number)',
      detail: [p.Company?.name, p.Project?.projectName].filter(Boolean).join(' · ') || null,
      date: p.purchaseDate?.toISOString() ?? null,
      deletedAt: p.deletedAt?.toISOString() ?? null,
      href: null,
    })),
    ...e.TimeRegistry_TimeRegistry_deletedByToEmployee.map(t => ({
      id: t.id,
      type: 'Time Registry' as const,
      label: t.WorkOrder.workOrderNumber ?? '(no WO)',
      detail: t.WorkOrder.Project.projectName,
      date: t.workDate.toISOString(),
      deletedAt: t.deletedAt?.toISOString() ?? null,
      href: null,
    })),
    ...e.TrainingStandard_TrainingStandard_deletedByToEmployee.map(t => ({
      id: t.id,
      type: 'Training Standard' as const,
      label: t.descriptionShort ?? '(no description)',
      detail: null,
      date: null,
      deletedAt: t.deletedAt?.toISOString() ?? null,
      href: null,
    })),
    ...e.DeliveryNoteSupplier_DeliveryNoteSupplier_deletedByToEmployee.map(d => ({
      id: d.id,
      type: 'Delivery Note' as const,
      label: d.supplierNN ?? d.information ?? '(no label)',
      detail: d.Company?.name ?? null,
      date: null,
      deletedAt: d.deletedAt?.toISOString() ?? null,
      href: null,
    })),
    ...e.QuoteSupplier_QuoteSupplier_deletedByToEmployee.map(q => ({
      id: q.id,
      type: 'Quote' as const,
      label: q.Project ? `${q.Project.projectNumber} — ${q.Project.projectName}` : '(no project)',
      detail: q.description ?? null,
      date: null,
      deletedAt: q.deletedAt?.toISOString() ?? null,
      href: null,
    })),
    ...e.WorkOrderStructure_WorkOrderStructure_deletedByToEmployee.map(w => ({
      id: w.id,
      type: 'WO Structure' as const,
      label: w.WorkOrder.workOrderNumber ?? '(no WO)',
      detail: w.shortDescription ?? null,
      date: null,
      deletedAt: w.deletedAt?.toISOString() ?? null,
      href: null,
    })),
    ...e.Material_Material_deletedByToEmployee.map(r => ({
      id: r.id,
      type: 'Material' as const,
      label: r.beNumber,
      detail: r.shortDescription,
      date: null,
      deletedAt: r.deletedAt?.toISOString() ?? null,
      href: null,
    })),
    ...deletedEmployees.map(emp => ({
      id: emp.id,
      type: 'Employee' as const,
      label: `${emp.firstName} ${emp.lastName}`,
      detail: emp.RoleLevel_Employee_roleLevelIdToRoleLevel
        ? `${emp.RoleLevel_Employee_roleLevelIdToRoleLevel.Role.name.replace(' Role', '')} / ${emp.RoleLevel_Employee_roleLevelIdToRoleLevel.SubRole.name}`
        : null,
      date: null,
      deletedAt: emp.deletedAt?.toISOString() ?? null,
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

    // ── Section 2: Main created records ────────────────────────────────────────
    createdMainRecords: createdRecords,

    // ── Section 2: Other created records ────────────────────────────────────────
    createdOtherRecords: [
      ...e.Certificate.map(r => ({
        id: r.id,
        type: 'Certificate' as const,
        label: r.descriptionShort ?? '(no desc)',
        detail: r.CertificateType.name,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.CertificateType.map(r => ({
        id: r.id,
        type: 'Certificate Type' as const,
        label: r.name,
        detail: null,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.CompanyAdress.map(r => ({
        id: r.id,
        type: 'Company Address' as const,
        label: [r.street, r.houseNumber].filter(Boolean).join(' ') || '(no address)',
        detail: r.Company.name,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.CompanyContact.map(r => ({
        id: r.id,
        type: 'Company Contact' as const,
        label: `${r.Contact.firstName} ${r.Contact.lastName}`,
        detail: r.Company.name,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.Department_Department_createdByToEmployee.map(r => ({
        id: r.id,
        type: 'Department' as const,
        label: r.name,
        detail: null,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.Function_Function_createdByToEmployee.map(r => ({
        id: r.id,
        type: 'Function' as const,
        label: r.name,
        detail: null,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.HourType.map(r => ({
        id: r.id,
        type: 'Hour Type' as const,
        label: r.name,
        detail: null,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.Inventory.map(r => ({
        id: r.id,
        type: 'Inventory' as const,
        label: r.beNumber,
        detail: r.shortDescription,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.InventoryChange.map(r => ({
        id: r.id,
        type: 'Inventory Change' as const,
        label: r.Inventory.beNumber,
        detail: r.changeDescription,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.InventoryOrder.map(r => ({
        id: r.id,
        type: 'Inventory Order' as const,
        label: r.orderNumber,
        detail: r.shortDescription,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.InventoryStructure.map(r => ({
        id: r.id,
        type: 'Inventory Structure' as const,
        label: r.Inventory.beNumber,
        detail: r.shortDescription,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.InvoiceType.map(r => ({
        id: r.id,
        type: 'Invoice Type' as const,
        label: r.name,
        detail: null,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.MaterialAssembly.map(r => ({
        id: r.id,
        type: 'Material Assembly' as const,
        label: r.name ?? '(unnamed)',
        detail: r.shortDescription,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.MaterialCode.map(r => ({
        id: r.id,
        type: 'Material Code' as const,
        label: r.name ?? '(unnamed)',
        detail: null,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.MaterialFamily.map(r => ({
        id: r.id,
        type: 'Material Family' as const,
        label: r.name ?? '(unnamed)',
        detail: null,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.MaterialOther.map(r => ({
        id: r.id,
        type: 'Material Other' as const,
        label: r.name ?? r.Material?.beNumber ?? '(unnamed)',
        detail: r.shortDescription,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.MaterialPrice.map(r => ({
        id: r.id,
        type: 'Material Price' as const,
        label: r.beNumber ?? '(no BE)',
        detail: r.shortDescription ?? null,
        date: null,
        deletedAt: null,
        href: null,
      })),
      ...e.MaterialSerialTrack.map(r => ({
        id: r.id,
        type: 'Material Serial Track' as const,
        label: r.beNumber ?? '(no BE)',
        detail: r.shortDescription ?? null,
        date: null,
        deletedAt: null,
        href: null,
      })),
      ...e.Part.map(r => ({
        id: r.id,
        type: 'Part' as const,
        label: r.name ?? '(unnamed)',
        detail: r.shortDescription ?? null,
        date: null,
        deletedAt: null,
        href: null,
      })),
      ...e.Phantom.map(r => ({
        id: r.id,
        type: 'Phantom' as const,
        label: r.description ?? '(no desc)',
        detail: null,
        date: null,
        deletedAt: null,
        href: null,
      })),
      ...e.Product.map(r => ({
        id: r.id,
        type: 'Product' as const,
        label: r.shortDescription ?? '(no desc)',
        detail: r.status ?? null,
        date: null,
        deletedAt: null,
        href: null,
      })),
      ...e.ProjectContact_ProjectContact_createdByToEmployee.map(r => ({
        id: r.id,
        type: 'Project Contact' as const,
        label: `${r.Contact.firstName} ${r.Contact.lastName}`,
        detail: `${r.Project.projectNumber} — ${r.Project.projectName}`,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.ProjectType.map(r => ({
        id: r.id,
        type: 'Project Type' as const,
        label: r.name,
        detail: null,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.PurchaseDetail.map(r => ({
        id: r.id,
        type: 'Purchase Detail' as const,
        label: r.Purchase?.orderNumber ?? '(no order)',
        detail: r.beNumber ?? null,
        date: null,
        deletedAt: null,
        href: null,
      })),
      ...e.PurchaseOrderBecra.map(r => ({
        id: r.id,
        type: 'Purchase Order' as const,
        label: r.description ?? '(no desc)',
        detail: null,
        date: r.date?.toISOString() ?? null,
        deletedAt: null,
        href: null,
      })),
      ...e.QouteBecra.map(r => ({
        id: r.id,
        type: 'Quote Becra' as const,
        label: r.description ?? '(no desc)',
        detail: null,
        date: r.date?.toISOString() ?? null,
        deletedAt: null,
        href: null,
      })),
      ...e.Role_Role_createdByToEmployee.map(r => ({
        id: r.id,
        type: 'Role' as const,
        label: r.name,
        detail: null,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.RoleLevel_RoleLevel_createdByToEmployee.map(r => ({
        id: r.id,
        type: 'Role Level' as const,
        label: `${r.Role.name} / ${r.SubRole.name}`,
        detail: null,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.Status.map(r => ({
        id: r.id,
        type: 'Status' as const,
        label: r.name,
        detail: null,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.SubRole_SubRole_createdByToEmployee.map(r => ({
        id: r.id,
        type: 'Sub Role' as const,
        label: r.name,
        detail: null,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.SupplierDeliveryNoteFollowUp.map(r => ({
        id: r.id,
        type: 'Supplier DN Follow-up' as const,
        label: r.DeliveryNoteSupplier.supplierNN ?? '(no supplier)',
        detail: r.information ?? null,
        date: r.deliveryDate?.toISOString() ?? null,
        deletedAt: null,
        href: null,
      })),
      ...e.Target.map(r => ({
        id: r.id,
        type: 'Target' as const,
        label: r.TargetType.name,
        detail: null,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.TargetType.map(r => ({
        id: r.id,
        type: 'Target Type' as const,
        label: r.name,
        detail: null,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.TestProcedure.map(r => ({
        id: r.id,
        type: 'Test Procedure' as const,
        label: r.name ?? '(unnamed)',
        detail: r.shortDescription,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.Title_Title_createdByToEmployee.map(r => ({
        id: r.id,
        type: 'Title' as const,
        label: r.name,
        detail: null,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.TrainingContact.map(r => ({
        id: r.id,
        type: 'Training Contact' as const,
        label: `${r.Contact.firstName} ${r.Contact.lastName}`,
        detail: r.Training.trainingNumber,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.Unit.map(r => ({
        id: r.id,
        type: 'Unit' as const,
        label: r.unitName,
        detail: r.abbreviation,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.UrgencyType.map(r => ({
        id: r.id,
        type: 'Urgency Type' as const,
        label: r.name,
        detail: null,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
      ...e.WarehousePlace.map(r => ({
        id: r.id,
        type: 'Warehouse Place' as const,
        label: [r.place, r.shelf].filter(Boolean).join(' / ') || '(unnamed)',
        detail: null,
        date: r.createdAt.toISOString(),
        deletedAt: null,
        href: null,
      })),
    ],

    // ── Section 3: Main deleted records ─────────────────────────────────────────
    deletedMainRecords: deletedRecords,

    // ── Section 3: Other deleted records ─────────────────────────────────────────
    deletedOtherRecords: [
      ...e.Certificate_Certificate_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Certificate' as const,
        label: r.descriptionShort ?? '(no desc)',
        detail: r.CertificateType.name,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.CertificateType_CertificateType_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Certificate Type' as const,
        label: r.name,
        detail: null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.CompanyAdress_CompanyAdress_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Company Address' as const,
        label: [r.street, r.houseNumber].filter(Boolean).join(' ') || '(no address)',
        detail: r.Company.name,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.CompanyContact_CompanyContact_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Company Contact' as const,
        label: `${r.Contact.firstName} ${r.Contact.lastName}`,
        detail: r.Company.name,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.Department_Department_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Department' as const,
        label: r.name,
        detail: null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.Function_Function_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Function' as const,
        label: r.name,
        detail: null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.HourType_HourType_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Hour Type' as const,
        label: r.name,
        detail: null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.Inventory_Inventory_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Inventory' as const,
        label: r.beNumber,
        detail: r.shortDescription,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.InventoryChange_InventoryChange_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Inventory Change' as const,
        label: r.Inventory.beNumber,
        detail: r.changeDescription,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.InventoryOrder_InventoryOrder_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Inventory Order' as const,
        label: r.orderNumber,
        detail: r.shortDescription,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.InventoryStructure_InventoryStructure_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Inventory Structure' as const,
        label: r.Inventory.beNumber,
        detail: r.shortDescription,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.InvoiceType_InvoiceType_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Invoice Type' as const,
        label: r.name,
        detail: null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.MaterialAssembly_MaterialAssembly_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Material Assembly' as const,
        label: r.name ?? '(unnamed)',
        detail: r.shortDescription,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.MaterialCode_MaterialCode_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Material Code' as const,
        label: r.name ?? '(unnamed)',
        detail: null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.MaterialFamily_MaterialFamily_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Material Family' as const,
        label: r.name ?? '(unnamed)',
        detail: null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.MaterialMovement_MaterialMovement_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Material Movement' as const,
        label: r.shortDescription ?? '(no desc)',
        detail: null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.MaterialOther_MaterialOther_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Material Other' as const,
        label: r.name ?? r.Material?.beNumber ?? '(unnamed)',
        detail: r.shortDescription,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.MaterialPrice_MaterialPrice_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Material Price' as const,
        label: r.beNumber ?? '(no BE)',
        detail: r.shortDescription ?? null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.MaterialSerialTrack_MaterialSerialTrack_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Material Serial Track' as const,
        label: r.beNumber ?? '(no BE)',
        detail: r.shortDescription ?? null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.Part_Part_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Part' as const,
        label: r.name ?? '(unnamed)',
        detail: r.shortDescription ?? null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.Phantom_Phantom_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Phantom' as const,
        label: r.description ?? '(no desc)',
        detail: null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.Product_Product_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Product' as const,
        label: r.shortDescription ?? '(no desc)',
        detail: r.status ?? null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.ProjectContact_ProjectContact_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Project Contact' as const,
        label: `${r.Contact.firstName} ${r.Contact.lastName}`,
        detail: `${r.Project.projectNumber} — ${r.Project.projectName}`,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.ProjectType_ProjectType_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Project Type' as const,
        label: r.name,
        detail: null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.PurchaseDetail_PurchaseDetail_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Purchase Detail' as const,
        label: r.Purchase?.orderNumber ?? '(no order)',
        detail: r.beNumber ?? null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.PurchaseOrderBecra_PurchaseOrderBecra_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Purchase Order' as const,
        label: r.description ?? '(no desc)',
        detail: null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.QouteBecra_QouteBecra_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Quote Becra' as const,
        label: r.description ?? '(no desc)',
        detail: null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.Role_Role_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Role' as const,
        label: r.name,
        detail: null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.RoleLevel_RoleLevel_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Role Level' as const,
        label: `${r.Role.name} / ${r.SubRole.name}`,
        detail: null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.Status_Status_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Status' as const,
        label: r.name,
        detail: null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.SubRole_SubRole_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Sub Role' as const,
        label: r.name,
        detail: null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.SupplierDeliveryNoteFollowUp_SupplierDeliveryNoteFollowUp_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Supplier DN Follow-up' as const,
        label: r.DeliveryNoteSupplier.supplierNN ?? '(no supplier)',
        detail: r.information,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.Target_Target_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Target' as const,
        label: r.TargetType.name,
        detail: null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.TargetType_TargetType_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Target Type' as const,
        label: r.name,
        detail: null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.TestProcedure_TestProcedure_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Test Procedure' as const,
        label: r.name ?? '(unnamed)',
        detail: r.shortDescription,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.Title_Title_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Title' as const,
        label: r.name,
        detail: null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.TrainingContact_TrainingContact_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Training Contact' as const,
        label: `${r.Contact.firstName} ${r.Contact.lastName}`,
        detail: r.Training.trainingNumber,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.Unit_Unit_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Unit' as const,
        label: r.unitName,
        detail: r.abbreviation,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.UrgencyType_UrgencyType_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Urgency Type' as const,
        label: r.name,
        detail: null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
      ...e.WarehousePlace_WarehousePlace_deletedByToEmployee.map(r => ({
        id: r.id,
        type: 'Warehouse Place' as const,
        label: [r.place, r.shelf].filter(Boolean).join(' / ') || '(unnamed)',
        detail: null,
        date: null,
        deletedAt: r.deletedAt?.toISOString() ?? null,
        href: null,
      })),
    ],
  }
}
