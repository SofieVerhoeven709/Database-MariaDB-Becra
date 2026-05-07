import {notFound} from 'next/navigation'
import Link from 'next/link'
import type {Route} from 'next'
import {ArrowLeft} from 'lucide-react'
import {
  getPurchaseById,
  getPurchaseDetails,
  getPurchaseDetailMaterialOptions,
  getPurchaseDetailMaterialDemandOptions,
} from '@/dal/purchases'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapPurchaseDetail, normalizePurchaseStatus} from '../../../../../../mapper/purchases'
import type {MappedPurchaseDetail} from '@/types/purchase'
import {PurchaseDetailTable} from '@/components/custom/purchaseDetailTable'
import {PurchaseOrderHeader} from '@/components/custom/purchaseOrderHeader'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {getCompanies} from '@/dal/companies'
import {getPaymentConditions} from '@/dal/quoteSuppliers'

interface Props {
  params: Promise<{departmentId: string; orderId: string}>
}

export default async function PurchaseOrderDetailPage({params}: Props) {
  const {departmentId, orderId} = await params

  const [department, purchase, detailsRaw, materialsRaw, demandsRaw, profile, companiesRaw, paymentConditionsRaw] =
    await Promise.all([
      getDepartmentById(departmentId),
      getPurchaseById(orderId),
      getPurchaseDetails(orderId),
      getPurchaseDetailMaterialOptions(),
      getPurchaseDetailMaterialDemandOptions(),
      getSessionProfileFromCookieOrThrow(),
      getCompanies(),
      getPaymentConditions(),
    ])

  if (!department) return <p>Department not found</p>
  if (!purchase) notFound()

  const purchaseExt = purchase as typeof purchase & {
    customerPoNumber?: string | null
    bocNumber?: string | null
    bocCustomerName?: string | null
    bocDescription?: string | null
    bocCreatedAt?: Date | null
    bocStatus?: string | null
  }

  const {currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const canEdit = currentUserLevel >= 40

  const details: MappedPurchaseDetail[] = detailsRaw.map(d =>
    mapPurchaseDetail(d as Parameters<typeof mapPurchaseDetail>[0]),
  )

  const materialOptions = materialsRaw
    .map(m => ({id: m.id, name: `${m.beNumber} - ${m.name ?? 'Unnamed material'}`}))
    .sort((a, b) => a.name.localeCompare(b.name))

  const materialDemandOptions = demandsRaw
    .map(d => ({
      id: d.id,
      name: `${d.Material?.beNumber ?? 'N/A'} - ${d.Material?.name ?? 'Demand'}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const quoteLineOptions = (purchase.QuoteSupplier?.QuoteSupplierLine ?? []).map(line => {
    const quoteLine = line as typeof line & {additionalInfo?: string | null}

    return {
      id: line.id,
      name: `${line.Material?.beNumber ?? 'N/A'} - ${line.Material?.name ?? 'Line'} (${line.quantity})`,
      materialId: line.materialId,
      materialDemandId: line.materialDemandId,
      additionalInfo: quoteLine.additionalInfo ?? null,
      quantity: line.quantity,
      unitPrice: line.unitPrice?.toString() ?? '0.00',
      minQuantity: line.minQuantity ?? null,
      notDeliverable: line.notDeliverable,
    }
  })

  const quoteMiscLineOptions = (purchase.QuoteSupplier?.QuoteSupplierMiscLine ?? []).map(miscLine => ({
    id: miscLine.id,
    description: miscLine.description,
    unitPrice: Number(miscLine.unitPrice),
  }))

  const createdByName = `${purchase.Employee.firstName} ${purchase.Employee.lastName}`

  // Shape the purchase into the flat header DTO the client component expects.
  const headerData = {
    id: purchase.id,
    purchaseNumber: purchase.purchaseNumber ?? null,
    description: purchase.description ?? null,
    status: normalizePurchaseStatus(purchase.status),
    purchaseDate: purchase.purchaseDate ?? null,
    companyId: purchase.Company?.id ?? null,
    companyName: purchase.Company?.name ?? null,
    quoteSupplierId: purchase.quoteSupplierId ?? null,
    quoteNumber: purchase.QuoteSupplier?.quoteNumber ?? null,
    paymentConditionId: purchase.PaymentCondition?.id ?? null,
    paymentConditionName: purchase.PaymentCondition?.name ?? null,
    customerPoNumber: purchaseExt.customerPoNumber ?? null,
    bocNumber: purchaseExt.bocNumber ?? null,
    bocCustomerName: purchaseExt.bocCustomerName ?? null,
    bocDescription: purchaseExt.bocDescription ?? null,
    bocCreatedAt: purchaseExt.bocCreatedAt ?? null,
    bocStatus: purchaseExt.bocStatus ?? null,
    additionalInfo: purchase.additionalInfo ?? null,
    createdByName,
  }

  const companyOptions = companiesRaw.map(c => ({id: c.id, name: c.name})).sort((a, b) => a.name.localeCompare(b.name))

  const paymentConditionOptions = paymentConditionsRaw
    .map(p => ({id: p.id, name: p.name}))
    .sort((a, b) => a.name.localeCompare(b.name))

  const purchaseDetailTableProps = {
    purchaseId: orderId,
    initialDetails: details,
    materialOptions,
    materialDemandOptions,
    quoteLineOptions,
    quoteMiscLines: quoteMiscLineOptions,
    currentUserLevel,
  } as const

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <Link
          href={`/departments/${departmentId}/orders` as Route}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Purchase Orders
        </Link>

        <Link
          href={`/departments/${departmentId}/purchaseOrdersConfirmation?purchaseId=${orderId}` as Route}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          View in Purchase Orders Confirmation
        </Link>

        <PurchaseOrderHeader
          purchase={headerData}
          companyOptions={companyOptions}
          paymentConditionOptions={paymentConditionOptions}
          canEdit={canEdit}
        />

        <PurchaseDetailTable {...(purchaseDetailTableProps as any)} />
      </div>
    </main>
  )
}
