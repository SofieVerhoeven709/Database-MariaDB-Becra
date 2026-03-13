import {getMaterialPrices} from '@/dal/materialPrices'
import {getCompanies} from '@/dal/companies'
import {mapMaterialPrice} from '@/extra/materialPrices'
import {MaterialPriceTable} from '@/components/custom/materialPriceTable'
import {DEPARTMENT_ACTIONS} from '@/extra/departmentActions'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function MaterialPricePage({params}: PageProps) {
  const {departmentId} = await params

  const [department, entriesFromDAL, companiesRaw, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getMaterialPrices(),
    getCompanies(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)

  const entries = entriesFromDAL.map(mapMaterialPrice)
  const action = DEPARTMENT_ACTIONS[department.name]?.find(a => a.id === 'materialPrice')

  const companyOptions = companiesRaw
    .filter(c => !c.deleted && (c.supplier || c.preferredSupplier))
    .map(c => ({id: c.id, name: c.name}))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{action?.name ?? 'Material Price'}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {action?.description ?? 'Manage and update material pricing information linked to suppliers.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="text-foreground">
              {entries.length}
              <span className="ml-1 text-xs uppercase tracking-wide text-muted-foreground">total</span>
            </span>
            <span className="text-xs uppercase tracking-wide">
              Viewing as {profile.firstName} {profile.lastName}
            </span>
          </div>
        </header>

        <MaterialPriceTable
          initialEntries={entries}
          companies={companyOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
        />
      </div>
    </main>
  )
}
