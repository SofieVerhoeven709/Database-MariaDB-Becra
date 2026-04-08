// ─── PurchaseBOMStructure ───────────────────────────────────────────────────────
export interface MappedPurchaseBOMStructure {
  id: string
  purchaseBOMId: string
  // ─── Link back to the originating project structure ─────────────────────────
  projectBOMStructureId: string
  materialId: string
  materialName: string
  materialBeNumber: string
  // ─── Read-only fields (driven from ProjectBOMStructure) ──────────────────────
  shortDescription: string | null
  additionalInfo: string | null
  description: string | null
  tag: string | null
  requiredQuantity: number | null
  readyForPurchaseDate: string | null
  notDeliverable: boolean
  createdAt: string
  createdBy: string
  createdByName: string
  deleted: boolean
  approvedForQuote: boolean
  purchased: boolean
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null
  // ─── Execution fields (editable on purchase side) ────────────────────────────
  reservedQuantity: number | null
  issuedQuantity: number | null
  notCorrect: boolean
  notCorrectReason: string | null
  completedDate: string | null
}

// ─── Child BOM summary (lightweight, no nested children to avoid infinite type) ─
export interface ChildPurchaseBOM {
  id: string
  purchaseBomNumber: string
  description: string | null
  shortDescription: string
  structureCount: number
  closed: boolean
  purchased: boolean
  approvedForQuote: boolean
  materialClosed: boolean
  deleted: boolean
}

// ─── PurchaseBOM ────────────────────────────────────────────────────────────────
export interface MappedPurchaseBOM {
  id: string
  projectId: string
  projectName: string | null
  projectNumber: string | null
  purchaseBomNumber: string
  /** ID of the parent BOM (self-relation foreign key) */
  purchaseBomId: string | null
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
  approvedForQuote: boolean
  deleted: boolean
  purchased: boolean
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null
  structures: MappedPurchaseBOMStructure[]
  structureCount: number
  /** Direct children of this BOM (one level deep) */
  children: ChildPurchaseBOM[]
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
