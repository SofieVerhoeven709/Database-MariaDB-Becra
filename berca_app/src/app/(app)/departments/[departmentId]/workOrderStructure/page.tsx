import {WorkOrderStructureTable} from '@/components/custom/workOrderStructureTable'
import {getWorkOrderStructures} from '@/dal/workOrderStructures'
import {mapWorkOrderStructure} from '@/extra/workOrderStructures'
import {getWorkOrders} from '@/dal/workOrders'
import {getMaterials} from '@/dal/materials'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import camelCase from 'lodash/camelCase'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function WorkOrderStructuresPage({params}: PageProps) {
  const {departmentId} = await params

  const [department, structuresFromDAL, workOrdersFromDAL, materialsFromDAL, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getWorkOrderStructures(),
    getWorkOrders(),
    getMaterials(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const departmentSlug = camelCase(department.name)

  const structures = structuresFromDAL.map(mapWorkOrderStructure)
  const workOrderOptions = workOrdersFromDAL.map(w => ({id: w.id, name: w.workOrderNumber ?? w.id}))
  const materialOptions = materialsFromDAL.map(m => ({id: m.id, name: m.name ?? '', beNumber: m.beNumber}))

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
          department={departmentSlug}
        />
      </div>
    </main>
  )
}
