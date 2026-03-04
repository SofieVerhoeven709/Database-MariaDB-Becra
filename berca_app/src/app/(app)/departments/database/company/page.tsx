import {CompanyTable} from '@/components/custom/companyTable'
import {getCompanies} from '@/dal/companies'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {mapCompany} from '@/extra/companies'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapRoleLevelOptions} from '@/types/roleLevel'

export default async function CompaniesPage() {
  const [companiesFromDAL, roleLevels, profile] = await Promise.all([
    getCompanies(),
    getAllRoleLevels(),
    getSessionProfileFromCookieOrThrow(),
  ])

  const currentUserRole = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.Role.name ?? ''
  const currentUserLevel = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.SubRole.level ?? 0
  const currentUserRoleLevelId = profile.roleLevelId ?? ''
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  const allCompanies = companiesFromDAL.map(mapCompany)
  const companies = isAdmin
    ? allCompanies
    : allCompanies.filter(c => {
        const rows = c.visibilityForRoles
        if (rows.length === 0) return true
        const myRow = rows.find(r => r.roleLevelId === currentUserRoleLevelId)
        return myRow?.visible ?? false
      })

  const roleLevelOptions = mapRoleLevelOptions(roleLevels)

  // Roles visible by default for this department
  const defaultVisibleRoleNames = ['Database']
  const department = 'database'

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
          department={department}
        />
      </div>
    </main>
  )
}
