import type {Prisma} from '@/generated/prisma/client'
import type {MappedInventoryOrder} from '@/types/inventoryOrder'

type InventoryOrderWithRelations = Prisma.InventoryOrderGetPayload<{
  include: {
    Employee: {select: {id: true; firstName: true; lastName: true}}
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
    orderDate: o.orderDate.toISOString(),
    shortDescription: o.shortDescription,
    longDescription: o.longDescription ?? null,
    createdAt: o.createdAt.toISOString(),
    createdBy: o.createdBy,
    createdByName: `${o.Employee.firstName} ${o.Employee.lastName}`,
    deleted: o.deleted,
    deletedAt: o.deletedAt?.toISOString() ?? null,
    deletedBy: o.deletedBy ?? null,
  }
}

