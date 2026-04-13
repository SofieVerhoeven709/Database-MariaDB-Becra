import {notFound} from 'next/navigation'
import Link from 'next/link'
import type {Route} from 'next'
import {ArrowLeft} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {getDepartmentById} from '@/dal/department'
import {
  getIncomingDeliveryById,
  getIncomingDeliveryMaterialOptions,
  getIncomingDeliveryPurchaseDetailOptions,
  getMaterialDemandSourceOptions,
} from '@/dal/incomingDeliveries'
import {mapIncomingDeliveryLine, mapIncomingDeliveryLineAllocation, mapMaterialDemandSourceOption} from '@/extra/incomingDeliveries'
import {IncomingDeliveryDetailTable} from '@/components/custom/incomingDeliveryDetailTable'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface PageProps {
  params: Promise<{departmentId: string; incomingDeliveryId: string}>
}

function formatDate(iso: string | Date | null | undefined) {
  if (!iso) return '—'
  const date = typeof iso === 'string' ? new Date(iso) : iso
  return date.toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

export default async function IncomingDeliveryDetailPage({params}: PageProps) {
  const {departmentId, incomingDeliveryId} = await params

  const [department, incomingDelivery, materialOptionsRaw, sourceOptionsRaw, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getIncomingDeliveryById(incomingDeliveryId),
    getIncomingDeliveryMaterialOptions(),
    getMaterialDemandSourceOptions(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>
  if (!incomingDelivery) notFound()

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)

  const lines = incomingDelivery.IncomingDeliveryLine.map(mapIncomingDeliveryLine)

  const allocationsByLineId: Record<string, ReturnType<typeof mapIncomingDeliveryLineAllocation>[]> = {}
  for (const line of incomingDelivery.IncomingDeliveryLine) {
    allocationsByLineId[line.id] = line.IncomingDeliveryLineAllocation.map(mapIncomingDeliveryLineAllocation)
  }

  const materialOptions = materialOptionsRaw.map(material => ({
    id: material.id,
    label: [material.beNumber, material.shortDescription ?? material.name].filter(Boolean).join(' - ') || material.id,
  }))

  const purchaseDetailOptionsRaw = await getIncomingDeliveryPurchaseDetailOptions(incomingDelivery.purchaseId)
  const purchaseDetailOptions = purchaseDetailOptionsRaw.map(detail => ({
    id: detail.id,
    materialId: detail.materialId,
    label: `${detail.Material.beNumber ?? '—'} - ${detail.Material.shortDescription ?? detail.Material.name ?? detail.id} (${detail.quantity})`,
  }))

  const sourceOptions = sourceOptionsRaw.map(mapMaterialDemandSourceOption)

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <Link href={`/departments/${departmentId}/incomingDeliveries` as Route}>
          <Button variant="ghost" className="px-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Incoming Deliveries
          </Button>
        </Link>

        <section className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-foreground">{incomingDelivery.incomingDeliveryNumber}</h1>
              <p className="text-sm text-muted-foreground">
                Purchase {incomingDelivery.Purchase?.purchaseNumber ?? 'Manual'} · Delivery date {formatDate(incomingDelivery.deliveryDate)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{incomingDelivery.status}</Badge>
              <Badge variant="outline">Received: {formatDate(incomingDelivery.receivedAt)}</Badge>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 text-sm">
            <div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Description</span>
              <p className="text-foreground mt-1">{incomingDelivery.description ?? '—'}</p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Additional info</span>
              <p className="text-foreground mt-1">{incomingDelivery.additionalInfo ?? '—'}</p>
            </div>
          </div>
        </section>

        <IncomingDeliveryDetailTable
          incomingDeliveryId={incomingDeliveryId}
          lines={lines}
          allocationsByLineId={allocationsByLineId}
          materialOptions={materialOptions}
          purchaseDetailOptions={purchaseDetailOptions}
          materialDemandSourceOptions={sourceOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
        />
      </div>
    </main>
  )
}


