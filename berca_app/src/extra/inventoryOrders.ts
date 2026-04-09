import type {Prisma} from '@/generated/prisma/client'
import type {MappedInventoryOrder} from '@/types/inventoryOrder'

type InventoryOrderWithRelations = Prisma.InventoryOrderGetPayload<{
  include: {
    Employee: {select: {id: true; firstName: true; lastName: true}}
    Employee_InventoryOrder_approvedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Inventory: {select: {id: true; beNumber: true; shortDescription: true}}
  }
}>

export function mapInventoryOrder(o: InventoryOrderWithRelations): MappedInventoryOrder {
  return {
    id: o.id,
    inventoryId: o.inventoryId,
    inventoryBeNumber: o.Inventory.beNumber ?? null,
    inventoryDescription: o.Inventory.shortDescription ?? null,
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
    deleted: o.deleted,
    deletedAt: o.deletedAt?.toISOString() ?? null,
    deletedBy: o.deletedBy ?? null,
  }
}

