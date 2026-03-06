import {TimeRegistryTable} from '@/components/custom/timeRegistryTable'
import {getTimeRegistries} from '@/dal/timeRegistries'
import {mapTimeRegistry} from '@/extra/timeRegistries'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getEmployees} from '@/dal/employees'
import {mapEmployee} from '@/extra/employees'
import {prismaClient} from '@/dal/prismaClient'

export default async function TimeRegistriesPage() {
  const [timeRegistriesFromDAL, employeesFromDAL, hourTypes, workOrders, profile] = await Promise.all([
    getTimeRegistries(),
    getEmployees(),
    prismaClient.hourType.findMany({where: {deleted: false}, orderBy: {name: 'asc'}}),
    prismaClient.workOrder.findMany({
      where: {deleted: false},
      select: {id: true, workOrderNumber: true},
      orderBy: {workOrderNumber: 'asc'},
    }),
    getSessionProfileFromCookieOrThrow(),
  ])

  const timeRegistries = timeRegistriesFromDAL.map(mapTimeRegistry)
  const employees = employeesFromDAL.map(mapEmployee)

  const currentUserRole = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.Role.name ?? ''
  const currentUserLevel = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.SubRole.level ?? 0

  const employeeOptions = employees.map(e => ({
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
  }))

  const hourTypeOptions = hourTypes.map(ht => ({
    id: ht.id,
    name: ht.name,
  }))

  const workOrderOptions = workOrders.map(wo => ({
    id: wo.id,
    workOrderNumber: wo.workOrderNumber,
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
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          currentUserId={profile.id}
        />
      </div>
    </main>
  )
}
