import {FollowUpDetail} from '@/components/custom/followUpDetail'
import {getFollowUpDetail} from '@/dal/followUps'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {mapFollowUpDetail} from '@/extra/followUps'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {prismaClient} from '@/dal/prismaClient'
import {notFound} from 'next/navigation'

interface FollowUpDetailPageProps {
  params: Promise<{id: string}>
}

export default async function FollowUpDetailPage({params}: FollowUpDetailPageProps) {
  const {id} = await params

  const [followUpFromDAL, roleLevels, profile, statuses, urgencyTypes, followUpTypes, employees, contacts] =
    await Promise.all([
      getFollowUpDetail(id).catch(() => null),
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
      prismaClient.contact.findMany({
        where: {deleted: false},
        orderBy: [{firstName: 'asc'}, {lastName: 'asc'}],
        select: {id: true, firstName: true, lastName: true},
      }),
    ])

  if (!followUpFromDAL) notFound()

  const followUp = mapFollowUpDetail(followUpFromDAL)
  const roleLevelOptions = mapRoleLevelOptions(roleLevels)

  const currentUserRole = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.Role.name ?? ''
  const currentUserLevel = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.SubRole.level ?? 0

  const defaultVisibleRoleNames = ['Purchasing']
  const department = 'purchasing'

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <FollowUpDetail
          followUp={followUp}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          roleLevelOptions={roleLevelOptions}
          defaultVisibleRoleNames={defaultVisibleRoleNames}
          statusOptions={statuses}
          urgencyTypeOptions={urgencyTypes}
          followUpTypeOptions={followUpTypes}
          employeeOptions={employees.map(e => ({id: e.id, name: `${e.firstName} ${e.lastName}`}))}
          contactOptions={contacts.map(c => ({id: c.id, name: `${c.firstName} ${c.lastName}`}))}
          department={department}
        />
      </div>
    </main>
  )
}
