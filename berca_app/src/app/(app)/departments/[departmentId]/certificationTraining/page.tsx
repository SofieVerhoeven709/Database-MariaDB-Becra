import {HrCertificationTrainingTable} from '@/components/custom/hrCertificationTrainingTable'
import {
  getHrAbsences,
  getHrCertificationTrainingEmployeeOptions,
  getHrCertificationTrainings,
} from '@/dal/hrCertificationTraining'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function CertificationTrainingPage({params}: PageProps) {
  const {departmentId} = await params

  const [certifications, absences, employees] = await Promise.all([
    getHrCertificationTrainings(),
    getHrAbsences(),
    getHrCertificationTrainingEmployeeOptions(),
  ])

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6">
      <HrCertificationTrainingTable
        certifications={certifications}
        absences={absences}
        employees={employees}
        departmentId={departmentId}
      />
    </div>
  )
}
