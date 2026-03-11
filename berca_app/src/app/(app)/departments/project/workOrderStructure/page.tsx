import {WorkOrderStructureTable} from '@/components/custom/workOrderStructureTable'
import {getWorkOrderStructures} from '@/dal/workOrderStructures'
import {mapWorkOrderStructure} from '@/extra/workOrderStructures'
import {getWorkOrders} from '@/dal/workOrders'
import {getMaterials} from '@/dal/materials'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'

export default async function WorkOrderStructuresPage() {
  const [structuresFromDAL, workOrdersFromDAL, materialsFromDAL, profile] = await Promise.all([
    getWorkOrderStructures(),
    getWorkOrders(),
    getMaterials(),
    getSessionProfileFromCookieOrThrow(),
  ])

  const currentUserRole = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.Role.name ?? ''
  const currentUserLevel = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.SubRole.level ?? 0

  const structures = structuresFromDAL.map(mapWorkOrderStructure)

  const workOrderOptions = workOrdersFromDAL.map(w => ({
    id: w.id,
    name: w.workOrderNumber ?? w.id,
  }))

  const materialOptions = materialsFromDAL.map(m => ({
    id: m.id,
    name: m.name ?? '',
    beNumber: m.beNumber,
  }))

  const department = 'project'

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Work Order Structures</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage work order structures across all work orders</p>
        </div>

        <WorkOrderStructureTable
          initialStructures={structures}
          workOrderOptions={workOrderOptions}
          materialOptions={materialOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          department={department}
        />
      </div>
    </main>
  )
}
