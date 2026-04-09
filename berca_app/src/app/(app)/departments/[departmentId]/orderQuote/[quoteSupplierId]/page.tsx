import {notFound} from 'next/navigation'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getQuoteSupplierById} from '@/dal/quoteSuppliers'
import {mapQuoteSupplierDetail} from '@/extra/quoteSuppliers'
import {QuoteSupplierDetail} from '@/components/custom/quoteSupplierDetail'
import {getMaterials} from '@/dal/materials'
import {getMaterialDemands} from '@/dal/materialDemands'

interface PageProps {
  params: Promise<{departmentId: string; quoteSupplierId: string}>
  searchParams?: Promise<{materialId?: string; materialDemandId?: string}>
}

export default async function QuoteSupplierDetailPage({params, searchParams}: PageProps) {
  const {departmentId, quoteSupplierId} = await params
  const {materialId, materialDemandId} = (await searchParams) ?? {}

  const [department, quoteRaw, materialsRaw, demandsRaw, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getQuoteSupplierById(quoteSupplierId),
    getMaterials(),
    getMaterialDemands(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>
  if (!quoteRaw) notFound()

  const quote = mapQuoteSupplierDetail(quoteRaw)
  const {currentUserLevel} = getDepartmentRoleInfo(profile, department.name)

  const materialOptions = materialsRaw.map(material => ({
    id: material.id,
    beNumber: material.beNumber ?? null,
    name: material.name ?? null,
    shortDescription: material.shortDescription ?? null,
  }))

  const materialDemandOptions = demandsRaw.map(demand => ({
    id: demand.id,
    materialId: demand.materialId,
    label: `${demand.Material.beNumber ?? '—'} — ${demand.Material.shortDescription ?? demand.Material.name ?? demand.id}`,
  }))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <QuoteSupplierDetail
          quote={quote}
          departmentId={departmentId}
          currentUserLevel={currentUserLevel}
          materialOptions={materialOptions}
          materialDemandOptions={materialDemandOptions}
          defaultMaterialId={materialId}
          defaultMaterialDemandId={materialDemandId}
        />
      </div>
    </main>
  )
}

