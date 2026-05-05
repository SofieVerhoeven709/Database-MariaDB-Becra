import {DashboardNavbar, type NavbarEmployee} from '@/components/custom/dashboardNavbar'
import {getSessionFromCookie} from '@/lib/sessionUtils'
import {redirect} from 'next/navigation'
import {Route} from 'next'

export default async function DashboardLayout({children}: {children: React.ReactNode}) {
  const session = await getSessionFromCookie()
  const employee = session?.Employee

  if (!employee) {
    redirect('../' as Route)
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

  // IMPORTANT:
  // Never pass Prisma models directly to Client Components.
  // Prisma fields like `Decimal` are not serializable across the Server→Client boundary.
  const navbarEmployee: NavbarEmployee = {
    id: employee.id,
    username: employee.username,
  }

  return (
    <div className="flex min-h-svh flex-col">
      <DashboardNavbar employee={navbarEmployee} roleContext={roleContext} roleContextInput={roleContextInput} />
      <div className="flex-1">{children}</div>
    </div>
  )
}
