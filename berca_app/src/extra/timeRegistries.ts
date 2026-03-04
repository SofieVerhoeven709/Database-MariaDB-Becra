import type {MappedTimeRegistry} from '@/types/timeRegistry'

type TimeRegistryWithRelations = {
  id: string
  activityDescription: string | null
  additionalInfo: string | null
  invoiceInfo: string | null
  startTime: Date
  endTime: Date | null
  workDate: Date
  startBreak: Date | null
  endBreak: Date | null
  createdAt: Date
  invoiceTime: boolean
  onSite: boolean
  createdBy: string
  workOrderId: string
  hourTypeId: string
  deleted: boolean
  deletedAt: Date | null
  deletedBy: string | null
  Employee: {firstName: string; lastName: string}
  HourType: {name: string}
  WorkOrder: {workOrderNumber: string | null}
  TimeRegistryEmployee: {
    id: string
    employeeId: string
    Employee: {firstName: string; lastName: string}
  }[]
}

export function mapTimeRegistry(tr: TimeRegistryWithRelations): MappedTimeRegistry {
  return {
    id: tr.id,
    activityDescription: tr.activityDescription,
    additionalInfo: tr.additionalInfo,
    invoiceInfo: tr.invoiceInfo,
    startTime: tr.startTime.toISOString(),
    endTime: tr.endTime?.toISOString() ?? null,
    workDate: tr.workDate.toISOString(),
    startBreak: tr.startBreak?.toISOString() ?? null,
    endBreak: tr.endBreak?.toISOString() ?? null,
    createdAt: tr.createdAt.toISOString(),
    invoiceTime: tr.invoiceTime,
    onSite: tr.onSite,
    createdBy: tr.createdBy,
    workOrderId: tr.workOrderId,
    hourTypeId: tr.hourTypeId,
    deleted: tr.deleted,
    deletedAt: tr.deletedAt?.toISOString() ?? null,
    deletedBy: tr.deletedBy,
    employeeFirstName: tr.Employee.firstName,
    employeeLastName: tr.Employee.lastName,
    hourTypeName: tr.HourType.name,
    workOrderNumber: tr.WorkOrder.workOrderNumber,
    additionalEmployees: tr.TimeRegistryEmployee.map(tre => ({
      id: tre.id,
      employeeId: tre.employeeId,
      employeeFirstName: tre.Employee.firstName,
      employeeLastName: tre.Employee.lastName,
    })),
  }
}
