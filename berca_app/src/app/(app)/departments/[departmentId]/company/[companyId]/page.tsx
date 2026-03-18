import {notFound} from 'next/navigation'
import {getCompanies, getCompanyDetail} from '@/dal/companies'
import {getContactOptions} from '@/dal/contacts'
import {getFunctions} from '@/dal/functions'
import {getDepartmentExterns} from '@/dal/departmentExterns'
import {getTitles} from '@/dal/titles'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {CompanyDetail} from '@/components/custom/companyDetail'
import {mapCompanyDetail} from '@/extra/companies'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {getDepartmentById} from '@/dal/department'

interface PageProps {
  params: Promise<{departmentId: string; companyId: string}>
}

export default async function CompanyDetailPage({params}: PageProps) {
  const {departmentId, companyId} = await params

  const [
    department,
    companyRaw,
    allCompaniesRaw,
    roleLevels,
    profile,
    contactOptions,
    functions,
    departmentExterns,
    titles,
  ] = await Promise.all([
    getDepartmentById(departmentId),
    getCompanyDetail(companyId).catch(() => null),
    getCompanies(),
    getAllRoleLevels(),
    getSessionProfileFromCookieOrThrow(),
    getContactOptions(),
    getFunctions(),
    getDepartmentExterns(),
    getTitles(),
  ])

  if (!department) return <p>Department not found</p>
  if (!companyRaw) notFound()

  const company = mapCompanyDetail(companyRaw)
  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const roleLevelOptions = mapRoleLevelOptions(roleLevels)
  const defaultVisibleRoleNames = [department.name]
  const companies = allCompaniesRaw.filter(c => !c.deleted).map(c => ({id: c.id, name: c.name}))
  const mappedContactOptions = (contactOptions ?? []).map(c => ({id: c.id, name: `${c.firstName} ${c.lastName}`}))

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
          departmentId={departmentId}
          contactOptions={mappedContactOptions}
          functionOptions={functions ?? []}
          departmentExternOptions={departmentExterns ?? []}
          titleOptions={titles ?? []}
        />
      </div>
    </main>
  )
}
