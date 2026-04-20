'use client'

import {useMemo, useState} from 'react'
import {useRouter} from 'next/navigation'
import type {Route} from 'next'
import {Search, ChevronDown, ChevronUp, Plus, Pencil, Trash2, ExternalLink} from 'lucide-react'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {PurchaseFormDialog, type PurchaseOption} from '@/components/custom/purchaseFormDialog'
import {normalizePurchaseStatus} from '@/extra/purchases'
import type {MappedPurchase} from '@/types/purchase'
import {
  createPurchaseAction,
  updatePurchaseAction,
  softDeletePurchaseAction,
  hardDeletePurchaseAction,
} from '@/serverFunctions/purchases'

type SortField = 'purchaseNumber' | 'purchaseDate' | 'companyName' | 'quote' | 'status' | 'createdBy'
type SortDir = 'asc' | 'desc'
type StatusFilter = string

function isOrderedNotSentStatus(status: string | null | undefined): boolean {
  const normalized = normalizePurchaseStatus(status)
  return normalized === 'ORDERED'
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function SortIcon({field, sortField, sortDir}: {field: SortField; sortField: SortField; sortDir: SortDir}) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? (
    <ChevronUp className="inline h-3.5 w-3.5 ml-1" />
  ) : (
    <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
  )
}

interface PurchaseTableProps {
  initialPurchases: MappedPurchase[]
  companies: PurchaseOption[]
  quoteSuppliers: PurchaseOption[]
  paymentConditions: PurchaseOption[]
  currentUserRole: string
  currentUserLevel: number
  departmentId: string
}

const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

