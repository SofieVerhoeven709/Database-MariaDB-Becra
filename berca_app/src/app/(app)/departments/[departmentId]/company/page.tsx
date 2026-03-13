import {CompanyTable} from '@/components/custom/companyTable'
import {getCompanies} from '@/dal/companies'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {mapCompany} from '@/extra/companies'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function CompaniesPage({params}: PageProps) {
  const {departmentId} = await params

  const [department, companiesFromDAL, roleLevels, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getCompanies(),
    getAllRoleLevels(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const currentUserRoleLevelIds = profile.RoleLevelEmployee.map(rle => rle.RoleLevel.id)
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  const allCompanies = companiesFromDAL.map(mapCompany)
  const companies = isAdmin
    ? allCompanies
    : allCompanies.filter(c => {
        const rows = c.visibilityForRoles
        if (rows.length === 0) return true
        const myRow = rows.find(r => currentUserRoleLevelIds.includes(r.roleLevelId))
        return myRow?.visible ?? false
      })

  const roleLevelOptions = mapRoleLevelOptions(roleLevels)
  const defaultVisibleRoleNames = [department.name]

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Companies</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage company records and relationships</p>
        </div>

        <CompanyTable
          initialCompanies={companies}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          roleLevelOptions={roleLevelOptions}
          defaultVisibleRoleNames={defaultVisibleRoleNames}
          departmentId={departmentId}
        />
      </div>
    </main>
  )
}
