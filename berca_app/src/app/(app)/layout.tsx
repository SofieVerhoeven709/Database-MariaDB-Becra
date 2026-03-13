import {DashboardNavbar} from '@/components/custom/dashboardNavbar'
import {getSessionFromCookie} from '@/lib/sessionUtils'
import {getRolelevelById} from '@/dal/roleLevel'

export default async function DashboardLayout({children}: {children: React.ReactNode}) {
  const session = await getSessionFromCookie()
  const employee = session?.Employee

  if (!employee) {
    return <div>Please log in</div>
  }

  const roleLevel = employee.RoleLevelEmployee.reduce<(typeof employee.RoleLevelEmployee)[0] | null>(
    (highest, current) => {
      if (!highest) return current
      return current.RoleLevel.SubRole.level > highest.RoleLevel.SubRole.level ? current : highest
    },
    null,
  )?.RoleLevel

  if (!roleLevel || !roleLevel.Role || !roleLevel.SubRole) {
    return <div>Role not configured</div>
  }

  const roleContext = {
    level: roleLevel.SubRole.level,
    role: roleLevel.Role.name,
    subRole: roleLevel.SubRole.name,
  }

  const roleContextInput = {
    roleLevelIds: employee.RoleLevelEmployee.map(rle => rle.roleLevelId),
  }

  return (
    <div className="flex min-h-svh flex-col">
      <DashboardNavbar employee={employee} roleContext={roleContext} roleContextInput={roleContextInput} />
      <div className="flex-1">{children}</div>
    </div>
  )
}
