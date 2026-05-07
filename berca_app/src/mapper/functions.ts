import type {Function, Employee} from '@/generated/prisma/client'
import type {MappedFunctionItem} from '@/types/function'

export type FunctionWithAudit = Function & {
  Employee_Function_createdByToEmployee: Pick<Employee, 'firstName' | 'lastName'>
  Employee_Function_deletedByToEmployee: Pick<Employee, 'firstName' | 'lastName'> | null
}

export function mapFunctionItem(f: FunctionWithAudit): MappedFunctionItem {
  return {
    id: f.id,
    name: f.name,
    createdAt: f.createdAt.toISOString(),
    createdByName: `${f.Employee_Function_createdByToEmployee.firstName} ${f.Employee_Function_createdByToEmployee.lastName}`,
    deleted: f.deleted,
    deletedAt: f.deletedAt?.toISOString() ?? null,
    deletedByName: f.Employee_Function_deletedByToEmployee
      ? `${f.Employee_Function_deletedByToEmployee.firstName} ${f.Employee_Function_deletedByToEmployee.lastName}`
      : null,
  }
}
