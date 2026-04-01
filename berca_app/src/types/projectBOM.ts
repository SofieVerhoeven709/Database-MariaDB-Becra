// ─── ProjectBOMStructure ───────────────────────────────────────────────────────
export interface MappedProjectBOMStructure {
  id: string
  projectBOMId: string
  materialId: string
  materialName: string
  materialBeNumber: string
  shortDescription: string | null
  additionalInfo: string | null
  description: string | null
  tag: string | null
  requiredQuantity: number | null
  reservedQuantity: number | null
  issuedQuantity: number | null
  readyForPurchaseDate: string | null
  createdAt: string
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
}

// ─── ProjectBOM ────────────────────────────────────────────────────────────────
export interface MappedProjectBOM {
  id: string
  projectId: string
  projectName: string | null
  projectNumber: string | null
  parentPart: string | null
  additionalInfo: string | null
  description: string | null
  startDate: string
  endDate: string | null
  createdAt: string
  createdBy: string
  createdByName: string
  closed: boolean
  materialClosed: boolean
  readyForPurchase: boolean
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null
  structures: MappedProjectBOMStructure[]
  structureCount: number
}

// ─── Project option (for search/select) ───────────────────────────────────────
export interface ProjectOption {
  id: string
  projectNumber: string
  projectName: string
}

// ─── Material option ───────────────────────────────────────────────────────────
export interface BomMaterialOption {
  id: string
  beNumber: string | null
  name: string | null
  shortDescription: string | null
}
