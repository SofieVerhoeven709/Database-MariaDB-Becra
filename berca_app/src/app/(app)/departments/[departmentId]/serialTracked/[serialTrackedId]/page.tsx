import {getSerialTrackedById} from '@/dal/materialSerialTracked'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {notFound} from 'next/navigation'

import {getCompanies} from '@/dal/companies'
import {getProjects} from '@/dal/projects'
import {getMaterialGroups} from '@/dal/materials'

import {MaterialSerialTrackedDetail} from '@/components/custom/serialTrackedDetail'

interface PageProps {
  params: Promise<{departmentId: string; serialTrackedId: string}>
}

export default async function SerialTrackedDetailPage({params}: PageProps) {
  const {departmentId, serialTrackedId} = await params

  const [department, item, profile, companiesFromDAL, projectsFromDAL, materialGroupsFromDAL] = await Promise.all([
    getDepartmentById(departmentId),
    getSerialTrackedById(serialTrackedId).catch(() => null),
    getSessionProfileFromCookieOrThrow(),
    getCompanies(),
    getProjects(),
    getMaterialGroups(),
  ])

  if (!department) return <p>Department not found</p>
  if (!item) notFound()

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)

  const companyOptions = companiesFromDAL.map(company => ({
    id: company.id,
    name: company.name,
  }))

  const projectOptions = projectsFromDAL.map(project => ({
    id: project.id,
    name: `${project.projectNumber} — ${project.projectName}`,
  }))

  const materialGroupOptions = materialGroupsFromDAL.map(mg => ({
    id: mg.id,
    name: [mg.groupA, mg.groupB, mg.groupC, mg.groupD].filter(Boolean).join(' / '),
  }))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <MaterialSerialTrackedDetail
          item={item}
          companies={companyOptions}
          projects={projectOptions}
          materialGroups={materialGroupOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
        />
      </div>
    </main>
  )
}
