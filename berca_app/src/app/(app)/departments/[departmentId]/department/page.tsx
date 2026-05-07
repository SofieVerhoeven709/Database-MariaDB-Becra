import {DepartmentTable} from '@/components/custom/departmentTable'
import {getDepartments} from '@/dal/department'
import {mapDepartment} from '@/extra/departments'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentRoleInfo} from '@/lib/utils'

export default async function DepartmentsPage() {
  const [departmentsFromDAL, profile] = await Promise.all([getDepartments(), getSessionProfileFromCookieOrThrow()])

  // Use a fixed sentinel name for global admin role resolution on this page.
  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, 'Admin')

  const departments = departmentsFromDAL.map(mapDepartment)

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Departments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage departments across the organisation</p>
        </div>

        <DepartmentTable
          initialDepartments={departments}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
        />
      </div>
    </main>
  )
}
