import {CertificateTable} from '@/components/custom/certificateTable'
import {getCertificates, getCertificateTypes} from '@/dal/training'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {mapCertificate, mapCertificateType} from '@/mapper/training'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapRoleLevelOptions} from '@/types/roleLevel'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function CertificateTrainingPage({params}: PageProps) {
  const {departmentId} = await params

  const [department, certificatesFromDAL, certificateTypesFromDAL, roleLevels, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getCertificates(),
    getCertificateTypes(),
    getAllRoleLevels(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const currentUserRoleLevelIds = profile.RoleLevelEmployee.map(rle => rle.RoleLevel.id)
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  const allCertificates = certificatesFromDAL.map(mapCertificate)
  const certificates = isAdmin
    ? allCertificates
    : allCertificates.filter(c => {
        const rows = c.visibilityForRoles
        if (rows.length === 0) return true
        const myRow = rows.find(r => currentUserRoleLevelIds.includes(r.roleLevelId))
        return myRow?.visible ?? false
      })

  const certificateTypes = certificateTypesFromDAL.map(mapCertificateType)
  const roleLevelOptions = mapRoleLevelOptions(roleLevels)
  const defaultVisibleRoleNames = [department.name]

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Training Certificates</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage training certificates and their types</p>
        </div>
        <CertificateTable
          initialCertificates={certificates}
          initialCertificateTypes={certificateTypes}
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
