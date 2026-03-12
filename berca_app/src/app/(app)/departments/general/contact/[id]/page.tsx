import {ContactDetail} from '@/components/custom/contactDetail'
import {getContactDetail} from '@/dal/contacts'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {mapContactDetail} from '@/extra/contacts'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {prismaClient} from '@/dal/prismaClient'
import {notFound} from 'next/navigation'

interface ContactDetailPageProps {
  params: Promise<{id: string}>
}

export default async function ContactDetailPage({params}: ContactDetailPageProps) {
  const {id} = await params

  const [contactFromDAL, roleLevels, profile, functions, departmentExterns, titles, companies] = await Promise.all([
    getContactDetail(id).catch(() => null),
    getAllRoleLevels(),
    getSessionProfileFromCookieOrThrow(),
    prismaClient.function.findMany({orderBy: {name: 'asc'}, select: {id: true, name: true}}),
    prismaClient.departmentExtern.findMany({orderBy: {name: 'asc'}, select: {id: true, name: true}}),
    prismaClient.title.findMany({orderBy: {name: 'asc'}, select: {id: true, name: true}}),
    prismaClient.company.findMany({where: {deleted: false}, orderBy: {name: 'asc'}, select: {id: true, name: true}}),
  ])

  if (!contactFromDAL) notFound()

  const contact = mapContactDetail(contactFromDAL)
  const roleLevelOptions = mapRoleLevelOptions(roleLevels)

  const currentUserRole = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.Role.name ?? ''
  const currentUserLevel = profile.RoleLevel_Employee_roleLevelIdToRoleLevel?.SubRole.level ?? 0

  const defaultVisibleRoleNames = ['General']
  const department = 'general'

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <ContactDetail
          contact={contact}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          roleLevelOptions={roleLevelOptions}
          defaultVisibleRoleNames={defaultVisibleRoleNames}
          functionOptions={functions}
          departmentExternOptions={departmentExterns}
          titleOptions={titles}
          companyOptions={companies}
          department={department}
        />
      </div>
    </main>
  )
}
