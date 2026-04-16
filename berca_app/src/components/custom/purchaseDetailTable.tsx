'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Plus, Pencil, Trash2} from 'lucide-react'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {
  PurchaseDetailFormDialog,
  type DetailOption,
  type QuoteLineOption,
} from '@/components/custom/purchaseDetailFormDialog'
import type {MappedPurchaseDetail} from '@/types/purchase'
import {
  createPurchaseDetailAction,
  updatePurchaseDetailAction,
  softDeletePurchaseDetailAction,
  hardDeletePurchaseDetailAction,
} from '@/serverFunctions/purchases'

interface PurchaseDetailTableProps {
  purchaseId: string
  initialDetails: MappedPurchaseDetail[]
  materialOptions: DetailOption[]
  materialDemandOptions: DetailOption[]
  quoteLineOptions: QuoteLineOption[]
  currentUserLevel: number
}

function formatCurrency(val: string | number | null | undefined) {
  if (val == null) return '—'
  const num = typeof val === 'string' ? parseFloat(val) : val
  if (isNaN(num)) return '—'
  return new Intl.NumberFormat('nl-BE', {style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2}).format(num)
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

const STATUS_COLOR: Record<string, string> = {
  OPEN: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  ORDERED: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  RECEIVED: 'bg-green-500/10 text-green-600 border-green-500/30',
  CANCELLED: 'bg-red-500/10 text-red-600 border-red-500/30',
}

const thClass = 'text-xs whitespace-nowrap'
const tdClass = 'text-sm text-muted-foreground whitespace-nowrap'

export function PurchaseDetailTable({
  purchaseId,
  initialDetails,
  materialOptions,
  materialDemandOptions,
  quoteLineOptions,
  currentUserLevel,
}: PurchaseDetailTableProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MappedPurchaseDetail | null>(null)
  const canEdit = currentUserLevel >= 40
  const canCreate = currentUserLevel >= 60
  const canSoftDelete = currentUserLevel >= 80
  const canHardDelete = currentUserLevel >= 100

  async function handleSave(d: MappedPurchaseDetail) {
    if (editing && !canEdit) return
    if (!editing && !canCreate) return

    if (editing) {
      await updatePurchaseDetailAction({
        id: d.id,
        purchaseId,
        quoteSupplierLineId: d.quoteSupplierLineId,
        materialId: d.materialId,
        materialDemandId: d.materialDemandId,
        unitPrice: d.unitPrice ?? '0.00',
        quantity: d.quantity,
        minQuantity: d.minQuantity,
        lineStatus: d.lineStatus,
        additionalInfo: d.additionalInfo,
        notDeliverable: d.notDeliverable,
      })
    } else {
      await createPurchaseDetailAction({
        purchaseId,
        quoteSupplierLineId: d.quoteSupplierLineId,
        materialId: d.materialId,
        materialDemandId: d.materialDemandId,
        unitPrice: d.unitPrice ?? '0.00',
        quantity: d.quantity,
        minQuantity: d.minQuantity,
        lineStatus: d.lineStatus,
        additionalInfo: d.additionalInfo,
        notDeliverable: d.notDeliverable,
      })
    }
    setEditing(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (canHardDelete) {
      await hardDeletePurchaseDetailAction({id, purchaseId})
    } else if (canSoftDelete) {
      await softDeletePurchaseDetailAction({id, purchaseId})
    } else {
      return
    }
    router.refresh()
  }

  const totalValue = initialDetails.reduce((sum, d) => {
    // Sum quantity * unit price, ignoring invalid prices.
    const unit = d.unitPrice != null ? parseFloat(d.unitPrice) : 0
    const cost = unit * d.quantity
    return sum + (isNaN(cost) ? 0 : cost)
  }, 0)

  // Fast lookup from demand id to label for table rendering.
  const demandLabelById = new Map(materialDemandOptions.map(option => [option.id, option.name]))

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Line Items</h2>
          <span className="text-xs text-muted-foreground">
            {initialDetails.length} item{initialDetails.length !== 1 ? 's' : ''}
          </span>
          {initialDetails.length > 0 && (
            <span className="rounded-full border border-border/70 px-2.5 py-0.5 text-xs text-muted-foreground">
              Total: {formatCurrency(totalValue)}
            </span>
          )}
        </div>
        <Button
          size="sm"
          disabled={!canCreate}
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
          className="bg-accent text-accent-foreground hover:bg-accent/80 gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Line Item
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className={thClass}>Material</TableHead>
              <TableHead className={thClass}>Demand</TableHead>
              <TableHead className={thClass}>Unit Price</TableHead>
              <TableHead className={thClass}>Qty</TableHead>
              <TableHead className={thClass}>Min Qty</TableHead>
              <TableHead className={thClass}>Line Status</TableHead>
              <TableHead className={thClass}>Flags</TableHead>
              <TableHead className={thClass}>Additional Info</TableHead>
              <TableHead className={thClass}>Created By</TableHead>
              <TableHead className="w-20">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialDetails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground text-sm">
                  No line items yet. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              initialDetails.map(d => (
                <TableRow key={d.id} className="border-border/40 hover:bg-secondary/50">
                  <TableCell className={`${tdClass} font-medium text-foreground`}>{d.materialLabel}</TableCell>
                  <TableCell className={tdClass}>
                    {d.materialDemandId ? demandLabelById.get(d.materialDemandId) ?? d.materialDemandId : '—'}
                  </TableCell>
                  <TableCell className={tdClass}>{formatCurrency(d.unitPrice)}</TableCell>
                  <TableCell className={tdClass}>{d.quantity}</TableCell>
                  <TableCell className={tdClass}>{d.minQuantity ?? '—'}</TableCell>
                  <TableCell>
                    {d.lineStatus ? (
                      <Badge
                        className={`border text-xs font-medium ${STATUS_COLOR[d.lineStatus] ?? 'bg-accent/10 text-accent border-0'}`}>
                        {d.lineStatus}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className={tdClass}>
                    {d.notDeliverable ? <Badge variant="destructive" className="text-[10px]">Not deliverable</Badge> : '—'}
                  </TableCell>
                  <TableCell className={tdClass}>{d.additionalInfo ?? '—'}</TableCell>
                  <TableCell className={tdClass}>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-foreground">{d.createdByName}</span>
                      <span className="text-[11px] text-muted-foreground">{formatDate(d.createdAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                        disabled={!canEdit}
                        onClick={() => {
                          setEditing(d)
                          setDialogOpen(true)
                        }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        disabled={!canSoftDelete && !canHardDelete}
                        onClick={() => handleDelete(d.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PurchaseDetailFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        detail={editing}
        purchaseId={purchaseId}
        materialOptions={materialOptions}
        materialDemandOptions={materialDemandOptions}
        quoteLineOptions={quoteLineOptions}
        onSave={handleSave}
      />
    </div>
  )
}
