import {notFound} from 'next/navigation'
import {getPurchaseBOMById, getMaterialOptions, getPurchaseBOMs} from '@/dal/purchaseBoms'
import {mapPurchaseBOM} from '@/extra/purchaseBoms'
import {PurchaseBOMDetail} from '@/components/custom/purchaseBomDetail'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface PageProps {
  params: Promise<{departmentId: string; purchaseBomId: string}>
}

export default async function PurchaseBOMDetailPage({params}: PageProps) {
  const {departmentId, purchaseBomId} = await params

  const [department, bomRaw, allBomsRaw, materialOptions, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getPurchaseBOMById(purchaseBomId).catch(() => null),
    getPurchaseBOMs(),
    getMaterialOptions(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>
  if (!bomRaw) notFound()

  const bom = mapPurchaseBOM(bomRaw)
  const allBOMs = allBomsRaw.map(r => mapPurchaseBOM(r))
  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <PurchaseBOMDetail
          bom={bom}
          materialOptions={materialOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          departmentId={departmentId}
          allBOMs={allBOMs}
        />
      </div>
    </main>
  )
}
