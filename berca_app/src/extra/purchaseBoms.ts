import type {Prisma} from '@/generated/prisma/client'
import type {MappedPurchaseBom} from '@/types/purchaseBom'

type PurchaseBomWithRelations = Prisma.PurchaseOrderBecraGetPayload<{
  include: {Employee: {select: {id: true; firstName: true; lastName: true}}}
}>

export function mapPurchaseBom(p: PurchaseBomWithRelations): MappedPurchaseBom {
  return {
    id: p.id,
    description: p.description ?? null,
    date: p.date?.toISOString() ?? null,
    createdBy: p.createdBy,
    createdByName: `${p.Employee.firstName} ${p.Employee.lastName}`,
    deleted: p.deleted,
    deletedAt: p.deletedAt?.toISOString() ?? null,
    deletedBy: p.deletedBy ?? null,
  }
}

