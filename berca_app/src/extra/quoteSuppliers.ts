import type {Prisma} from '@/generated/prisma/client'
import type {MappedQuoteSupplier} from '@/types/quoteSupplier'

type QuoteSupplierWithRelations = Prisma.QuoteSupplierGetPayload<{
  include: {
    Employee: {select: {id: true; firstName: true; lastName: true}}
    Employee_QuoteSupplier_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Company: {select: {id: true; name: true; number: true}}
    PaymentCondition: {select: {id: true; name: true}}
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
  }
}

