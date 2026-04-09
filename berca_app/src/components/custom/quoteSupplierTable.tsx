'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Search, ChevronDown, ChevronUp, Plus, Pencil, Trash2} from 'lucide-react'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {
  QuoteSupplierFormDialog,
  type CompanyOption,
  type PaymentConditionOption,
} from '@/components/custom/quoteSupplierFormDialog'
import type {MappedQuoteSupplier} from '@/types/quoteSupplier'
import {
  createQuoteSupplierAction,
  updateQuoteSupplierAction,
  softDeleteQuoteSupplierAction,
  hardDeleteQuoteSupplierAction,
} from '@/serverFunctions/quoteSuppliers'

type SortField = 'quoteNumber' | 'companyName' | 'validUntill' | 'deliveryTimeDays'
type SortDir = 'asc' | 'desc'
type StatusFilter = 'all' | 'accepted' | 'rejected' | 'pending'
type FilterDeleted = 'not-deleted' | 'deleted' | 'all'
const QUOTE_NUMBER_BASE = 1_000_000

function parseQuoteNumber(value: string | null | undefined): number | null {
  if (!value) return null
  const match = /^Q(\d+)$/.exec(value.trim().toUpperCase())
  if (!match) return null
  const parsed = Number.parseInt(match[1], 10)
  return Number.isFinite(parsed) ? parsed : null
}

function formatQuoteNumber(n: number): string {
  return `Q${n}`
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function SortIcon({field, sortField, sortDir}: {field: SortField; sortField: SortField; sortDir: SortDir}) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? <ChevronUp className="inline h-3.5 w-3.5 ml-1" /> : <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
}

interface Props {
  initialEntries: MappedQuoteSupplier[]
  companies: CompanyOption[]
  paymentConditions: PaymentConditionOption[]
  currentUserRole: string
  currentUserLevel: number
}

const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

function extractActionError(result: unknown): string | null {
  if (!result || typeof result !== 'object' || !('success' in result) || (result as {success?: boolean}).success !== false) {
    return null
  }

  const errors = (result as {errors?: {global?: string[]; message?: string[]}}).errors
  return errors?.message?.[0] ?? errors?.global?.[0] ?? 'Could not save quote supplier.'
}

