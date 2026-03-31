import {DocumentTable} from '@/components/custom/documentTable'
import {
  getDocuments,
  getDocumentGroups,
  getDocumentGroupAs,
  getDocumentGroupBs,
  getDocumentGroupCs,
  getDocumentGroupDs,
  getDocumentPlaces,
  getDocumentStatuses,
  getDocumentTargetOptions,
} from '@/dal/documents'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {
  mapDocument,
  mapDocumentGroupA,
  mapDocumentGroupB,
  mapDocumentGroupC,
  mapDocumentGroupD,
  mapDocumentPlace,
  mapDocumentStatus,
} from '@/extra/documents'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {prismaClient} from '@/dal/prismaClient'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import type {MappedDocumentGroup} from '@/types/document'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function DocumentsPage({params}: PageProps) {
  const {departmentId} = await params

  const [
    department,
    documentsFromDAL,
    documentGroupsFromDAL,
    groupAs,
    groupBs,
    groupCs,
    groupDs,
    places,
    statuses,
    roleLevels,
    profile,
    employees,
    targetOptions,
  ] = await Promise.all([
    getDepartmentById(departmentId),
    getDocuments(),
    getDocumentGroups(),
    getDocumentGroupAs(),
    getDocumentGroupBs(),
    getDocumentGroupCs(),
    getDocumentGroupDs(),
    getDocumentPlaces(),
    getDocumentStatuses(),
    getAllRoleLevels(),
    getSessionProfileFromCookieOrThrow(),
    prismaClient.employee.findMany({
      where: {deleted: false},
      orderBy: [{firstName: 'asc'}, {lastName: 'asc'}],
      select: {id: true, firstName: true, lastName: true},
    }),
    getDocumentTargetOptions(),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const currentUserRoleLevelIds = profile.RoleLevelEmployee.map(rle => rle.RoleLevel.id)
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  const allDocuments = documentsFromDAL.map(mapDocument)
  const documents = isAdmin
    ? allDocuments
    : allDocuments.filter(d => {
        const rows = d.visibilityForRoles
        if (rows.length === 0) return true
        const myRow = rows.find(r => currentUserRoleLevelIds.includes(r.roleLevelId))
        return myRow?.visible ?? false
      })

  // Map DocumentGroup junctions
  const documentGroups: MappedDocumentGroup[] = documentGroupsFromDAL.map(g => ({
    id: g.id,
    groupAId: g.groupAId,
    groupAName: g.DocumentGroupA?.name ?? null,
    groupBId: g.groupBId,
    groupBName: g.DocumentGroupB?.name ?? null,
    groupCId: g.groupCId,
    groupCName: g.DocumentGroupC?.name ?? null,
    groupDId: g.groupDId,
    groupDName: g.DocumentGroupD?.name ?? null,
    label:
      [g.DocumentGroupA?.name, g.DocumentGroupB?.name, g.DocumentGroupC?.name, g.DocumentGroupD?.name]
        .filter(Boolean)
        .join(' › ') || '—',
  }))

  const roleLevelOptions = mapRoleLevelOptions(roleLevels)
  const defaultVisibleRoleNames = [department.name]
  const employeeOptions = employees.map(e => ({id: e.id, name: `${e.firstName} ${e.lastName}`}))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage document records, groups, places, and statuses</p>
        </div>

        <DocumentTable
          initialDocuments={documents}
          initialDocumentGroups={documentGroups}
          initialGroupAs={groupAs.map(mapDocumentGroupA)}
          initialGroupBs={groupBs.map(mapDocumentGroupB)}
          initialGroupCs={groupCs.map(mapDocumentGroupC)}
          initialGroupDs={groupDs.map(mapDocumentGroupD)}
          initialPlaces={places.map(mapDocumentPlace)}
          initialStatuses={statuses.map(mapDocumentStatus)}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          roleLevelOptions={roleLevelOptions}
          defaultVisibleRoleNames={defaultVisibleRoleNames}
          departmentId={departmentId}
          employeeOptions={employeeOptions}
          targetOptions={targetOptions}
        />
      </div>
    </main>
  )
}
