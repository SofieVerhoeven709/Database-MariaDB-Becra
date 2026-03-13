import {QuoteBecraTable} from '@/components/custom/quoteBecraTable'
import {getQuoteBecras} from '@/dal/quoteBecra'
import {mapQuoteBecra} from '@/extra/quoteBecra'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function QuoteBecraPage({params}: PageProps) {
  const {departmentId} = await params

  const [department, quotesFromDAL, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getQuoteBecras(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const currentUserId = profile.id
  const currentUserName = `${profile.firstName} ${profile.lastName}`
  const quotes = quotesFromDAL.map(mapQuoteBecra)

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Becra Quotes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage Becra quote records</p>
        </div>

        <QuoteBecraTable
          initialQuotes={quotes}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
        />
      </div>
    </main>
  )
}