export function QuoteSupplierTable({
  initialEntries,
  companies,
  paymentConditions,
  currentUserRole,
  currentUserLevel,
}: Props) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canEdit = currentUserLevel >= 40
  const canCreate = currentUserLevel >= 60
  const canDelete = currentUserLevel >= 80
  const canEditNumber = currentUserLevel >= 80

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [sortField, setSortField] = useState<SortField>('validUntill')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MappedQuoteSupplier | null>(null)

  const highestQuoteNumber = initialEntries.reduce((max, entry) => {
    const parsed = parseQuoteNumber(entry.quoteNumber)
    return parsed !== null && parsed > max ? parsed : max
  }, QUOTE_NUMBER_BASE - 1)
  const defaultQuoteNumber = formatQuoteNumber(Math.max(QUOTE_NUMBER_BASE, highestQuoteNumber + 1))

  const filtered = initialEntries
    .filter(e => {
      if (filterDeleted === 'not-deleted' && e.deleted) return false
      if (filterDeleted === 'deleted' && !e.deleted) return false
      if (statusFilter === 'accepted' && !e.acceptedForPOB) return false
      if (statusFilter === 'rejected' && !e.rejected) return false
      if (statusFilter === 'pending' && (e.rejected || e.acceptedForPOB)) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        e.quoteNumber.toLowerCase().includes(q) ||
        (e.quotationNumber ?? '').toLowerCase().includes(q) ||
        e.companyName.toLowerCase().includes(q) ||
        (e.description ?? '').toLowerCase().includes(q) ||
        (e.paymentConditionName ?? '').toLowerCase().includes(q) ||
        (e.additionalInfo ?? '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const cmp = (x: string | null | undefined, y: string | null | undefined) => dir * (x ?? '').localeCompare(y ?? '')
      switch (sortField) {
        case 'quoteNumber':
          return cmp(a.quoteNumber, b.quoteNumber)
        case 'companyName':
          return cmp(a.companyName, b.companyName)
        case 'validUntill':
          return cmp(a.validUntill, b.validUntill)
        case 'deliveryTimeDays':
          return dir * ((a.deliveryTimeDays ?? 0) - (b.deliveryTimeDays ?? 0))
        default:
          return 0
      }
    })

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }

  async function handleSave(e: MappedQuoteSupplier) {
    const payload = {
      quoteNumber: e.quoteNumber,
      quotationNumber: e.quotationNumber,
      companyId: e.companyId,
      description: e.description,
      rejected: e.rejected,
      additionalInfo: e.additionalInfo,
      acceptedForPOB: e.acceptedForPOB,
      validUntill: e.validUntill,
      deliveryTimeDays: e.deliveryTimeDays,
      paymentConditionId: e.paymentConditionId,
    }
    const result = editing ? await updateQuoteSupplierAction({id: e.id, ...payload}) : await createQuoteSupplierAction(payload)
    const error = extractActionError(result)
    if (error) throw new Error(error)
    setEditing(null)
    router.refresh()
  }

  async function handleSoftDelete(id: string) {
    await softDeleteQuoteSupplierAction({id})
    router.refresh()
  }

  async function handleHardDelete(id: string) {
    await hardDeleteQuoteSupplierAction({id})
    router.refresh()
  }

  function statusBadge(e: MappedQuoteSupplier) {
    if (e.rejected) return <Badge className="border text-xs bg-red-500/10 text-red-600 border-red-500/30">Rejected</Badge>
    if (e.acceptedForPOB) return <Badge className="border text-xs bg-green-500/10 text-green-600 border-green-500/30">Accepted</Badge>
    return <Badge className="border text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pending</Badge>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search quote number, supplier…" value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border placeholder:text-muted-foreground/60" />
          </div>
          <Select value={filterDeleted} onValueChange={v => setFilterDeleted(v as FilterDeleted)}>
            <SelectTrigger className="w-40 bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="not-deleted">Not Deleted</SelectItem>
              <SelectItem value="deleted">Deleted Only</SelectItem>
              <SelectItem value="all">Show All</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-40 bg-secondary border-border">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{filtered.length} / {initialEntries.length}</span>
          {canCreate && (
            <Button
              onClick={() => {
                setEditing(null)
                setDialogOpen(true)
              }}
              className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
              <Plus className="h-4 w-4" /> New Quote
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className="text-xs whitespace-nowrap">Status</TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('quoteNumber')}>
                Quote Number <SortIcon field="quoteNumber" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('companyName')}>
                Supplier <SortIcon field="companyName" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className="text-xs whitespace-nowrap max-w-50">Description</TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('validUntill')}>
                Valid Until <SortIcon field="validUntill" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('deliveryTimeDays')}>
                Delivery (days) <SortIcon field="deliveryTimeDays" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className="text-xs whitespace-nowrap">Payment</TableHead>
              <TableHead className="text-xs whitespace-nowrap">Created By</TableHead>
              {filterDeleted !== 'not-deleted' && (
                <>
                  <TableHead className="text-xs whitespace-nowrap">Deleted At</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Deleted By</TableHead>
                </>
              )}
              <TableHead className="w-24"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={filterDeleted !== 'not-deleted' ? 11 : 9} className="h-28 text-center text-muted-foreground">
                  No supplier quotes found.
                </TableCell>
              </TableRow>
            ) : filtered.map(entry => (
              <TableRow key={entry.id} className={`border-border/40 hover:bg-secondary/50 ${entry.deleted ? 'opacity-50' : ''}`}>
                <TableCell>{statusBadge(entry)}</TableCell>
                <TableCell className={tdClass}>{entry.quoteNumber}</TableCell>
                <TableCell className={tdClass}>{entry.companyName}</TableCell>
                <TableCell className={`${tdClass} max-w-50 truncate`}>{entry.description ?? '—'}</TableCell>
                <TableCell className={tdClass}>{formatDate(entry.validUntill)}</TableCell>
                <TableCell className={tdClass}>{entry.deliveryTimeDays ?? '—'}</TableCell>
                <TableCell className={tdClass}>{entry.paymentConditionName ?? '—'}</TableCell>
                <TableCell className={tdClass}>{entry.createdByName}</TableCell>
                {filterDeleted !== 'not-deleted' && (
                  <>
                    <TableCell className={tdClass}>{formatDate(entry.deletedAt)}</TableCell>
                    <TableCell className={tdClass}>{entry.deletedByName ?? '—'}</TableCell>
                  </>
                )}
                <TableCell>
                  <div className="flex items-center gap-1">
                    {!entry.deleted && canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                        onClick={() => {
                          setEditing(entry)
                          setDialogOpen(true)
                        }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {!entry.deleted && canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleSoftDelete(entry.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {entry.deleted && (
                      <>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => handleHardDelete(entry.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <QuoteSupplierFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={editing}
        companies={companies}
        paymentConditions={paymentConditions}
        defaultQuoteNumber={defaultQuoteNumber}
        canEditNumber={canEditNumber}
        onSave={handleSave}
      />
    </div>
  )
}

