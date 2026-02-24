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
} from '@/generated/prisma/client'
import type {MappedWorkOrder} from '@/types/workOrder'

// ─── Mapper for list / simple use ────────────────────────────────────────────
type WorkOrderWithRelations = WorkOrder & {
  Employee: Pick<Employee, 'firstName' | 'lastName'>
  Project: Pick<Project, 'projectNumber' | 'projectName'>
}

export function mapWorkOrder(wo: WorkOrderWithRelations): MappedWorkOrder {
  return {
    id: wo.id,
    workOrderNumber: wo.workOrderNumber,
    description: wo.description,
    aditionalInfo: wo.aditionalInfo,
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
    createdByFirstName: wo.Employee.firstName,
    createdByLastName: wo.Employee.lastName,
    projectNumber: wo.Project.projectNumber,
    projectName: wo.Project.projectName,
  }
}

// ─── Full detail shape passed to the UI component ────────────────────────────
export type WorkOrderDetailData = WorkOrder & {
  Employee: Pick<Employee, 'firstName' | 'lastName'>
  Project: Pick<Project, 'projectNumber' | 'projectName'>
  TimeRegistry: (TimeRegistry & {
    Employee: Pick<Employee, 'firstName' | 'lastName'>
    HourType: Pick<HourType, 'name'>
    TimeRegistryEmployee: (TimeRegistryEmployee & {
      Employee: Pick<Employee, 'firstName' | 'lastName'>
    })[]
  })[]
  WorkOrderStructure: (WorkOrderStructure & {
    Employee: Pick<Employee, 'firstName' | 'lastName'>
    Material: Pick<Material, 'name'>
  })[]
  Training: Training[]
}
