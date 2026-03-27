import type {Prisma} from '@/generated/prisma/client'
import type {MappedQuoteSupplier} from '@/types/quoteSupplier'

type QuoteSupplierWithRelations = Prisma.QuoteSupplierGetPayload<{
  include: {
    Employee: {select: {id: true; firstName: true; lastName: true}}
    Project: {select: {id: true; projectNumber: true; projectName: true}}
  }
}>

export function mapQuoteSupplier(q: QuoteSupplierWithRelations): MappedQuoteSupplier {
  return {
    id: q.id,
    description: q.description ?? null,
    projectId: q.projectId ?? null,
    projectName: q.Project ? `${q.Project.projectNumber} – ${q.Project.projectName}` : null,
    rejected: q.rejected,
    additionalInfo: q.additionalInfo ?? null,
    link: q.link ?? null,
    payementCondition: q.payementCondition ?? null,
    acceptedForPOB: q.acceptedForPOB ?? null,
    validUntill: q.validUntill?.toISOString() ?? null,
    deliveryTimeDays: q.deliveryTimeDays ?? null,
    createdBy: q.createdBy,
    createdByName: `${q.Employee.firstName} ${q.Employee.lastName}`,
    deleted: q.deleted,
    deletedAt: q.deletedAt?.toISOString() ?? null,
    deletedBy: q.deletedBy ?? null,
  }
}

