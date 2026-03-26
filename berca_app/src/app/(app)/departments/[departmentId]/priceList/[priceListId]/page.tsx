import {notFound} from 'next/navigation'
import {getPriceListById, getUnassignedOpenProjects, enrichLinkedTargets} from '@/dal/priceLists'
import {mapPriceList} from '@/extra/priceLists'
import {PriceListDetail} from '@/components/custom/priceListDetail'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface PageProps {
  params: Promise<{departmentId: string; priceListId: string}>
}

export default async function PriceListDetailPage({params}: PageProps) {
  const {departmentId, priceListId} = await params

  const [department, priceListRaw, unassignedProjectsRaw, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getPriceListById(priceListId).catch(() => null),
    getUnassignedOpenProjects(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>
  if (!priceListRaw) notFound()

  // Collect all linked targetIds across items so we can resolve display labels in one batch
  const linkedTargetIds = priceListRaw.PriceListItem.map(i => i.PriceListItemTarget?.targetId).filter(
    (id): id is string => !!id,
  )

  const resolvedTargets = await enrichLinkedTargets(linkedTargetIds)

  const priceList = mapPriceList(priceListRaw, resolvedTargets)
  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)

  const unassignedProjects = unassignedProjectsRaw.map(p => ({
    id: p.id,
    projectNumber: p.projectNumber,
    projectName: p.projectName,
    companyName: p.Company.name,
  }))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <PriceListDetail
          priceList={priceList}
          unassignedProjects={unassignedProjects}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          departmentId={departmentId}
        />
      </div>
    </main>
  )
}
