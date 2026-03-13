import {ContactTable} from '@/components/custom/contactTable'
import {getContacts} from '@/dal/contacts'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {mapContact} from '@/extra/contacts'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {prismaClient} from '@/dal/prismaClient'

export default async function ContactsPage() {
  const [contactsFromDAL, roleLevels, profile, functions, departmentExterns, titles, companies] = await Promise.all([
    getContacts(),
    getAllRoleLevels(),
    getSessionProfileFromCookieOrThrow(),
    prismaClient.function.findMany({orderBy: {name: 'asc'}, select: {id: true, name: true}}),
    prismaClient.departmentExtern.findMany({orderBy: {name: 'asc'}, select: {id: true, name: true}}),
    prismaClient.title.findMany({orderBy: {name: 'asc'}, select: {id: true, name: true}}),
    prismaClient.company.findMany({where: {deleted: false}, orderBy: {name: 'asc'}, select: {id: true, name: true}}),
  ])

  const currentUserRole = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.Role.name ?? ''
  const currentUserLevel = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.SubRole.level ?? 0
  const currentUserRoleLevelId = profile.roleLevelId ?? ''
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  const allContacts = contactsFromDAL.map(mapContact)
  const contacts = isAdmin
    ? allContacts
    : allContacts.filter(c => {
        const rows = c.visibilityForRoles
        if (rows.length === 0) return true
        const myRow = rows.find(r => r.roleLevelId === currentUserRoleLevelId)
        return myRow?.visible ?? false
      })

  const roleLevelOptions = mapRoleLevelOptions(roleLevels)
  const defaultVisibleRoleNames = ['Management']
  const department = 'management'

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
          department={department}
          functionOptions={functions}
          departmentExternOptions={departmentExterns}
          titleOptions={titles}
          companyOptions={companies}
        />
      </div>
    </main>
  )
}
