import {TrainingStandardTable} from '@/components/custom/trainingStandardTable'
import {getTrainingStandards, getCertificates} from '@/dal/training'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {mapTrainingStandard, mapCertificate} from '../../../../../mapper/training'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function TrainingStandardPage({params}: PageProps) {
  const {departmentId} = await params

  const [department, standardsFromDAL, certificatesFromDAL, roleLevels, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getTrainingStandards(),
    getCertificates(),
    getAllRoleLevels(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const currentUserRoleLevelIds = profile.RoleLevelEmployee.map(rle => rle.RoleLevel.id)
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  const allStandards = standardsFromDAL.map(mapTrainingStandard)
  const standards = isAdmin
    ? allStandards
    : allStandards.filter(s => {
        const rows = s.visibilityForRoles
        if (rows.length === 0) return true
        const myRow = rows.find(r => currentUserRoleLevelIds.includes(r.roleLevelId))
        return myRow?.visible ?? false
      })

  const certificateOptions = certificatesFromDAL
    .filter(c => !c.deleted)
    .map(mapCertificate)
    .map(c => ({id: c.id, name: c.descriptionShort ?? c.description ?? c.id}))

  const roleLevelOptions = mapRoleLevelOptions(roleLevels)
  const defaultVisibleRoleNames = [department.name]

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Training Standards</h1>
          <p className="mt-1 text-sm text-muted-foreground">Define and maintain training course standards</p>
        </div>
        <TrainingStandardTable
          initialStandards={standards}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          roleLevelOptions={roleLevelOptions}
          defaultVisibleRoleNames={defaultVisibleRoleNames}
          departmentId={departmentId}
          certificateOptions={certificateOptions}
        />
      </div>
    </main>
  )
}
