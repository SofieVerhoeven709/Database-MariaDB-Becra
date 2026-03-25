import {SerialTrackedTable} from '@/components/custom/serialTrackedTable'
import {getSerialTracked} from '@/dal/materialSerialTracked'
import {getProjects} from '@/dal/projects'
import {getCompanies} from '@/dal/companies'
import {getMaterialGroups} from '@/dal/materials'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {mapMaterialSerialTracked} from '@/extra/serialTracked'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function SerialTrackedPage({params}: PageProps) {
  const {departmentId} = await params

  const [department, serialTrackedFromDAL, companiesFromDAL, projectsFromDAL, materialGroupsFromDAL, profile] =
    await Promise.all([
      getDepartmentById(departmentId),
      getSerialTracked(),
      getCompanies(),
      getProjects(),
      getMaterialGroups(),
      getSessionProfileFromCookieOrThrow(),
    ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)

  const serialTracked = serialTrackedFromDAL.map(mapMaterialSerialTracked)

  const companyOptions = companiesFromDAL.map(c => ({
    id: c.id,
    name: c.name,
  }))

  const projectOptions = projectsFromDAL.map(p => ({
    id: p.id,
    name: `${p.projectNumber} — ${p.projectName}`,
  }))

  const materialGroupOptions = materialGroupsFromDAL.map(mg => ({
    id: mg.id,
    name: [mg.groupA, mg.groupB, mg.groupC, mg.groupD].filter(Boolean).join(' / '),
  }))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Serial Tracked</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage serial tracked items</p>
        </div>

        <SerialTrackedTable
          initialSerialTracked={serialTracked}
          companyOptions={companyOptions}
          projectOptions={projectOptions}
          materialGroupOptions={materialGroupOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          departmentId={departmentId}
        />
      </div>
    </main>
  )
}
