import {redirect} from 'next/navigation'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function MaterialPlacePage({params}: PageProps) {
  const {departmentId} = await params
  redirect(`/departments/${departmentId}/place`)
}
