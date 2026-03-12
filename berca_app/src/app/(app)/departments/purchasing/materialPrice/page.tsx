import {getMaterialPrices} from '@/dal/materialPrices'
import {getCompanies} from '@/dal/companies'
import {mapMaterialPrice} from '@/extra/materialPrices'
import {MaterialPriceTable} from '@/components/custom/materialPriceTable'
import {DEPARTMENT_ACTIONS} from '@/extra/departmentActions'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'

export default async function MaterialPricePage() {
  const [entriesFromDAL, companiesRaw, profile] = await Promise.all([
    getMaterialPrices(),
    getCompanies(),
    getSessionProfileFromCookieOrThrow(),
  ])

  const entries = entriesFromDAL.map(mapMaterialPrice)
  const action = DEPARTMENT_ACTIONS.Purchasing?.find(a => a.id === 'materialPrice')

  const currentUserRole = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.Role.name ?? ''
  const currentUserLevel = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.SubRole.level ?? 0

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
