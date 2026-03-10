import type {WorkOrderStructure, Employee, Material, WorkOrder} from '@/generated/prisma/client'
import type {MappedWorkOrderStructure} from '@/types/workOrderStructure'

type WorkOrderStructureWithRelations = WorkOrderStructure & {
  Employee: Pick<Employee, 'firstName' | 'lastName'>
  Employee_WorkOrderStructure_deletedByToEmployee: Pick<Employee, 'firstName' | 'lastName'> | null
  Material: Pick<Material, 'id' | 'name' | 'beNumber'>
  WorkOrder: Pick<WorkOrder, 'workOrderNumber'>
}

export function mapWorkOrderStructure(s: WorkOrderStructureWithRelations): MappedWorkOrderStructure {
  return {
    id: s.id,
    clientNumber: s.clientNumber,
    tag: s.tag,
    quantity: s.quantity,
    additionalInfo: s.additionalInfo,
    shortDescription: s.shortDescription,
    longDescription: s.longDescription,
    createdAt: s.createdAt.toISOString(),
    createdBy: s.createdBy,
    workOrderId: s.workOrderId,
    materialId: s.materialId,
    deleted: s.deleted,
    deletedAt: s.deletedAt?.toISOString() ?? null,
    deletedBy: s.deletedBy,
    createdByName: `${s.Employee.firstName} ${s.Employee.lastName}`,
    deletedByName: s.Employee_WorkOrderStructure_deletedByToEmployee
      ? `${s.Employee_WorkOrderStructure_deletedByToEmployee.firstName} ${s.Employee_WorkOrderStructure_deletedByToEmployee.lastName}`
      : null,
    materialName: s.Material.name ?? '',
    materialBeNumber: s.Material.beNumber,
    workOrderNumber: s.WorkOrder.workOrderNumber,
  }
}
