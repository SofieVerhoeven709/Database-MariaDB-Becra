import {DepartmentVisibilityTable} from '@/components/custom/departmentVisibilityTable'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {getDepartments, getDepartmentById} from '@/dal/department'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapVisibility} from '@/extra/visibilityForRole'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function DepartmentVisibilityPage({params}: PageProps) {
  const {departmentId} = await params

  const [department, departmentsFromDAL, roleLevels, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getDepartments(),
    getAllRoleLevels(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const isManager = currentUserRole === 'Administrator' || currentUserLevel >= 80

  if (!isManager) {
    return (
      <main className="px-6 py-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-muted-foreground">You do not have permission to manage department visibility.</p>
        </div>
      </main>
    )
  }

  const departments = departmentsFromDAL.map(d => ({
    id: d.id,
    name: d.name,
    color: d.color,
    icon: d.icon,
    description: d.description,
    targetId: d.Target.id,
    visibilityForRoles: d.Target.VisibilityForRole.map(mapVisibility),
  }))

  const roleLevelOptions = mapRoleLevelOptions(roleLevels)

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Department Visibility</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Control which roles can see each department. Administrators always have full access.
          </p>
        </div>

        <DepartmentVisibilityTable departments={departments} roleLevelOptions={roleLevelOptions} />
      </div>
    </main>
  )
}
