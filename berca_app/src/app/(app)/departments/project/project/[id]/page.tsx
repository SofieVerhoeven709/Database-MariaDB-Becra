import {getProjectById} from '@/dal/projects'
import {getProjectTypes} from '@/dal/projects'
import {getEmployees} from '@/dal/employees'
import {getContacts} from '@/dal/contacts'
import {getPurchases} from '@/dal/purchases'
import {mapEmployee} from '@/extra/employees'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {ProjectDetail} from '@/components/custom/projectDetail'
import {notFound} from 'next/navigation'
import {getCompanies} from '@/dal/companies'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {mapVisibility} from '@/extra/visibilityForRole'
import {getFunctions} from '@/dal/functions'
import {getDepartmentExterns} from '@/dal/departmentExterns'
import {getTitles} from '@/dal/titles'

interface ProjectDetailPageProps {
  params: Promise<{id: string}>
}

export default async function ProjectDetailPage({params}: ProjectDetailPageProps) {
  const {id} = await params
  const [
    project,
    projectTypes,
    companies,
    employeesFromDAL,
    contactsFromDAL,
    purchasesFromDAL,
    roleLevels,
    profile,
    functions,
    departmentExterns,
    titles,
  ] = await Promise.all([
    getProjectById(id).catch(() => null),
    getProjectTypes(),
    getCompanies(),
    getEmployees(),
    getContacts(),
    getPurchases(),
    getAllRoleLevels(),
    getSessionProfileFromCookieOrThrow(),
    getFunctions(),
    getDepartmentExterns(),
    getTitles(),
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
  const companyOptions = companies.filter(c => !c.deleted).map(c => ({id: c.id, name: c.name}))

  const availablePurchases = purchasesFromDAL
    .filter(p => !p.deleted && p.projectId === null)
    .map(p => ({
      id: p.id,
      orderNumber: p.orderNumber,
      companyName: p.Company?.name ?? null,
      status: p.status,
    }))

  const currentUserRole = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.Role.name ?? ''
  const currentUserLevel = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.SubRole.level ?? 0

  const roleLevelOptions = mapRoleLevelOptions(roleLevels)
  const defaultVisibleRoleNames = ['Project']
  const visibilityForRoles = project.Target.VisibilityForRole.map(mapVisibility)

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
          currentUserLevel={currentUserLevel}
          availablePurchases={availablePurchases}
          roleLevelOptions={roleLevelOptions}
          defaultVisibleRoleNames={defaultVisibleRoleNames}
          visibilityForRoles={visibilityForRoles}
          functionOptions={functionOptions}
          departmentExternOptions={departmentExternOptions}
          titleOptions={titleOptions}
        />
      </div>
    </main>
  )
}
