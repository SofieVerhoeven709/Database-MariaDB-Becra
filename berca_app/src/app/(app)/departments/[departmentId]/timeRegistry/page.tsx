import {TimeRegistryTable} from '@/components/custom/timeRegistryTable'
import {getTimeRegistries} from '@/dal/timeRegistries'
import {mapTimeRegistry} from '@/extra/timeRegistries'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getEmployees} from '@/dal/employees'
import {mapEmployee} from '@/extra/employees'
import {prismaClient} from '@/dal/prismaClient'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function TimeRegistriesPage({params}: PageProps) {
  const {departmentId} = await params

  const [department, timeRegistriesFromDAL, employeesFromDAL, hourTypes, workOrders, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getTimeRegistries(),
    getEmployees(),
    prismaClient.hourType.findMany({where: {deleted: false}, orderBy: {name: 'asc'}}),
    prismaClient.workOrder.findMany({
      where: {deleted: false},
      select: {id: true, workOrderNumber: true, description: true, hoursMaterialClosed: true},
      orderBy: {workOrderNumber: 'asc'},
    }),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)

  const timeRegistries = timeRegistriesFromDAL
    .map(mapTimeRegistry)
    .filter(tr =>
      currentUserLevel >= 80
        ? true
        : tr.createdBy === profile.id || tr.additionalEmployees.some(e => e.employeeId === profile.id),
    )
  const employees = employeesFromDAL.map(mapEmployee)

  const employeeOptions = employees.map(e => ({id: e.id, firstName: e.firstName, lastName: e.lastName}))
  const hourTypeOptions = hourTypes.map(ht => ({id: ht.id, name: ht.name}))

  const openWorkOrders = workOrders.filter(wo => !wo.hoursMaterialClosed)
  const workOrderOptions = openWorkOrders.map(wo => ({
    id: wo.id,
    workOrderNumber: wo.workOrderNumber,
    description: wo.description,
    hoursMaterialClosed: wo.hoursMaterialClosed,
  }))
  const allWorkOrderOptions = workOrders.map(wo => ({
    id: wo.id,
    workOrderNumber: wo.workOrderNumber,
    description: wo.description,
    hoursMaterialClosed: wo.hoursMaterialClosed,
  }))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Time Registries</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and manage time registration records</p>
        </div>

        <TimeRegistryTable
          initialTimeRegistries={timeRegistries}
          employees={employeeOptions}
          hourTypes={hourTypeOptions}
          workOrders={workOrderOptions}
          allWorkOrders={allWorkOrderOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          currentUserId={profile.id}
        />
      </div>
    </main>
  )
}
