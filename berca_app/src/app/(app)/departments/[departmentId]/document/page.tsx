import {DocumentTable} from '@/components/custom/documentTable'
import {
  getDocuments,
  getDocumentGroupAs,
  getDocumentGroupBs,
  getDocumentGroupCs,
  getDocumentGroupDs,
  getDocumentPlaces,
} from '@/dal/documents'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {
  mapDocument,
  mapDocumentGroupA,
  mapDocumentGroupB,
  mapDocumentGroupC,
  mapDocumentGroupD,
  mapDocumentPlace,
} from '@/extra/documents'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {prismaClient} from '@/dal/prismaClient'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function DocumentsPage({params}: PageProps) {
  const {departmentId} = await params

  const [
    department,
    documentsFromDAL,
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

  const roleLevelOptions = mapRoleLevelOptions(roleLevels)
  const defaultVisibleRoleNames = [department.name]
  const employeeOptions = employees.map(e => ({id: e.id, name: `${e.firstName} ${e.lastName}`}))
  const roleOptions = roles.map(r => ({id: r.id, name: r.name}))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage document records, groups, and storage locations</p>
        </div>

        <DocumentTable
          initialDocuments={documents}
          initialGroupAs={groupAs.map(mapDocumentGroupA)}
          initialGroupBs={groupBs.map(mapDocumentGroupB)}
          initialGroupCs={groupCs.map(mapDocumentGroupC)}
          initialGroupDs={groupDs.map(mapDocumentGroupD)}
          initialPlaces={places.map(mapDocumentPlace)}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          roleLevelOptions={roleLevelOptions}
          defaultVisibleRoleNames={defaultVisibleRoleNames}
          departmentId={departmentId}
          employeeOptions={employeeOptions}
          roleOptions={roleOptions}
        />
      </div>
    </main>
  )
}
