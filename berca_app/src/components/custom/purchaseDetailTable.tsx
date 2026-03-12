'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Plus, Pencil, Trash2} from 'lucide-react'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {PurchaseDetailFormDialog, type DetailOption} from '@/components/custom/purchaseDetailFormDialog'
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
  projects: DetailOption[]
  isAdmin: boolean
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
  Pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  Ordered: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  Delivered: 'bg-green-500/10 text-green-600 border-green-500/30',
  Cancelled: 'bg-red-500/10 text-red-600 border-red-500/30',
  'On Hold': 'bg-orange-500/10 text-orange-600 border-orange-500/30',
}

const thClass = 'text-xs whitespace-nowrap'
const tdClass = 'text-sm text-muted-foreground whitespace-nowrap'

export function PurchaseDetailTable({purchaseId, initialDetails, projects, isAdmin}: PurchaseDetailTableProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MappedPurchaseDetail | null>(null)

  async function handleSave(d: MappedPurchaseDetail) {
    if (editing) {
      await updatePurchaseDetailAction({
        id: d.id,
        purchaseId,
        projectId: d.projectId,
        beNumber: d.beNumber,
        unitPrice: d.unitPrice,
        quantity: d.quantity,
        totalCost: d.totalCost,
        status: d.status,
        additionalInfo: d.additionalInfo,
      })
    } else {
      await createPurchaseDetailAction({
        purchaseId,
        projectId: d.projectId,
        beNumber: d.beNumber,
        unitPrice: d.unitPrice,
        quantity: d.quantity,
        totalCost: d.totalCost,
        status: d.status,
        additionalInfo: d.additionalInfo,
      })
    }
    setEditing(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (isAdmin) {
      await hardDeletePurchaseDetailAction({id, purchaseId})
    } else {
      await softDeletePurchaseDetailAction({id, purchaseId})
    }
    router.refresh()
  }

  const totalValue = initialDetails.reduce((sum, d) => {
    const cost = d.totalCost != null ? parseFloat(d.totalCost) : 0
    return sum + (isNaN(cost) ? 0 : cost)
  }, 0)

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
              <TableHead className={thClass}>BE Number</TableHead>
              <TableHead className={thClass}>Project</TableHead>
              <TableHead className={thClass}>Unit Price</TableHead>
              <TableHead className={thClass}>Qty</TableHead>
              <TableHead className={thClass}>Total Cost</TableHead>
              <TableHead className={thClass}>Status</TableHead>
              <TableHead className={thClass}>Additional Info</TableHead>
              <TableHead className={thClass}>Updated By</TableHead>
              <TableHead className="w-20">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialDetails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground text-sm">
                  No line items yet. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              initialDetails.map(d => (
                <TableRow key={d.id} className="border-border/40 hover:bg-secondary/50">
                  <TableCell className={`${tdClass} font-medium text-foreground`}>{d.beNumber ?? '—'}</TableCell>
                  <TableCell className={tdClass}>
                    {d.projectNumber ? (
                      <div className="flex flex-col gap-0.5">
                        <Badge
                          variant="outline"
                          className="border-border text-muted-foreground font-normal whitespace-nowrap w-fit">
                          {d.projectNumber}
                        </Badge>
                        {d.projectName && (
                          <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                            {d.projectName}
                          </span>
                        )}
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className={tdClass}>{formatCurrency(d.unitPrice)}</TableCell>
                  <TableCell className={tdClass}>{d.quantity ?? '—'}</TableCell>
                  <TableCell className={`${tdClass} font-medium`}>{formatCurrency(d.totalCost)}</TableCell>
                  <TableCell>
                    {d.status ? (
                      <Badge
                        className={`border text-xs font-medium ${STATUS_COLOR[d.status] ?? 'bg-accent/10 text-accent border-0'}`}>
                        {d.status}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className={tdClass}>{d.additionalInfo ?? '—'}</TableCell>
                  <TableCell className={tdClass}>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-foreground">{d.createdByName}</span>
                      <span className="text-[11px] text-muted-foreground">{formatDate(d.updatedAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
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
        projects={projects}
        onSave={handleSave}
      />
    </div>
  )
}
