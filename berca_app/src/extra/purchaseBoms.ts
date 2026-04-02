import type {MappedPurchaseBOM, MappedPurchaseBOMStructure, ChildPurchaseBOM} from '@/types/purchaseBom'

// ─── Raw types (matching updated Prisma include shape) ─────────────────────────
type StructureEmployeeRaw = {id: string; firstName: string; lastName: string}

type PurchaseBOMStructureRaw = {
  id: string
  purchaseBOMId: string
  materialId: string
  shortDescription: string | null
  additionalInfo: string | null
  description: string | null
  tag: string | null
  requiredQuantity: number | null
  reservedQuantity: number | null
  issuedQuantity: number | null
  readyForPurchaseDate: Date | null
  createdAt: Date
  createdBy: string
  readyForPurchase: boolean
  notDeliverable: boolean
  deleted: boolean
  deletedAt: Date | null
  deletedBy: string | null
  Material: {id: string; name: string | null; beNumber: string | null; shortDescription: string | null}
  Employee_PurchaseBOMStructure_createdByToEmployee: StructureEmployeeRaw
  Employee_PurchaseBOMStructure_deletedByToEmployee: StructureEmployeeRaw | null
}

type ChildBOMRaw = {
  id: string
  purchaseBomNumber: string
  description: string | null
  shortDescription: string
  closed: boolean
  materialClosed: boolean
  readyForPurchase: boolean
  deleted: boolean
  PurchaseBOMStructure: {id: string}[]
}

type PurchaseBOMRaw = {
  id: string
  projectId: string
  purchaseBomId: string | null
  purchaseBomNumber: string
  shortDescription: string
  additionalInfo: string | null
  description: string | null
  startDate: Date
  endDate: Date | null
  createdAt: Date
  createdBy: string
  closed: boolean
  materialClosed: boolean
  readyForPurchase: boolean
  deleted: boolean
  deletedAt: Date | null
  deletedBy: string | null
  Project: {id: string; projectNumber: string | null; projectName: string | null}
  Employee_PurchaseBOM_createdByToEmployee: StructureEmployeeRaw
  Employee_PurchaseBOM_deletedByToEmployee: StructureEmployeeRaw | null
  other_PurchaseBOM: ChildBOMRaw[]
  PurchaseBOMStructure: PurchaseBOMStructureRaw[]
}

function mapStructure(r: PurchaseBOMStructureRaw): MappedPurchaseBOMStructure {
  return {
    id: r.id,
    purchaseBOMId: r.purchaseBOMId,
    materialId: r.materialId,
    materialName: r.Material.name ?? r.Material.shortDescription ?? r.Material.beNumber ?? r.materialId,
    materialBeNumber: r.Material.beNumber ?? '',
    shortDescription: r.shortDescription,
    additionalInfo: r.additionalInfo,
    description: r.description,
    tag: r.tag,
    requiredQuantity: r.requiredQuantity,
    reservedQuantity: r.reservedQuantity,
    issuedQuantity: r.issuedQuantity,
    readyForPurchaseDate: r.readyForPurchaseDate?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    createdBy: r.createdBy,
    createdByName: `${r.Employee_PurchaseBOMStructure_createdByToEmployee.firstName} ${r.Employee_PurchaseBOMStructure_createdByToEmployee.lastName}`,
    readyForPurchase: r.readyForPurchase,
    notDeliverable: r.notDeliverable,
    deleted: r.deleted,
    deletedAt: r.deletedAt?.toISOString() ?? null,
    deletedBy: r.deletedBy,
    deletedByName: r.Employee_PurchaseBOMStructure_deletedByToEmployee
      ? `${r.Employee_PurchaseBOMStructure_deletedByToEmployee.firstName} ${r.Employee_PurchaseBOMStructure_deletedByToEmployee.lastName}`
      : null,
  }
}

function mapChild(r: ChildBOMRaw): ChildPurchaseBOM {
  return {
    id: r.id,
    purchaseBomNumber: r.purchaseBomNumber,
    description: r.description,
    shortDescription: r.shortDescription,
    structureCount: r.PurchaseBOMStructure.length,
    closed: r.closed,
    materialClosed: r.materialClosed,
    readyForPurchase: r.readyForPurchase,
    deleted: r.deleted,
  }
}

export function mapPurchaseBOM(r: PurchaseBOMRaw): MappedPurchaseBOM {
  const structures = r.PurchaseBOMStructure.map(mapStructure)
  return {
    id: r.id,
    projectId: r.projectId,
    projectName: r.Project.projectName,
    projectNumber: r.Project.projectNumber,
    purchaseBomId: r.purchaseBomId,
    purchaseBomNumber: r.purchaseBomNumber,
    shortDescription: r.shortDescription,
    additionalInfo: r.additionalInfo,
    description: r.description,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    createdBy: r.createdBy,
    createdByName: `${r.Employee_PurchaseBOM_createdByToEmployee.firstName} ${r.Employee_PurchaseBOM_createdByToEmployee.lastName}`,
    closed: r.closed,
    materialClosed: r.materialClosed,
    readyForPurchase: r.readyForPurchase,
    deleted: r.deleted,
    deletedAt: r.deletedAt?.toISOString() ?? null,
    deletedBy: r.deletedBy,
    deletedByName: r.Employee_PurchaseBOM_deletedByToEmployee
      ? `${r.Employee_PurchaseBOM_deletedByToEmployee.firstName} ${r.Employee_PurchaseBOM_deletedByToEmployee.lastName}`
      : null,
    structures,
    structureCount: structures.filter(s => !s.deleted).length,
    children: r.other_PurchaseBOM.map(mapChild),
  }
}
