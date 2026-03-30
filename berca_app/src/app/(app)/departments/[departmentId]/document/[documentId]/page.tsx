import {DocumentDetail} from '@/components/custom/documentDetail'
import {
  getDocumentDetail,
  getDocumentGroupAs,
  getDocumentGroupBs,
  getDocumentGroupCs,
  getDocumentGroupDs,
  getDocumentPlaces,
  getDocuments,
} from '@/dal/documents'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {
  mapDocumentDetail,
  mapDocumentGroupA,
  mapDocumentGroupB,
  mapDocumentGroupC,
  mapDocumentGroupD,
  mapDocumentPlace,
  mapDocument,
} from '@/extra/documents'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {prismaClient} from '@/dal/prismaClient'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {notFound} from 'next/navigation'

interface PageProps {
  params: Promise<{departmentId: string; documentId: string}>
}

export default async function DocumentDetailPage({params}: PageProps) {
  const {departmentId, documentId} = await params

  const [
    department,
    documentFromDAL,
    allDocumentsFromDAL,
    groupAs,
    groupBs,
    groupCs,
    groupDs,
    places,
    roleLevels,
    profile,
    employees,
    roles,
  ] = await Promise.all([
    getDepartmentById(departmentId),
    getDocumentDetail(documentId).catch(() => null),
    getDocuments(),
    getDocumentGroupAs(),
    getDocumentGroupBs(),
    getDocumentGroupCs(),
    getDocumentGroupDs(),
    getDocumentPlaces(),
    getAllRoleLevels(),
    getSessionProfileFromCookieOrThrow(),
    prismaClient.employee.findMany({
      where: {deleted: false},
      orderBy: [{firstName: 'asc'}, {lastName: 'asc'}],
      select: {id: true, firstName: true, lastName: true},
    }),
    prismaClient.role.findMany({
      where: {deleted: false},
      orderBy: {name: 'asc'},
      select: {id: true, name: true},
    }),
  ])

  if (!department) return <p>Department not found</p>
  if (!documentFromDAL) notFound()

  const doc = mapDocumentDetail(documentFromDAL)
  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const roleLevelOptions = mapRoleLevelOptions(roleLevels)
  const defaultVisibleRoleNames = [department.name]
  const employeeOptions = employees.map(e => ({id: e.id, name: `${e.firstName} ${e.lastName}`}))
  const roleOptions = roles.map(r => ({id: r.id, name: r.name}))

  // Build group options with parent IDs for cascading
  const groupAOptions = groupAs
    .filter(g => !g.deleted)
    .map(mapDocumentGroupA)
    .map(g => ({id: g.id, name: g.name}))
  const groupBOptions = groupBs
    .filter(g => !g.deleted)
    .map(mapDocumentGroupB)
    .map(g => ({id: g.id, name: g.name, documentGroupAId: g.documentGroupAId}))
  const groupCOptions = groupCs
    .filter(g => !g.deleted)
    .map(mapDocumentGroupC)
    .map(g => ({id: g.id, name: g.name, documentGroupBId: g.documentGroupBId}))
  const groupDOptions = groupDs
    .filter(g => !g.deleted)
    .map(mapDocumentGroupD)
    .map(g => ({id: g.id, name: g.name, documentGroupCId: g.documentGroupCId}))
  const placeOptions = places
    .filter(p => !p.deleted)
    .map(mapDocumentPlace)
    .map(p => ({id: p.id, headFolder: p.headFolder, subFolder: p.subFolder, label: p.label}))
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
          roleOptions={roleOptions}
          groupAOptions={groupAOptions}
          groupBOptions={groupBOptions}
          groupCOptions={groupCOptions}
          groupDOptions={groupDOptions}
          placeOptions={placeOptions}
          documentOptions={documentOptions}
          departmentId={departmentId}
        />
      </div>
    </main>
  )
}
