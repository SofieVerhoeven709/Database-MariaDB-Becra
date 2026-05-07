import {getProjectById, getProjectTypes} from '@/dal/projects'
import {getEmployees} from '@/dal/employees'
import {getContacts} from '@/dal/contacts'
import {getProjectBOMs} from '@/dal/projectBoms'
import {mapEmployee} from '../../../../../../mapper/employees'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {ProjectDetail} from '@/components/custom/projectDetail'
import {notFound} from 'next/navigation'
import {getCompanies} from '@/dal/companies'
import {getFunctions} from '@/dal/functions'
import {getDepartmentExterns} from '@/dal/departmentExterns'
import {getTitles} from '@/dal/titles'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {getCountries} from '@/dal/countries'
import {mapProjectBOM} from '../../../../../../mapper/projectBom'

interface PageProps {
  params: Promise<{departmentId: string; projectId: string}>
}

export default async function ProjectDetailPage({params}: PageProps) {
  const {departmentId, projectId} = await params

  const [
    department,
    project,
    projectTypes,
    companies,
    employeesFromDAL,
    contactsFromDAL,
    projectBomsFromDAL,
    profile,
    functions,
    departmentExterns,
    titles,
    countries,
  ] = await Promise.all([
    getDepartmentById(departmentId),
    getProjectById(projectId).catch(() => null),
    getProjectTypes(),
    getCompanies(),
    getEmployees(),
    getContacts(),
    getProjectBOMs(),
    getSessionProfileFromCookieOrThrow(),
    getFunctions(),
    getDepartmentExterns(),
    getTitles(),
    getCountries(),
  ])

  if (!department) return <p>Department not found</p>
  if (!project) notFound()

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)

  const employees = employeesFromDAL.map(mapEmployee)
  const employeeOptions = employees.map(e => ({id: e.id, name: `${e.firstName} ${e.lastName}`}))
  const contactOptions = contactsFromDAL.map(c => ({id: c.id, name: `${c.firstName} ${c.lastName}`}))
  const projectTypeOptions = projectTypes.map(t => ({id: t.id, name: t.name}))
  const companyOptions = companies.filter(c => !c.deleted).map(c => ({id: c.id, name: c.name}))
  const projectBomOptions = projectBomsFromDAL.map(mapProjectBOM)
  const functionOptions = (functions ?? []).map(f => ({id: f.id, name: f.name ?? ''})).filter(f => f.name)
  const departmentExternOptions = (departmentExterns ?? [])
    .map(d => ({id: d.id, name: d.name ?? ''}))
    .filter(d => d.name)
  const titleOptions = (titles ?? []).map(t => ({id: t.id, name: t.name ?? ''})).filter(t => t.name)

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
          currentUserId={profile.id}
          currentUserLevel={currentUserLevel}
          projectBoms={projectBomOptions}
          functionOptions={functionOptions}
          departmentExternOptions={departmentExternOptions}
          titleOptions={titleOptions}
          departmentId={departmentId}
          countryOptions={countries}
        />
      </div>
    </main>
  )
}
