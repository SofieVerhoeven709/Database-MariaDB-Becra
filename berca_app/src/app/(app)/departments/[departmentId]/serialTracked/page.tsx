import {SerialTrackedTable} from '@/components/custom/serialTrackedTable'
import {getSerialTracked} from '@/dal/materialSerialTracked'
import {getProjects} from '@/dal/projects'
import {getCompanies} from '@/dal/companies'
import {getMaterialGroups, getMaterials} from '@/dal/materials'
import {getWarehousePlaces} from '@/dal/warehousePlace'
import {getEmployees} from '@/dal/employees'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {mapMaterialSerialTracked} from '@/extra/serialTracked'
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/ui/tabs'
import {Table, TableHeader, TableRow, TableHead, TableBody, TableCell} from '@/components/ui/table'
import {getSerialTrackedStructuresBySerialTrackedIds} from '@/dal/materialSerialTrackedStructure'
import {AppSettings} from '@/constants'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function SerialTrackedPage({params}: PageProps) {
  try {
    const {departmentId} = await params

    const [
      department,
      serialTrackedFromDAL,
      companiesFromDAL,
      projectsFromDAL,
      materialGroupsFromDAL,
      materialsFromDAL,
      warehousePlacesFromDAL,
      employeesFromDAL,
      profile,
    ] = await Promise.all([
      getDepartmentById(departmentId),
      getSerialTracked(),
      getCompanies(),
      getProjects(),
      getMaterialGroups(),
      getMaterials(),
      getWarehousePlaces(),
      getEmployees(),
      getSessionProfileFromCookieOrThrow(),
    ])

    if (!department) return <p>Department not found</p>

    const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)

    const serialTracked = serialTrackedFromDAL.map((item: any) => ({
      ...mapMaterialSerialTracked(item),
      materialGroupIdA: item.materialGroupIdA ?? '',
      materialGroupIdB: item.materialGroupIdB ?? '',
      materialGroupIdC: item.materialGroupIdC ?? '',
      materialGroupIdD: item.materialGroupIdD ?? '',
    }))

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

    const warehousePlaceOptions = warehousePlacesFromDAL.map(place => ({
      id: place.id,
      label: [place.abbreviation, place.place, place.shelf, place.column, place.layer, place.layerPlace]
        .filter(Boolean)
        .join(' / '),
    }))

    const managementEmployeeOptions = employeesFromDAL
      .filter(employee => !employee.deleted)
      .map(employee => ({
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`.trim(),
      }))

    // Map materials to the shape expected by materialOptions, only include global materialGroupId
    const materialOptions = materialsFromDAL.map((m: any) => ({
      id: m.id,
      beNumber: m.beNumber ?? '',
      brandName: m.brandName ?? '',
      management: m.management ?? '',
      brandOrderNr: m.brandOrderNr ?? '',
      shortDescription: m.shortDescription ?? '',
      longDescription: m.longDescription ?? '',
      materialGroupId: m.materialGroupIdA ?? '', // Use materialGroupIdA
    }))

    const serialTrackedBeNumberById = new Map(serialTracked.map(item => [item.id, item.beNumber]))
    const structureRows = await getSerialTrackedStructuresBySerialTrackedIds(serialTracked.map(item => item.id))
    const flatStructures = structureRows.map(s => ({
      ...s,
      serialTrackedBeNumber: serialTrackedBeNumberById.get(s.serialTrackedId) ?? '-',
    }))

    const inspectionWarningDays = AppSettings.inspectionReminderMonths * 30

    return (
      <main className="px-6 py-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-lg font-semibold text-foreground">Serial Tracked</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage serial tracked items</p>
          </div>
          <Tabs defaultValue="serialTracked">
            <TabsList>
              <TabsTrigger value="serialTracked">Serial Tracked</TabsTrigger>
              <TabsTrigger value="structure">Structure</TabsTrigger>
            </TabsList>
            <TabsContent value="serialTracked">
              <SerialTrackedTable
                initialSerialTracked={serialTracked}
                companyOptions={companyOptions}
                projectOptions={projectOptions}
                materialGroupOptions={materialGroupOptions}
                warehousePlaceOptions={warehousePlaceOptions}
                currentUserRole={currentUserRole}
                currentUserLevel={currentUserLevel}
                departmentId={departmentId}
                materialOptions={materialOptions}
                managementEmployeeOptions={managementEmployeeOptions}
                inspectionWarningDays={inspectionWarningDays}
              />
            </TabsContent>
            <TabsContent value="structure">
              <div className="overflow-x-auto rounded-xl border border-border/60 bg-card p-4 mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial Tracked BE Number</TableHead>
                      <TableHead>Short Description</TableHead>
                      <TableHead>Long Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flatStructures.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No structure found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      flatStructures.map((s: any) => (
                        <TableRow key={s.id}>
                          <TableCell>{s.serialTrackedBeNumber ?? '-'}</TableCell>
                          <TableCell>{s.shortDescription ?? '-'}</TableCell>
                          <TableCell>{s.longDescription ?? '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    )
  } catch (error) {
    console.error('Failed to render serial tracked page:', error)
    return <p className="px-6 py-8 text-sm text-muted-foreground">Could not load serial tracked data.</p>
  }
}
