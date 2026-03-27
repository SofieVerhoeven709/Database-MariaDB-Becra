import {TrainingDetail} from '@/components/custom/trainingDetail'
import {getTrainingDetail, getTrainingStandards} from '@/dal/training'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {mapTrainingDetail, mapTrainingStandard} from '@/extra/training'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {prismaClient} from '@/dal/prismaClient'
import {notFound} from 'next/navigation'

interface PageProps {
  params: Promise<{departmentId: string; trainingId: string}>
}

export default async function TrainingDetailPage({params}: PageProps) {
  const {departmentId, trainingId} = await params

  const [department, trainingFromDAL, standardsFromDAL, roleLevels, profile, workOrders, contacts] = await Promise.all([
    getDepartmentById(departmentId),
    getTrainingDetail(trainingId).catch(() => null),
    getTrainingStandards(),
    getAllRoleLevels(),
    getSessionProfileFromCookieOrThrow(),
    prismaClient.workOrder.findMany({
      where: {deleted: false},
      orderBy: {workOrderNumber: 'asc'},
      select: {id: true, workOrderNumber: true},
    }),
    prismaClient.contact.findMany({
      where: {deleted: false},
      orderBy: [{lastName: 'asc'}, {firstName: 'asc'}],
      select: {id: true, firstName: true, lastName: true},
    }),
  ])

  if (!department) return <p>Department not found</p>
  if (!trainingFromDAL) notFound()

  const training = mapTrainingDetail(trainingFromDAL)
  const standardOptions = standardsFromDAL
    .filter(s => !s.deleted)
    .map(mapTrainingStandard)
    .map(s => ({id: s.id, name: s.descriptionShort ?? s.description ?? s.id}))

  const workOrderOptions = workOrders.map(w => ({id: w.id, name: w.workOrderNumber ?? w.id}))
  const contactOptions = contacts.map(c => ({id: c.id, name: `${c.lastName} ${c.firstName}`}))

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const roleLevelOptions = mapRoleLevelOptions(roleLevels)
  const defaultVisibleRoleNames = [department.name]

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <TrainingDetail
          training={training}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          roleLevelOptions={roleLevelOptions}
          defaultVisibleRoleNames={defaultVisibleRoleNames}
          departmentId={departmentId}
          standardOptions={standardOptions}
          workOrderOptions={workOrderOptions}
          contactOptions={contactOptions}
        />
      </div>
    </main>
  )
}
