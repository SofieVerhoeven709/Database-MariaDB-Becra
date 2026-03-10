export interface MappedWorkOrderStructure {
  id: string
  clientNumber: string | null
  tag: string | null
  quantity: number | null
  additionalInfo: string | null
  shortDescription: string | null
  longDescription: string | null
  createdAt: string
  createdBy: string
  workOrderId: string
  materialId: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  // display fields
  createdByName: string
  deletedByName: string | null
  materialName: string
  materialBeNumber: string
  workOrderNumber: string | null
}

export interface MaterialOption {
  id: string
  name: string
  beNumber: string
}
