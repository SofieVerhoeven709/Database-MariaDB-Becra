import {getQuoteSuppliers} from '@/dal/quoteSuppliers'
import {mapQuoteSupplier} from '@/extra/quoteSuppliers'
import {QuoteSupplierTable} from '@/components/custom/quoteSupplierTable'
import {DEPARTMENT_ACTIONS} from '@/extra/departmentActions'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getProjects} from '@/dal/projects'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function OrderQuotePage({params}: PageProps) {
  const {departmentId} = await params

  const [department, entriesFromDAL, projectsRaw, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getQuoteSuppliers(),
    getProjects(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)

  const entries = entriesFromDAL.map(mapQuoteSupplier)
  const action = DEPARTMENT_ACTIONS[department.name]?.find(a => a.id === 'orderQuote')

  const projectOptions = projectsRaw
    .filter(p => !p.deleted)
    .map(p => ({id: p.id, name: `${p.projectNumber} – ${p.projectName}`}))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{action?.name ?? 'Order Quotes'}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {action?.description ?? 'Manage supplier quotations and comparisons.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="text-foreground">
              {entries.length}
              <span className="ml-1 text-xs uppercase tracking-wide text-muted-foreground">total</span>
            </span>
            <span className="text-xs uppercase tracking-wide">
              Viewing as {profile.firstName} {profile.lastName}
            </span>
          </div>
        </header>

        <QuoteSupplierTable
          initialEntries={entries}
          projects={projectOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
        />
      </div>
    </main>
  )
}
