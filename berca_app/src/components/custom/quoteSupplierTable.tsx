'use client'

import {useState} from 'react'
import Link from 'next/link'
import type {Route} from 'next'
import {useRouter} from 'next/navigation'
import {Search, ChevronDown, ChevronUp, Plus, Pencil, Trash2, RotateCcw} from 'lucide-react'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {
  QuoteSupplierFormDialog,
  type CompanyOption,
  type PaymentConditionOption,
} from '@/components/custom/quoteSupplierFormDialog'
import {PaymentConditionFormDialog} from '@/components/custom/paymentConditionFormDialog'
import type {MappedPaymentCondition, MappedQuoteSupplier} from '@/types/quoteSupplier'
import {
  createQuoteSupplierAction,
  updateQuoteSupplierAction,
  softDeleteQuoteSupplierAction,
  hardDeleteQuoteSupplierAction,
  createPaymentConditionAction,
  updatePaymentConditionAction,
  softDeletePaymentConditionAction,
  hardDeletePaymentConditionAction,
  undeletePaymentConditionAction,
  setQuoteSupplierSentAction,
  setQuoteSupplierReceivedAction,
} from '@/serverFunctions/quoteSuppliers'

type SortField = 'quoteNumber' | 'companyName' | 'validUntil' | 'deliveryTimeDays'
type SortDir = 'asc' | 'desc'
type StatusFilter = 'all' | 'pending' | 'sent' | 'received' | 'approved' | 'rejected'
type FilterDeleted = 'not-deleted' | 'deleted' | 'all'
type ExecutionFilter = 'all' | 'executed' | 'active'

const QUOTE_NUMBER_BASE = 1_000_000
const PAYMENT_FILTER_ALL = '__all__'
const PAYMENT_FILTER_NONE = '__none__'

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
  paymentConditionRows: MappedPaymentCondition[]
  currentUserRole: string
  currentUserLevel: number
  defaultMaterialId?: string
  defaultMaterialDemandId?: string
  defaultInitialQuantity?: number
  defaultSupplierId?: string
  departmentId: string
}

const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

function extractActionError(result: unknown): string | null {
  if (!result || typeof result !== 'object' || !('success' in result) || (result as {success?: boolean}).success !== false) {
    return null
  }

  const errors = (result as {errors?: {global?: string[]; message?: string[]}}).errors
  return errors?.message?.[0] ?? errors?.global?.[0] ?? 'Could not save.'
}

