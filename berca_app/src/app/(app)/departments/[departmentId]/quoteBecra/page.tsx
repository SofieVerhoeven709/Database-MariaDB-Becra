import {QuoteBecraTable} from '@/components/custom/quoteBecraTable'
import {getQuoteBecras} from '@/dal/quoteBecra'
import {getCompanies} from '@/dal/companies'
import {mapQuoteBecra} from '../../../../../mapper/quoteBecra'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import type {ReactElement} from 'react'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function QuoteBecraPage({params}: PageProps) {
  const {departmentId} = await params

  const [department, quotesFromDAL, companiesFromDAL, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getQuoteBecras(),
    getCompanies(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const currentUserId = profile.id
  const currentUserName = `${profile.firstName} ${profile.lastName}`
  const quotes = quotesFromDAL.map(mapQuoteBecra)
  const companyOptions = companiesFromDAL
    .filter(company => !company.deleted && company.companyActive)
    .map(company => ({id: company.id, name: company.name}))
    .sort((a, b) => a.name.localeCompare(b.name))
  const QuoteBecraTableWithCompanies = QuoteBecraTable as unknown as (props: {
    initialQuotes: typeof quotes
    companyOptions: typeof companyOptions
    currentUserRole: string
    currentUserLevel: number
    currentUserId: string
    currentUserName: string
  }) => ReactElement

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Becra Quotes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage Becra quote records</p>
        </div>

        <QuoteBecraTableWithCompanies
          initialQuotes={quotes}
          companyOptions={companyOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
        />
      </div>
    </main>
  )
}
