import {HrScheduleMeetingTable} from '@/components/custom/hrScheduleMeetingTable'
import {getEmployees} from '@/dal/employees'
import {getHrEvaluationMeetings} from '@/dal/hrEvaluationMeetings'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function SchedulePage({params}: PageProps) {
  const {departmentId} = await params

  const [employeesFromDAL, meetings] = await Promise.all([getEmployees(), getHrEvaluationMeetings()])
  const employees = employeesFromDAL
    .filter(employee => !employee.deleted && employee.active)
    .map(employee => ({
      id: employee.id,
      name: `${employee.firstName} ${employee.lastName}`.trim(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6">
      <HrScheduleMeetingTable meetings={meetings} employees={employees} departmentId={departmentId} />
      <p className="text-xs text-muted-foreground">Department: {departmentId}</p>
    </div>
  )
}
