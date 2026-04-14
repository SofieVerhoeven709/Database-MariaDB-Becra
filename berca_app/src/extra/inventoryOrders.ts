import type {Prisma} from '@/generated/prisma/client'
import type {MappedInventoryOrder} from '@/types/inventoryOrder'

type InventoryOrderWithRelations = Prisma.InventoryOrderGetPayload<{
  include: {
    Employee: {select: {id: true; firstName: true; lastName: true}}
    Employee_InventoryOrder_approvedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_InventoryOrder_rejectedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_InventoryOrder_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Material: {select: {id: true; beNumber: true; shortDescription: true}}
  }
}>

export function mapInventoryOrder(o: InventoryOrderWithRelations): MappedInventoryOrder {
  return {
    id: o.id,
    materialId: o.materialId,
    inventoryBeNumber: o.Material.beNumber ?? null,
    inventoryDescription: o.Material.shortDescription ?? null,
    orderNumber: o.orderNumber,
    requestedQty: o.requestedQty ?? 1,
    orderDate: o.orderDate.toISOString(),
    shortDescription: o.shortDescription,
    longDescription: o.longDescription ?? null,
    createdAt: o.createdAt.toISOString(),
    createdBy: o.createdBy,
    createdByName: `${o.Employee.firstName} ${o.Employee.lastName}`,
    approved: o.approved,
    approvedAt: o.approvedAt?.toISOString() ?? null,
    approvedBy: o.approvedBy ?? null,
    approvedByName: o.Employee_InventoryOrder_approvedByToEmployee
      ? `${o.Employee_InventoryOrder_approvedByToEmployee.firstName} ${o.Employee_InventoryOrder_approvedByToEmployee.lastName}`
      : null,
    rejected: o.rejected ?? false,
    rejectedAt: o.rejectedAt?.toISOString() ?? null,
    rejectedBy: o.rejectedBy ?? null,
    rejectedByName: o.Employee_InventoryOrder_rejectedByToEmployee
      ? `${o.Employee_InventoryOrder_rejectedByToEmployee.firstName} ${o.Employee_InventoryOrder_rejectedByToEmployee.lastName}`
      : null,
    notDeliverable: o.notDeliverable,
    notCorrect: o.notCorrect,
    notCorrectReason: o.notCorrectReason ?? null,
    snapshotTakenAt: o.snapshotTakenAt?.toISOString() ?? null,
    deleted: o.deleted,
    deletedAt: o.deletedAt?.toISOString() ?? null,
    deletedBy: o.deletedBy ?? null,
    deletedByName: o.Employee_InventoryOrder_deletedByToEmployee
      ? `${o.Employee_InventoryOrder_deletedByToEmployee.firstName} ${o.Employee_InventoryOrder_deletedByToEmployee.lastName}`
      : null,
  }
}

