import {notFound} from 'next/navigation'
import {getProjectBOMById, getMaterialOptions, getProjectBOMs} from '@/dal/projectBoms'
import {mapProjectBOM} from '@/extra/projectBom'
import {ProjectBOMDetail} from '@/components/custom/projectBomDetail'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {getProjectById} from '@/dal/projects'

interface PageProps {
  params: Promise<{departmentId: string; projectBomId: string}>
}

export default async function ProjectBOMDetailPage({params}: PageProps) {
  const {departmentId, projectBomId} = await params

  const [department, bomRaw, allBomsRaw, materialOptions, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getProjectBOMById(projectBomId).catch(() => null),
    getProjectBOMs(),
    getMaterialOptions(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>
  if (!bomRaw) notFound()

  const bom = mapProjectBOM(bomRaw)
  const allBOMs = allBomsRaw.map(r => mapProjectBOM(r))
  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const project = bomRaw.Project

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <ProjectBOMDetail
          bom={bom}
          materialOptions={materialOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          currentUserId={profile.id}
          departmentId={departmentId}
          project={project}
          allBOMs={allBOMs}
        />
      </div>
    </main>
  )
}
