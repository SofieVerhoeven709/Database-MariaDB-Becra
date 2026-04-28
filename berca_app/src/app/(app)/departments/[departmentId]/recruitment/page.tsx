import {RecruitmentTable} from '@/components/custom/recruitmentTable'
import {getRecruitmentApplicants, getRecruitmentVacancies} from '@/dal/recruitment'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function RecruitmentPage({params}: PageProps) {
  const {departmentId} = await params
  const [applicants, vacancies] = await Promise.all([getRecruitmentApplicants(), getRecruitmentVacancies()])

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6">
      <RecruitmentTable applicants={applicants} vacancies={vacancies} departmentId={departmentId} />
      <p className="text-xs text-muted-foreground">Department: {departmentId}</p>
    </div>
  )
}
