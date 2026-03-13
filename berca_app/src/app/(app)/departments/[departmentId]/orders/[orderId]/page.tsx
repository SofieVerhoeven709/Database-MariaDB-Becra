import {notFound} from 'next/navigation'
import Link from 'next/link'
import {ArrowLeft, Building2, Calendar, Package, Tag, User} from 'lucide-react'
import {Badge} from '@/components/ui/badge'
import {getPurchaseById, getPurchaseDetails} from '@/dal/purchases'
import {getProjects} from '@/dal/projects'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {mapPurchaseDetail} from '@/extra/purchases'
import type {MappedPurchaseDetail} from '@/types/purchase'
import {PurchaseDetailTable} from '@/components/custom/purchaseDetailTable'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface Props {
  params: Promise<{departmentId: string; orderId: string}>
}

function formatDate(date: Date | null | undefined) {
  if (!date) return '—'
  return date.toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

const STATUS_COLOR: Record<string, string> = {
  Pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  Ordered: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  Delivered: 'bg-green-500/10 text-green-600 border-green-500/30',
  Cancelled: 'bg-red-500/10 text-red-600 border-red-500/30',
  'On Hold': 'bg-orange-500/10 text-orange-600 border-orange-500/30',
}

export default async function PurchaseOrderDetailPage({params}: Props) {
  const {departmentId, orderId} = await params

  const [department, purchase, detailsRaw, projectsRaw, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getPurchaseById(orderId),
    getPurchaseDetails(orderId),
    getProjects(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>
  if (!purchase) notFound()

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  const details: MappedPurchaseDetail[] = detailsRaw.map(d => mapPurchaseDetail(d))

  const projectOptions = projectsRaw
    .filter(p => !p.deleted)
    .map(p => ({id: p.id, name: `${p.projectNumber} – ${p.projectName}`}))
    .sort((a, b) => a.name.localeCompare(b.name))

  const createdByName = `${purchase.Employee.firstName} ${purchase.Employee.lastName}`

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <Link
          href={`/departments/${departmentId}/orders`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Purchase Orders
        </Link>

        <div className="rounded-xl border border-border/60 bg-card p-6 space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-semibold text-foreground">{purchase.orderNumber ?? 'Unnamed Order'}</h1>
                {purchase.status && (
                  <Badge
                    className={`border text-xs font-medium ${
                      STATUS_COLOR[purchase.status] ?? 'bg-accent/10 text-accent border-0'
                    }`}>
                    {purchase.status}
                  </Badge>
                )}
              </div>
              {purchase.description && <p className="text-sm text-muted-foreground">{purchase.description}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 pt-2 border-t border-border/50">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Purchase Date
              </span>
              <span className="text-sm text-foreground">{formatDate(purchase.purchaseDate)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" /> Supplier
              </span>
              <span className="text-sm text-foreground">{purchase.Company?.name ?? '—'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Package className="h-3 w-3" /> Project
              </span>
              <span className="text-sm text-foreground">
                {purchase.Project ? `${purchase.Project.projectNumber} – ${purchase.Project.projectName}` : '—'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Tag className="h-3 w-3" /> Brand
              </span>
              <span className="text-sm text-foreground">{purchase.brandName ?? '—'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" /> Created By
              </span>
              <span className="text-sm text-foreground">{createdByName}</span>
            </div>
          </div>

          {(purchase.preferredSupplier ?? purchase.additionalInfo) && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
              {purchase.preferredSupplier && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Preferred Supplier
                  </span>
                  <span className="text-sm text-foreground">{purchase.preferredSupplier}</span>
                </div>
              )}
              {purchase.additionalInfo && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Additional Info</span>
                  <span className="text-sm text-foreground">{purchase.additionalInfo}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <PurchaseDetailTable
          purchaseId={orderId}
          initialDetails={details}
          projects={projectOptions}
          isAdmin={isAdmin}
        />
      </div>
    </main>
  )
}
