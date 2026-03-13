import {DepartmentVisibilityTable} from '@/components/custom/departmentVisibilityTable'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {getDepartments} from '@/dal/department'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapVisibility} from '@/extra/visibilityForRole'

export default async function DepartmentVisibilityPage() {
  const [departmentsFromDAL, roleLevels, profile] = await Promise.all([
    getDepartments(),
    getAllRoleLevels(),
    getSessionProfileFromCookieOrThrow(),
  ])

  const currentUserRole = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.Role.name ?? ''
  const currentUserLevel = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.SubRole.level ?? 0
  const isManager = currentUserRole === 'Administrator' || currentUserLevel >= 80

  // Only admins/managers should access this page
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
