import {TrainingStandardDetail} from '@/components/custom/trainingStandardDetail'
import {getTrainingStandardDetail, getCertificates} from '@/dal/training'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {mapTrainingStandardDetail, mapCertificate} from '../../../../../../mapper/training'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {notFound} from 'next/navigation'

interface PageProps {
  params: Promise<{departmentId: string; standardId: string}>
}

export default async function TrainingStandardDetailPage({params}: PageProps) {
  const {departmentId, standardId} = await params

  const [department, standardFromDAL, certificatesFromDAL, roleLevels, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getTrainingStandardDetail(standardId).catch(() => null),
    getCertificates(),
    getAllRoleLevels(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>
  if (!standardFromDAL) notFound()

  const standard = mapTrainingStandardDetail(standardFromDAL)
  const certificateOptions = certificatesFromDAL
    .filter(c => !c.deleted)
    .map(mapCertificate)
    .map(c => ({id: c.id, name: c.descriptionShort ?? c.description ?? c.id}))

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const roleLevelOptions = mapRoleLevelOptions(roleLevels)
  const defaultVisibleRoleNames = [department.name]

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <TrainingStandardDetail
          standard={standard}
          certificateOptions={certificateOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          roleLevelOptions={roleLevelOptions}
          defaultVisibleRoleNames={defaultVisibleRoleNames}
          departmentId={departmentId}
        />
      </div>
    </main>
  )
}
