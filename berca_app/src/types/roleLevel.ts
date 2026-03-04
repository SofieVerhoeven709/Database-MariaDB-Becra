export interface RoleLevelOption {
  id: string
  roleName: string
  subRoleName: string
  subRoleLevel: number
}

export function mapRoleLevelOptions(
  roleLevels: {
    id: string
    Role: {name: string}
    SubRole: {name: string; level: number}
  }[],
): RoleLevelOption[] {
  return roleLevels
    .filter(r => r.Role.name !== 'Administrator')
    .map(r => ({
      id: r.id,
      roleName: r.Role.name,
      subRoleName: r.SubRole.name,
      subRoleLevel: r.SubRole.level,
    }))
}
