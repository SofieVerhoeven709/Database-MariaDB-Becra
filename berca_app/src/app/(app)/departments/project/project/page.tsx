import {ProjectTable} from '@/components/custom/projectTable'
import {getProjects, getProjectTypes} from '@/dal/projects'
import {mapProject} from '@/extra/projects'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getEmployees} from '@/dal/employees'
import {mapEmployee} from '@/extra/employees'
import {getCompanies} from '@/dal/companies'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {mapRoleLevelOptions} from '@/types/roleLevel'

export default async function ProjectsPage() {
  const [projectsFromDAL, employeesFromDAL, projectTypes, companies, roleLevels, profile] = await Promise.all([
    getProjects(),
    getEmployees(),
    getProjectTypes(),
    getCompanies(),
    getAllRoleLevels(),
    getSessionProfileFromCookieOrThrow(),
  ])

  const currentUserRole = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.Role.name ?? ''
  const currentUserLevel = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.SubRole.level ?? 0
  const currentUserRoleLevelId = profile.roleLevelId ?? ''
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  const allProjects = projectsFromDAL.map(mapProject)
  const projects = isAdmin
    ? allProjects
    : allProjects.filter(p => {
        const rows = p.visibilityForRoles
        if (rows.length === 0) return true
        const myRow = rows.find(r => r.roleLevelId === currentUserRoleLevelId)
        return myRow?.visible ?? false
      })

  const projectTypeOptions = projectTypes.map(t => ({id: t.id, name: t.name}))
  const companyOptions = companies.map(c => ({id: c.id, name: c.name}))
  const employees = employeesFromDAL.map(mapEmployee)
  const employeeOptions = employees.map(e => ({id: e.id, name: `${e.firstName} ${e.lastName}`}))
  const roleLevelOptions = mapRoleLevelOptions(roleLevels)

  const defaultVisibleRoleNames = ['Project']

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage project records and assignments</p>
        </div>

        <ProjectTable
          initialProjects={projects}
          projectTypes={projectTypeOptions}
          companies={companyOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          employees={employeeOptions}
          roleLevelOptions={roleLevelOptions}
          defaultVisibleRoleNames={defaultVisibleRoleNames}
        />
      </div>
    </main>
  )
}
