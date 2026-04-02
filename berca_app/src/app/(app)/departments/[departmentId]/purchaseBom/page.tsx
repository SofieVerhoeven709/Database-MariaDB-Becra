import {getPurchaseBOMs} from '@/dal/purchaseBoms'
import {mapPurchaseBOM} from '@/extra/purchaseBoms'
import {PurchaseBOMTable} from '@/components/custom/purchaseBomTable'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface PageProps {
  params: Promise<{departmentId: string}>
  searchParams: Promise<{projectId?: string}>
}

export default async function PurchaseBOMsPage({params, searchParams}: PageProps) {
  const {departmentId} = await params
  const {projectId} = await searchParams

  const [department, bomsRaw, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getPurchaseBOMs(projectId),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const boms = bomsRaw.map(r => mapPurchaseBOM(r))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Purchase BOMs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage bill of materials for purchases</p>
        </div>
        <PurchaseBOMTable
          initialBOMs={boms}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          projectId={projectId}
          departmentId={departmentId}
        />
      </div>
    </main>
  )
}
