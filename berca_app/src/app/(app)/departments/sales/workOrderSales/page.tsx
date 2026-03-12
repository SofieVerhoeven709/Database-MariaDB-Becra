import {WorkOrderTable} from '@/components/custom/workOrderTable'
import {getWorkOrders} from '@/dal/workOrders'
import {mapWorkOrder} from '@/extra/workOrders'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getProjects} from '@/dal/projects'

export default async function WorkOrderSalesPage() {
  const [workOrdersFromDAL, projectsFromDAL, profile] = await Promise.all([
    getWorkOrders(),
    getProjects(),
    getSessionProfileFromCookieOrThrow(),
  ])

  const currentUserRole = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.Role.name ?? ''
  const currentUserLevel = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.SubRole.level ?? 0

  const workOrders = workOrdersFromDAL.map(mapWorkOrder)

  const projectOptions = projectsFromDAL
    .filter(p => !p.deleted)
    .map(p => ({
      id: p.id,
      name: p.projectNumber ? `${p.projectNumber} – ${p.projectName ?? ''}` : (p.projectName ?? p.id),
    }))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Work Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and manage sales-related work orders</p>
        </div>

        <WorkOrderTable
          initialWorkOrders={workOrders}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          projectOptions={projectOptions}
          department="sales"
        />
      </div>
    </main>
  )
}
