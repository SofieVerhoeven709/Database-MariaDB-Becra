import {DashboardNavbar} from '@/components/custom/dashboardNavbar'
import {getSessionFromCookie} from '@/lib/sessionUtils'
import {getRolelevelById} from '@/dal/roleLevel'

export default async function DashboardLayout({children}: {children: React.ReactNode}) {
  const session = await getSessionFromCookie()
  const employee = session?.Employee

  if (!employee) {
    return <div>Please log in</div>
  }

  const roleLevel =
    employee.RoleLevel_Employee_roleLevelIdToRoleLevel ?? (await getRolelevelById(employee.roleLevelId!))

  return (
    <div className="flex min-h-svh flex-col">
      <DashboardNavbar employee={employee} roleLevel={roleLevel!} />
      <div className="flex-1">{children}</div>
    </div>
  )
}
