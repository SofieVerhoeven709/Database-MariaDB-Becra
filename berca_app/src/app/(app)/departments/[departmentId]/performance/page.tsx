import {HrPerformanceReviewOverview} from '@/components/custom/hrPerformanceReviewOverview'
import {HrScheduleMeetingTable} from '@/components/custom/hrScheduleMeetingTable'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {getDepartmentByIdOrThrow} from '@/dal/department'
import {getHrCertificationTrainingEmployeeOptions} from '@/dal/hrCertificationTraining'
import {getHrEvaluationMeetings} from '@/dal/hrEvaluationMeetings'
import {
  getHrPerformanceProjectOptions,
  getHrPerformanceReviewRows,
  getHrPerformanceTimeRegistryOptions,
} from '@/dal/hrPerformanceReview'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function PerformancePage({params}: PageProps) {
  const {departmentId} = await params
  const meetings = await getHrEvaluationMeetings()
  const [rows, employees, projects, timeRegistryOptions, department, profile] = await Promise.all([
    getHrPerformanceReviewRows(meetings),
    getHrCertificationTrainingEmployeeOptions(),
    getHrPerformanceProjectOptions(),
    getHrPerformanceTimeRegistryOptions(),
    getDepartmentByIdOrThrow(departmentId),
    getSessionProfileFromCookieOrThrow(),
  ])
  const {currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const canManageOvertime = currentUserLevel >= 80

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <HrPerformanceReviewOverview
            rows={rows}
            projects={projects}
            timeRegistryOptions={timeRegistryOptions}
            departmentId={departmentId}
            canManageOvertime={canManageOvertime}
          />
        </TabsContent>
        <TabsContent value="meetings">
          <HrScheduleMeetingTable
            meetings={meetings}
            employees={employees}
            departmentId={departmentId}
            title="Performance meetings"
            description="Plan, update and complete evaluation meetings from Performance Review."
            createButtonLabel="New meeting"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
