import {DepartmentGrid} from '@/components/custom/departmentGrid'

export default function DashboardPage() {
  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Departments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Select a department to manage</p>
        </div>
        <DepartmentGrid role="admin" />
      </div>
    </main>
  )
}
