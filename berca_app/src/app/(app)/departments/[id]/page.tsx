import {DepartmentActionGrid} from '@/components/custom/departmentActionGrid'
import {getDepartmentById} from '@/dal/department'

interface PageProps {
  params: {id: string}
}

export default async function DepartmentPage({params}: PageProps) {
  const {id} = params
  const department = await getDepartmentById(id)

  if (!department) return <p>Department not found</p>

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">{department.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Actions you can perform in {department.name}</p>
        </div>

        <DepartmentActionGrid department={department} />
      </div>
    </main>
  )
}
