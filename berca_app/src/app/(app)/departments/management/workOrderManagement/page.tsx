import {WorkOrderTable} from '@/components/custom/workOrderTable'
import {getWorkOrders} from '@/dal/workOrders'
import {mapWorkOrder} from '@/extra/workOrders'
import {getProjects} from '@/dal/projects'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapRoleLevelOptions} from '@/types/roleLevel'

export default async function WorkOrdersPage() {
  const [workOrdersFromDAL, projectsFromDAL, roleLevels, profile] = await Promise.all([
    getWorkOrders(),
    getProjects(),
    getAllRoleLevels(),
    getSessionProfileFromCookieOrThrow(),
  ])

  const currentUserRole = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.Role.name ?? ''
  const currentUserLevel = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.SubRole.level ?? 0
  const currentUserRoleLevelId = profile.roleLevelId ?? ''
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  const allWorkOrders = workOrdersFromDAL.map(mapWorkOrder)
  const workOrders = isAdmin
    ? allWorkOrders
    : allWorkOrders.filter(wo => {
        const rows = wo.visibilityForRoles
        if (!rows || rows.length === 0) return true
        const myRow = rows.find(r => r.roleLevelId === currentUserRoleLevelId)
        return myRow?.visible ?? false
      })

  const projectOptions = projectsFromDAL.map(p => ({id: p.id, name: p.name}))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Work Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage work orders and related records</p>
        </div>

        <WorkOrderTable
          initialWorkOrders={workOrders}
          projectOptions={projectOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
        />
      </div>
    </main>
  )
}
