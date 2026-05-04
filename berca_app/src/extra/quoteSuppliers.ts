import type {Prisma} from '@/generated/prisma/client'
import type {MappedPaymentCondition, MappedQuoteSupplier, MappedQuoteSupplierDetail} from '@/types/quoteSupplier'

type QuoteSupplierWithRelations = Prisma.QuoteSupplierGetPayload<{
  include: {
    Employee: {select: {id: true; firstName: true; lastName: true}}
    Employee_QuoteSupplier_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Company: {select: {id: true; name: true; number: true}}
    PaymentCondition: {select: {id: true; name: true}}
    _count: {select: {QuoteSupplierLine: true}}
  }
}>

type QuoteSupplierDetailWithRelations = Prisma.QuoteSupplierGetPayload<{
  include: {
    Employee: {select: {id: true; firstName: true; lastName: true}}
    Employee_QuoteSupplier_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Company: {select: {id: true; name: true; number: true}}
    PaymentCondition: {select: {id: true; name: true}}
    _count: {select: {QuoteSupplierLine: true}}
    QuoteSupplierLine: {
      include: {
        Material: {select: {id: true; beNumber: true; name: true; shortDescription: true}}
        MaterialDemand: {
          select: {
            id: true
            Material: {select: {id: true; beNumber: true; name: true; shortDescription: true}}
          }
        }
      }
    }
    QuoteSupplierMiscLine: true
  }
}>

type PaymentConditionWithRelations = Prisma.PaymentConditionGetPayload<{
  include: {
    Employee_PaymentCondition_createdByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_PaymentCondition_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
  }
}>

export function mapQuoteSupplier(q: QuoteSupplierWithRelations): MappedQuoteSupplier {
  return {
    id: q.id,
    quoteNumber: q.quoteNumber,
    quotationNumber: q.quotationNumber ?? null,
    companyId: q.companyId,
    companyName: q.Company.name,
    description: q.description ?? null,
    rejected: q.rejected,
    additionalInfo: q.additionalInfo ?? null,
    acceptedForPOB: q.acceptedForPOB,
    validUntil: q.validUntil?.toISOString() ?? null,
    deliveryTimeDays: q.deliveryTimeDays ?? null,
    paymentConditionId: q.paymentConditionId ?? null,
    paymentConditionName: q.PaymentCondition?.name ?? null,
    createdBy: q.createdBy,
    // Flatten creator name for list display.
    createdByName: `${q.Employee.firstName} ${q.Employee.lastName}`,
    deleted: q.deleted,
    deletedAt: q.deletedAt?.toISOString() ?? null,
    deletedBy: q.deletedBy ?? null,
    deletedByName: q.Employee_QuoteSupplier_deletedByToEmployee
      ? `${q.Employee_QuoteSupplier_deletedByToEmployee.firstName} ${q.Employee_QuoteSupplier_deletedByToEmployee.lastName}`
      : null,
    lineCount: q._count.QuoteSupplierLine,
    sent: q.sent,
    received: q.received,
  }
}

export function mapQuoteSupplierDetail(q: QuoteSupplierDetailWithRelations): MappedQuoteSupplierDetail {
  return {
    ...mapQuoteSupplier(q),
    lines: q.QuoteSupplierLine.map(line => ({
      id: line.id,
      materialId: line.materialId,
      materialBeNumber: line.Material.beNumber ?? null,
      materialName: line.Material.name ?? null,
      materialShortDescription: line.Material.shortDescription ?? null,
      materialDemandId: line.materialDemandId ?? null,
      // Human-readable label for demand context in the detail table.
      materialDemandLabel: line.MaterialDemand
        ? `${line.MaterialDemand.Material.beNumber ?? '—'} — ${line.MaterialDemand.Material.shortDescription ?? line.MaterialDemand.Material.name ?? line.MaterialDemand.id}`
        : null,
      quantity: line.quantity,
      // Prisma returns Decimal for unitPrice; cast to number for UI math/formatting.
      unitPrice: Number(line.unitPrice),
      minQuantity: line.minQuantity ?? null,
      supplierDescription: line.supplierDescription ?? null,
      selected: !!line.selected,
      notDeliverable: line.notDeliverable,
    })),
    miscLines: q.QuoteSupplierMiscLine.map(ml => ({
      id: ml.id,
      description: ml.description,
      unitPrice: Number(ml.unitPrice),
    })),
  }
}

export function mapPaymentCondition(row: PaymentConditionWithRelations): MappedPaymentCondition {
  return {
    id: row.id,
    name: row.name,
    deleted: row.deleted,
    createdAt: row.createdAt.toISOString(),
    createdBy: row.createdBy,
    createdByName: `${row.Employee_PaymentCondition_createdByToEmployee.firstName} ${row.Employee_PaymentCondition_createdByToEmployee.lastName}`,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    deletedBy: row.deletedBy ?? null,
    deletedByName: row.Employee_PaymentCondition_deletedByToEmployee
      ? `${row.Employee_PaymentCondition_deletedByToEmployee.firstName} ${row.Employee_PaymentCondition_deletedByToEmployee.lastName}`
      : null,
  }
}