export function QuoteSupplierTable({
  initialEntries,
  companies,
  paymentConditions,
  paymentConditionRows,
  currentUserRole,
  currentUserLevel,
  defaultMaterialId,
  defaultMaterialDemandId,
  defaultInitialQuantity,
  defaultSupplierId,
  departmentId,
}: Props) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canEdit = currentUserLevel >= 40
  const canCreate = currentUserLevel >= 60
  const canDelete = currentUserLevel >= 80
  const canManageApprovedQuotes = currentUserLevel >= 80
  const canEditNumber = currentUserLevel >= 80

  // Quotes tab state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [executionFilter, setExecutionFilter] = useState<ExecutionFilter>('all')
  const [paymentConditionFilter, setPaymentConditionFilter] = useState<string>(PAYMENT_FILTER_ALL)
  const [sortField, setSortField] = useState<SortField>('validUntil')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MappedQuoteSupplier | null>(null)
  const [showCreateWithMaterial, setShowCreateWithMaterial] = useState(!!defaultMaterialId)

  // Payment condition tab state
  const [paymentSearch, setPaymentSearch] = useState('')
  const [paymentFilterDeleted, setPaymentFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [editingPaymentCondition, setEditingPaymentCondition] = useState<MappedPaymentCondition | null>(null)

  const highestQuoteNumber = initialEntries.reduce((max, entry) => {
    const parsed = parseQuoteNumber(entry.quoteNumber)
    return parsed !== null && parsed > max ? parsed : max
  }, QUOTE_NUMBER_BASE - 1)
  const defaultQuoteNumber = formatQuoteNumber(Math.max(QUOTE_NUMBER_BASE, highestQuoteNumber + 1))

  const filtered = initialEntries
    .filter(e => {
      const lifecycle = getLifecycleStatus(e)

      if (filterDeleted === 'not-deleted' && e.deleted) return false
      if (filterDeleted === 'deleted' && !e.deleted) return false

      if (executionFilter === 'executed' && !e.sent) return false
      if (executionFilter === 'active' && e.sent) return false

      if (statusFilter !== 'all' && lifecycle !== statusFilter) return false

      if (paymentConditionFilter === PAYMENT_FILTER_NONE && e.paymentConditionId !== null) return false
      if (
        paymentConditionFilter !== PAYMENT_FILTER_ALL &&
        paymentConditionFilter !== PAYMENT_FILTER_NONE &&
        e.paymentConditionId !== paymentConditionFilter
      ) return false

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
        case 'validUntil':
          return cmp(a.validUntil, b.validUntil)
        case 'deliveryTimeDays':
          return dir * ((a.deliveryTimeDays ?? 0) - (b.deliveryTimeDays ?? 0))
        default:
          return 0
      }
    })

  const filteredPaymentConditions = paymentConditionRows
    .filter(row => {
      if (paymentFilterDeleted === 'not-deleted' && row.deleted) return false
      if (paymentFilterDeleted === 'deleted' && !row.deleted) return false
      if (!paymentSearch) return true
      return row.name.toLowerCase().includes(paymentSearch.toLowerCase())
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
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
      validUntil: e.validUntil,
      deliveryTimeDays: e.deliveryTimeDays,
      paymentConditionId: e.paymentConditionId,
    }

    const result = editing
      ? await updateQuoteSupplierAction({id: e.id, ...payload})
      : await createQuoteSupplierAction({
        ...payload,
        initialMaterialId: defaultMaterialId,
        initialMaterialDemandId: defaultMaterialDemandId,
        initialQuantity: defaultInitialQuantity,
      })

    const error = extractActionError(result)
    if (error) throw new Error(error)
    setEditing(null)
    router.refresh()
  }

  async function handleSavePaymentCondition(name: string, id?: string) {
    if (id) await updatePaymentConditionAction({id, name})
    else await createPaymentConditionAction({name})
    setPaymentDialogOpen(false)
    setEditingPaymentCondition(null)
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

  async function handleExecutedToggle(entry: MappedQuoteSupplier) {
    const result = await setQuoteSupplierSentAction({
      id: entry.id,
      sent: !entry.sent,
    })
    const error = extractActionError(result)
    if (error) throw new Error(error)
    router.refresh()
  }

  async function handleReceivedToggle(entry: MappedQuoteSupplier) {
    const result = await setQuoteSupplierReceivedAction({
      id: entry.id,
      received: !entry.received,
    })
    const error = extractActionError(result)
    if (error) throw new Error(error)
    router.refresh()
  }

  function isExpiredWhenApproved(entry: MappedQuoteSupplier) {
    if (!entry.acceptedForPOB || !entry.validUntil) return false
    const validDate = new Date(entry.validUntil)
    if (Number.isNaN(validDate.getTime())) return false
    return validDate.getTime() < Date.now()
  }

  function getLifecycleStatus(entry: MappedQuoteSupplier): Exclude<StatusFilter, 'all'> {
    if (entry.rejected) return 'rejected'
    if (entry.acceptedForPOB) return 'approved'
    if (entry.received) return 'received'
    if (entry.sent) return 'sent'
    return 'pending'
  }

  function statusBadge(e: MappedQuoteSupplier) {
    const status = getLifecycleStatus(e)

    if (status === 'rejected') return <Badge className="border text-xs bg-red-500/10 text-red-600 border-red-500/30">Rejected</Badge>
    if (status === 'approved' && isExpiredWhenApproved(e)) {
      return <Badge className="border text-xs bg-orange-500/10 text-orange-700 border-orange-500/30">Expired</Badge>
    }
    if (status === 'approved') {
      return <Badge className="border text-xs bg-green-500/10 text-green-600 border-green-500/30">Approved</Badge>
    }
    if (status === 'received') {
      return <Badge className="border text-xs bg-blue-500/10 text-blue-700 border-blue-500/30">Received</Badge>
    }
    if (status === 'sent') {
      return <Badge className="border text-xs bg-slate-500/15 text-slate-700 border-slate-500/30">Sent</Badge>
    }
    return <Badge className="border text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pending</Badge>
  }

  return (
    <div className="flex flex-col gap-6">
      <Tabs defaultValue="quotes">
        <TabsList className="bg-secondary border border-border/60">
          <TabsTrigger value="quotes">
            Quotes
            <Badge variant="secondary" className="ml-2 text-xs">
              {initialEntries.filter(e => !e.deleted).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="payment-conditions">
            Payment Conditions
            <Badge variant="secondary" className="ml-2 text-xs">
              {paymentConditionRows.filter(p => !p.deleted).length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quotes" className="mt-4 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search quote number, supplier…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 bg-secondary border-border placeholder:text-muted-foreground/60"
                />
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
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
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

          <div className="grid gap-3 md:grid-cols-2">
            <Select value={paymentConditionFilter} onValueChange={setPaymentConditionFilter}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Filter by payment condition" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value={PAYMENT_FILTER_ALL}>All payment conditions</SelectItem>
                <SelectItem value={PAYMENT_FILTER_NONE}>No payment condition</SelectItem>
                {paymentConditions.map(condition => (
                  <SelectItem key={condition.id} value={condition.id}>
                    {condition.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={executionFilter} onValueChange={v => setExecutionFilter(v as ExecutionFilter)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Filter by execution state" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All execution states</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="executed">Executed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {defaultMaterialId && showCreateWithMaterial && (
            <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Create a new quote for this material</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Add quote lines and pricing information for the selected material</p>
                  {defaultSupplierId && (
                    <p className="text-xs text-muted-foreground mt-0.5">Supplier will be preselected in the form.</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowCreateWithMaterial(false)} className="text-xs">
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs"
                  onClick={() => {
                    setEditing(null)
                    setDialogOpen(true)
                  }}>
                  Create Quote
                </Button>
              </div>
            </div>
          )}

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
                  <TableHead className={thClass} onClick={() => toggleSort('validUntil')}>
                    Valid Until <SortIcon field="validUntil" sortField={sortField} sortDir={sortDir} />
                  </TableHead>
                  <TableHead className={thClass} onClick={() => toggleSort('deliveryTimeDays')}>
                    Delivery (days) <SortIcon field="deliveryTimeDays" sortField={sortField} sortDir={sortDir} />
                  </TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Lines</TableHead>
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
                    <TableCell colSpan={filterDeleted !== 'not-deleted' ? 12 : 10} className="h-28 text-center text-muted-foreground">
                      No supplier quotes found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(entry => (

                    <TableRow key={entry.id} className={`border-border/40 hover:bg-secondary/50 ${entry.deleted ? 'opacity-50' : ''}`}>
                      <TableCell>{statusBadge(entry)}</TableCell>
                      <TableCell className={tdClass}>
                        <Link
                          href={`/departments/${departmentId}/orderQuote/${entry.id}` as Route}
                          className="text-foreground hover:text-accent hover:underline">
                          {entry.quoteNumber}
                        </Link>
                      </TableCell>
                      <TableCell className={tdClass}>{entry.companyName}</TableCell>
                      <TableCell className={`${tdClass} max-w-50 truncate`}>{entry.description ?? '—'}</TableCell>
                      <TableCell className={tdClass}>{formatDate(entry.validUntil)}</TableCell>
                      <TableCell className={tdClass}>{entry.deliveryTimeDays ?? '—'}</TableCell>
                      <TableCell className={tdClass}>{entry.lineCount}</TableCell>
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
                          {!entry.deleted && canEdit && (!entry.acceptedForPOB || canManageApprovedQuotes) && (
                            <Button
                              variant={entry.sent ? 'secondary' : 'outline'}
                              size="sm"
                              className="h-7 text-[11px]"
                              onClick={() => handleExecutedToggle(entry)}>
                              {entry.sent ? 'Sent' : 'Mark Sent'}
                            </Button>
                          )}
                          {!entry.deleted && canEdit && (!entry.acceptedForPOB || canManageApprovedQuotes) && entry.sent && !entry.rejected && !entry.acceptedForPOB && (
                            <Button
                              variant={entry.received ? 'secondary' : 'outline'}
                              size="sm"
                              className="h-7 text-[11px]"
                              onClick={() => handleReceivedToggle(entry)}>
                              {entry.received ? 'Received' : 'Mark Received'}
                            </Button>
                          )}
                          {!entry.deleted && canEdit && (!entry.acceptedForPOB || canManageApprovedQuotes) && (
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
                          {entry.deleted && isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() => handleHardDelete(entry.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="payment-conditions" className="mt-4 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payment conditions…"
                  value={paymentSearch}
                  onChange={e => setPaymentSearch(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                />
              </div>
              <Select value={paymentFilterDeleted} onValueChange={v => setPaymentFilterDeleted(v as FilterDeleted)}>
                <SelectTrigger className="w-40 bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="not-deleted">Not Deleted</SelectItem>
                  <SelectItem value="deleted">Deleted Only</SelectItem>
                  <SelectItem value="all">Show All</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {canCreate && (
              <Button
                onClick={() => {
                  setEditingPaymentCondition(null)
                  setPaymentDialogOpen(true)
                }}
                className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
                <Plus className="h-4 w-4" /> New Payment Condition
              </Button>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="text-xs whitespace-nowrap">Name</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Created At</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Created By</TableHead>
                  {paymentFilterDeleted !== 'not-deleted' && (
                    <>
                      <TableHead className="text-xs whitespace-nowrap">Deleted</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">Deleted At</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">Deleted By</TableHead>
                    </>
                  )}
                  <TableHead className="w-24"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPaymentConditions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={paymentFilterDeleted !== 'not-deleted' ? 7 : 4} className="h-32 text-center text-muted-foreground">
                      No payment conditions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPaymentConditions.map(row => (
                    <TableRow key={row.id} className={`border-border/40 hover:bg-secondary/50 ${row.deleted ? 'opacity-50' : ''}`}>
                      <TableCell className="text-sm text-foreground font-medium">{row.name}</TableCell>
                      <TableCell className={tdClass}>{formatDate(row.createdAt)}</TableCell>
                      <TableCell className={tdClass}>{row.createdByName}</TableCell>
                      {paymentFilterDeleted !== 'not-deleted' && (
                        <>
                          <TableCell>
                            {row.deleted ? <Badge variant="destructive">Yes</Badge> : <span className="text-muted-foreground text-sm">No</span>}
                          </TableCell>
                          <TableCell className={tdClass}>{formatDate(row.deletedAt)}</TableCell>
                          <TableCell className={tdClass}>{row.deletedByName ?? '—'}</TableCell>
                        </>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {!row.deleted && canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                              onClick={() => {
                                setEditingPaymentCondition(row)
                                setPaymentDialogOpen(true)
                              }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {!row.deleted && canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={async () => {
                                await softDeletePaymentConditionAction({id: row.id})
                                router.refresh()
                              }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {row.deleted && (
                            <>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                  onClick={async () => {
                                    await undeletePaymentConditionAction({id: row.id})
                                    router.refresh()
                                  }}>
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                  onClick={async () => {
                                    await hardDeletePaymentConditionAction({id: row.id})
                                    router.refresh()
                                  }}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <QuoteSupplierFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={editing}
        companies={companies}
        paymentConditions={paymentConditions}
        defaultQuoteNumber={defaultQuoteNumber}
        defaultCompanyId={!editing ? defaultSupplierId : undefined}
        canEditNumber={canEditNumber}
        onSave={handleSave}
      />

      <PaymentConditionFormDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        paymentCondition={editingPaymentCondition}
        onSave={handleSavePaymentCondition}
      />
    </div>
  )
}

