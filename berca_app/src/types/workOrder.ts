import type {WorkOrderDetailData} from '@/extra/workOrders'

export interface MappedWorkOrder {
  id: string
  workOrderNumber: string | null
  description: string | null
  additionalInfo: string | null
  startDate: string
  endDate: string | null
  createdAt: string
  hoursMaterialClosed: boolean
  invoiceSent: boolean
  completed: boolean
  createdBy: string
  projectId: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  // display fields
  createdByName: string
  deletedByName: string | null
  projectNumber: string
  projectName: string
}

export interface EmployeeOption {
  // Minimal employee shape for selectors.
  id: string
  firstName: string
  lastName: string
}

export interface HourTypeOption {
  // Minimal hour type shape for selectors.
  id: string
  name: string
}

export interface MaterialOption {
  // Minimal material shape for selectors.
  id: string
  name: string
}

export interface PermissionProps {
  // Permissions are derived from the current user's role/level.
  canAdd: boolean
  canDelete: boolean
  isAdmin: boolean
  canApprove: boolean
}

// Row types used by detail tabs.
export type TimeRegistryRow = WorkOrderDetailData['TimeRegistry'][number]
export type StructureRow = WorkOrderDetailData['WorkOrderStructure'][number]
