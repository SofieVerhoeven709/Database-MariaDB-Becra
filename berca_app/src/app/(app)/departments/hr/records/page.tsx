import {EmployeeTable} from '@/components/custom/employeeTable'
import {getEmployees} from '@/dal/employees'
import {mapEmployee} from '@/extra/employees'
import {getTitles} from '@/dal/titles'
import {getRoleLevels} from '@/dal/roleLevel'

export default async function RecordPage() {
  // Fetch employees, roles, and titles
  const [employeesFromDAL, roleLevels, titles] = await Promise.all([getEmployees(), getRoleLevels(), getTitles()])

  // Map employees to include roleName/titleName
  const employees = employeesFromDAL.map(mapEmployee)

  // Prepare select options for forms
  const roleOptions = roleLevels!
    .filter(t => !t.deleted)
    .map(r => ({
      id: r.id,
      name: `${r.Role.name.replace(' Role', '')} / ${r.SubRole.name}`,
    }))

  const titleOptions = titles!
    .filter(t => !t.deleted)
    .map(t => ({
      id: t.id,
      name: t.name,
    }))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Employees</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage employee records and onboarding</p>
        </div>

        <EmployeeTable initialEmployees={employees} roleOptions={roleOptions} titleOptions={titleOptions} />
      </div>
    </main>
  )
}
