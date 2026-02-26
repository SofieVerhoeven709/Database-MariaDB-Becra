import {CompanyTable} from '@/components/custom/companyTable'
import {getCompanies} from '@/dal/companies'
import {mapCompany} from '@/extra/companies'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'

export default async function CompaniesPage() {
  const [companiesFromDAL, profile] = await Promise.all([getCompanies(), getSessionProfileFromCookieOrThrow()])

  const companies = companiesFromDAL.map(mapCompany)

  const currentUserRole = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.Role.name ?? ''
  const currentUserLevel = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.SubRole.level ?? 0

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
        />
      </div>
    </main>
  )
}
