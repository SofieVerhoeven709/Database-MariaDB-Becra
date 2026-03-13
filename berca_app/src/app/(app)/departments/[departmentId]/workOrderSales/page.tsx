import {WorkOrderTable} from '@/components/custom/workOrderTable'
import {getWorkOrders} from '@/dal/workOrders'
import {mapWorkOrder} from '@/extra/workOrders'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getProjects} from '@/dal/projects'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import camelCase from 'lodash/camelCase'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function WorkOrderSalesPage({params}: PageProps) {
  const {departmentId} = await params

  const [department, workOrdersFromDAL, projectsFromDAL, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getWorkOrders(),
    getProjects(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const departmentSlug = camelCase(department.name)

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
          department={departmentSlug}
        />
      </div>
    </main>
  )
}
