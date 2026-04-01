import {getSerialTrackedById} from '@/dal/materialSerialTracked'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {notFound} from 'next/navigation'

import {getCompanies} from '@/dal/companies'
import {getProjects} from '@/dal/projects'
import {getMaterials, getMaterialGroups} from '@/dal/materials'
import {getWarehousePlaces} from '@/dal/warehousePlace'

import {MaterialSerialTrackedDetail} from '@/components/custom/serialTrackedDetail'

interface PageProps {
  params: Promise<{departmentId: string; serialTrackedId: string}>
}

export default async function SerialTrackedDetailPage({params}: PageProps) {

  const {departmentId, serialTrackedId} = await params

  const itemPromise = typeof serialTrackedId === 'string'
    ? getSerialTrackedById(serialTrackedId).catch(() => null)
    : Promise.resolve(null)

  const [department, item, profile, companiesFromDAL, projectsFromDAL, materialGroupsFromDAL, materialsFromDAL, warehousePlacesFromDAL] = await Promise.all([
    getDepartmentById(departmentId),
    itemPromise,
    getSessionProfileFromCookieOrThrow(),
    getCompanies(),
    getProjects(),
    getMaterialGroups(),
    getMaterials(),
    getWarehousePlaces(),
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

  const warehousePlaceOptions = warehousePlacesFromDAL.map(place => ({
    id: place.id,
    label: [place.abbreviation, place.place, place.shelf, place.column, place.layer, place.layerPlace]
      .filter(Boolean)
      .join(' / '),
  }))

  // Map materials for dialog
  const materialOptions = materialsFromDAL.map(m => ({
    id: m.id,
    beNumber: m.beNumber,
    brandName: m.brandName,
    brandOrderNr: m.brandOrderNr,
    shortDescription: m.shortDescription,
    longDescription: m.longDescription,
    materialGroupId: m.materialGroupIdA, // or combine as needed
  }))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <MaterialSerialTrackedDetail
          item={item}
          companies={companyOptions}
          projects={projectOptions}
          materialGroups={materialGroupOptions}
          warehousePlaces={warehousePlaceOptions}
          materialOptions={materialOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
        />
      </div>
    </main>
  )
}
