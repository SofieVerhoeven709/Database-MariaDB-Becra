import {getPriceLists} from '@/dal/priceLists'
import {mapPriceList} from '@/extra/priceLists'
import {PriceListTable} from '@/components/custom/priceListTable'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function PriceListsPage({params}: PageProps) {
  const {departmentId} = await params

  const [department, priceListsRaw, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getPriceLists(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const priceLists = priceListsRaw.map(r => mapPriceList(r))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Price Lists</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage price lists and assign them to projects</p>
        </div>

        <PriceListTable
          initialPriceLists={priceLists}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          departmentId={departmentId}
        />
      </div>
    </main>
  )
}
