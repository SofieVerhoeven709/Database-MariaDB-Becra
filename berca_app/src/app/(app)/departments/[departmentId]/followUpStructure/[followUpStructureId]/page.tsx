import {FollowUpStructureDetail} from '@/components/custom/followUpStructureDetail'
import {getFollowUpStructureDetail} from '@/dal/followUpStructures'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {mapFollowUpStructureDetail} from '@/extra/followUpStructures'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {prismaClient} from '@/dal/prismaClient'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {notFound} from 'next/navigation'
import camelCase from 'lodash/camelCase'

interface PageProps {
  params: Promise<{departmentId: string; followUpStructureId: string}>
}

export default async function FollowUpStructureDetailPage({params}: PageProps) {
  const {departmentId, followUpStructureId} = await params

  const [department, structureFromDAL, roleLevels, profile, statuses, urgencyTypes, employees, contacts] =
    await Promise.all([
      getDepartmentById(departmentId),
      getFollowUpStructureDetail(followUpStructureId).catch(() => null),
      getAllRoleLevels(),
      getSessionProfileFromCookieOrThrow(),
      prismaClient.status.findMany({where: {deleted: false}, orderBy: {name: 'asc'}, select: {id: true, name: true}}),
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

  if (!department) return <p>Department not found</p>
  if (!structureFromDAL) notFound()

  const structure = mapFollowUpStructureDetail(structureFromDAL)
  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const roleLevelOptions = mapRoleLevelOptions(roleLevels)
  const defaultVisibleRoleNames = [department.name]
  const employeeOptions = employees.map(e => ({id: e.id, name: `${e.firstName} ${e.lastName}`}))
  const contactOptions = contacts.map(c => ({id: c.id, name: `${c.firstName} ${c.lastName}`}))
  const departmentSlug = camelCase(department.name)

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
          employeeOptions={employeeOptions}
          contactOptions={contactOptions}
          department={departmentSlug}
        />
      </div>
    </main>
  )
}
