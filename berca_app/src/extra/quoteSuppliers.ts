import type {Prisma} from '@/generated/prisma/client'
import type {MappedQuoteSupplier, MappedQuoteSupplierDetail} from '@/types/quoteSupplier'

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
    validUntill: q.validUntill?.toISOString() ?? null,
    deliveryTimeDays: q.deliveryTimeDays ?? null,
    paymentConditionId: q.paymentConditionId ?? null,
    paymentConditionName: q.PaymentCondition?.name ?? null,
    createdBy: q.createdBy,
    createdByName: `${q.Employee.firstName} ${q.Employee.lastName}`,
    deleted: q.deleted,
    deletedAt: q.deletedAt?.toISOString() ?? null,
    deletedBy: q.deletedBy ?? null,
    deletedByName: q.Employee_QuoteSupplier_deletedByToEmployee
      ? `${q.Employee_QuoteSupplier_deletedByToEmployee.firstName} ${q.Employee_QuoteSupplier_deletedByToEmployee.lastName}`
      : null,
    lineCount: q._count.QuoteSupplierLine,
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
      materialDemandLabel: line.MaterialDemand
        ? `${line.MaterialDemand.Material.beNumber ?? '—'} — ${line.MaterialDemand.Material.shortDescription ?? line.MaterialDemand.Material.name ?? line.MaterialDemand.id}`
        : null,
      quantity: line.quantity,
      unitPrice: Number(line.unitPrice),
      minQuantity: line.minQuantity ?? null,
      selected: !!line.selected,
    })),
  }
}

