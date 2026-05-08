import type {ProjectDetailData} from '@/mapper/projectDetails'
import type {
  MappedProject,
  MappedProjectEmployee,
  MappedProjectContact,
  MappedWorkOrder,
  MappedMaterialSerialTrack,
  MappedSubProject,
} from '@/types/project'
import {getProjects} from '@/dal/projects'
import {mapProjectBOM} from '@/mapper/projectBom'

function mapProjectEmployee(pe: ProjectDetailData['ProjectEmployee'][number]): MappedProjectEmployee {
  return {
    id: pe.id,
    employeeId: pe.employeeId,
    employeeName: `${pe.Employee.firstName} ${pe.Employee.lastName}`,
    additionalInfo: pe.additionalInfo,
    manager: pe.manager,
    supervisor: pe.supervisor,
  }
}

export function mapProject(p: ProjectDetailData): MappedProject {
  return {
    id: p.id,
    projectNumber: p.projectNumber,
    projectName: p.projectName,
    description: p.description,
    extraInfo: p.extraInfo,
    startDate: p.startDate?.toISOString() ?? null,
    endDate: p.endDate?.toISOString() ?? null,
    closingDate: p.closingDate?.toISOString() ?? null,
    engineeringStartDate: p.engineeringStartDate?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    isMainProject: p.isMainProject,
    isIntern: p.isIntern,
    isOpen: p.isOpen,
    isClosed: p.isClosed,
    createdBy: p.createdBy,
    companyId: p.companyId,
    companyName: p.Company.name,
    projectTypeId: p.projectTypeId,
    projectTypeName: p.ProjectType.name,
    parentProjectId: p.parentProjectId,
    deleted: p.deleted,
    deletedAt: p.deletedAt?.toISOString() ?? null,
    deletedBy: p.deletedBy,
    targetId: p.targetId,
    projectEmployees: p.ProjectEmployee.map(mapProjectEmployee),

    // ─── Creator (direct Employee relation on Project) ─────────────────────
    createdByEmployeeId: p.Employee?.id ?? null,
    createdByEmployeeName: p.Employee ? `${p.Employee.firstName} ${p.Employee.lastName}` : null,

    // ─── Contacts ──────────────────────────────────────────────────────────
    contacts: p.ProjectContact.map((pc): MappedProjectContact => {
      const row = pc as typeof pc & {
        additionalInfo: string | null
        description: string | null
        extraInfo: string | null
        isValid: boolean
        createdAt: Date
        createdBy: string
        contactId: string
        deleted: boolean
        deletedAt: Date | null
      }
      return {
        id: row.id,
        contactId: row.contactId,
        contactName: `${row.Contact.firstName} ${row.Contact.lastName}`,
        contactEmail: row.Contact.mail1 ?? null,
        contactPhone: row.Contact.generalPhone ?? null,
        additionalInfo: row.additionalInfo,
        description: row.description,
        extraInfo: row.extraInfo,
        isValid: row.isValid,
        createdAt: row.createdAt.toISOString(),
        createdBy: row.createdBy,
        createdByName: row.Employee_ProjectContact_createdByToEmployee
          ? `${row.Employee_ProjectContact_createdByToEmployee.firstName} ${row.Employee_ProjectContact_createdByToEmployee.lastName}`
          : row.createdBy,
        deleted: row.deleted,
        deletedAt: row.deletedAt?.toISOString() ?? null,
      }
    }),

    workOrders: p.WorkOrder.map((wo): MappedWorkOrder => {
      const row = wo as typeof wo & {
        startDate: Date | null
        endDate: Date | null
        completed: boolean
        invoiceSent: boolean
        hoursMaterialClosed: boolean
        deleted: boolean
      }
      return {
        id: row.id,
        workOrderNumber: row.workOrderNumber ?? null,
        description: row.description ?? null,
        startDate: row.startDate?.toISOString() ?? null,
        endDate: row.endDate?.toISOString() ?? null,
        completed: row.completed,
        invoiceSent: row.invoiceSent,
        hoursMaterialClosed: row.hoursMaterialClosed,
        createdAt: row.createdAt.toISOString(),
        employeeId: row.Employee?.id ?? null,
        employeeName: row.Employee ? `${row.Employee.firstName} ${row.Employee.lastName}` : null,
        deleted: row.deleted,
      }
    }),

    materialSerialTracks: p.MaterialSerialTrack.map((mst): MappedMaterialSerialTrack => {
      const row = mst as typeof mst & {
        serialNumber: string | null
        becraCode: string | null
        shortDescription: string | null
        brandName: string | null
        transactionType: string | null
        createdAt: Date
        materialId: string | null
        companyId: string | null
        employeeId: string | null
        deleted: boolean
      }
      return {
        id: row.id,
        materialId: row.materialId,
        companyId: row.companyId,
        companyName: row.Company?.name ?? null,
        employeeId: row.Employee?.id ?? null,
        employeeName: row.Employee ? `${row.Employee.firstName} ${row.Employee.lastName}` : null,
        serialNumber: row.serialNumber,
        becraCode: row.becraCode,
        shortDescription: row.shortDescription,
        brandName: row.brandName,
        transactionType: row.transactionType,
        createdAt: row.createdAt.toISOString(),
        deleted: row.deleted,
      }
    }),

    subProjects: p.other_Project.map(
      (sp): MappedSubProject => ({
        id: sp.id,
        projectNumber: sp.projectNumber ?? null,
        projectName: sp.projectName ?? null,
        companyName: sp.Company.name,
        projectTypeName: sp.ProjectType.name,
        startDate: (sp as any).startDate ? new Date((sp as any).startDate).toISOString() : null,
        endDate: (sp as any).endDate ? new Date((sp as any).endDate).toISOString() : null,
        isOpen: sp.isOpen,
        isClosed: sp.isClosed,
        deleted: sp.deleted,
      }),
    ),

    projectBoms: p.ProjectBOM.map(b => mapProjectBOM(b as any)),

    parentProjectNumber: p.Project?.projectNumber ?? null,
  }
}

type ProjectListData = Awaited<ReturnType<typeof getProjects>>[number]

export function mapProjectList(p: ProjectListData): MappedProject {
  return {
    id: p.id,
    projectNumber: p.projectNumber,
    projectName: p.projectName,
    description: p.description,
    extraInfo: p.extraInfo,
    startDate: p.startDate?.toISOString() ?? null,
    endDate: p.endDate?.toISOString() ?? null,
    closingDate: p.closingDate?.toISOString() ?? null,
    engineeringStartDate: p.engineeringStartDate?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    isMainProject: p.isMainProject,
    isIntern: p.isIntern,
    isOpen: p.isOpen,
    isClosed: p.isClosed,
    createdBy: p.createdBy,
    companyId: p.companyId,
    companyName: p.Company.name,
    projectTypeId: p.projectTypeId,
    projectTypeName: p.ProjectType.name,
    parentProjectId: p.parentProjectId,
    deleted: p.deleted,
    deletedAt: p.deletedAt?.toISOString() ?? null,
    deletedBy: p.deletedBy,
    targetId: p.targetId,
    projectEmployees: p.ProjectEmployee.map(mapProjectEmployee),
    // ─── Detail-only fields — not available in list query ─────────────────
    createdByEmployeeId: null,
    createdByEmployeeName: null,
    parentProjectNumber: null,
    contacts: [],
    workOrders: [],
    materialSerialTracks: [],
    subProjects: [],
    projectBoms: [],
  }
}
