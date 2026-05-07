import type {Prisma} from '@/generated/prisma/client'
import type {MappedPurchase, MappedPurchaseDetail} from '@/types/purchase'

type PurchaseWithRelations = Prisma.PurchaseGetPayload<{
  include: {
    Company: true
    QuoteSupplier: {select: {id: true; quoteNumber: true}}
    PaymentCondition: {select: {id: true; name: true}}
    Employee: {select: {id: true; firstName: true; lastName: true}}
    Employee_Purchase_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
  }
}>

type PurchaseWithOptionalCustomerRefs = PurchaseWithRelations & {
  customerPoNumber?: string | null
  bocNumber?: string | null
  bocCustomerName?: string | null
  bocDescription?: string | null
  bocCreatedAt?: Date | null
  bocStatus?: string | null
}

const PURCHASE_STATUSES = new Set(['DRAFT', 'ORDERED', 'PARTIAL_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED'])

export function normalizePurchaseStatus(status: string | null | undefined): string {
  // Enforce a known status set; fall back to DRAFT/ORDERED when input is missing or unexpected.
  if (!status) return 'DRAFT'
  return PURCHASE_STATUSES.has(status) ? status : 'ORDERED'
}

export function mapPurchase(p: PurchaseWithRelations): MappedPurchase {
  const purchase = p as PurchaseWithOptionalCustomerRefs
  return {
    id: purchase.id,
    purchaseNumber: purchase.purchaseNumber,
    customerPoNumber: purchase.customerPoNumber ?? null,
    bocNumber: purchase.bocNumber ?? null,
    bocCustomerName: purchase.bocCustomerName ?? null,
    bocDescription: purchase.bocDescription ?? null,
    bocCreatedAt: purchase.bocCreatedAt?.toISOString() ?? null,
    bocStatus: purchase.bocStatus ?? null,
    purchaseDate: purchase.purchaseDate?.toISOString() ?? null,
    status: normalizePurchaseStatus(purchase.status),
    companyId: purchase.companyId,
    companyName: purchase.Company?.name ?? null,
    quoteSupplierId: purchase.quoteSupplierId,
    quoteNumber: purchase.QuoteSupplier?.quoteNumber ?? null,
    paymentConditionId: purchase.paymentConditionId,
    paymentConditionName: purchase.PaymentCondition?.name ?? null,
    createdAt: purchase.createdAt?.toISOString() ?? null,
    createdBy: purchase.createdBy,
    createdByName: `${purchase.Employee.firstName} ${purchase.Employee.lastName}`,
    description: purchase.description,
    additionalInfo: purchase.additionalInfo,
    deleted: purchase.deleted,
    deletedAt: purchase.deletedAt?.toISOString() ?? null,
    deletedBy: purchase.deletedBy,
    deletedByName: purchase.Employee_Purchase_deletedByToEmployee
      ? `${purchase.Employee_Purchase_deletedByToEmployee.firstName} ${purchase.Employee_Purchase_deletedByToEmployee.lastName}`
      : null,
  }
}

type PurchaseDetailWithRelations = Prisma.PurchaseDetailGetPayload<{
  include: {
    Employee: {select: {id: true; firstName: true; lastName: true}}
    Material: {select: {id: true; beNumber: true; name: true}}
  }
}>

type PurchaseDetailWithLegacyMaterialShape = Prisma.PurchaseDetailGetPayload<{
  include: {
    Employee: {select: {id: true; firstName: true; lastName: true}}
    Material: {select: {id: true; beNumber: true; name: true; shortDescription: true}}
  }
}>

export function mapPurchaseDetail(
  d: PurchaseDetailWithRelations | PurchaseDetailWithLegacyMaterialShape,
): MappedPurchaseDetail {
  return {
    id: d.id,
    purchaseId: d.purchaseId,
    quoteSupplierLineId: d.quoteSupplierLineId,
    materialId: d.materialId,
    // Prefer BE number + name for purchase labels.
    materialLabel: [d.Material?.beNumber, d.Material?.name].filter(Boolean).join(' - '),
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
