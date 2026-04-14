import {
  getMaterialDemands,
  getMaterialDemandMaterialOptions,
  getMaterialDemandSourceReferenceLabels,
} from '@/dal/materialDemands'
import {mapMaterialDemand} from '@/extra/materialDemands'
import {MaterialDemandTable} from '@/components/custom/materialDemandTable'
import {DEPARTMENT_ACTIONS} from '@/extra/departmentActions'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {getSupplierCompanies} from '@/dal/companies'
import Link from 'next/link'

interface PageProps {
  params: Promise<{departmentId: string}>
  searchParams: Promise<{[key: string]: string | string[] | undefined}>
}

export default async function MaterialDemandPage({params, searchParams}: PageProps) {
  const {departmentId} = await params
  const resolvedSearchParams = await searchParams
  const showFulfilled = resolvedSearchParams?.showFulfilled === 'true'

  const [department, demandsFromDAL, materialsRaw, supplierCompaniesRaw, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getMaterialDemands(showFulfilled),
    getMaterialDemandMaterialOptions(),
    getSupplierCompanies(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const action = DEPARTMENT_ACTIONS[department.name]?.find(a => a.id === 'materialDemand')
  const sourceLabelEntries = demandsFromDAL.flatMap(demand =>
    demand.MaterialDemandSource.map(source => ({
      sourceTypeName: source.MaterialDemandSourceType.name,
      sourceReferenceId: source.sourceReferenceId,
    })),
  )
  const sourceReferenceLabels = await getMaterialDemandSourceReferenceLabels(sourceLabelEntries)
  const entries = demandsFromDAL.map(demand => mapMaterialDemand(demand, sourceReferenceLabels))
  const suppliers = supplierCompaniesRaw
    .map(s => ({id: s.id, name: s.name}))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{action?.name ?? 'Material Demand'}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {action?.description ?? 'Review purchasing demand and prepare grouped quote requests by supplier.'}
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
            <span className="rounded-full border border-border/70 px-3 py-1 text-xs uppercase tracking-wide">
              Role: {currentUserRole}
            </span>
            <Link
              href={`?showFulfilled=${showFulfilled ? 'false' : 'true'}`}
              className="rounded-full border border-border/70 px-3 py-1 text-xs uppercase tracking-wide text-foreground hover:bg-secondary/70">
              {showFulfilled ? 'Hide Fulfilled Sources' : 'Show Fulfilled Sources'}
            </Link>
          </div>
        </header>

        <MaterialDemandTable
          initialEntries={entries}
          materials={materialsRaw}
          suppliers={suppliers}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          departmentId={departmentId}
        />
      </div>
    </main>
  )
}

