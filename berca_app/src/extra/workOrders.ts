import type {
  WorkOrder,
  Employee,
  Project,
  TimeRegistry,
  TimeRegistryEmployee,
  HourType,
  WorkOrderStructure,
  Material,
  Training,
  ProjectEmployee,
} from '@/generated/prisma/client'
import type {MappedWorkOrder} from '@/types/workOrder'

type WorkOrderWithRelations = WorkOrder & {
  Employee: Pick<Employee, 'firstName' | 'lastName'>
  Employee_WorkOrder_deletedByToEmployee: Pick<Employee, 'firstName' | 'lastName'> | null
  Project: Pick<Project, 'projectNumber' | 'projectName'>
}

export function mapWorkOrder(wo: WorkOrderWithRelations): MappedWorkOrder {
  return {
    id: wo.id,
    workOrderNumber: wo.workOrderNumber,
    description: wo.description,
    additionalInfo: wo.additionalInfo,
    // Normalize dates to ISO strings for the client.
    startDate: wo.startDate.toISOString(),
    endDate: wo.endDate?.toISOString() ?? null,
    createdAt: wo.createdAt.toISOString(),
    hoursMaterialClosed: wo.hoursMaterialClosed,
    invoiceSent: wo.invoiceSent,
    completed: wo.completed,
    createdBy: wo.createdBy,
    projectId: wo.projectId,
    deleted: wo.deleted,
    deletedAt: wo.deletedAt?.toISOString() ?? null,
    deletedBy: wo.deletedBy,
    // Denormalized display fields used in list views.
    createdByName: `${wo.Employee.firstName} ${wo.Employee.lastName}`,
    deletedByName: wo.Employee_WorkOrder_deletedByToEmployee
      ? `${wo.Employee_WorkOrder_deletedByToEmployee.firstName} ${wo.Employee_WorkOrder_deletedByToEmployee.lastName}`
      : null,
    projectNumber: wo.Project.projectNumber,
    projectName: wo.Project.projectName,
  }
}

// ─── Full detail shape passed to the UI component ────────────────────────────
// Matches the include shape from getWorkOrderById for the detail tabs.
export type WorkOrderDetailData = WorkOrder & {
  Employee: Pick<Employee, 'firstName' | 'lastName'>
  Project: Pick<Project, 'projectNumber' | 'projectName'> & {
    ProjectEmployee: {
      employeeId: string
      manager: boolean
      supervisor: boolean
    }[]
  }
  TimeRegistry: (TimeRegistry & {
    Employee: Pick<Employee, 'id' | 'firstName' | 'lastName'>
    HourType: Pick<HourType, 'id' | 'name'>
    TimeRegistryEmployee: (TimeRegistryEmployee & {
      Employee: Pick<Employee, 'id' | 'firstName' | 'lastName'>
    })[]
  })[]
  WorkOrderStructure: (WorkOrderStructure & {
    Employee: Pick<Employee, 'id' | 'firstName' | 'lastName'>
    Material: Pick<Material, 'id' | 'name' | 'beNumber'>
  })[]
  Training: Training[]
}
