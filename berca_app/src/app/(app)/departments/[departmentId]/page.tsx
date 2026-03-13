import {DepartmentActionGrid} from '@/components/custom/departmentActionGrid'
import {getDepartmentById} from '@/dal/department'
import {logger} from '@/lib/logger'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function DepartmentPage({params}: PageProps) {
  const {departmentId} = await params
  logger.warn(`Department Page loaded for ${departmentId}`)
  const department = await getDepartmentById(departmentId)

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
