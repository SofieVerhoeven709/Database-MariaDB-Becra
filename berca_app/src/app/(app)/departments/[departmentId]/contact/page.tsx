import {ContactTable} from '@/components/custom/contactTable'
import {getContacts} from '@/dal/contacts'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {mapContact} from '@/extra/contacts'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {prismaClient} from '@/dal/prismaClient'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function ContactsPage({params}: PageProps) {
  const {departmentId} = await params

  const [department, contactsFromDAL, roleLevels, profile, functions, departmentExterns, titles, companies] =
    await Promise.all([
      getDepartmentById(departmentId),
      getContacts(),
      getAllRoleLevels(),
      getSessionProfileFromCookieOrThrow(),
      prismaClient.function.findMany({orderBy: {name: 'asc'}, select: {id: true, name: true}}),
      prismaClient.departmentExtern.findMany({orderBy: {name: 'asc'}, select: {id: true, name: true}}),
      prismaClient.title.findMany({orderBy: {name: 'asc'}, select: {id: true, name: true}}),
      prismaClient.company.findMany({where: {deleted: false}, orderBy: {name: 'asc'}, select: {id: true, name: true}}),
    ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const currentUserRoleLevelIds = profile.RoleLevelEmployee.map(rle => rle.RoleLevel.id)
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  const allContacts = contactsFromDAL.map(mapContact)
  const contacts = isAdmin
    ? allContacts
    : allContacts.filter(c => {
        const rows = c.visibilityForRoles
        if (rows.length === 0) return true
        const myRow = rows.find(r => currentUserRoleLevelIds.includes(r.roleLevelId))
        return myRow?.visible ?? false
      })

  const roleLevelOptions = mapRoleLevelOptions(roleLevels)
  const defaultVisibleRoleNames = [department.name]

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Contacts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage contact records and relationships</p>
        </div>

        <ContactTable
          initialContacts={contacts}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          roleLevelOptions={roleLevelOptions}
          defaultVisibleRoleNames={defaultVisibleRoleNames}
          departmentId={departmentId}
          functionOptions={functions}
          departmentExternOptions={departmentExterns}
          titleOptions={titles}
          companyOptions={companies}
        />
      </div>
    </main>
  )
}
