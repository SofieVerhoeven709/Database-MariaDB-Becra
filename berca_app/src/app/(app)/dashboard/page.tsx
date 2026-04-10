import {redirect} from 'next/navigation'
import {DepartmentGrid} from '@/components/custom/departmentGrid'
import {DashboardInspectionPopup} from '@/components/custom/dashboardInspectionPopup'
import {getSessionFromCookie} from '@/lib/sessionUtils'
import {getSerialTracked} from '@/dal/materialSerialTracked'
import {mapMaterialSerialTracked} from '@/extra/serialTracked'
import {AppSettings} from '@/constants'
import {prismaClient} from '@/dal/prismaClient'

export default async function DashboardPage() {
  const session = await getSessionFromCookie()
  const employee = session?.Employee

  if (!employee) {
    redirect('/')
  }

  const roleLevelIds = employee.RoleLevelEmployee.map(rle => rle.RoleLevel.id)

  if (!roleLevelIds.length) {
    redirect('/')
  }

  const roleContextInput = {
    roleLevelIds,
  }

  const departmentTargetType = await prismaClient.targetType.findFirst({
    where: {
      name: 'Department',
      deleted: false,
    },
    select: {id: true},
  })

  let maintenanceHref: string | null = null

  if (departmentTargetType) {
    const visibleDepartmentTargets = await prismaClient.visibilityForRole.findMany({
      where: {
        roleLevelId: {in: roleLevelIds},
        visible: true,
        Target: {
          deleted: false,
          targetTypeId: departmentTargetType.id,
        },
      },
      select: {
        targetId: true,
      },
    })

    const targetIds = visibleDepartmentTargets.map(v => v.targetId)

    if (targetIds.length > 0) {
      const firstDepartment = await prismaClient.department.findFirst({
        where: {
          targetId: {in: targetIds},
        },
        select: {
          id: true,
        },
        orderBy: [{number: 'asc'}, {name: 'asc'}],
      })

      if (firstDepartment) {
        maintenanceHref = `/departments/${firstDepartment.id}/maintenance`
      }
    }
  }

  const inspectionWarningDays = AppSettings.inspectionReminderMonths * 30
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const serialTracked = (await getSerialTracked()).map(mapMaterialSerialTracked)
  const upcomingInspectionsCount = serialTracked.reduce((count, item) => {
    if (!item.nextInspectionDate) return count

    const targetDate = new Date(item.nextInspectionDate)
    if (Number.isNaN(targetDate.getTime())) return count

    targetDate.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    return diffDays >= 0 && diffDays <= inspectionWarningDays ? count + 1 : count
  }, 0)

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold">Departments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Select a department to manage</p>
        </div>

        {upcomingInspectionsCount > 0 && (
          <DashboardInspectionPopup
            upcomingInspectionsCount={upcomingInspectionsCount}
            inspectionWarningDays={inspectionWarningDays}
            maintenanceHref={maintenanceHref}
          />
        )}

        <DepartmentGrid roleContextInput={roleContextInput} />
      </div>
    </main>
  )
}
