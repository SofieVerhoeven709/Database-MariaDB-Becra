import type {Prisma} from '@/generated/prisma/client'
import type {MappedPurchase, MappedPurchaseDetail} from '@/types/purchase'

type PurchaseWithRelations = Prisma.PurchaseGetPayload<{
  include: {
    Company: true
    QuoteSupplier: {select: {id: true; quoteNumber: true}}
    PaymentCondition: {select: {id: true; name: true}}
    Employee: {select: {id: true; firstName: true; lastName: true}}
  }
}>

const PURCHASE_STATUSES = new Set(['DRAFT', 'ORDERED', 'PARTIAL_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED'])

export function normalizePurchaseStatus(status: string | null | undefined): string {
  // Enforce a known status set; fall back to DRAFT/ORDERED when input is missing or unexpected.
  if (!status) return 'DRAFT'
  return PURCHASE_STATUSES.has(status) ? status : 'ORDERED'
}

export function mapPurchase(p: PurchaseWithRelations): MappedPurchase {
  return {
    id: p.id,
    purchaseNumber: p.purchaseNumber,
    purchaseDate: p.purchaseDate?.toISOString() ?? null,
    status: normalizePurchaseStatus(p.status),
    companyId: p.companyId,
    companyName: p.Company?.name ?? null,
    quoteSupplierId: p.quoteSupplierId,
    quoteNumber: p.QuoteSupplier?.quoteNumber ?? null,
    paymentConditionId: p.paymentConditionId,
    paymentConditionName: p.PaymentCondition?.name ?? null,
    shortDescription: p.shortDescription,
    createdAt: p.createdAt?.toISOString() ?? null,
    createdBy: p.createdBy,
    createdByName: `${p.Employee.firstName} ${p.Employee.lastName}`,
    description: p.description,
    additionalInfo: p.additionalInfo,
    deleted: p.deleted,
    deletedAt: p.deletedAt?.toISOString() ?? null,
    deletedBy: p.deletedBy,
  }
}

type PurchaseDetailWithRelations = Prisma.PurchaseDetailGetPayload<{
  include: {
    Employee: {select: {id: true; firstName: true; lastName: true}}
    Material: {select: {id: true; beNumber: true; name: true; shortDescription: true}}
  }
}>

export function mapPurchaseDetail(d: PurchaseDetailWithRelations): MappedPurchaseDetail {
  return {
    id: d.id,
    purchaseId: d.purchaseId,
    quoteSupplierLineId: d.quoteSupplierLineId,
    materialId: d.materialId,
    // Prefer BE number + name; fall back to short description when name is missing.
    materialLabel: [d.Material?.beNumber, d.Material?.name ?? d.Material?.shortDescription]
      .filter(Boolean)
      .join(' - '),
    materialDemandId: d.materialDemandId,
    unitPrice: d.unitPrice?.toString() ?? null,
    quantity: d.quantity ?? 0,
    minQuantity: d.minQuantity,
    // Default new lines to OPEN when no line status is stored.
    lineStatus: d.lineStatus ?? 'OPEN',
    additionalInfo: d.additionalInfo,
    notDeliverable: d.notDeliverable,
    createdAt: d.createdAt?.toISOString() ?? null,
    createdBy: d.createdBy,
    createdByName: `${d.Employee.firstName} ${d.Employee.lastName}`,
    deleted: d.deleted,
    deletedAt: d.deletedAt?.toISOString() ?? null,
    deletedBy: d.deletedBy,
  }
}
