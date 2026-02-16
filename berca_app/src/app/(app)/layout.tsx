import {DashboardNavbar} from '@/components/custom/dashboardNavbar'
import {getSessionFromCookie} from '@/lib/sessionUtils'
import {getRoleById} from '@/dal/role'

export default async function DashboardLayout({children}: {children: React.ReactNode}) {
  const session = await getSessionFromCookie()
  const employee = session?.Employee

  if (!employee) {
    return <div>Please log in</div>
  }

  const role = employee.Role_Employee_roleIdToRole ?? (await getRoleById(employee.roleId!))

  return (
    <div className="flex min-h-svh flex-col">
      <DashboardNavbar employee={employee} role={role!} />
      <div className="flex-1">{children}</div>
    </div>
  )
}
