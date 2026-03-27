import type {QuoteBecra, Employee} from '@/generated/prisma/client'
import type {MappedQuoteBecra} from '@/types/quoteBecra'

type QuoteBecraWithRelations = QuoteBecra & {
  Employee_QuoteBecra_createdByToEmployee: Pick<Employee, 'id' | 'firstName' | 'lastName'>
  Employee_QuoteBecra_deletedByToEmployee: Pick<Employee, 'id' | 'firstName' | 'lastName'> | null
}

export function mapQuoteBecra(q: QuoteBecraWithRelations): MappedQuoteBecra {
  return {
    id: q.id,
    description: q.description,
    validDate: q.validDate,
    date: q.date?.toISOString() ?? null,
    createdBy: q.createdBy,
    deleted: q.deleted,
    deletedAt: q.deletedAt?.toISOString() ?? null,
    deletedBy: q.deletedBy,
    createdByName: `${q.Employee_QuoteBecra_createdByToEmployee.firstName} ${q.Employee_QuoteBecra_createdByToEmployee.lastName}`,
    deletedByName: q.Employee_QuoteBecra_deletedByToEmployee
      ? `${q.Employee_QuoteBecra_deletedByToEmployee.firstName} ${q.Employee_QuoteBecra_deletedByToEmployee.lastName}`
      : null,
  }
}

