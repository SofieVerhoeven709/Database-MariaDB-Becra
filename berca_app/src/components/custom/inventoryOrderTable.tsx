'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Search, ChevronDown, ChevronUp, Plus, Pencil, Trash2, Check, RotateCcw, X} from 'lucide-react'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {InventoryOrderFormDialog, type InventoryOption} from '@/components/custom/inventoryOrderFormDialog'
import type {MappedInventoryOrder} from '@/types/inventoryOrder'
import {
  createInventoryOrderAction,
  updateInventoryOrderAction,
  softDeleteInventoryOrderAction,
  hardDeleteInventoryOrderAction,
  undeleteInventoryOrderAction,
  rejectInventoryOrderAction,
  approveInventoryOrderAction,
} from '@/serverFunctions/inventoryOrders'

type SortField = 'orderDate' | 'orderNumber' | 'shortDescription' | 'inventoryBeNumber'
type SortDir = 'asc' | 'desc'
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'deleted'
type MaterialNumberFilter = 'all' | 'be' | 'iso'

const ISO_THRESHOLD = 4_000_000

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function SortIcon({field, sortField, sortDir}: {field: SortField; sortField: SortField; sortDir: SortDir}) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? <ChevronUp className="inline h-3.5 w-3.5 ml-1" /> : <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
}

function classifyMaterialNumber(beNumber: string | null | undefined): 'be' | 'iso' | 'unknown' {
  if (!beNumber) return 'unknown'
  const digits = beNumber.replace(/\D/g, '')
  if (!digits) return 'unknown'
  const parsed = Number.parseInt(digits, 10)
  if (Number.isNaN(parsed)) return 'unknown'
  return parsed >= ISO_THRESHOLD ? 'iso' : 'be'
}

interface Props {
  initialEntries: MappedInventoryOrder[]
  inventories: InventoryOption[]
  currentUserRole: string
  currentUserLevel: number
}

const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

