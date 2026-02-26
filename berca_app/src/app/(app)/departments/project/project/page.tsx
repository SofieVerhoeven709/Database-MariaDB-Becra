import {ProjectTable} from '@/components/custom/projectTable'
import {getProjects, getProjectTypes} from '@/dal/projects'
import {mapProject} from '@/extra/projects'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getEmployees} from '@/dal/employees'
import {mapEmployee} from '@/extra/employees'
import {getCompanies} from '@/dal/companies'

export default async function ProjectsPage() {
  const [projectsFromDAL, employeesFromDAL, projectTypes, companies, profile] = await Promise.all([
    getProjects(),
    getEmployees(),
    getProjectTypes(),
    getCompanies(),
    getSessionProfileFromCookieOrThrow(),
  ])

  const projects = projectsFromDAL.map(mapProject)

  const projectTypeOptions = projectTypes.map(t => ({id: t.id, name: t.name}))
  const companyOptions = companies.map(c => ({id: c.id, name: c.name}))

  const currentUserRole = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.Role.name ?? ''
  const currentUserLevel = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.SubRole.level ?? 0
  const employees = employeesFromDAL.map(mapEmployee)

  const employeeOptions = employees.map(e => ({
    id: e.id,
    name: `${e.firstName} ${e.lastName}`,
  }))

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
        />
      </div>
    </main>
  )
}
