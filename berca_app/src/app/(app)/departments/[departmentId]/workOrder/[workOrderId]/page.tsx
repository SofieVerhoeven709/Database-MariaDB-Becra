import {getWorkOrderById} from '@/dal/workOrders'
import {getEmployees} from '@/dal/employees'
import {getHourTypes} from '@/dal/hourTypes'
import {getMaterials} from '@/dal/materials'
import {mapEmployee} from '@/extra/employees'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {WorkOrderDetail} from '@/components/custom/workOrderDetail'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {notFound} from 'next/navigation'

interface PageProps {
  params: Promise<{departmentId: string; workOrderId: string}>
}

export default async function WorkOrderDetailPage({params}: PageProps) {
  const {departmentId, workOrderId} = await params

  const [department, workOrder, employeesFromDAL, hourTypes, materialsFromDAL, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getWorkOrderById(workOrderId).catch(() => null),
    getEmployees(),
    getHourTypes(),
    getMaterials(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>
  if (!workOrder) notFound()

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)

  const employees = employeesFromDAL.map(mapEmployee)
  const employeeOptions = employees.map(e => ({id: e.id, firstName: e.firstName, lastName: e.lastName}))
  const hourTypeOptions = hourTypes.map(ht => ({id: ht.id, name: ht.name}))
  const materialOptions = materialsFromDAL.map(m => ({id: m.id, name: m.name ?? ''}))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <WorkOrderDetail
          workOrder={workOrder}
          projectId={workOrder.projectId}
          employees={employeeOptions}
          hourTypes={hourTypeOptions}
          materials={materialOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          currentUserId={profile.id}
        />
      </div>
    </main>
  )
}
