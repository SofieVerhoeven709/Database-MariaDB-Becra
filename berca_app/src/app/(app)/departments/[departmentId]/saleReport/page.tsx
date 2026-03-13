import {prismaClient} from '@/dal/prismaClient'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {FileText, Users, TrendingUp, CheckCircle, Clock, AlertCircle} from 'lucide-react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'

function formatDate(date: Date | null | undefined) {
  if (!date) return '-'
  return date.toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

export default async function SaleReportPage() {
  await getSessionProfileFromCookieOrThrow()

  const [
    quoteCount,
    quoteValidCount,
    followUpTotal,
    followUpOpen,
    followUpClosed,
    companyCount,
    recentFollowUps,
    recentQuotes,
  ] = await Promise.all([
    prismaClient.quoteBecra.count({where: {deleted: false}}),
    prismaClient.quoteBecra.count({where: {deleted: false, validDate: true}}),
    prismaClient.followUp.count({where: {deleted: false, salesFollowUp: true}}),
    prismaClient.followUp.count({where: {deleted: false, salesFollowUp: true, itemClosed: false}}),
    prismaClient.followUp.count({where: {deleted: false, salesFollowUp: true, itemClosed: true}}),
    prismaClient.company.count({where: {deleted: false, customer: true}}),
    prismaClient.followUp.findMany({
      where: {deleted: false, salesFollowUp: true},
      orderBy: {actionAgenda: 'asc'},
      take: 5,
      select: {
        id: true,
        activityDescription: true,
        actionAgenda: true,
        itemClosed: true,
        Status: {select: {name: true}},
        UrgencyType: {select: {name: true}},
      },
    }),
    prismaClient.quoteBecra.findMany({
      where: {deleted: false},
      orderBy: {date: 'desc'},
      take: 5,
      select: {
        id: true,
        description: true,
        date: true,
        validDate: true,
        Employee_QuoteBecra_createdByToEmployee: {select: {firstName: true, lastName: true}},
      },
    }),
  ])

  const stats = [
    {
      label: 'Total Quotes',
      value: quoteCount,
      sub: `${quoteValidCount} confirmed valid`,
      icon: FileText,
      color: 'text-blue-500',
    },
    {
      label: 'Open Follow-ups',
      value: followUpOpen,
      sub: `${followUpTotal} total sales follow-ups`,
      icon: AlertCircle,
      color: 'text-orange-500',
    },
    {
      label: 'Closed Follow-ups',
      value: followUpClosed,
      sub: `${Math.round(followUpTotal > 0 ? (followUpClosed / followUpTotal) * 100 : 0)}% completion rate`,
      icon: CheckCircle,
      color: 'text-green-500',
    },
    {
      label: 'Active Customers',
      value: companyCount,
      sub: 'Companies marked as customer',
      icon: Users,
      color: 'text-purple-500',
    },
  ]

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Sales Report</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overview of sales activity and performance</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <Card key={s.label} className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{s.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent quotes */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                Recent Quotes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentQuotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No quotes yet.</p>
              ) : (
                recentQuotes.map(q => (
                  <div key={q.id} className="flex items-start justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-foreground">
                        {q.description
                          ? q.description.slice(0, 50) + (q.description.length > 50 ? '…' : '')
                          : <span className="italic text-muted-foreground">No description</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {q.Employee_QuoteBecra_createdByToEmployee.firstName}{' '}
                        {q.Employee_QuoteBecra_createdByToEmployee.lastName} · {formatDate(q.date)}
                      </p>
                    </div>
                    {q.validDate ? (
                      <Badge className="bg-accent/15 text-accent border-0 text-xs shrink-0">Valid</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs shrink-0">Pending</Badge>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Upcoming follow-ups */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                Upcoming Sales Follow-ups
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentFollowUps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming follow-ups.</p>
              ) : (
                recentFollowUps.map(f => (
                  <div key={f.id} className="flex items-start justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-foreground">
                        {f.activityDescription
                          ? f.activityDescription.slice(0, 50) + (f.activityDescription.length > 50 ? '…' : '')
                          : <span className="italic text-muted-foreground">No description</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due: {formatDate(f.actionAgenda)} · {f.UrgencyType?.name ?? '-'}
                      </p>
                    </div>
                    {f.itemClosed ? (
                      <Badge className="bg-accent/15 text-accent border-0 text-xs shrink-0">Closed</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs shrink-0">{f.Status?.name ?? 'Open'}</Badge>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
