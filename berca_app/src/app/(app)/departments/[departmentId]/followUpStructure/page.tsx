import {FollowUpStructureTable} from '@/components/custom/followUpStructureTable'
import {getFollowUpStructures} from '@/dal/followUpStructures'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {mapFollowUpStructure} from '@/extra/followUpStructures'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {prismaClient} from '@/dal/prismaClient'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import camelCase from 'lodash/camelCase'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function FollowUpStructuresPage({params}: PageProps) {
  const {departmentId} = await params

  const [department, structuresFromDAL, roleLevels, profile, statuses, urgencyTypes, employees, contacts, followUps] =
    await Promise.all([
      getDepartmentById(departmentId),
      getFollowUpStructures(),
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
      prismaClient.followUp.findMany({
        where: {deleted: false},
        orderBy: {createdAt: 'desc'},
        select: {id: true, activityDescription: true},
      }),
    ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
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
  const defaultVisibleRoleNames = [department.name]
  const employeeOptions = employees.map(e => ({id: e.id, name: `${e.firstName} ${e.lastName}`}))
  const contactOptions = contacts.map(c => ({id: c.id, name: `${c.firstName} ${c.lastName}`}))
  const departmentSlug = camelCase(department.name)
  const followUpOptions = followUps.map(f => ({
    id: f.id,
    name: f.activityDescription
      ? f.activityDescription.slice(0, 60) + (f.activityDescription.length > 60 ? '…' : '')
      : `Follow-up (${f.id.slice(0, 8)})`,
  }))

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
          department={departmentSlug}
          statusOptions={statuses}
          urgencyTypeOptions={urgencyTypes}
          employeeOptions={employeeOptions}
          contactOptions={contactOptions}
          followUpOptions={followUpOptions}
        />
      </div>
    </main>
  )
}
