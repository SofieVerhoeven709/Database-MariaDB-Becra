import {getProjectById} from '@/dal/projects'
import {getProjectTypes} from '@/dal/projects'
import {getEmployees} from '@/dal/employees'
import {getContacts} from '@/dal/contacts'
import {mapEmployee} from '@/extra/employees'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {ProjectDetail} from '@/components/custom/projectDetail'
import {notFound} from 'next/navigation'
import {getCompanies} from '@/dal/companies'

interface ProjectDetailPageProps {
  params: Promise<{id: string}>
}

export default async function ProjectDetailPage({params}: ProjectDetailPageProps) {
  const {id} = await params
  const [project, projectTypes, companies, employeesFromDAL, contactsFromDAL, profile] = await Promise.all([
    getProjectById(id).catch(() => null),
    getProjectTypes(),
    getCompanies(),
    getEmployees(),
    getContacts(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!project) notFound()

  const employees = employeesFromDAL.map(mapEmployee)

  const employeeOptions = employees.map(e => ({
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
  }))

  const contactOptions = contactsFromDAL.map(c => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
  }))

  const projectTypeOptions = projectTypes.map(t => ({id: t.id, name: t.name}))
  const companyOptions = companies.map(c => ({id: c.id, name: c.name}))

  const currentUserRole = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.Role.name ?? ''
  const currentUserLevel = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.SubRole.level ?? 0

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <ProjectDetail
          project={project}
          projectTypes={projectTypeOptions}
          companies={companyOptions}
          employees={employeeOptions}
          contacts={contactOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
        />
      </div>
    </main>
  )
}
