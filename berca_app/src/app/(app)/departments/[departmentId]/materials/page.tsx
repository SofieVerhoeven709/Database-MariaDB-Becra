import {redirect} from 'next/navigation'
import {Route} from 'next'

interface MaterialsAliasPageProps {
  params: Promise<{departmentId: string}>
}

export default async function MaterialsAliasPage({params}: MaterialsAliasPageProps) {
  const {departmentId} = await params
  redirect(`/departments/${departmentId}/material` as Route)
}
