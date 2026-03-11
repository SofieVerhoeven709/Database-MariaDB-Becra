import {FollowUpTable} from '@/components/custom/followUpTable'
import {getFollowUps} from '@/dal/followUps'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {mapFollowUp} from '@/extra/followUps'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {prismaClient} from '@/dal/prismaClient'
import {getFollowUpTargetOptions} from '@/extra/followUpTargetOptions'

export default async function FollowUpsPage() {
  const [followUpsFromDAL, roleLevels, profile, statuses, urgencyTypes, followUpTypes, employees, targetOptions] =
    await Promise.all([
      getFollowUps(),
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
      prismaClient.followUpType.findMany({
        where: {deleted: false},
        orderBy: {name: 'asc'},
        select: {id: true, name: true},
      }),
      prismaClient.employee.findMany({
        where: {deleted: false},
        orderBy: [{firstName: 'asc'}, {lastName: 'asc'}],
        select: {id: true, firstName: true, lastName: true},
      }),
      getFollowUpTargetOptions(prismaClient),
    ])

  const currentUserRole = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.Role.name ?? ''
  const currentUserLevel = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.SubRole.level ?? 0
  const currentUserRoleLevelId = profile.roleLevelId ?? ''
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  const allFollowUps = followUpsFromDAL.map(mapFollowUp)
  const followUps = isAdmin
    ? allFollowUps
    : allFollowUps.filter(f => {
        const rows = f.visibilityForRoles
        if (rows.length === 0) return true
        const myRow = rows.find(r => r.roleLevelId === currentUserRoleLevelId)
        return myRow?.visible ?? false
      })

  const roleLevelOptions = mapRoleLevelOptions(roleLevels)
  const defaultVisibleRoleNames = ['Database']
  const department = 'database'

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Follow-ups</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage follow-up records and assignments</p>
        </div>

        <FollowUpTable
          initialFollowUps={followUps}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          roleLevelOptions={roleLevelOptions}
          defaultVisibleRoleNames={defaultVisibleRoleNames}
          department={department}
          statusOptions={statuses}
          urgencyTypeOptions={urgencyTypes}
          followUpTypeOptions={followUpTypes}
          employeeOptions={employees.map(e => ({id: e.id, name: `${e.firstName} ${e.lastName}`}))}
          targetOptions={targetOptions}
        />
      </div>
    </main>
  )
}
