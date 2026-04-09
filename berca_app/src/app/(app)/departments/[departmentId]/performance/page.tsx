import {DepartmentActionPlaceholder} from '@/components/custom/departmentActionPlaceholder'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function PerformancePage({params}: PageProps) {
  const {departmentId} = await params
  return <DepartmentActionPlaceholder pageTitle="Performance" departmentId={departmentId} />
}
