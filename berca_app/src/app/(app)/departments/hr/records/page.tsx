import {EmployeeTable} from '@/components/custom/employeeTable'
import {getEmployees} from '@/dal/employees'
import {mapEmployee} from '@/extra/employees'

interface PageProps {
  params: {departmentSlug: string; actionSlug: string}
}

export default async function RecordPage({params}: PageProps) {
  const {departmentSlug, actionSlug} = params

  const data = await getEmployees()
  const employees = data.map(mapEmployee)

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Employees</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage employee records and onboarding</p>
        </div>

        <EmployeeTable initialEmployees={employees} />
      </div>
    </main>
  )
}
