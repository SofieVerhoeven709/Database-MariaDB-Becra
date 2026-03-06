import {notFound} from 'next/navigation'
import {getCompanies, getCompanyDetail} from '@/dal/companies'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {CompanyDetail} from '@/components/custom/companyDetail'
import {mapCompanyDetail} from '@/extra/companies'
import {mapRoleLevelOptions} from '@/types/roleLevel'

interface Props {
  params: Promise<{id: string}>
}

export default async function CompanyDetailPage({params}: Props) {
  const {id} = await params

  const [companyRaw, allCompaniesRaw, roleLevels, profile] = await Promise.all([
    getCompanyDetail(id).catch(() => null),
    getCompanies(),
    getAllRoleLevels(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!companyRaw) notFound()

  const company = mapCompanyDetail(companyRaw)
  const currentUserRole = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.Role.name ?? ''
  const currentUserLevel = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.SubRole.level ?? 0
  const roleLevelOptions = mapRoleLevelOptions(roleLevels)
  const defaultVisibleRoleNames = ['Management']

  const companies = allCompaniesRaw.filter(c => !c.deleted).map(c => ({id: c.id, name: c.name}))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <CompanyDetail
          company={company}
          companies={companies}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          roleLevelOptions={roleLevelOptions}
          defaultVisibleRoleNames={defaultVisibleRoleNames}
        />
      </div>
    </main>
  )
}
