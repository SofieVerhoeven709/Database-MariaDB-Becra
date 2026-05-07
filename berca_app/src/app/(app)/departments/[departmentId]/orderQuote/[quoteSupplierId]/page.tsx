import {notFound} from 'next/navigation'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getPaymentConditionOptions, getQuoteSupplierById} from '@/dal/quoteSuppliers'
import {mapQuoteSupplierDetail} from '../../../../../../mapper/quoteSuppliers'
import {QuoteSupplierDetail} from '@/components/custom/quoteSupplierDetail'
import {getMaterialsForSupplierCompany} from '@/dal/materials'
import {getMaterialDemands} from '@/dal/materialDemands'
import {getSupplierCompanies} from '@/dal/companies'

interface PageProps {
  params: Promise<{departmentId: string; quoteSupplierId: string}>
  searchParams?: Promise<{materialId?: string; materialDemandId?: string}>
}

export default async function QuoteSupplierDetailPage({params, searchParams}: PageProps) {
  const {departmentId, quoteSupplierId} = await params
  const {materialId, materialDemandId} = (await searchParams) ?? {}

  const [department, quoteRaw, demandsRaw, profile, companiesRaw, paymentConditionsRaw] = await Promise.all([
    getDepartmentById(departmentId),
    getQuoteSupplierById(quoteSupplierId),
    getMaterialDemands(),
    getSessionProfileFromCookieOrThrow(),
    getSupplierCompanies(),
    getPaymentConditionOptions(),
  ])

  if (!department) return <p>Department not found</p>
  if (!quoteRaw) notFound()

  const materialsRaw = await getMaterialsForSupplierCompany(quoteRaw.companyId)

  const quote = mapQuoteSupplierDetail(quoteRaw)
  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)

  // Limit selectable materials to the supplier linked to this quote.
  const materialOptions = materialsRaw.map(material => ({
    id: material.id,
    beNumber: material.beNumber ?? null,
    name: material.name ?? null,
    shortDescription: material.shortDescription ?? null,
  }))

  const allowedMaterialIds = new Set(materialOptions.map(material => material.id))

  // Only expose material demands that match the supplier's available materials.
  const materialDemandOptions = demandsRaw
    .filter(demand => allowedMaterialIds.has(demand.materialId))
    .map(demand => ({
      id: demand.id,
      materialId: demand.materialId,
      label: `${demand.Material.beNumber ?? '—'} — ${demand.Material.shortDescription ?? demand.Material.name ?? demand.id}`,
    }))

  // Guard against invalid defaults passed through query params.
  const safeDefaultMaterialId = materialId && allowedMaterialIds.has(materialId) ? materialId : undefined
  const safeDefaultMaterialDemandId =
    materialDemandId && materialDemandOptions.some(option => option.id === materialDemandId)
      ? materialDemandId
      : undefined

  const companyOptions = companiesRaw.map(c => ({id: c.id, name: c.name})).sort((a, b) => a.name.localeCompare(b.name))

  const paymentConditionOptions = paymentConditionsRaw
    .map(pc => ({id: pc.id, name: pc.name}))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <QuoteSupplierDetail
          quote={quote}
          departmentId={departmentId}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          companyOptions={companyOptions}
          paymentConditionOptions={paymentConditionOptions}
          materialOptions={materialOptions}
          materialDemandOptions={materialDemandOptions}
          defaultMaterialId={safeDefaultMaterialId}
          defaultMaterialDemandId={safeDefaultMaterialDemandId}
        />
      </div>
    </main>
  )
}
