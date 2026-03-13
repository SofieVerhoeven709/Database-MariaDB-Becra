import {ContactDetail} from '@/components/custom/contactDetail'
import {getContactDetail} from '@/dal/contacts'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {mapContactDetail} from '@/extra/contacts'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {prismaClient} from '@/dal/prismaClient'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {notFound} from 'next/navigation'
import camelCase from 'lodash/camelCase'

interface PageProps {
  params: Promise<{departmentId: string; contactId: string}>
}

export default async function ContactDetailPage({params}: PageProps) {
  const {departmentId, contactId} = await params

  const [department, contactFromDAL, roleLevels, profile, functions, departmentExterns, titles, companies] =
    await Promise.all([
      getDepartmentById(departmentId),
      getContactDetail(contactId).catch(() => null),
      getAllRoleLevels(),
      getSessionProfileFromCookieOrThrow(),
      prismaClient.function.findMany({orderBy: {name: 'asc'}, select: {id: true, name: true}}),
      prismaClient.departmentExtern.findMany({orderBy: {name: 'asc'}, select: {id: true, name: true}}),
      prismaClient.title.findMany({orderBy: {name: 'asc'}, select: {id: true, name: true}}),
      prismaClient.company.findMany({where: {deleted: false}, orderBy: {name: 'asc'}, select: {id: true, name: true}}),
    ])

  if (!department) return <p>Department not found</p>
  if (!contactFromDAL) notFound()

  const contact = mapContactDetail(contactFromDAL)
  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const roleLevelOptions = mapRoleLevelOptions(roleLevels)
  const defaultVisibleRoleNames = [department.name]
  const departmentSlug = camelCase(department.name)

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
          department={departmentSlug}
        />
      </div>
    </main>
  )
}
