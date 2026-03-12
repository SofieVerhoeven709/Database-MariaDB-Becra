import type {Prisma} from '@/generated/prisma/client'
import type {MappedPurchase, MappedPurchaseDetail} from '@/types/purchase'

type PurchaseWithRelations = Prisma.PurchaseGetPayload<{
  include: {
    Company: true
    Project: {select: {id: true; projectNumber: true; projectName: true}}
    Employee: {select: {id: true; firstName: true; lastName: true}}
  }
}>

export function mapPurchase(p: PurchaseWithRelations): MappedPurchase {
  return {
    id: p.id,
    orderNumber: p.orderNumber,
    brandName: p.brandName,
    purchaseDate: p.purchaseDate?.toISOString() ?? null,
    status: p.status,
    companyId: p.companyId,
    companyName: p.Company?.name ?? null,
    projectId: p.projectId,
    projectNumber: p.Project?.projectNumber ?? null,
    projectName: p.Project?.projectName ?? null,
    updatedAt: p.updatedAt?.toISOString() ?? null,
    createdBy: p.createdBy,
    createdByName: `${p.Employee.firstName} ${p.Employee.lastName}`,
    preferredSupplier: p.preferredSupplier,
    description: p.description,
    deleted: p.deleted,
    deletedAt: p.deletedAt?.toISOString() ?? null,
    deletedBy: p.deletedBy,
  }
}

type PurchaseDetailWithRelations = Prisma.PurchaseDetailGetPayload<{
  include: {
    Employee: {select: {id: true; firstName: true; lastName: true}}
    Project: {select: {id: true; projectNumber: true; projectName: true}}
  }
}>

export function mapPurchaseDetail(d: PurchaseDetailWithRelations): MappedPurchaseDetail {
  return {
    id: d.id,
    purchaseId: d.purchaseId,
    projectId: d.projectId,
    projectNumber: d.Project?.projectNumber ?? null,
    projectName: d.Project?.projectName ?? null,
    beNumber: d.beNumber,
    unitPrice: d.unitPrice?.toString() ?? null,
    quantity: d.quantity,
    totalCost: d.totalCost?.toString() ?? null,
    status: d.status,
    additionalInfo: d.additionalInfo,
    updatedAt: d.updatedAt?.toISOString() ?? null,
    createdBy: d.createdBy,
    createdByName: `${d.Employee.firstName} ${d.Employee.lastName}`,
    deleted: d.deleted,
    deletedAt: d.deletedAt?.toISOString() ?? null,
    deletedBy: d.deletedBy,
  }
}
