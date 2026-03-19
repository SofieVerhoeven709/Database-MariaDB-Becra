import {redirect} from 'next/navigation'

interface MaterialDetailAliasPageProps {
  params: Promise<{departmentId: string; materialId: string}>
}

export default async function MaterialDetailAliasPage({params}: MaterialDetailAliasPageProps) {
  const {departmentId, materialId} = await params
  redirect(`/departments/${departmentId}/material/${materialId}`)
}

