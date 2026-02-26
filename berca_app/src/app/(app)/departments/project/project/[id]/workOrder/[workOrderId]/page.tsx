import {getWorkOrderById} from '@/dal/workOrders'
import {getEmployees} from '@/dal/employees'
import {getHourTypes} from '@/dal/hourTypes'
import {getMaterials} from '@/dal/materials'
import {mapEmployee} from '@/extra/employees'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {WorkOrderDetail} from '@/components/custom/workOrderDetail'
import {notFound} from 'next/navigation'

interface WorkOrderDetailPageProps {
  params: Promise<{id: string; workOrderId: string}>
}

export default async function WorkOrderDetailPage({params}: WorkOrderDetailPageProps) {
  const {id: projectId, workOrderId} = await params

  const [workOrder, employeesFromDAL, hourTypes, materialsFromDAL, profile] = await Promise.all([
    getWorkOrderById(workOrderId).catch(() => null),
    getEmployees(),
    getHourTypes(),
    getMaterials(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!workOrder) notFound()

  const employees = employeesFromDAL.map(mapEmployee)

  const employeeOptions = employees.map(e => ({
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
  }))

  const hourTypeOptions = hourTypes.map(ht => ({id: ht.id, name: ht.name}))
  const materialOptions = materialsFromDAL.map(m => ({id: m.id, name: m.name ?? ''}))

  const currentUserRole = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.Role.name ?? ''
  const currentUserLevel = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.SubRole.level ?? 0

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <WorkOrderDetail
          workOrder={workOrder}
          projectId={projectId}
          employees={employeeOptions}
          hourTypes={hourTypeOptions}
          materials={materialOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
        />
      </div>
    </main>
  )
}
