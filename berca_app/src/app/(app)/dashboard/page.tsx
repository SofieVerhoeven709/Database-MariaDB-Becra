import {redirect} from 'next/navigation'
import {DepartmentGrid} from '@/components/custom/departmentGrid'
import {DashboardHrMeetingPopup} from '@/components/custom/dashboardHrMeetingPopup'
import {DashboardInspectionPopup} from '@/components/custom/dashboardInspectionPopup'
import {getSessionFromCookie} from '@/lib/sessionUtils'
import {getSerialTracked} from '@/dal/materialSerialTracked'
import {mapMaterialSerialTracked} from '@/mapper/serialTracked'
import {AppSettings} from '@/constants'
import {prismaClient} from '@/dal/prismaClient'
import {getEvaluationWarningDays} from '@/lib/hrScheduleMeetings'
import {getUpcomingHrEvaluationMeetingsForEmployee} from '@/dal/hrEvaluationMeetings'

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
  let scheduleHref: string | null = null

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
      const visibleDepartments = await prismaClient.department.findMany({
        where: {
          targetId: {in: targetIds},
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: [{number: 'asc'}, {name: 'asc'}],
      })

      const firstDepartment = visibleDepartments[0]
      const hrDepartment =
        visibleDepartments.find(department => department.name.toLowerCase().includes('hr')) ??
        visibleDepartments.find(department => department.name.toLowerCase().includes('human'))

      if (firstDepartment) {
        maintenanceHref = `/departments/${firstDepartment.id}/maintenance`
      }

      scheduleHref = hrDepartment ? `/departments/${hrDepartment.id}/schedule` : null
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
  const scheduleHrefForPopup = typeof scheduleHref === 'string' ? scheduleHref : null
  const upcomingHrMeetings = await getUpcomingHrEvaluationMeetingsForEmployee(
    employee.id,
    today,
    getEvaluationWarningDays(),
  )

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

        {upcomingHrMeetings.length > 0 && (
          <DashboardHrMeetingPopup meetings={upcomingHrMeetings} scheduleHref={scheduleHrefForPopup} />
        )}

        <DepartmentGrid roleContextInput={roleContextInput} />
      </div>
    </main>
  )
}
