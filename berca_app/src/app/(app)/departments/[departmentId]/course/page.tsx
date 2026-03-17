import {TrainingTable} from '@/components/custom/trainingTable'
import {getTrainings, getTrainingStandards} from '@/dal/training'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {mapTraining, mapTrainingStandard} from '@/extra/training'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {prismaClient} from '@/dal/prismaClient'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function TrainingCoursePage({params}: PageProps) {
  const {departmentId} = await params

  const [department, trainingsFromDAL, standardsFromDAL, roleLevels, profile, workOrders] = await Promise.all([
    getDepartmentById(departmentId),
    getTrainings(),
    getTrainingStandards(),
    getAllRoleLevels(),
    getSessionProfileFromCookieOrThrow(),
    prismaClient.workOrder.findMany({
      where: {deleted: false},
      orderBy: {workOrderNumber: 'asc'},
      select: {id: true, workOrderNumber: true},
    }),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const currentUserRoleLevelIds = profile.RoleLevelEmployee.map(rle => rle.RoleLevel.id)
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  const allTrainings = trainingsFromDAL.map(mapTraining)
  const trainings = isAdmin
    ? allTrainings
    : allTrainings.filter(t => {
        const rows = t.visibilityForRoles
        if (rows.length === 0) return true
        const myRow = rows.find(r => currentUserRoleLevelIds.includes(r.roleLevelId))
        return myRow?.visible ?? false
      })

  const standardOptions = standardsFromDAL
    .filter(s => !s.deleted)
    .map(mapTrainingStandard)
    .map(s => ({id: s.id, name: s.descriptionShort ?? s.description ?? s.id}))

  const workOrderOptions = workOrders.map(w => ({id: w.id, name: w.workOrderNumber ?? w.id}))

  const roleLevelOptions = mapRoleLevelOptions(roleLevels)
  const defaultVisibleRoleNames = [department.name]

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Training Courses</h1>
          <p className="mt-1 text-sm text-muted-foreground">Organize and manage internal training programs</p>
        </div>
        <TrainingTable
          initialTrainings={trainings}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          roleLevelOptions={roleLevelOptions}
          defaultVisibleRoleNames={defaultVisibleRoleNames}
          departmentId={departmentId}
          standardOptions={standardOptions}
          workOrderOptions={workOrderOptions}
        />
      </div>
    </main>
  )
}
