import {FollowUpStructureTable} from '@/components/custom/followUpStructureTable'
import {getFollowUpStructures} from '@/dal/followUpStructures'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {mapFollowUpStructure} from '@/extra/followUpStructures'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {prismaClient} from '@/dal/prismaClient'

export default async function FollowUpStructuresPage() {
  const [structuresFromDAL, roleLevels, profile, statuses, urgencyTypes, employees, contacts, followUps] =
    await Promise.all([
      getFollowUpStructures(),
      getAllRoleLevels(),
      getSessionProfileFromCookieOrThrow(),
      prismaClient.status.findMany({
        where: {deleted: false},
        orderBy: {name: 'asc'},
        select: {id: true, name: true},
      }),
      prismaClient.urgencyType.findMany({
        where: {deleted: false},
        orderBy: {name: 'asc'},
        select: {id: true, name: true},
      }),
      prismaClient.employee.findMany({
        where: {deleted: false},
        orderBy: [{firstName: 'asc'}, {lastName: 'asc'}],
        select: {id: true, firstName: true, lastName: true},
      }),
      prismaClient.contact.findMany({
        where: {deleted: false},
        orderBy: [{firstName: 'asc'}, {lastName: 'asc'}],
        select: {id: true, firstName: true, lastName: true},
      }),
      prismaClient.followUp.findMany({
        where: {deleted: false},
        orderBy: {createdAt: 'desc'},
        select: {id: true, activityDescription: true},
      }),
    ])

  const currentUserRole = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.Role.name ?? ''
  const currentUserLevel = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.SubRole.level ?? 0
  const currentUserRoleLevelId = profile.roleLevelId ?? ''
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  const allStructures = structuresFromDAL.map(mapFollowUpStructure)
  const structures = isAdmin
    ? allStructures
    : allStructures.filter(s => {
        const rows = s.visibilityForRoles
        if (rows.length === 0) return true
        const myRow = rows.find(r => r.roleLevelId === currentUserRoleLevelId)
        return myRow?.visible ?? false
      })

  const roleLevelOptions = mapRoleLevelOptions(roleLevels)
  const defaultVisibleRoleNames = ['Product Quality']
  const department = 'productQuality'

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Follow-up Entries</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage follow-up log entries and tasks</p>
        </div>

        <FollowUpStructureTable
          initialStructures={structures}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          roleLevelOptions={roleLevelOptions}
          defaultVisibleRoleNames={defaultVisibleRoleNames}
          department={department}
          statusOptions={statuses}
          urgencyTypeOptions={urgencyTypes}
          employeeOptions={employees.map(e => ({id: e.id, name: `${e.firstName} ${e.lastName}`}))}
          contactOptions={contacts.map(c => ({id: c.id, name: `${c.firstName} ${c.lastName}`}))}
          followUpOptions={followUps.map(f => ({
            id: f.id,
            name: f.activityDescription
              ? f.activityDescription.slice(0, 60) + (f.activityDescription.length > 60 ? '…' : '')
              : `Follow-up (${f.id.slice(0, 8)})`,
          }))}
        />
      </div>
    </main>
  )
}
