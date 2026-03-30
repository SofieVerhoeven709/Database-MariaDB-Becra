export interface MappedMaterialPlace {
  id: string
  abbreviation: string
  beNumber: string | null
  serialTrackedId: string | null
  place: string | null
  storageEmployeeId: string | null
  storageEmployeeName: string | null
  shelf: string | null
  column: string | null
  layer: string | null
  layerPlace: string | null
  information: string | null
  quantityInStock: number
  createdAt: string
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null
}

export interface MaterialPlaceEmployeeOption {
  id: string
  name: string
}

