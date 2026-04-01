import {notFound} from 'next/navigation'
import {getProjectBOMById, getMaterialOptions} from '@/dal/projectBOM'
import {mapProjectBOM} from '@/extra/projectBOM'
import {ProjectBOMDetail} from '@/components/custom/projectBOMDetail'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface PageProps {
  params: Promise<{departmentId: string; projectBomId: string}>
}

export default async function ProjectBOMDetailPage({params}: PageProps) {
  const {departmentId, projectBomId} = await params

  const [department, bomRaw, materialOptions, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getProjectBOMById(projectBomId).catch(() => null),
    getMaterialOptions(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>
  if (!bomRaw) notFound()

  const bom = mapProjectBOM(bomRaw)
  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <ProjectBOMDetail
          bom={bom}
          materialOptions={materialOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          departmentId={departmentId}
        />
      </div>
    </main>
  )
}
