import {getInventoryOrders, getInventoryForPicker} from '@/dal/inventoryOrders'
import {mapInventoryOrder} from '@/extra/inventoryOrders'
import {InventoryOrderTable} from '@/components/custom/inventoryOrderTable'
import {DEPARTMENT_ACTIONS} from '@/extra/departmentActions'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function OrderRequestsPage({params}: PageProps) {
  const {departmentId} = await params

  const [department, entriesFromDAL, inventoriesRaw, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getInventoryOrders(),
    getInventoryForPicker(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)

  const entries = entriesFromDAL.map(mapInventoryOrder)
  const action = DEPARTMENT_ACTIONS[department.name]?.find(a => a.id === 'orderRequests')

  const inventoryOptions = inventoriesRaw.map(i => ({
    id: i.id,
    beNumber: i.beNumber,
    shortDescription: i.shortDescription,
  }))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{action?.name ?? 'Order Requests'}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {action?.description ?? 'Process and approve internal purchase requests.'}
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

        <InventoryOrderTable
          initialEntries={entries}
          inventories={inventoryOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
        />
      </div>
    </main>
  )
}
