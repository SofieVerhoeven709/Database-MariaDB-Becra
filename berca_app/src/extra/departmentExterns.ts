import type {DepartmentExtern, Employee} from '@/generated/prisma/client'
import type {MappedDepartmentExternItem} from '@/types/departmentExtern'

export type DepartmentExternWithAudit = DepartmentExtern & {
  Employee_DepartmentExtern_createdByToEmployee: Pick<Employee, 'firstName' | 'lastName'>
  Employee_DepartmentExtern_deletedByToEmployee: Pick<Employee, 'firstName' | 'lastName'> | null
}

export function mapDepartmentExternItem(d: DepartmentExternWithAudit): MappedDepartmentExternItem {
  return {
    id: d.id,
    name: d.name,
    createdAt: d.createdAt.toISOString(),
    createdByName: `${d.Employee_DepartmentExtern_createdByToEmployee.firstName} ${d.Employee_DepartmentExtern_createdByToEmployee.lastName}`,
    deleted: d.deleted,
    deletedAt: d.deletedAt?.toISOString() ?? null,
    deletedByName: d.Employee_DepartmentExtern_deletedByToEmployee
      ? `${d.Employee_DepartmentExtern_deletedByToEmployee.firstName} ${d.Employee_DepartmentExtern_deletedByToEmployee.lastName}`
      : null,
  }
}

