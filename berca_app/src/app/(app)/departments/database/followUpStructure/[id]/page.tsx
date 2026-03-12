import {FollowUpStructureDetail} from '@/components/custom/followUpStructureDetail'
import {getFollowUpStructureDetail} from '@/dal/followUpStructures'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {mapFollowUpStructureDetail} from '@/extra/followUpStructures'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {prismaClient} from '@/dal/prismaClient'
import {notFound} from 'next/navigation'

interface FollowUpStructureDetailPageProps {
  params: Promise<{id: string}>
}

export default async function FollowUpStructureDetailPage({params}: FollowUpStructureDetailPageProps) {
  const {id} = await params

  const [structureFromDAL, roleLevels, profile, statuses, urgencyTypes, employees, contacts] = await Promise.all([
    getFollowUpStructureDetail(id).catch(() => null),
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
  ])

  if (!structureFromDAL) notFound()

  const structure = mapFollowUpStructureDetail(structureFromDAL)
  const roleLevelOptions = mapRoleLevelOptions(roleLevels)

  const currentUserRole = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.Role.name ?? ''
  const currentUserLevel = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.SubRole.level ?? 0

  const defaultVisibleRoleNames = ['Database']
  const department = 'database'

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <FollowUpStructureDetail
          structure={structure}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          roleLevelOptions={roleLevelOptions}
          defaultVisibleRoleNames={defaultVisibleRoleNames}
          statusOptions={statuses}
          urgencyTypeOptions={urgencyTypes}
          employeeOptions={employees.map(e => ({id: e.id, name: `${e.firstName} ${e.lastName}`}))}
          contactOptions={contacts.map(c => ({id: c.id, name: `${c.firstName} ${c.lastName}`}))}
          department={department}
        />
      </div>
    </main>
  )
}
