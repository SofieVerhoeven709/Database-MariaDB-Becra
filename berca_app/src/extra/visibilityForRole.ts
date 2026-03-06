import type {MappedVisibilityForRole} from '@/types/visibilityForRole'
import type {Role, RoleLevel, SubRole, VisibilityForRole} from '@/generated/prisma/client'

export type VisibilityWithRoleLevel = VisibilityForRole & {
  RoleLevel: RoleLevel & {
    Role: Role
    SubRole: SubRole
  }
}

export function mapVisibility(v: VisibilityWithRoleLevel): MappedVisibilityForRole {
  return {
    id: v.id,
    visible: v.visible,
    roleLevelId: v.roleLevelId,
    roleName: v.RoleLevel.Role.name,
    subRoleName: v.RoleLevel.SubRole.name,
    subRoleLevel: v.RoleLevel.SubRole.level,
    targetId: v.targetId,
  }
}
