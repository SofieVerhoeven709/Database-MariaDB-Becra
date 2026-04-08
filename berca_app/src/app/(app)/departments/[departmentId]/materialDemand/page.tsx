import {getMaterialDemands, getMaterialDemandMaterialOptions} from '@/dal/materialDemands'
import {mapMaterialDemand} from '@/extra/materialDemands'
import {MaterialDemandTable} from '@/components/custom/materialDemandTable'
import {DEPARTMENT_ACTIONS} from '@/extra/departmentActions'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function MaterialDemandPage({params}: PageProps) {
  const {departmentId} = await params

  const [department, demandsFromDAL, materialsRaw, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getMaterialDemands(),
    getMaterialDemandMaterialOptions(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const action = DEPARTMENT_ACTIONS[department.name]?.find(a => a.id === 'materialDemand')
  const entries = demandsFromDAL.map(mapMaterialDemand)

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
          </div>
        </header>

        <MaterialDemandTable
          initialEntries={entries}
          materials={materialsRaw}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          departmentId={departmentId}
        />
      </div>
    </main>
  )
}

