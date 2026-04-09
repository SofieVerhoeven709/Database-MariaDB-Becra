'use client'

import {Fragment, useMemo, useState} from 'react'
import Link from 'next/link'
import type {Route} from 'next'
import {useRouter} from 'next/navigation'
import {Search, ChevronDown, ChevronUp, Pencil, Check, X, Plus} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Label} from '@/components/ui/label'
import type {MappedMaterialDemand, MaterialDemandMaterialOption} from '@/types/materialDemand'
import {createMaterialDemandAction, updateMaterialDemandAction} from '@/serverFunctions/materialDemands'
import {createInventoryOrderAction} from '@/serverFunctions/inventoryOrders'
import {selectQuoteSupplierLineAction} from '@/serverFunctions/quoteSupplierLines'

type SortField = 'material' | 'totalRequiredQty' | 'reservedQty' | 'sourceCount' | 'quoteLineCount' | 'createdAt'
type SortDir = 'asc' | 'desc'
type RankingPolicy = 'best-price' | 'fastest-delivery' | 'balanced'

interface MaterialDemandTableProps {
  initialEntries: MappedMaterialDemand[]
  materials: MaterialDemandMaterialOption[]
  suppliers: {id: string; name: string}[]
  currentUserRole: string
  currentUserLevel: number
  departmentId: string
}

const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

function extractActionError(result: unknown): string | null {
  if (!result || typeof result !== 'object' || !('success' in result) || (result as {success?: boolean}).success !== false) {
    return null
  }

  const errors = (result as {errors?: {global?: string[]; message?: string[]}}).errors
  return errors?.message?.[0] ?? errors?.global?.[0] ?? 'Could not save material demand.'
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function deliveryRank(days: number | null) {
  return days ?? Number.MAX_SAFE_INTEGER
}

function compareQuoteOptions(
  a: {unitPrice: number; deliveryTimeDays: number | null; isEligibleForBest: boolean},
  b: {unitPrice: number; deliveryTimeDays: number | null; isEligibleForBest: boolean},
  policy: RankingPolicy,
) {
  const aBucket = a.isEligibleForBest ? 0 : 1
  const bBucket = b.isEligibleForBest ? 0 : 1
  if (aBucket !== bBucket) return aBucket - bBucket

  if (policy === 'fastest-delivery') {
    const byDelivery = deliveryRank(a.deliveryTimeDays) - deliveryRank(b.deliveryTimeDays)
    if (byDelivery !== 0) return byDelivery
    return a.unitPrice - b.unitPrice
  }

  if (policy === 'balanced') {
    const aScore = a.unitPrice + deliveryRank(a.deliveryTimeDays) * 0.02
    const bScore = b.unitPrice + deliveryRank(b.deliveryTimeDays) * 0.02
    if (aScore !== bScore) return aScore - bScore
    return a.unitPrice - b.unitPrice
  }

  const byPrice = a.unitPrice - b.unitPrice
  if (byPrice !== 0) return byPrice
  return deliveryRank(a.deliveryTimeDays) - deliveryRank(b.deliveryTimeDays)
}

function SortIcon({field, sortField, sortDir}: {field: SortField; sortField: SortField; sortDir: SortDir}) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? <ChevronUp className="inline h-3.5 w-3.5 ml-1" /> : <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
}

function materialLabel(m: MaterialDemandMaterialOption) {
  return [m.beNumber, m.shortDescription ?? m.name].filter(Boolean).join(' — ') || m.id
}

function generateLowStockRequestNumber(entry: MappedMaterialDemand) {
  const suffix = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 12)
  const materialToken = (entry.materialBeNumber ?? entry.materialId.slice(0, 6)).replace(/\s+/g, '')
  return `REQ-${materialToken}-${suffix}`
}