export function InventoryOrderTable({initialEntries, inventories, currentUserRole, currentUserLevel}: Props) {
  const router = useRouter()
  const canCreate = currentUserLevel >= 40 || currentUserRole === 'Administrator'
  const canEdit = currentUserLevel >= 40 || currentUserRole === 'Administrator'
  const canApprove = currentUserLevel >= 60 || currentUserRole === 'Administrator'
  const canDelete = currentUserLevel >= 60 || currentUserRole === 'Administrator'

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [materialNumberFilter, setMaterialNumberFilter] = useState<MaterialNumberFilter>('all')
  const [sortField, setSortField] = useState<SortField>('orderDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MappedInventoryOrder | null>(null)

  const filtered = initialEntries
    .filter(e => {
      const status = e.deleted ? 'deleted' : e.rejected ? 'rejected' : e.approved ? 'approved' : 'pending'
      if (statusFilter !== 'all' && status !== statusFilter) return false

      const numberClass = classifyMaterialNumber(e.inventoryBeNumber)
      if (materialNumberFilter === 'be' && numberClass !== 'be') return false
      if (materialNumberFilter === 'iso' && numberClass !== 'iso') return false

      if (!search) return true
      const q = search.toLowerCase()
      return (
        e.orderNumber.toLowerCase().includes(q) ||
        (e.shortDescription ?? '').toLowerCase().includes(q) ||
        (e.inventoryBeNumber ?? '').toLowerCase().includes(q) ||
        (e.inventoryDescription ?? '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const cmp = (x: string | null | undefined, y: string | null | undefined) => dir * (x ?? '').localeCompare(y ?? '')
      switch (sortField) {
        case 'orderDate': return cmp(a.orderDate, b.orderDate)
        case 'orderNumber': return cmp(a.orderNumber, b.orderNumber)
        case 'shortDescription': return cmp(a.shortDescription, b.shortDescription)
        case 'inventoryBeNumber': return cmp(a.inventoryBeNumber, b.inventoryBeNumber)
        default: return 0
      }
    })

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  async function handleSave(e: MappedInventoryOrder) {
    if (editing) {
      await updateInventoryOrderAction({
        id: e.id, materialId: e.materialId, orderNumber: e.orderNumber,
        requestedQty: e.requestedQty,
        orderDate: e.orderDate, shortDescription: e.shortDescription, longDescription: e.longDescription,
      })
    } else {
      await createInventoryOrderAction({
        materialId: e.materialId, orderNumber: e.orderNumber, requestedQty: e.requestedQty,
        orderDate: e.orderDate, shortDescription: e.shortDescription, longDescription: e.longDescription,
      })
    }
    setEditing(null)
    router.refresh()
  }

  async function handleDelete(entry: MappedInventoryOrder) {
    const confirmed = window.confirm(
      `Delete order request ${entry.orderNumber}? This will soft-delete it and remove linked demand source lines.`,
    )
    if (!confirmed) return
    await softDeleteInventoryOrderAction({id: entry.id})
    router.refresh()
  }

  async function handleReject(entry: MappedInventoryOrder) {
    const confirmed = window.confirm(`Reject order request ${entry.orderNumber}?`)
    if (!confirmed) return
    await rejectInventoryOrderAction({id: entry.id})
    router.refresh()
  }

  async function handleHardDelete(entry: MappedInventoryOrder) {
    const confirmed = window.confirm(
      `Permanently delete order request ${entry.orderNumber}? This cannot be undone.`,
    )
    if (!confirmed) return
    await hardDeleteInventoryOrderAction({id: entry.id})
    router.refresh()
  }

  async function handleApprove(id: string) {
    await approveInventoryOrderAction({id})
    router.refresh()
  }

  async function handleRestore(entry: MappedInventoryOrder) {
    const confirmed = window.confirm(
      entry.approved
        ? `Restore order request ${entry.orderNumber}? This will also restore the linked material demand source.`
        : `Restore order request ${entry.orderNumber}?`,
    )
    if (!confirmed) return

    await undeleteInventoryOrderAction({id: entry.id})
    router.refresh()
  }

  function renderStatus(entry: MappedInventoryOrder) {
    if (entry.deleted) {
      return <Badge className="text-[10px] bg-slate-500/15 text-slate-700 border border-slate-500/30">Deleted</Badge>
    }
    if (entry.rejected) {
      return <Badge className="text-[10px] bg-red-500/15 text-red-700 border border-red-500/30">Rejected</Badge>
    }
    if (entry.approved) {
      return <Badge className="text-[10px] bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">Approved</Badge>
    }
    return <Badge className="text-[10px] bg-amber-500/15 text-amber-700 border border-amber-500/30">Pending</Badge>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search order, description, BE…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-secondary border-border placeholder:text-muted-foreground/60" />
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-40 bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          <Select value={materialNumberFilter} onValueChange={v => setMaterialNumberFilter(v as MaterialNumberFilter)}>
            <SelectTrigger className="w-32 bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Mat.</SelectItem>
              <SelectItem value="be">BE (&lt; 4000000)</SelectItem>
              <SelectItem value="iso">ISO (&gt;= 4000000)</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{filtered.length} / {initialEntries.length}</span>
          <Button disabled={!canCreate} onClick={() => { setEditing(null); setDialogOpen(true) }} className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
            <Plus className="h-4 w-4" /> New Request
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className={thClass} onClick={() => toggleSort('orderDate')}>
                Order Date <SortIcon field="orderDate" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('orderNumber')}>
                Order # <SortIcon field="orderNumber" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass}>
                Qty
              </TableHead>
              <TableHead className="text-xs whitespace-nowrap">Status</TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('inventoryBeNumber')}>
                Inventory Item <SortIcon field="inventoryBeNumber" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('shortDescription')}>
                Description <SortIcon field="shortDescription" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className="text-xs whitespace-nowrap">Created / Decision</TableHead>
              <TableHead className="w-20"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                  No order requests found.
                </TableCell>
              </TableRow>
            ) : filtered.map(entry => (
              <TableRow key={entry.id} className={`border-border/40 hover:bg-secondary/50 ${entry.deleted ? 'opacity-70' : ''}`}>
                <TableCell className={tdClass}>{formatDate(entry.orderDate)}</TableCell>
                <TableCell className={`${tdClass} font-medium text-foreground`}>{entry.orderNumber}</TableCell>
                <TableCell className={tdClass}>{entry.requestedQty}</TableCell>
                <TableCell>{renderStatus(entry)}</TableCell>
                <TableCell className={tdClass}>
                  <div className="flex flex-col gap-0.5">
                    <span>{entry.inventoryBeNumber ?? '—'}</span>
                    {entry.inventoryDescription && (
                      <span className="text-[11px] text-muted-foreground">{entry.inventoryDescription}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className={`${tdClass} max-w-50 truncate`}>{entry.shortDescription}</TableCell>
                <TableCell className={tdClass}>
                  <div className="flex flex-col gap-0.5">
                    <span>{entry.createdByName}</span>
                    {entry.approved && (
                      <span className="text-[11px] text-emerald-700">
                        Approved{entry.approvedByName ? ` by ${entry.approvedByName}` : ''}
                      </span>
                    )}
                    {entry.rejected && (
                      <span className="text-[11px] text-red-700">
                        Rejected{entry.rejectedByName ? ` by ${entry.rejectedByName}` : ''}
                      </span>
                    )}
                    {entry.deleted && (
                      <span className="text-[11px] text-red-700">
                        Deleted{entry.deletedByName ? ` by ${entry.deletedByName}` : ''}
                      </span>
                    )}
                    {!entry.approved && !entry.deleted && <span className="text-[11px] text-muted-foreground">Waiting approval</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {entry.deleted ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11px] text-sky-700 hover:bg-sky-500/10"
                          disabled={!canDelete}
                          onClick={() => handleRestore(entry)}>
                          <RotateCcw className="mr-1 h-3.5 w-3.5" />
                          Restore
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          disabled={!canDelete}
                          onClick={() => handleHardDelete(entry)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10"
                      disabled={!canApprove || entry.approved || entry.deleted || entry.rejected}
                      onClick={() => handleApprove(entry.id)}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-600 hover:bg-red-500/10"
                      disabled={!canApprove || entry.approved || entry.deleted || entry.rejected}
                      onClick={() => handleReject(entry)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                      disabled={!canEdit || entry.deleted}
                      onClick={() => { setEditing(entry); setDialogOpen(true) }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      disabled={!canDelete || entry.deleted}
                      onClick={() => handleDelete(entry)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <InventoryOrderFormDialog open={dialogOpen} onOpenChange={setDialogOpen} entry={editing} inventories={inventories} onSave={handleSave} />
    </div>
  )
}

