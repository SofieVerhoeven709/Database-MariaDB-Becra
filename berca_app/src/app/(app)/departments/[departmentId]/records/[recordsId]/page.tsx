import {EmployeeDetail} from '@/components/custom/employeeDetail'
import {getEmployeeDetail} from '@/dal/employees'
import {mapEmployeeDetail} from '@/extra/employees'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getRoleLevels} from '@/dal/roleLevel'
import {getTitles} from '@/dal/titles'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {notFound} from 'next/navigation'

interface PageProps {
  params: Promise<{departmentId: string; recordsId: string}>
}

export default async function EmployeeDetailPage({params}: PageProps) {
  const {departmentId, recordsId} = await params

  const [department, employeeResult, roleLevels, titles, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getEmployeeDetail(recordsId).catch(() => null),
    getRoleLevels(),
    getTitles(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>
  if (!employeeResult) notFound()

  const {employee: employeeFromDAL, createdEmployees, deletedEmployees} = employeeResult
  const employee = mapEmployeeDetail(employeeFromDAL, createdEmployees, deletedEmployees)

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)

  const roleOptions = roleLevels!
    .filter(r => !r.deleted)
    .map(r => ({
      id: r.id,
      name: `${r.Role.name.replace(' Role', '')} / ${r.SubRole.name}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const titleOptions = titles!.filter(t => !t.deleted).map(t => ({id: t.id, name: t.name}))

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
