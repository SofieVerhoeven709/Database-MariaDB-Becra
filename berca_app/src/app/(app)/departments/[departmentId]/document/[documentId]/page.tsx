import {DocumentDetail} from '@/components/custom/documentDetail'
import {
  getDocumentDetail,
  getDocumentGroups,
  getDocumentPlaces,
  getDocuments,
  getDocumentStatuses,
  getDocumentStructureTargetNames,
} from '@/dal/documents'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {mapDocumentDetail, mapDocumentPlace, mapDocument, mapDocumentStatus} from '@/extra/documents'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {prismaClient} from '@/dal/prismaClient'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {notFound} from 'next/navigation'
import type {MappedDocumentGroup} from '@/types/document'
import {getDocumentTargetOptions} from '@/dal/documents'

interface PageProps {
  params: Promise<{departmentId: string; documentId: string}>
}

export default async function DocumentDetailPage({params}: PageProps) {
  const {departmentId, documentId} = await params

  const [
    department,
    documentFromDAL,
    targetDisplayNames,
    allDocumentsFromDAL,
    documentGroupsFromDAL,
    places,
    statuses,
    roleLevels,
    profile,
    employees,
    targetOptions,
  ] = await Promise.all([
    getDepartmentById(departmentId),
    getDocumentDetail(documentId).catch(() => null),
    getDocumentDetail(documentId)
      .catch(() => null)
      .then(d => (d ? getDocumentStructureTargetNames(documentId) : [])),
    getDocuments(),
    getDocumentGroups(),
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
  if (!documentFromDAL) notFound()

  const doc = mapDocumentDetail(documentFromDAL, targetDisplayNames)
  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const roleLevelOptions = mapRoleLevelOptions(roleLevels)
  const defaultVisibleRoleNames = [department.name]
  const employeeOptions = employees.map(e => ({id: e.id, name: `${e.firstName} ${e.lastName}`}))

  // Map DocumentGroup junctions for the cascade logic
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

  // Build flat group A/B/C/D option lists for the selects
  const groupAOptions = Array.from(
    new Map(
      documentGroupsFromDAL
        .filter(g => g.groupAId && g.DocumentGroupA)
        .map(g => [g.groupAId!, {id: g.groupAId!, name: g.DocumentGroupA?.name ?? null}]),
    ).values(),
  )
  const groupBOptions = Array.from(
    new Map(
      documentGroupsFromDAL
        .filter(g => g.groupBId && g.DocumentGroupB)
        .map(g => [g.groupBId!, {id: g.groupBId!, name: g.DocumentGroupB?.name ?? null}]),
    ).values(),
  )
  const groupCOptions = Array.from(
    new Map(
      documentGroupsFromDAL
        .filter(g => g.groupCId && g.DocumentGroupC)
        .map(g => [g.groupCId!, {id: g.groupCId!, name: g.DocumentGroupC?.name ?? null}]),
    ).values(),
  )
  const groupDOptions = Array.from(
    new Map(
      documentGroupsFromDAL
        .filter(g => g.groupDId && g.DocumentGroupD)
        .map(g => [g.groupDId!, {id: g.groupDId!, name: g.DocumentGroupD?.name ?? null}]),
    ).values(),
  )

  const placeOptions = places
    .filter(p => !p.deleted)
    .map(mapDocumentPlace)
    .map(p => ({id: p.id, headFolder: p.headFolder, subFolder: p.subFolder, label: p.label}))

  const statusOptions = statuses
    .filter(s => !s.deleted)
    .map(mapDocumentStatus)
    .map(s => ({id: s.id, name: s.name}))

  const documentOptions = allDocumentsFromDAL
    .map(mapDocument)
    .filter(d => !d.deleted && d.id !== documentId)
    .map(d => ({id: d.id, name: `${d.documentNumber} — ${d.descriptionShort}`}))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <DocumentDetail
          document={doc}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          roleLevelOptions={roleLevelOptions}
          defaultVisibleRoleNames={defaultVisibleRoleNames}
          employeeOptions={employeeOptions}
          groupAOptions={groupAOptions}
          groupBOptions={groupBOptions}
          groupCOptions={groupCOptions}
          groupDOptions={groupDOptions}
          documentGroups={documentGroups}
          placeOptions={placeOptions}
          statusOptions={statusOptions}
          documentOptions={documentOptions}
          targetOptions={targetOptions}
          departmentId={departmentId}
        />
      </div>
    </main>
  )
}
