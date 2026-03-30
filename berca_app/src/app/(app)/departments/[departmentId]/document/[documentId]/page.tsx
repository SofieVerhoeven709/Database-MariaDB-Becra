import {DocumentDetail} from '@/components/custom/documentDetail'
import {getDocumentDetail, getDocumentGroups, getDocumentPlaces, getDocuments} from '@/dal/documents'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {mapDocumentDetail, mapDocumentPlace, mapDocument, mapDocumentGroup} from '@/extra/documents'
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

  const [department, documentFromDAL, allDocumentsFromDAL, groups, places, roleLevels, profile, employees, roles] =
    await Promise.all([
      getDepartmentById(departmentId),
      getDocumentDetail(documentId).catch(() => null),
      getDocuments(),
      getDocumentGroups(),
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
  const groupOptions = groups.map(mapDocumentGroup)
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
          groupOptions={groupOptions}
          placeOptions={placeOptions}
          documentOptions={documentOptions}
          departmentId={departmentId}
        />
      </div>
    </main>
  )
}
