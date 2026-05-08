// ─── ProjectBOMStructure ───────────────────────────────────────────────────────
import {MappedProjectEmployee} from '@/types/project'

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
  readyForPurchaseDate: string | null
  readyForPurchase: boolean
  createdAt: string
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null
  // ─── Execution fields (from BOMExecution, read-only on project side) ────────
  execStockReservedQuantity: number | null
  execIssuedQuantity: number | null
  execNotDeliverable: boolean
  execNotCorrect: boolean
  execNotCorrectReason: string | null
  execCompletedDate: string | null
}

// ─── Child BOM summary (lightweight, no nested children to avoid infinite type) ─
export interface ChildProjectBOM {
  id: string
  projectBomNumber: string
  description: string | null
  shortDescription: string
  structureCount: number
  closed: boolean
  materialClosed: boolean
  readyForPurchase: boolean
  deleted: boolean
}

// ─── ProjectBOM ────────────────────────────────────────────────────────────────
export interface MappedProjectBOM {
  id: string
  projectId: string
  projectName: string | null
  projectNumber: string | null
  projectBomNumber: string
  /** ID of the parent BOM (self-relation foreign key) */
  projectBomId: string | null
  additionalInfo: string | null
  description: string | null
  shortDescription: string
  startDate: string
  endDate: string | null
  createdAt: string
  createdBy: string
  createdByName: string
  closed: boolean
  materialClosed: boolean
  readyForPurchase: boolean
  canCopy: boolean
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null
  structures: MappedProjectBOMStructure[]
  structureCount: number
  /** Direct children of this BOM (one level deep) */
  children: ChildProjectBOM[]
  projectEmployees: MappedProjectEmployee[]
}

export interface ProjectOptionBom {
  id: string
  projectNumber: string | null
  projectName: string | null
  projectEmployees: MappedProjectEmployee[]
}

// ─── Project option (for search/select) ───────────────────────────────────────
export interface ProjectOption {
  id: string
  projectNumber: string | null
  projectName: string | null
}

// ─── Material option ───────────────────────────────────────────────────────────
export interface BomMaterialOption {
  id: string
  beNumber: string | null
  name: string | null
  shortDescription: string | null
}
