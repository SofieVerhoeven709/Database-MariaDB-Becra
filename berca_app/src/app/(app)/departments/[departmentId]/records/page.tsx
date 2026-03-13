import {EmployeeTable} from '@/components/custom/employeeTable'
import {getEmployees} from '@/dal/employees'
import {mapEmployee} from '@/extra/employees'
import {getTitles} from '@/dal/titles'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getRoleLevels} from '@/dal/roleLevel'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function RecordPage({params}: PageProps) {
  const {departmentId} = await params

  const [department, employeesFromDAL, roleLevels, titles, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getEmployees(),
    getRoleLevels(),
    getTitles(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)

  const employees = employeesFromDAL.map(mapEmployee)
  const roleOptions = roleLevels!
    .filter(t => !t.deleted)
    .map(r => ({id: r.id, name: `${r.Role.name.replace(' Role', '')} / ${r.SubRole.name}`}))
    .sort((a, b) => a.name.localeCompare(b.name))
  const titleOptions = titles!.filter(t => !t.deleted).map(t => ({id: t.id, name: t.name}))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mb-8">
        <h1 className="text-lg font-semibold text-foreground">Employees</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage employee records and onboarding</p>
      </div>

      <EmployeeTable
        initialEmployees={employees}
        roleOptions={roleOptions}
        titleOptions={titleOptions}
        currentUserRole={currentUserRole}
        currentUserLevel={currentUserLevel}
      />
    </main>
  )
}
