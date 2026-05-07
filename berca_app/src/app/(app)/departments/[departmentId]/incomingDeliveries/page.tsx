import {IncomingDeliveryTable} from '@/components/custom/incomingDeliveryTable'
import {getDepartmentById} from '@/dal/department'
import {getIncomingDeliveries, getIncomingDeliveryPurchaseOptions} from '@/dal/incomingDeliveries'
import {mapIncomingDelivery, mapIncomingDeliveryOption} from '../../../../../mapper/incomingDeliveries'
import {DEPARTMENT_ACTIONS} from '@/extra/departmentActions'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function IncomingDeliveriesPage({params}: PageProps) {
  const {departmentId} = await params

  const [department, deliveriesRaw, purchaseOptionsRaw, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getIncomingDeliveries(),
    getIncomingDeliveryPurchaseOptions(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const entries = deliveriesRaw.map(mapIncomingDelivery)
  // Convert purchase records into dropdown options.
  const purchaseOptions = purchaseOptionsRaw.map(option =>
    mapIncomingDeliveryOption({
      id: option.id,
      purchaseNumber: option.purchaseNumber,
      purchaseDescription: option.description,
    }),
  )
  const action = DEPARTMENT_ACTIONS[department.name]?.find(item => item.id === 'incomingDeliveries')

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{action?.name ?? 'Incoming Deliveries'}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {action?.description ?? 'Receive deliveries and assign line quantities to demand sources.'}
            </p>
          </div>
        </header>

        <IncomingDeliveryTable
          initialEntries={entries}
          purchaseOptions={purchaseOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          departmentId={departmentId}
        />
      </div>
    </main>
  )
}
