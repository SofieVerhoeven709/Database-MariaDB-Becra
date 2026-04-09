import {DepartmentActionPlaceholder} from '@/components/custom/departmentActionPlaceholder'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function RecruitmentPage({params}: PageProps) {
  const {departmentId} = await params
  return <DepartmentActionPlaceholder pageTitle="Recruitment" departmentId={departmentId} />
}
