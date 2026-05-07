import {CertificateDetail} from '@/components/custom/certificateDetail'
import {getCertificateDetail, getCertificateTypes} from '@/dal/training'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {mapCertificateDetail, mapCertificateType} from '../../../../../../mapper/training'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {notFound} from 'next/navigation'

interface PageProps {
  params: Promise<{departmentId: string; certificateId: string}>
}

export default async function CertificateDetailPage({params}: PageProps) {
  const {departmentId, certificateId} = await params

  const [department, certificateFromDAL, certificateTypesFromDAL, roleLevels, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getCertificateDetail(certificateId).catch(() => null),
    getCertificateTypes(),
    getAllRoleLevels(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>
  if (!certificateFromDAL) notFound()

  const certificate = mapCertificateDetail(certificateFromDAL)
  const certificateTypes = certificateTypesFromDAL.map(mapCertificateType)
  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const roleLevelOptions = mapRoleLevelOptions(roleLevels)
  const defaultVisibleRoleNames = [department.name]

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <CertificateDetail
          certificate={certificate}
          certificateTypes={certificateTypes}
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