export function MaterialDemandTable({
  initialEntries,
  materials,
  suppliers,
  currentUserRole,
  currentUserLevel,
  departmentId,
}: MaterialDemandTableProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canEditRequiredQty = isAdmin || currentUserLevel >= 80
  const canCreate = isAdmin || currentUserLevel >= 80
  const canEdit = currentUserLevel >= 40

  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('material')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [creating, setCreating] = useState(false)
  const [newMaterialId, setNewMaterialId] = useState<string>('')
  const [newTotalRequiredQty, setNewTotalRequiredQty] = useState<string>('0')
  const [newReservedQty, setNewReservedQty] = useState<string>('0')
  const [actionError, setActionError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTotalRequiredQty, setEditTotalRequiredQty] = useState<string>('0')
  const [editReservedQty, setEditReservedQty] = useState<string>('0')
  const [expandedDemandIds, setExpandedDemandIds] = useState<Set<string>>(new Set())
  const [lineActionLoadingId, setLineActionLoadingId] = useState<string | null>(null)
  const [rankingPolicy, setRankingPolicy] = useState<RankingPolicy>('balanced')
  const [showEligibleOnly, setShowEligibleOnly] = useState(false)
  const [lowStockRequestDialog, setLowStockRequestDialog] = useState<{entry: MappedMaterialDemand; qty: string} | null>(null)
  const [makeQuoteDialog, setMakeQuoteDialog] = useState<{entry: MappedMaterialDemand; supplierId: string} | null>(null)

  const usedMaterialIds = useMemo(() => new Set(initialEntries.map(e => e.materialId)), [initialEntries])
  const availableMaterials = useMemo(
    () => materials.filter(m => !usedMaterialIds.has(m.id)).sort((a, b) => materialLabel(a).localeCompare(materialLabel(b))),
    [materials, usedMaterialIds],
  )

  const filtered = initialEntries
    .filter(entry => {
      if (!search) return true
      const q = search.toLowerCase()
      return (entry.materialBeNumber ?? '').toLowerCase().includes(q) || (entry.materialName ?? '').toLowerCase().includes(q)
    })
    .sort((a, b) => {
      // Primary sort: low-stock items first
      const aIsLowStock = a.isLowStock ? 0 : 1
      const bIsLowStock = b.isLowStock ? 0 : 1
      if (aIsLowStock !== bIsLowStock) return aIsLowStock - bIsLowStock

      // Secondary sort: items with required quantities first
      const aHasRequired = a.totalRequiredQty > 0 ? 0 : 1
      const bHasRequired = b.totalRequiredQty > 0 ? 0 : 1
      if (aHasRequired !== bHasRequired) return aHasRequired - bHasRequired

      // Tertiary sort: apply user's sort preference
      const dir = sortDir === 'asc' ? 1 : -1
      const cmpStr = (x: string | null | undefined, y: string | null | undefined) => dir * (x ?? '').localeCompare(y ?? '')
      switch (sortField) {
        case 'material':
          return cmpStr(a.materialBeNumber ?? a.materialName, b.materialBeNumber ?? b.materialName)
        case 'totalRequiredQty':
          return dir * (a.totalRequiredQty - b.totalRequiredQty)
        case 'reservedQty':
          return dir * (a.reservedQty - b.reservedQty)
        case 'sourceCount':
          return dir * (a.sourceCount - b.sourceCount)
        case 'quoteLineCount':
          return dir * (a.quoteLineCount - b.quoteLineCount)
        case 'createdAt':
          return cmpStr(a.createdAt, b.createdAt)
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

  function startEdit(entry: MappedMaterialDemand) {
    setEditingId(entry.id)
    setEditTotalRequiredQty(String(entry.totalRequiredQty))
    setEditReservedQty(String(entry.reservedQty))
  }

  function cancelEdit() {
    setEditingId(null)
    setEditTotalRequiredQty('0')
    setEditReservedQty('0')
  }

  function toggleQuotes(demandId: string) {
    setExpandedDemandIds(prev => {
      const next = new Set(prev)
      if (next.has(demandId)) next.delete(demandId)
      else next.add(demandId)
      return next
    })
  }

  async function handleQuoteLineSelection(demandId: string, lineId: string, selected: boolean) {
    try {
      setLineActionLoadingId(lineId)
      const result = await selectQuoteSupplierLineAction({
        id: lineId,
        selected,
        materialDemandId: demandId,
      })
      const error = extractActionError(result)
      if (error) {
        setActionError(error)
        return
      }
      setActionError(null)
      router.refresh()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not update quote selection.')
    } finally {
      setLineActionLoadingId(null)
    }
  }

  async function handleLowStockRequest(entry: MappedMaterialDemand) {
    // Open dialog to let user specify quantity
    setLowStockRequestDialog({
      entry,
      qty: String(entry.suggestedRequestQty),
    })
  }

  function openMakeQuoteDialog(entry: MappedMaterialDemand) {
    setMakeQuoteDialog({entry, supplierId: '__none__'})
  }

  function continueToQuotePage() {
    if (!makeQuoteDialog) return
    if (!makeQuoteDialog.supplierId || makeQuoteDialog.supplierId === '__none__') {
      setActionError('Please select a supplier first.')
      return
    }

    const {entry, supplierId} = makeQuoteDialog
    setMakeQuoteDialog(null)
    setActionError(null)
    router.push(`/departments/${departmentId}/orderQuote?materialId=${entry.materialId}&supplierId=${supplierId}` as Route)
  }

  async function submitLowStockRequest() {
    if (!lowStockRequestDialog) return
    const {entry, qty} = lowStockRequestDialog
    const requestedQty = Number.parseInt(qty, 10)
    if (Number.isNaN(requestedQty) || requestedQty < 1) {
      setActionError('Please enter a valid quantity (at least 1).')
      return
    }

    try {
      if (!entry.requestInventoryId) {
        setActionError('No inventory row linked to this material. Please create inventory first.')
        return
      }

      const result = await createInventoryOrderAction({
        inventoryId: entry.requestInventoryId,
        orderNumber: generateLowStockRequestNumber(entry),
        requestedQty,
        orderDate: new Date().toISOString().slice(0, 10),
        shortDescription: `Low-stock request for ${entry.materialBeNumber ?? entry.materialId}`,
        longDescription: `Stock ${entry.stockQuantity} is at/below minimum ${entry.minimumStockQuantity}.`,
      })

      const error = extractActionError(result)
      if (error) {
        setActionError(error)
        return
      }

      setActionError(null)
      setLowStockRequestDialog(null)
      router.refresh()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not create approval request.')
    }
  }

  async function handleUpdate(id: string) {
    try {
      const totalRequiredQty = Number.parseInt(editTotalRequiredQty, 10)
      const reservedQty = Number.parseInt(editReservedQty, 10)
      const row = initialEntries.find(e => e.id === id)
      const nextTotalRequiredQty = canEditRequiredQty
        ? (Number.isNaN(totalRequiredQty) ? 0 : totalRequiredQty)
        : (row?.totalRequiredQty ?? 0)

      const result = await updateMaterialDemandAction({
        id,
        totalRequiredQty: nextTotalRequiredQty,
        reservedQty: Number.isNaN(reservedQty) ? 0 : reservedQty,
      })
      const error = extractActionError(result)
      if (error) {
        setActionError(error)
        return
      }
      setActionError(null)
      cancelEdit()
      router.refresh()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not save material demand.')
    }
  }

  async function handleCreate() {
    try {
      if (!newMaterialId) return
      const totalRequiredQty = Number.parseInt(newTotalRequiredQty, 10)
      const reservedQty = Number.parseInt(newReservedQty, 10)

      const result = await createMaterialDemandAction({
        materialId: newMaterialId,
        totalRequiredQty: Number.isNaN(totalRequiredQty) ? 0 : totalRequiredQty,
        reservedQty: Number.isNaN(reservedQty) ? 0 : reservedQty,
      })

      const error = extractActionError(result)
      if (error) {
        setActionError(error)
        return
      }

      setNewMaterialId('')
      setNewTotalRequiredQty('0')
      setNewReservedQty('0')
      setActionError(null)
      setCreating(false)
      router.refresh()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not save material demand.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by material number (BE/ISO) or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-secondary border-border placeholder:text-muted-foreground/60"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={rankingPolicy} onValueChange={value => setRankingPolicy(value as RankingPolicy)}>
            <SelectTrigger className="w-44 bg-secondary border-border h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="balanced">Best: Balanced</SelectItem>
              <SelectItem value="best-price">Best: Lowest Price</SelectItem>
              <SelectItem value="fastest-delivery">Best: Fastest Delivery</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={showEligibleOnly ? 'secondary' : 'outline'}
            className="h-9 text-xs"
            onClick={() => setShowEligibleOnly(v => !v)}>
            {showEligibleOnly ? 'Eligible only: ON' : 'Eligible only: OFF'}
          </Button>

          <span className="text-xs uppercase tracking-wide text-muted-foreground">{filtered.length} / {initialEntries.length}</span>
          {canCreate && (
            <Button onClick={() => setCreating(v => !v)} className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
              <Plus className="h-4 w-4" />
              New Demand
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {creating && canCreate && (
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <Select value={newMaterialId || '__none__'} onValueChange={v => setNewMaterialId(v === '__none__' ? '' : v)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="__none__">— Select material —</SelectItem>
                  {availableMaterials.map(material => (
                    <SelectItem key={material.id} value={material.id}>
                      {materialLabel(material)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              type="number"
              min={0}
              value={newTotalRequiredQty}
              onChange={e => setNewTotalRequiredQty(e.target.value)}
              className="bg-secondary border-border"
              placeholder="Total required"
            />
            <Input
              type="number"
              min={0}
              value={newReservedQty}
              onChange={e => setNewReservedQty(e.target.value)}
              className="bg-secondary border-border"
              placeholder="Reserved"
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setActionError(null); setCreating(false) }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newMaterialId}>Create demand row</Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className={thClass} onClick={() => toggleSort('material')}>
                Material <SortIcon field="material" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('totalRequiredQty')}>
                Required Qty <SortIcon field="totalRequiredQty" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('reservedQty')}>
                Reserved Qty <SortIcon field="reservedQty" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('sourceCount')}>
                Sources <SortIcon field="sourceCount" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('quoteLineCount')}>
                Quote Lines <SortIcon field="quoteLineCount" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('createdAt')}>
                Created At <SortIcon field="createdAt" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className="w-24"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                  No material demand rows found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(entry => {
                const isEditing = editingId === entry.id
                const materialHref = `/departments/${departmentId}/material/${entry.materialId}` as Route
                const isExpanded = expandedDemandIds.has(entry.id)
                const quoteOptions = [...entry.quoteOptions].sort((a, b) => compareQuoteOptions(a, b, rankingPolicy))
                const visibleQuoteOptions = showEligibleOnly ? quoteOptions.filter(option => option.isEligibleForBest) : quoteOptions
                const bestOptionId = quoteOptions.find(option => option.isEligibleForBest)?.id ?? null
                return (
                  <Fragment key={entry.id}>
                    <TableRow key={entry.id} className="border-border/40 hover:bg-secondary/50">
                      <TableCell className={tdClass}>
                        <Link href={materialHref} className="hover:text-accent hover:underline transition-colors">
                          <div className={`flex flex-col gap-0.5 rounded-md px-2 py-1 ${entry.isLowStock ? 'border border-amber-500/70 bg-amber-500/10' : ''}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-foreground font-medium">{entry.materialBeNumber ?? '—'}</span>
                              {entry.isLowStock && (
                                <Badge className="text-[10px] border border-amber-500/30 bg-amber-500/10 text-amber-700">Low stock</Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{entry.materialShortDescription ?? entry.materialName ?? entry.materialId}</span>
                            <span className="text-[11px] text-muted-foreground">
                              Stock {entry.stockQuantity} / Min {entry.minimumStockQuantity}
                            </span>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className={tdClass}>
                        {isEditing && canEditRequiredQty ? (
                          <Input
                            type="number"
                            min={0}
                            value={editTotalRequiredQty}
                            onChange={e => setEditTotalRequiredQty(e.target.value)}
                            className="h-8 bg-secondary border-border"
                          />
                        ) : (
                          <Badge variant="secondary" className="text-xs">{entry.totalRequiredQty}</Badge>
                        )}
                      </TableCell>
                      <TableCell className={tdClass}>
                        {isEditing ? (
                          <Input
                            type="number"
                            min={0}
                            value={editReservedQty}
                            onChange={e => setEditReservedQty(e.target.value)}
                            className="h-8 bg-secondary border-border"
                          />
                        ) : (
                          <Badge variant="outline" className="text-xs border-border">{entry.reservedQty}</Badge>
                        )}
                      </TableCell>
                      <TableCell className={tdClass}>{entry.sourceCount}</TableCell>
                      <TableCell className={tdClass}>
                        <div className="flex items-center gap-2">
                          <span>{entry.quoteLineCount}</span>
                          {entry.quoteLineCount > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => toggleQuotes(entry.id)}>
                              {isExpanded ? 'Hide' : 'Compare'}
                            </Button>
                          )}
                          {bestOptionId && (
                            <Badge className="text-[10px] bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">Best</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={tdClass}>{formatDate(entry.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openMakeQuoteDialog(entry)}
                            className="inline-flex h-7 items-center rounded-md border border-accent/50 bg-accent/10 px-2 text-[11px] font-medium text-accent hover:bg-accent/20">
                            Make Quote
                          </button>
                          {entry.isLowStock && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[11px] border-amber-500/60 text-amber-700 hover:bg-amber-500/10"
                              disabled={entry.pendingRequestCount > 0 || !entry.requestInventoryId}
                              onClick={() => handleLowStockRequest(entry)}>
                              {entry.pendingRequestCount > 0 ? 'Pending approval' : 'Request approval'}
                            </Button>
                          )}
                          {isEditing ? (
                            <>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10" onClick={() => handleUpdate(entry.id)}>
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:bg-secondary" onClick={() => { setActionError(null); cancelEdit() }}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : (
                            canEdit && (
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => startEdit(entry)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow className="bg-secondary/20">
                        <TableCell colSpan={7} className="py-3">
                          <div className="rounded-lg border border-border/50 bg-card overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="border-border/50">
                                  <TableHead className="text-xs">Quote</TableHead>
                                  <TableHead className="text-xs">Supplier</TableHead>
                                  <TableHead className="text-xs">Qty</TableHead>
                                  <TableHead className="text-xs">Min Qty</TableHead>
                                  <TableHead className="text-xs">Unit Price</TableHead>
                                  <TableHead className="text-xs">Delivery</TableHead>
                                  <TableHead className="text-xs">Valid Until</TableHead>
                                  <TableHead className="text-xs">Status</TableHead>
                                  <TableHead className="text-xs w-28">
                                    <button
                                      type="button"
                                      onClick={() => openMakeQuoteDialog(entry)}
                                      className="inline-flex h-6 items-center rounded-md border border-accent bg-accent/10 px-2 text-xs text-accent hover:bg-accent/20 font-medium">
                                      New Quote
                                    </button>
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {visibleQuoteOptions.length === 0 && (
                                  <TableRow>
                                    <TableCell colSpan={9} className="text-xs text-muted-foreground py-4">
                                      <div className="flex items-center justify-between gap-3">
                                        <span>No eligible quote options for this material yet.</span>
                                        <div className="flex gap-2">
                                          <button
                                            type="button"
                                            onClick={() => openMakeQuoteDialog(entry)}
                                            className="inline-flex h-7 items-center rounded-md border border-accent bg-accent/10 px-2.5 text-xs text-accent hover:bg-accent/20 font-medium">
                                            Create Quote
                                          </button>
                                          <Link
                                            href={`/departments/${departmentId}/orderQuote` as Route}
                                            className="inline-flex h-7 items-center rounded-md border border-border px-2.5 text-xs text-foreground hover:bg-secondary">
                                            All Quotes
                                          </Link>
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}

                                {visibleQuoteOptions.map(option => {
                                  const isSelected = entry.selectedQuoteLineIds.includes(option.id)
                                  const isLoading = lineActionLoadingId === option.id
                                  const canSelect = option.isCurrentlyValid && !option.rejected && !option.deleted

                                  return (
                                    <TableRow key={option.id} className="border-border/30">
                                      <TableCell className="text-xs text-muted-foreground">{option.quoteNumber}</TableCell>
                                      <TableCell className="text-xs text-muted-foreground">{option.supplierCompanyName}</TableCell>
                                      <TableCell className="text-xs text-muted-foreground">{option.quantity}</TableCell>
                                      <TableCell className="text-xs text-muted-foreground">{option.minQuantity ?? '—'}</TableCell>
                                      <TableCell className="text-xs text-muted-foreground">{formatMoney(option.unitPrice)}</TableCell>
                                      <TableCell className="text-xs text-muted-foreground">
                                        {option.deliveryTimeDays !== null ? `${option.deliveryTimeDays} day(s)` : '—'}
                                      </TableCell>
                                      <TableCell className="text-xs text-muted-foreground">{formatDate(option.validUntill)}</TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-1.5">
                                          {option.id === bestOptionId && (
                                            <Badge className="text-[10px] bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">Best</Badge>
                                          )}
                                          {!option.isCurrentlyValid && (
                                            <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700">Expired</Badge>
                                          )}
                                          {option.rejected && (
                                            <Badge className="text-[10px] bg-red-500/15 text-red-700 border border-red-500/30">Rejected</Badge>
                                          )}
                                          {option.deleted && (
                                            <Badge variant="outline" className="text-[10px]">Deleted</Badge>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          size="sm"
                                          variant={isSelected ? 'secondary' : 'outline'}
                                          className="h-7 text-xs w-full"
                                          disabled={isLoading || (!isSelected && !canSelect)}
                                          onClick={() => handleQuoteLineSelection(entry.id, option.id, !isSelected)}>
                                          {isLoading ? 'Saving…' : isSelected ? 'Selected' : 'Select'}
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Demand rows are unique per material. Auto-create/remove on material lifecycle can be added next.
      </p>

      {/* Low-stock request dialog */}
      <Dialog open={!!lowStockRequestDialog} onOpenChange={open => !open && setLowStockRequestDialog(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Request Stock Replenishment</DialogTitle>
            <DialogDescription>
              How much would you like to request for {lowStockRequestDialog?.entry.materialBeNumber ?? lowStockRequestDialog?.entry.materialId}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground space-y-1">
              <p><strong>Current stock:</strong> {lowStockRequestDialog?.entry.stockQuantity}</p>
              <p><strong>Minimum required:</strong> {lowStockRequestDialog?.entry.minimumStockQuantity}</p>
              <p><strong>Suggested:</strong> {lowStockRequestDialog?.entry.suggestedRequestQty}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="requestQty" className="text-xs">Quantity to request</Label>
              <Input
                id="requestQty"
                type="number"
                min={1}
                value={lowStockRequestDialog?.qty ?? ''}
                onChange={e => {
                  if (lowStockRequestDialog) {
                    setLowStockRequestDialog({...lowStockRequestDialog, qty: e.target.value})
                  }
                }}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLowStockRequestDialog(null)}>Cancel</Button>
            <Button onClick={submitLowStockRequest} className="bg-amber-600 hover:bg-amber-700 text-white">
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!makeQuoteDialog} onOpenChange={open => !open && setMakeQuoteDialog(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Select Supplier</DialogTitle>
            <DialogDescription>
              Choose a supplier for {makeQuoteDialog?.entry.materialBeNumber ?? makeQuoteDialog?.entry.materialId}, then continue to quotes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="makeQuoteSupplier" className="text-xs">Supplier</Label>
            <Select
              value={makeQuoteDialog?.supplierId ?? '__none__'}
              onValueChange={value => {
                if (!makeQuoteDialog) return
                setMakeQuoteDialog({...makeQuoteDialog, supplierId: value})
              }}>
              <SelectTrigger id="makeQuoteSupplier" className="bg-secondary border-border">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="__none__">— Select supplier —</SelectItem>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMakeQuoteDialog(null)}>Cancel</Button>
            <Button onClick={continueToQuotePage}>Continue to Quotes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

