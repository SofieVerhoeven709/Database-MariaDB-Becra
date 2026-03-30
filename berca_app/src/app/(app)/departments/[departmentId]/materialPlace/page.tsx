import {getMaterialPlaces} from '@/dal/materialPlace'
import {getEmployees} from '@/dal/employees'
import {MaterialPlaceTable} from '@/components/custom/materialPlaceTable'
import {mapMaterialPlace} from '@/extra/materialPlace'

export default async function MaterialPlacePage() {
  const [places, employees] = await Promise.all([getMaterialPlaces({includeDeleted: true}), getEmployees()])

  const employeeOptions = employees
    .filter(employee => !employee.deleted)
    .map(employee => ({id: employee.id, name: `${employee.firstName} ${employee.lastName}`}))
    .sort((a, b) => a.name.localeCompare(b.name))

  const employeeNameById = new Map(employeeOptions.map(employee => [employee.id, employee.name]))
  const mappedPlaces = places.map(place => {
    const mapped = mapMaterialPlace(place)
    return {
      ...mapped,
      storageEmployeeName: mapped.storageEmployeeId ? (employeeNameById.get(mapped.storageEmployeeId) ?? null) : null,
    }
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Material Places</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Assign and maintain material storage locations across warehouse shelves and layers.
        </p>
      </div>
      <MaterialPlaceTable initialItems={mappedPlaces} employees={employeeOptions} />
    </div>
  )
}
