import {DepartmentActionPlaceholder} from '@/components/custom/departmentActionPlaceholder'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function MonitoringPage({params}: PageProps) {
  const {departmentId} = await params
  return <DepartmentActionPlaceholder pageTitle="Monitoring" departmentId={departmentId} />
}
