import type {Department, VisibilityForDepartment} from '@/generated/prisma/client'
import {MappedVisibilityForDepartment} from '@/types/visibilityForDepartment'

export type VisibilityWithDepartment = VisibilityForDepartment & {
  Department: Department
}

export function mapDepartmentVisibility(v: VisibilityWithDepartment): MappedVisibilityForDepartment {
  // Project Prisma relations into the flattened UI-friendly shape.
  return {
    id: v.id,
    visible: v.visible,
    departmentId: v.departmentId,
    departmentName: v.Department.name,
    targetId: v.targetId,
  }
}
