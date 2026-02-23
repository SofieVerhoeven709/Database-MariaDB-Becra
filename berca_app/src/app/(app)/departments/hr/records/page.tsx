import {EmployeeTable} from '@/components/custom/employeeTable'
import {getEmployees} from '@/dal/employees'
import {mapEmployee} from '@/extra/employees'
import {getTitles} from '@/dal/titles'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getRoleLevels} from '@/dal/roleLevel'

export default async function RecordPage() {
  const [employeesFromDAL, roleLevels, titles, profile] = await Promise.all([
    getEmployees(),
    getRoleLevels(),
    getTitles(),
    getSessionProfileFromCookieOrThrow(),
  ])

  const employees = employeesFromDAL.map(mapEmployee)

  const roleOptions = roleLevels!
    .filter(t => !t.deleted)
    .map(r => ({
      id: r.id,
      name: `${r.Role.name.replace(' Role', '')} / ${r.SubRole.name}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const titleOptions = titles!
    .filter(t => !t.deleted)
    .map(t => ({
      id: t.id,
      name: t.name,
    }))

  const currentUserRole = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.Role.name ?? ''
  const currentUserLevel = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.SubRole.level ?? 0

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
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
      </div>
    </main>
  )
}
