import {prismaClient} from '@/dal/prismaClient'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {Badge} from '@/components/ui/badge'
import {Calendar, Clock} from 'lucide-react'

function formatDate(date: Date | null | undefined) {
  if (!date) return '-'
  return date.toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function isOverdue(date: Date | null | undefined) {
  if (!date) return false
  return date < new Date()
}

function isDueToday(date: Date | null | undefined) {
  if (!date) return false
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

export default async function SchedulePage() {
  await getSessionProfileFromCookieOrThrow()

  const upcomingFollowUps = await prismaClient.followUp.findMany({
    where: {
      deleted: false,
      itemClosed: false,
      salesFollowUp: true,
      actionAgenda: {not: null},
    },
    orderBy: {actionAgenda: 'asc'},
    select: {
      id: true,
      activityDescription: true,
      actionAgenda: true,
      closedAgenda: true,
      Status: {select: {name: true}},
      UrgencyType: {select: {name: true}},
      Employee_FollowUp_ownedByToEmployee: {select: {firstName: true, lastName: true}},
      Employee_FollowUp_executedByToEmployee: {select: {firstName: true, lastName: true}},
    },
  })

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Schedule</h1>
          <p className="mt-1 text-sm text-muted-foreground">Upcoming sales follow-up activities and deadlines</p>
        </div>

          {upcomingFollowUps.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <Calendar className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No upcoming sales activities scheduled.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingFollowUps.map(f => {
                const overdue = isOverdue(f.actionAgenda ?? undefined)
                const today = isDueToday(f.actionAgenda ?? undefined)

                return (
                  <div
                    key={f.id}
                    className={`rounded-lg border bg-card p-4 flex gap-4 items-start ${
                      overdue ? 'border-destructive/40' : today ? 'border-accent/40' : 'border-border'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      <Clock
                        className={`h-4 w-4 ${overdue ? 'text-destructive' : today ? 'text-accent' : 'text-muted-foreground'}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {f.activityDescription ?? <span className="italic text-muted-foreground">No description</span>}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Due: {formatDate(f.actionAgenda)}</span>
                        {f.Employee_FollowUp_ownedByToEmployee && (
                          <span>
                            Owner: {f.Employee_FollowUp_ownedByToEmployee.firstName}{' '}
                            {f.Employee_FollowUp_ownedByToEmployee.lastName}
                          </span>
                        )}
                        {f.Employee_FollowUp_executedByToEmployee && (
                          <span>
                            Assigned: {f.Employee_FollowUp_executedByToEmployee.firstName}{' '}
                            {f.Employee_FollowUp_executedByToEmployee.lastName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end shrink-0">
                      {overdue && (
                        <Badge variant="destructive" className="text-xs">Overdue</Badge>
                      )}
                      {today && !overdue && (
                        <Badge className="bg-accent/15 text-accent border-0 text-xs">Today</Badge>
                      )}
                      {f.UrgencyType && (
                        <Badge variant="secondary" className="text-xs">{f.UrgencyType.name}</Badge>
                      )}
                      {f.Status && (
                        <Badge variant="outline" className="text-xs">{f.Status.name}</Badge>
                      )}
                    </div>
                  </div>
                )
              })}
              <p className="text-xs text-muted-foreground pt-2">{upcomingFollowUps.length} item(s) in schedule</p>
            </div>
          )}
        </div>
      </main>
  )
}