export function PurchaseTable({
  initialPurchases,
  companies,
  quoteSuppliers,
  paymentConditions,
  currentUserRole,
  currentUserLevel,
  departmentId,
}: PurchaseTableProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canManageOrderedPurchases = currentUserLevel >= 80

  const statusOptions = useMemo(() => {
    const statuses = new Set<string>()
    initialPurchases.forEach(p => {
      if (p.status) statuses.add(p.status)
    })
    // Stable, de-duplicated list for the status filter dropdown.
    return Array.from(statuses).sort()
  }, [initialPurchases])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortField, setSortField] = useState<SortField>('purchaseDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MappedPurchase | null>(null)

  const filtered = initialPurchases
    .filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (!search) return true
      const q = search.toLowerCase()
      // Match against the most common purchase identifiers and labels.
      return (
        (p.purchaseNumber ?? '').toLowerCase().includes(q) ||
        (p.customerPoNumber ?? '').toLowerCase().includes(q) ||
        (p.bocNumber ?? '').toLowerCase().includes(q) ||
        (p.companyName ?? '').toLowerCase().includes(q) ||
        (p.quoteNumber ?? '').toLowerCase().includes(q) ||
        (p.paymentConditionName ?? '').toLowerCase().includes(q) ||
        (p.status ?? '').toLowerCase().includes(q) ||
        p.createdByName.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const cmpStr = (x: string | null | undefined, y: string | null | undefined) =>
        dir * (x ?? '').localeCompare(y ?? '')
      // Comparator switches on the active column, falling back to 0.
      switch (sortField) {
        case 'purchaseNumber':
          return cmpStr(a.purchaseNumber, b.purchaseNumber)
        case 'purchaseDate':
          return cmpStr(a.purchaseDate, b.purchaseDate)
        case 'companyName':
          return cmpStr(a.companyName, b.companyName)
        case 'quote':
          return cmpStr(a.quoteNumber, b.quoteNumber)
        case 'status':
          return cmpStr(a.status, b.status)
        case 'createdBy':
          return cmpStr(a.createdByName, b.createdByName)
        default:
          return 0
      }
    })

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  async function handleSave(p: MappedPurchase) {
    if (editing) {
      await updatePurchaseAction({
        id: p.id,
        purchaseNumber: p.purchaseNumber,
        purchaseDate: p.purchaseDate ?? new Date().toISOString(),
        status: p.status,
        companyId: p.companyId,
        quoteSupplierId: p.quoteSupplierId,
        paymentConditionId: p.paymentConditionId,
        customerPoNumber: p.customerPoNumber,
        bocNumber: p.bocNumber,
        description: p.description,
        additionalInfo: p.additionalInfo,
      })
    } else {
      await createPurchaseAction({
        purchaseNumber: p.purchaseNumber,
        purchaseDate: p.purchaseDate ?? new Date().toISOString(),
        status: p.status,
        companyId: p.companyId,
        quoteSupplierId: p.quoteSupplierId,
        paymentConditionId: p.paymentConditionId,
        customerPoNumber: p.customerPoNumber,
        bocNumber: p.bocNumber,
        description: p.description,
        additionalInfo: p.additionalInfo,
      })
    }
    setEditing(null)
    router.refresh()
  }

  async function handleSoftDelete(id: string) {
    await softDeletePurchaseAction({id})
    router.refresh()
  }

  async function handleHardDelete(id: string) {
    await hardDeletePurchaseAction({id})
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search PO, customer PO, BOC, company, quote or status..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border placeholder:text-muted-foreground/60 focus-visible:ring-accent"
            />
          </div>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v)}>
            <SelectTrigger className="w-45 bg-secondary border-border">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All statuses</SelectItem>
              {statusOptions.map(s => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {filtered.length} / {initialPurchases.length}
          </span>
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
            <Plus className="h-4 w-4" />
            New Purchase Order
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className={thClass} onClick={() => toggleSort('purchaseNumber')}>
                Purchase # <SortIcon field="purchaseNumber" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('purchaseDate')}>
                Purchase Date <SortIcon field="purchaseDate" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('companyName')}>
                Company <SortIcon field="companyName" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('quote')}>
                Quote <SortIcon field="quote" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('status')}>
                Status <SortIcon field="status" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('createdBy')}>
                Created By <SortIcon field="createdBy" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className="w-28">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                  No purchase orders match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(purchase => {
                const secondaryLabel = purchase.customerPoNumber ?? purchase.paymentConditionName ?? ''
                const detailHref = `/departments/${departmentId}/orders/${purchase.id}` as Route
                const isOrderedNotSent = isOrderedNotSentStatus(purchase.status)
                // Ordered purchases are locked unless the user meets the manager threshold.
                const canMutatePurchase = !isOrderedNotSent || canManageOrderedPurchases
                return (
                  <TableRow
                    key={purchase.id}
                    className={`border-border/40 hover:bg-secondary/50 cursor-pointer ${purchase.deleted ? 'opacity-60' : ''}`}
                    onClick={() => router.push(detailHref)}>
                    <TableCell className={`${tdClass} text-foreground font-medium`}>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-accent underline-offset-2 hover:underline">
                          {purchase.purchaseNumber ?? '—'}
                        </span>
                        {secondaryLabel ? (
                          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            {secondaryLabel}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className={tdClass}>{formatDate(purchase.purchaseDate)}</TableCell>
                    <TableCell className={tdClass}>{purchase.companyName ?? '-'}</TableCell>
                    <TableCell className={tdClass}>
                      <div className="flex flex-col gap-0.5">
                        <Badge
                          variant="outline"
                          className="border-border text-muted-foreground font-normal whitespace-nowrap">
                          {purchase.quoteNumber ?? 'Manual'}
                        </Badge>
                        {purchase.paymentConditionName ? (
                          <span className="text-[11px] text-muted-foreground truncate">
                            {purchase.paymentConditionName}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-accent/10 text-accent border-0 font-medium">
                        {purchase.status ?? 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className={tdClass}>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-foreground">{purchase.createdByName}</span>
                        <span className="text-[11px] text-muted-foreground">{formatDate(purchase.createdAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          onClick={() => router.push(detailHref)}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          disabled={!canMutatePurchase}
                          onClick={() => {
                            setEditing(purchase)
                            setDialogOpen(true)
                          }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          disabled={!canMutatePurchase}
                          onClick={() => (isAdmin ? handleHardDelete(purchase.id) : handleSoftDelete(purchase.id))}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <PurchaseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        purchase={editing}
        companies={companies}
        quoteSuppliers={quoteSuppliers}
        paymentConditions={paymentConditions}
        onSave={handleSave}
      />
    </div>
  )
}
