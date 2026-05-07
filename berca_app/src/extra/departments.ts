import type {Department, Employee} from '@/generated/prisma/client'
import type {MappedDepartment} from '@/types/department'

type DepartmentWithRelations = Department & {
  Employee_Department_createdByToEmployee: Pick<Employee, 'firstName' | 'lastName'>
  Employee_Department_deletedByToEmployee: Pick<Employee, 'firstName' | 'lastName'> | null
}

export function mapDepartment(d: DepartmentWithRelations): MappedDepartment {
  return {
    id: d.id,
    name: d.name,
    color: d.color,
    icon: d.icon,
    description: d.description,
    number: d.number,
    // Normalize dates to ISO strings for the client.
    createdAt: d.createdAt.toISOString(),
    createdBy: d.createdBy,
    deleted: d.deleted,
    deletedAt: d.deletedAt?.toISOString() ?? null,
    deletedBy: d.deletedBy,
    targetId: d.targetId,
    // Denormalized display fields used in list views.
    createdByName: `${d.Employee_Department_createdByToEmployee.firstName} ${d.Employee_Department_createdByToEmployee.lastName}`,
    deletedByName: d.Employee_Department_deletedByToEmployee
      ? `${d.Employee_Department_deletedByToEmployee.firstName} ${d.Employee_Department_deletedByToEmployee.lastName}`
      : null,
  }
}
