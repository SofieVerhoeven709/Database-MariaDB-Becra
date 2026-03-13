import {WorkOrderTable} from '@/components/custom/workOrderTable'
import {getWorkOrders} from '@/dal/workOrders'
import {mapWorkOrder} from '@/extra/workOrders'
import {getProjects} from '@/dal/projects'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'

export default async function WorkOrdersPage() {
  const [workOrdersFromDAL, projectsFromDAL, profile] = await Promise.all([
    getWorkOrders(),
    getProjects(),
    getSessionProfileFromCookieOrThrow(),
  ])

  const currentUserRole = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.Role.name ?? ''
  const currentUserLevel = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.SubRole.level ?? 0

  const workOrders = workOrdersFromDAL.map(mapWorkOrder)

  const projectOptions = projectsFromDAL.map(p => ({
    id: p.id,
    name: `${p.projectNumber} — ${p.projectName}`,
  }))
  const department = 'management'

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Work Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage work orders across all projects</p>
        </div>

        <WorkOrderTable
          initialWorkOrders={workOrders}
          projectOptions={projectOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          department={department}
        />
      </div>
    </main>
  )
}
