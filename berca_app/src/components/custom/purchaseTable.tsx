'use client'

import {useEffect, useMemo, useState} from 'react'
import {useRouter} from 'next/navigation'
import type {Route} from 'next'
import {Search, ChevronDown, ChevronUp, Plus, Pencil, Trash2, ExternalLink, RotateCcw, Link2} from 'lucide-react'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {PurchaseFormDialog, type PurchaseOption} from '@/components/custom/purchaseFormDialog'
import {PaymentConditionFormDialog} from '@/components/custom/paymentConditionFormDialog'
import {normalizePurchaseStatus} from '@/extra/purchases'
import type {MappedPurchase} from '@/types/purchase'
import type {MappedPaymentCondition} from '@/types/quoteSupplier'
import {generateOrderConfirmationNumber, generatePurchaseNumber} from '@/lib/utils'
import {
  createPurchaseAction,
  updatePurchaseAction,
  softDeletePurchaseAction,
  hardDeletePurchaseAction,
} from '@/serverFunctions/purchases'
import {
  createPaymentConditionAction,
  updatePaymentConditionAction,
  softDeletePaymentConditionAction,
  hardDeletePaymentConditionAction,
  undeletePaymentConditionAction,
} from '@/serverFunctions/quoteSuppliers'

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
  paymentConditionRows: MappedPaymentCondition[]
  currentUserRole: string
  currentUserLevel: number
  departmentId: string
  prefillPurchase?: MappedPurchase | null
  returnToConfirmation?: boolean
}

const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

export function PurchaseTable({
  initialPurchases,
  companies,
  quoteSuppliers,
  paymentConditions,
  paymentConditionRows,
  currentUserRole,
  currentUserLevel,
  departmentId,
  prefillPurchase,
  returnToConfirmation = false,
}: PurchaseTableProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canEdit = currentUserLevel >= 40
  const canCreate = currentUserLevel >= 60
  const canDelete = currentUserLevel >= 80
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
  const [draftPurchase, setDraftPurchase] = useState<MappedPurchase | null>(null)
  const [paymentSearch, setPaymentSearch] = useState('')
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [editingPaymentCondition, setEditingPaymentCondition] = useState<MappedPaymentCondition | null>(null)
  const [prefillHandled, setPrefillHandled] = useState(false)
  const [confirmationCreateFlow, setConfirmationCreateFlow] = useState(false)
  const filteredPaymentConditions = paymentConditionRows
    .filter(row => row.name.toLowerCase().includes(paymentSearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))


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

  useEffect(() => {
    if (!prefillPurchase || prefillHandled) return

    // Start a create flow with copied values from the selected source purchase.
    setDraftPurchase({
      ...prefillPurchase,
      id: '',
      purchaseNumber: generatePurchaseNumber(),
      purchaseDate: new Date().toISOString(),
      bocNumber: generateOrderConfirmationNumber(),
      bocDescription: prefillPurchase.bocDescription ?? prefillPurchase.description ?? null,
      bocCreatedAt: new Date().toISOString(),
      bocStatus: 'DRAFT',
      status: 'DRAFT',
      createdAt: null,
      createdBy: '',
      createdByName: '',
      deleted: false,
      deletedAt: null,
      deletedBy: null,
    })
    setEditing(null)
    setDialogOpen(true)
    setPrefillHandled(true)
    setConfirmationCreateFlow(true)
    router.replace(`/departments/${departmentId}/orders` as Route)
  }, [prefillPurchase, prefillHandled, router, departmentId])

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  async function handleSave(p: MappedPurchase) {
    const isCreateFlow = !editing

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
        bocCustomerName: p.bocCustomerName,
        bocDescription: p.bocDescription,
        bocCreatedAt: p.bocCreatedAt,
        bocStatus: p.bocStatus,
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
        bocCustomerName: p.bocCustomerName,
        bocDescription: p.bocDescription,
        bocCreatedAt: p.bocCreatedAt,
        bocStatus: p.bocStatus,
        description: p.description,
        additionalInfo: p.additionalInfo,
      })
    }
    setEditing(null)
    setDraftPurchase(null)
    if (isCreateFlow && returnToConfirmation && confirmationCreateFlow) {
      setConfirmationCreateFlow(false)
      router.push(`/departments/${departmentId}/purchaseOrdersConfirmation` as Route)
      return
    }
    setConfirmationCreateFlow(false)
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

  async function handleSavePaymentCondition(name: string, id?: string) {
    if (id) await updatePaymentConditionAction({id, name})
    else await createPaymentConditionAction({name})
    setPaymentDialogOpen(false)
    setEditingPaymentCondition(null)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <Tabs defaultValue="orders">
        <TabsList className="bg-secondary border border-border/60">
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="payment-conditions">Payment Conditions</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4 space-y-6">
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
              setDraftPurchase(null)
              setConfirmationCreateFlow(false)
              setDialogOpen(true)
            }}
            disabled={!canCreate}
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
                          onClick={() =>
                            router.push(
                              `/departments/${departmentId}/purchaseOrdersConfirmation?purchaseId=${purchase.id}` as Route,
                            )
                          }>
                          <Link2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          disabled={!canMutatePurchase}
                          onClick={() => {
                            setDraftPurchase(null)
                            setConfirmationCreateFlow(false)
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

        </TabsContent>

        <TabsContent value="payment-conditions" className="mt-4 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payment conditions..."
                value={paymentSearch}
                onChange={e => setPaymentSearch(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
            <Button
              onClick={() => {
                setEditingPaymentCondition(null)
                setPaymentDialogOpen(true)
              }}
              disabled={!canCreate}
              className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
              <Plus className="h-4 w-4" />
              New Payment Condition
            </Button>
          </div>

          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="text-xs whitespace-nowrap">Name</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Created At</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Created By</TableHead>
                  <TableHead className="w-24"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPaymentConditions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No payment conditions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPaymentConditions.map(row => (
                    <TableRow key={row.id} className={`border-border/40 hover:bg-secondary/50 ${row.deleted ? 'opacity-50' : ''}`}>
                      <TableCell className="text-sm text-foreground font-medium">{row.name}</TableCell>
                      <TableCell className={tdClass}>{formatDate(row.createdAt)}</TableCell>
                      <TableCell className={tdClass}>{row.createdByName}</TableCell>
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
                          {row.deleted && canDelete && (
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
                          {row.deleted && isAdmin && (
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

      <PurchaseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        purchase={editing ?? draftPurchase}
        companies={companies}
        quoteSuppliers={quoteSuppliers}
        paymentConditions={paymentConditions}
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
