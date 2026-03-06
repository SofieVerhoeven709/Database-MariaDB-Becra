import {EmployeeDetail} from '@/components/custom/employeeDetail'
import {getEmployeeDetail} from '@/dal/employees'
import {mapEmployeeDetail} from '@/extra/employees'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getRoleLevels} from '@/dal/roleLevel'
import {getTitles} from '@/dal/titles'
import {notFound} from 'next/navigation'

interface EmployeeDetailPageProps {
  params: Promise<{id: string}>
}

export default async function EmployeeDetailPage({params}: EmployeeDetailPageProps) {
  const {id} = await params

  const [employeeResult, roleLevels, titles, profile] = await Promise.all([
    getEmployeeDetail(id).catch(() => null),
    getRoleLevels(),
    getTitles(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!employeeResult) notFound()

  const {employee: employeeFromDAL, createdEmployees, deletedEmployees} = employeeResult
  const employee = mapEmployeeDetail(employeeFromDAL, createdEmployees, deletedEmployees)

  const roleOptions = roleLevels!
    .filter(r => !r.deleted)
    .map(r => ({
      id: r.id,
      name: `${r.Role.name.replace(' Role', '')} / ${r.SubRole.name}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const titleOptions = titles!.filter(t => !t.deleted).map(t => ({id: t.id, name: t.name}))

  const currentUserRole = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.Role.name ?? ''
  const currentUserLevel = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.SubRole.level ?? 0

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <EmployeeDetail
          employee={employee}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          roleOptions={roleOptions}
          titleOptions={titleOptions}
        />
      </div>
    </main>
  )
}
