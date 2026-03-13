import {getPurchaseBoms} from '@/dal/purchaseBoms'
import {mapPurchaseBom} from '@/extra/purchaseBoms'
import {PurchaseBomTable} from '@/components/custom/purchaseBomTable'
import {DEPARTMENT_ACTIONS} from '@/extra/departmentActions'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'

export default async function PurchaseBomPage() {
  const [entriesFromDAL, profile] = await Promise.all([getPurchaseBoms(), getSessionProfileFromCookieOrThrow()])

  const entries = entriesFromDAL.map(mapPurchaseBom)
  const action = DEPARTMENT_ACTIONS.Purchasing?.find(a => a.id === 'purchaseBom')

  const currentUserRole = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.Role.name ?? ''
  const currentUserLevel = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.SubRole.level ?? 0

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{action?.name ?? 'Purchase BOM Structure'}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {action?.description ?? 'Maintain purchasing bill of materials structures.'}
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

        <PurchaseBomTable
          initialEntries={entries}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
        />
      </div>
    </main>
  )
}
