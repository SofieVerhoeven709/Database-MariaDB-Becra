import {HrHseFileOverview} from '@/components/custom/hrHseFileOverview'
import {getHrHseFileRows} from '@/dal/hrHseFile'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function HseFilePage({params}: PageProps) {
  const {departmentId} = await params
  const rows = await getHrHseFileRows()

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6">
      <HrHseFileOverview rows={rows} departmentId={departmentId} />
    </div>
  )
}
