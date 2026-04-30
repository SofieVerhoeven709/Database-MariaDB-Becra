import {HrFacilityOverview} from '@/components/custom/hrFacilityOverview'
import {getDepartmentByIdOrThrow} from '@/dal/department'
import {getHrFacilityEmployeeOptions, getHrFacilityRows, getHrFacilitySerialTrackedOptions} from '@/dal/hrFacility'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function FacilityPage({params}: PageProps) {
  const {departmentId} = await params
  const [rows, employees, serialTrackedOptions, department, profile] = await Promise.all([
    getHrFacilityRows(),
    getHrFacilityEmployeeOptions(),
    getHrFacilitySerialTrackedOptions(),
    getDepartmentByIdOrThrow(departmentId),
    getSessionProfileFromCookieOrThrow(),
  ])
  const {currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const canManageFacility = currentUserLevel >= 80

  return (
    <div className="mx-auto max-w-7xl p-6">
      <HrFacilityOverview
        rows={rows}
        employees={employees}
        serialTrackedOptions={serialTrackedOptions}
        departmentId={departmentId}
        canManageFacility={canManageFacility}
      />
    </div>
  )
}
