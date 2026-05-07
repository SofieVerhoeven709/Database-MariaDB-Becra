import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {SerialTrackedTable} from '@/components/custom/serialTrackedTable'
import {WorkOrderTable} from '@/components/custom/workOrderTable'
import {getDepartmentById} from '@/dal/department'
import {getSerialTracked} from '@/dal/materialSerialTracked'
import {getWorkOrders} from '@/dal/workOrders'
import {getCompanies} from '@/dal/companies'
import {getProjects} from '@/dal/projects'
import {getMaterialGroups, getMaterials} from '@/dal/materials'
import {getWarehousePlaces} from '@/dal/warehousePlace'
import {getEmployees} from '@/dal/employees'
import {getSerialTrackedStructuresBySerialTrackedIds} from '@/dal/materialSerialTrackedStructure'
import {mapMaterialSerialTracked} from '../../../../../mapper/serialTracked'
import {mapWorkOrder} from '../../../../../mapper/workOrders'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {AppSettings} from '@/constants'

interface PageProps {
  params: Promise<{departmentId: string}>
}

type MaintenanceInspectionItem = {
  id: string
  beNumber: string | null
  shortDescription: string | null
  quantityRequired: number | null
}

export default async function MaintenancePage({params}: PageProps) {
  try {
    const {departmentId} = await params

    const [
      department,
      serialTrackedFromDAL,
      workOrdersFromDAL,
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
      getWorkOrders(),
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

    const serialTracked = serialTrackedFromDAL.map(mapMaterialSerialTracked)
    const maintenanceSerialTracked = serialTracked.filter(
      item => item.lastInspectionDate || item.nextInspectionDate || item.inspectionIntervalValue,
    )

    const structureRows = await getSerialTrackedStructuresBySerialTrackedIds(
      maintenanceSerialTracked.map(item => item.id),
    )
    const inspectionItemsBySerialTrackedId = structureRows.reduce<Record<string, MaintenanceInspectionItem[]>>(
      (acc, row) => {
        if (!acc[row.serialTrackedId]) acc[row.serialTrackedId] = []
        acc[row.serialTrackedId].push({
          id: row.id,
          beNumber: row.beNumber,
          shortDescription: row.shortDescription,
          quantityRequired: row.quantityRequired,
        })
        return acc
      },
      {},
    )

    const workOrders = workOrdersFromDAL.map(mapWorkOrder)

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

    const materialOptions = materialsFromDAL.map((m: any) => ({
      id: m.id,
      beNumber: m.beNumber ?? '',
      brandName: m.brandName ?? '',
      management: m.management ?? '',
      brandOrderNr: m.brandOrderNr ?? '',
      shortDescription: m.shortDescription ?? '',
      longDescription: m.longDescription ?? '',
      materialGroupId: m.materialGroupIdA ?? '',
    }))

    const managementEmployeeOptions = employeesFromDAL
      .filter(employee => !employee.deleted)
      .map(employee => ({
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`.trim(),
      }))

    const inspectionWarningDays = AppSettings.inspectionReminderMonths * 30

    return (
      <main className="px-6 py-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-lg font-semibold text-foreground">Maintenance</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Equipment inspection planning comes from Serial Tracked, maintenance execution comes from Work Orders.
            </p>
          </div>

          <Tabs defaultValue="equipment">
            <TabsList>
              <TabsTrigger value="equipment">Equipment Inspections</TabsTrigger>
              <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
            </TabsList>

            <TabsContent value="equipment" className="mt-4">
              <SerialTrackedTable
                initialSerialTracked={maintenanceSerialTracked}
                companyOptions={companyOptions}
                projectOptions={projectOptions}
                materialGroupOptions={materialGroupOptions}
                warehousePlaceOptions={warehousePlaceOptions}
                currentUserRole={currentUserRole}
                currentUserLevel={currentUserLevel}
                departmentId={departmentId}
                materialOptions={materialOptions}
                managementEmployeeOptions={managementEmployeeOptions}
                inspectionItemsBySerialTrackedId={inspectionItemsBySerialTrackedId}
                inspectionWarningDays={inspectionWarningDays}
              />
            </TabsContent>

            <TabsContent value="work-orders" className="mt-4">
              <WorkOrderTable
                initialWorkOrders={workOrders}
                projectOptions={projectOptions}
                currentUserRole={currentUserRole}
                currentUserLevel={currentUserLevel}
                departmentId={departmentId}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    )
  } catch (error) {
    console.error('Failed to render maintenance page:', error)
    return <p className="px-6 py-8 text-sm text-muted-foreground">Could not load maintenance data.</p>
  }
}
