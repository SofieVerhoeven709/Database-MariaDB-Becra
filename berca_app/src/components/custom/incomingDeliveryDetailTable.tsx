'use client'

import {useMemo, useState} from 'react'
import {useRouter} from 'next/navigation'
import {Plus, Pencil, Trash2, Link2} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Checkbox} from '@/components/ui/checkbox'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import type {
  MappedIncomingDeliveryLine,
  MappedIncomingDeliveryLineAllocation,
  MaterialDemandSourceOption,
  WarehousePlaceOption,
} from '@/types/incomingDelivery'
import {
  createIncomingDeliveryLineAction,
  updateIncomingDeliveryLineAction,
  softDeleteIncomingDeliveryLineAction,
  undeleteIncomingDeliveryLineAction,
  hardDeleteIncomingDeliveryLineAction,
  createIncomingDeliveryLineAllocationAction,
  createIncomingDeliveryOverDeliveryAllocationAction,
  softDeleteIncomingDeliveryLineAllocationAction,
  undeleteIncomingDeliveryLineAllocationAction,
  hardDeleteIncomingDeliveryLineAllocationAction,
} from '@/serverFunctions/incomingDeliveries'
import {INCOMING_PERMISSION_LEVELS} from '@/constants'

type FilterDeleted = 'not-deleted' | 'deleted' | 'all'

interface MaterialOption {
  id: string
  label: string
  warehousePlaceId: string | null
}

interface PurchaseDetailOption {
  id: string
  label: string
  materialId: string
}

interface Props {
  incomingDeliveryId: string
  lines: MappedIncomingDeliveryLine[]
  allocationsByLineId: Record<string, MappedIncomingDeliveryLineAllocation[]>
  materialOptions: MaterialOption[]
  purchaseDetailOptions: PurchaseDetailOption[]
  materialDemandSourceOptions: MaterialDemandSourceOption[]
  warehousePlaceOptions: WarehousePlaceOption[]
  currentUserRole: string
  currentUserLevel: number
}

interface LineFormState {
  id?: string
  purchaseDetailId: string
  materialId: string
  orderedQty: string
  deliveredQty: string
  acceptedQty: string
  rejectedQty: string
  backorderQty: string
  unitPrice: string
  lineStatus: string
  notCorrect: boolean
  notCorrectReason: string
}

function emptyLineForm(): LineFormState {
  return {
    purchaseDetailId: '__none__',
    materialId: '__none__',
    orderedQty: '0',
    deliveredQty: '0',
    acceptedQty: '0',
    rejectedQty: '0',
    backorderQty: '0',
    unitPrice: '',
    lineStatus: 'RECEIVED',
    notCorrect: false,
    notCorrectReason: '',
  }
}

function formatMoney(value: string | null) {
  if (!value) return '—'
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed)) return '—'
  return new Intl.NumberFormat('nl-BE', {style: 'currency', currency: 'EUR'}).format(parsed)
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

export function IncomingDeliveryDetailTable({
  incomingDeliveryId,
  lines,
  allocationsByLineId,
  materialOptions,
  purchaseDetailOptions,
  materialDemandSourceOptions,
  warehousePlaceOptions,
  currentUserRole,
  currentUserLevel,
}: Props) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canEdit = isAdmin || currentUserLevel >= INCOMING_PERMISSION_LEVELS.edit
  const canCreate = isAdmin || currentUserLevel >= INCOMING_PERMISSION_LEVELS.create
  const canDelete = isAdmin || currentUserLevel >= INCOMING_PERMISSION_LEVELS.delete
  const canAddSourceLink = isAdmin || currentUserLevel >= INCOMING_PERMISSION_LEVELS.addSourceLink
  const canDeleteSourceLink = isAdmin || currentUserLevel >= INCOMING_PERMISSION_LEVELS.deleteSourceLink

  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [form, setForm] = useState<LineFormState>(emptyLineForm())
  const [saving, setSaving] = useState(false)
  const [editingLineId, setEditingLineId] = useState<string | null>(null)
  const [expandedLineId, setExpandedLineId] = useState<string | null>(null)
  const [allocationSourceId, setAllocationSourceId] = useState<string>('__none__')
  const [allocationQty, setAllocationQty] = useState('1')
  const [warehousePlaceId, setWarehousePlaceId] = useState<string>('__none__')
  const [warehouseAllocationQty, setWarehouseAllocationQty] = useState('1')

  const materialById = useMemo(() => new Map(materialOptions.map(option => [option.id, option])), [materialOptions])
  const lineById = useMemo(() => new Map(lines.map(line => [line.id, line])), [lines])

  // Filter lines client-side so deleted ones can be shown/hidden without a server round-trip.
  const visibleLines = useMemo(() => {
    return lines.filter(line => {
      if (filterDeleted === 'not-deleted') return !line.deleted
      if (filterDeleted === 'deleted') return line.deleted
      return true
    })
  }, [lines, filterDeleted])

  function loadLine(line: MappedIncomingDeliveryLine) {
    setEditingLineId(line.id)
    setForm({
      id: line.id,
      purchaseDetailId: line.purchaseDetailId ?? '__none__',
      materialId: line.materialId,
      orderedQty: String(line.orderedQty),
      deliveredQty: String(line.deliveredQty),
      acceptedQty: String(line.acceptedQty),
      rejectedQty: String(line.rejectedQty),
      backorderQty: String(line.backorderQty),
      unitPrice: line.unitPrice ?? '',
      lineStatus: line.lineStatus,
      notCorrect: line.notCorrect,
      notCorrectReason: line.notCorrectReason ?? '',
    })
  }

  function resetForm() {
    setEditingLineId(null)
    setForm(emptyLineForm())
  }

  async function saveLine() {
    if (editingLineId && !canEdit) return
    if (!editingLineId && !canCreate) return
    if (!form.materialId || form.materialId === '__none__') return

    // Normalize string inputs into numeric payload values.
    const payload = {
      incomingDeliveryId,
      purchaseDetailId: form.purchaseDetailId === '__none__' ? null : form.purchaseDetailId,
      materialId: form.materialId,
      orderedQty: Number.parseInt(form.orderedQty, 10) || 0,
      deliveredQty: Number.parseInt(form.deliveredQty, 10) || 0,
      acceptedQty: Number.parseInt(form.acceptedQty, 10) || 0,
      rejectedQty: Number.parseInt(form.rejectedQty, 10) || 0,
      backorderQty: Number.parseInt(form.backorderQty, 10) || 0,
      unitPrice: form.unitPrice || null,
      lineStatus: form.lineStatus,
      notCorrect: form.notCorrect,
      notCorrectReason: form.notCorrect ? form.notCorrectReason || null : null,
    }

    setSaving(true)
    try {
      if (editingLineId) {
        await updateIncomingDeliveryLineAction({id: editingLineId, ...payload})
      } else {
        await createIncomingDeliveryLineAction(payload)
      }
      resetForm()
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function deleteLine(lineId: string) {
    if (!canDelete) return
    await softDeleteIncomingDeliveryLineAction({id: lineId, incomingDeliveryId})
    if (editingLineId === lineId) resetForm()
    router.refresh()
  }

  async function restoreLine(lineId: string) {
    if (!canDelete) return
    await undeleteIncomingDeliveryLineAction({id: lineId, incomingDeliveryId})
    router.refresh()
  }

  async function hardDeleteLine(lineId: string) {
    if (!isAdmin) return
    await hardDeleteIncomingDeliveryLineAction({id: lineId, incomingDeliveryId})
    if (editingLineId === lineId) resetForm()
    if (expandedLineId === lineId) setExpandedLineId(null)
    router.refresh()
  }

  async function addAllocation() {
    if (!canAddSourceLink) return
    if (!expandedLineId) return
    if (!allocationSourceId || allocationSourceId === '__none__') return

    await createIncomingDeliveryLineAllocationAction({
      incomingDeliveryLineId: expandedLineId,
      materialDemandSourceId: allocationSourceId,
      allocatedQty: Number.parseInt(allocationQty, 10) || 1,
    })

    setAllocationSourceId('__none__')
    setAllocationQty('1')
    router.refresh()
  }

  function handleSourceSelectionChange(sourceId: string) {
    setAllocationSourceId(sourceId)
    // Auto-calculate and populate allocation quantity
    if (sourceId && sourceId !== '__none__') {
      const smartAllocations = calculateSmartAllocations(expandedLineId || '')
      const suggestedQty = smartAllocations.get(sourceId) ?? 1
      setAllocationQty(String(Math.max(suggestedQty, 1)))
    } else {
      setAllocationQty('1')
    }
  }

  function handleWarehouseLocationChange(warehouseLocId: string) {
    setWarehousePlaceId(warehouseLocId)
    // Auto-calculate and populate warehouse allocation quantity
    if (warehouseLocId && warehouseLocId !== '__none__' && expandedLine) {
      const availableQty = overDeliveredQty > 0 ? overDeliveredRemainingQty : expandedLine.deliveredQty
      setWarehouseAllocationQty(String(Math.max(availableQty, 1)))
    } else {
      setWarehouseAllocationQty('1')
    }
  }

  async function deleteAllocation(allocationId: string, lineId: string) {
    if (!canDeleteSourceLink) return
    await softDeleteIncomingDeliveryLineAllocationAction({
      id: allocationId,
      incomingDeliveryLineId: lineId,
      incomingDeliveryId,
    })

    router.refresh()
  }

  async function restoreAllocation(allocationId: string, lineId: string) {
    if (!canDeleteSourceLink) return
    await undeleteIncomingDeliveryLineAllocationAction({
      id: allocationId,
      incomingDeliveryLineId: lineId,
      incomingDeliveryId,
    })
    router.refresh()
  }

  async function hardDeleteAllocation(allocationId: string, lineId: string) {
    if (!isAdmin) return
    await hardDeleteIncomingDeliveryLineAllocationAction({
      id: allocationId,
      incomingDeliveryLineId: lineId,
      incomingDeliveryId,
    })
    router.refresh()
  }

  async function addOverDeliveryAllocation() {
    if (!canAddSourceLink) return
    if (!expandedLineId) return
    if (!warehousePlaceId || warehousePlaceId === '__none__') return

    await createIncomingDeliveryOverDeliveryAllocationAction({
      incomingDeliveryLineId: expandedLineId,
      warehousePlaceId,
      allocatedQty: Number.parseInt(warehouseAllocationQty, 10) || 1,
    })

    setWarehousePlaceId('__none__')
    setWarehouseAllocationQty('1')
    router.refresh()
  }

  const sourceOptionsForExpandedLine = (() => {
    if (!expandedLineId) return []
    const line = lineById.get(expandedLineId)
    if (!line) return []
    return materialDemandSourceOptions.filter(option => option.materialId === line.materialId && !option.fulfilled)
  })()

  const expandedLine = expandedLineId ? (lineById.get(expandedLineId) ?? null) : null
  const expandedLineMaterialWarehousePlaceId = expandedLine
    ? (materialOptions.find(m => m.id === expandedLine.materialId)?.warehousePlaceId ?? null)
    : null
  const overDeliveredQty = expandedLine ? Math.max(expandedLine.deliveredQty - expandedLine.orderedQty, 0) : 0
  const overDeliveredAssignedQty = expandedLine
    ? (allocationsByLineId[expandedLine.id] ?? [])
        .filter(allocation => allocation.sourceTypeName.toLowerCase() === 'warehouseplace')
        .reduce((sum, allocation) => sum + allocation.allocatedQty, 0)
    : 0
  const overDeliveredRemainingQty = Math.max(overDeliveredQty - overDeliveredAssignedQty, 0)
  const warehousePlaceById = useMemo(
    () => new Map(warehousePlaceOptions.map(option => [option.id, option.label])),
    [warehousePlaceOptions],
  )

  function allocationLabel(allocation: MappedIncomingDeliveryLineAllocation) {
    if (allocation.sourceTypeName.toLowerCase() !== 'warehouseplace') return allocation.materialDemandSourceLabel
    const locationLabel = allocation.sourceReferenceId ? warehousePlaceById.get(allocation.sourceReferenceId) : null
    // Prefer warehouse location label for over-delivery allocations.
    return `WarehousePlace - ${locationLabel ?? allocation.sourceReferenceId ?? allocation.materialDemandSourceLabel}`
  }

  function getOverDeliveryStats(line: MappedIncomingDeliveryLine) {
    const overDeliveredQty = Math.max(line.deliveredQty - line.orderedQty, 0)
    const assignedWarehouseQty = (allocationsByLineId[line.id] ?? [])
      .filter(allocation => allocation.sourceTypeName.toLowerCase() === 'warehouseplace')
      .reduce((sum, allocation) => sum + allocation.allocatedQty, 0)

    return {
      overDeliveredQty,
      assignedWarehouseQty,
      remainingQty: Math.max(overDeliveredQty - assignedWarehouseQty, 0),
    }
  }

  /**
   * Calculate smart allocation amounts for demand sources based on accepted quantity.
   * Returns a map of sourceId → suggested allocation qty.
   *
   * Algorithm:
   * - available = line.acceptedQty
   * - for each source (in order):
   *   - already_allocated = sum of allocations for this source
   *   - can_allocate_more = source.requiredQty - already_allocated
   *   - allocation_for_this_source = min(can_allocate_more, available)
   *   - available -= allocation_for_this_source
   *
   * This ensures we don't over-allocate beyond accepted and don't duplicate existing allocations.
   */
  function calculateSmartAllocations(lineId: string): Map<string, number> {
    const line = lineById.get(lineId)
    const sources = sourceOptionsForExpandedLine
    const currentAllocations = allocationsByLineId[lineId] ?? []

    if (!line) return new Map()

    const result = new Map<string, number>()
    let availableQty = line.acceptedQty

    for (const source of sources) {
      // Sum allocations already made to this source
      const alreadyAllocated = currentAllocations
        .filter(alloc => alloc.materialDemandSourceId === source.id)
        .reduce((sum, alloc) => sum + alloc.allocatedQty, 0)

      // How much more can we allocate to this source?
      const requiredQty = source.requiredQty - alreadyAllocated
      if (requiredQty <= 0) {
        // Already fully allocated
        result.set(source.id, 0)
        continue
      }

      // Allocate the minimum of what's needed and what's available
      const toAllocate = Math.min(requiredQty, availableQty)
      result.set(source.id, toAllocate)
      availableQty -= toAllocate
    }

    return result
  }

  const deletedCount = lines.filter(l => l.deleted).length

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border/60 bg-card p-4 space-y-4">
        <h2 className="text-sm font-medium text-foreground">Incoming line</h2>

        {!canEdit && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800">
            You do not have permission to edit incoming delivery lines.
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-1.5">
            <Label>Purchase detail (optional)</Label>
            <Select
              value={form.purchaseDetailId}
              onValueChange={value => {
                const next = purchaseDetailOptions.find(option => option.id === value)
                setForm(prev => ({
                  ...prev,
                  purchaseDetailId: value,
                  materialId: next ? next.materialId : prev.materialId,
                }))
              }}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select purchase detail" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="__none__">No purchase line link</SelectItem>
                {purchaseDetailOptions.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>Material</Label>
            <Select value={form.materialId} onValueChange={value => setForm(prev => ({...prev, materialId: value}))}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="__none__">Select material</SelectItem>
                {materialOptions.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>Line status</Label>
            <Select value={form.lineStatus} onValueChange={value => setForm(prev => ({...prev, lineStatus: value}))}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {['RECEIVED', 'PARTIAL', 'CLOSED', 'REJECTED'].map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[auto_1fr] items-end">
          <div className="flex items-center gap-2 rounded-md border border-border/60 bg-secondary/30 px-3 py-2">
            <Checkbox
              id="notCorrect"
              checked={form.notCorrect}
              onCheckedChange={checked =>
                setForm(prev => ({
                  ...prev,
                  notCorrect: checked === true,
                  notCorrectReason: checked === true ? prev.notCorrectReason : '',
                }))
              }
            />
            <Label htmlFor="notCorrect" className="text-sm font-normal cursor-pointer">
              Not correct
            </Label>
          </div>
          <div className="grid gap-1.5">
            <Label>Reason</Label>
            <Input
              value={form.notCorrectReason}
              onChange={e => setForm(prev => ({...prev, notCorrectReason: e.target.value}))}
              placeholder="Reason for correction"
              disabled={!form.notCorrect}
              className="bg-secondary border-border"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-6">
          <div className="grid gap-1.5">
            <Label>Ordered</Label>
            <Input
              value={form.orderedQty}
              onChange={e => setForm(prev => ({...prev, orderedQty: e.target.value}))}
              type="number"
              min={0}
              className="bg-secondary border-border"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Delivered</Label>
            <Input
              value={form.deliveredQty}
              onChange={e => setForm(prev => ({...prev, deliveredQty: e.target.value}))}
              type="number"
              min={0}
              className="bg-secondary border-border"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Accepted</Label>
            <Input
              value={form.acceptedQty}
              onChange={e => setForm(prev => ({...prev, acceptedQty: e.target.value}))}
              type="number"
              min={0}
              className="bg-secondary border-border"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Rejected</Label>
            <Input
              value={form.rejectedQty}
              onChange={e => setForm(prev => ({...prev, rejectedQty: e.target.value}))}
              type="number"
              min={0}
              className="bg-secondary border-border"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Backorder</Label>
            <Input
              value={form.backorderQty}
              onChange={e => setForm(prev => ({...prev, backorderQty: e.target.value}))}
              type="number"
              min={0}
              className="bg-secondary border-border"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Unit price</Label>
            <Input
              value={form.unitPrice}
              onChange={e => setForm(prev => ({...prev, unitPrice: e.target.value}))}
              type="number"
              min={0}
              step="0.01"
              className="bg-secondary border-border"
            />
          </div>
        </div>

        {(canCreate || (editingLineId && canEdit)) && (
          <div className="flex justify-end gap-2">
            {editingLineId && (
              <Button variant="outline" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            )}
            <Button
              onClick={saveLine}
              disabled={saving || form.materialId === '__none__' || (editingLineId ? !canEdit : !canCreate)}
              className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
              <Plus className="h-4 w-4" />
              {editingLineId ? 'Save Line' : 'Add Line'}
            </Button>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        {/* Toolbar: deleted filter */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60">
          <p className="text-xs text-muted-foreground">
            {visibleLines.length} line{visibleLines.length === 1 ? '' : 's'}
            {deletedCount > 0 && filterDeleted === 'not-deleted' && ` · ${deletedCount} deleted (hidden)`}
          </p>
          {deletedCount > 0 && (
            <Select value={filterDeleted} onValueChange={v => setFilterDeleted(v as FilterDeleted)}>
              <SelectTrigger className="w-[160px] h-8 text-xs bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="not-deleted">Not deleted</SelectItem>
                <SelectItem value="deleted">Deleted only</SelectItem>
                <SelectItem value="all">Show all</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className="text-xs">Material</TableHead>
              <TableHead className="text-xs">Ordered</TableHead>
              <TableHead className="text-xs">Delivered</TableHead>
              <TableHead className="text-xs">Accepted</TableHead>
              <TableHead className="text-xs">Backorder</TableHead>
              <TableHead className="text-xs">Unit Price</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Flags</TableHead>
              <TableHead className="text-xs">Links</TableHead>
              <TableHead className="w-28">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleLines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                  No incoming lines yet.
                </TableCell>
              </TableRow>
            ) : (
              visibleLines.map(line => (
                <TableRow
                  key={line.id}
                  className={`border-border/40 hover:bg-secondary/50 ${line.deleted ? 'opacity-50' : ''}`}>
                  {(() => {
                    const overDelivery = getOverDeliveryStats(line)
                    return (
                      <>
                        <TableCell className="text-sm text-foreground">
                          {line.materialLabel || materialById.get(line.materialId)?.label || line.materialId}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{line.orderedQty}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{line.deliveredQty}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{line.acceptedQty}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{line.backorderQty}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatMoney(line.unitPrice)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[11px]">
                            {line.lineStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {line.deleted && (
                              <Badge variant="destructive" className="text-[10px] w-fit">
                                Deleted
                              </Badge>
                            )}
                            {line.notCorrect && (
                              <>
                                <Badge variant="destructive" className="text-[10px] w-fit">
                                  Not correct
                                </Badge>
                                {line.notCorrectReason && (
                                  <span className="text-[11px] text-muted-foreground">{line.notCorrectReason}</span>
                                )}
                              </>
                            )}
                            {overDelivery.overDeliveredQty > 0 && (
                              <Badge
                                variant="outline"
                                className={`text-[10px] w-fit ${
                                  overDelivery.remainingQty > 0
                                    ? 'border-amber-500/60 text-amber-700'
                                    : 'border-emerald-500/50 text-emerald-700'
                                }`}>
                                {overDelivery.remainingQty > 0
                                  ? `Over rem: ${overDelivery.remainingQty}`
                                  : 'Over fully allocated'}
                              </Badge>
                            )}
                            {!line.deleted && !line.notCorrect && overDelivery.overDeliveredQty === 0 && '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {!line.deleted && (
                            <Button
                              size="sm"
                              variant={expandedLineId === line.id ? 'secondary' : 'outline'}
                              className="h-7 text-xs"
                              onClick={() => {
                                const isOpening = expandedLineId !== line.id
                                setExpandedLineId(isOpening ? line.id : null)
                                setAllocationSourceId('__none__')
                                setAllocationQty('1')
                                const mat = materialOptions.find(m => m.id === line.materialId)
                                setWarehousePlaceId(
                                  isOpening && mat?.warehousePlaceId ? mat.warehousePlaceId : '__none__',
                                )
                                setWarehouseAllocationQty('1')
                              }}>
                              <Link2 className="h-3.5 w-3.5 mr-1" />
                              {line.allocationCount} source{line.allocationCount === 1 ? '' : 's'}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {!line.deleted && canEdit && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                onClick={() => loadLine(line)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {!line.deleted && canDelete && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                onClick={() => deleteLine(line.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {line.deleted && canDelete && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                onClick={() => restoreLine(line.id)}>
                                Restore
                              </Button>
                            )}
                            {line.deleted && isAdmin && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                title="Permanently delete"
                                onClick={() => hardDeleteLine(line.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </>
                    )
                  })()}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>

      {expandedLineId && (
        <section className="rounded-xl border border-border/60 bg-card p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-foreground">Material demand source links</h3>
            <span className="text-xs text-muted-foreground">
              Add lvl {INCOMING_PERMISSION_LEVELS.addSourceLink}+, delete lvl{' '}
              {INCOMING_PERMISSION_LEVELS.deleteSourceLink}+
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_140px_auto] items-end">
            <div className="grid gap-1.5">
              <Label>Source</Label>
              <Select value={allocationSourceId} onValueChange={handleSourceSelectionChange}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select material demand source" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="__none__">Select source</SelectItem>
                  {sourceOptionsForExpandedLine.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label} ({option.reservedQty}/{option.requiredQty})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Allocated Qty</Label>
              <Input
                type="number"
                min={1}
                value={allocationQty}
                onChange={e => setAllocationQty(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            <Button
              onClick={addAllocation}
              disabled={!canAddSourceLink || allocationSourceId === '__none__'}
              title={`Requires role level ${INCOMING_PERMISSION_LEVELS.addSourceLink}+`}
              className="bg-accent text-accent-foreground hover:bg-accent/80">
              Add Link
            </Button>
          </div>

          {expandedLine && sourceOptionsForExpandedLine.length > 0 && (
            <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 p-3 space-y-2">
              <div className="text-xs text-blue-800 font-medium">Smart Allocation Summary</div>
              <div className="text-xs text-blue-800 space-y-1">
                <div>
                  Available to allocate: <span className="font-mono font-semibold">{expandedLine.acceptedQty}</span>
                </div>
                {sourceOptionsForExpandedLine.map(source => {
                  const smartAllocations = calculateSmartAllocations(expandedLineId || '')
                  const suggestedQty = smartAllocations.get(source.id) ?? 0
                  const currentAllocated = (allocationsByLineId[expandedLineId || ''] ?? [])
                    .filter(alloc => alloc.materialDemandSourceId === source.id)
                    .reduce((sum, alloc) => sum + alloc.allocatedQty, 0)
                  const totalWillBeAllocated = currentAllocated + suggestedQty

                  return (
                    <div key={source.id} className="pl-2 border-l border-blue-500/30">
                      <div className="text-xs">
                        {source.label.substring(0, 40)}:{' '}
                        {currentAllocated > 0 && <span className="text-blue-700">{currentAllocated} already + </span>}
                        <span className="font-mono font-semibold">{suggestedQty}</span>
                        {suggestedQty > 0 && (
                          <span className="text-blue-700">
                            {' '}
                            = <span className="font-mono font-semibold">{totalWillBeAllocated}</span>/
                            {source.requiredQty}
                          </span>
                        )}
                        {suggestedQty === 0 && currentAllocated >= source.requiredQty && (
                          <span className="text-emerald-700"> ✓ Fulfilled</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {(overDeliveredQty > 0 || (sourceOptionsForExpandedLine.length === 0 && expandedLine)) && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-3">
              {overDeliveredQty > 0 ? (
                <div className="text-xs text-amber-800">
                  Over-delivered: {overDeliveredQty} · Assigned to warehouse: {overDeliveredAssignedQty} · Remaining:{' '}
                  {overDeliveredRemainingQty}
                </div>
              ) : (
                <div className="text-xs text-amber-800">
                  No material demand sources available. Assign materials directly to warehouse location.
                </div>
              )}
              <div className="grid gap-3 md:grid-cols-[1fr_140px_auto] items-end">
                <div className="grid gap-1.5">
                  <Label>Warehouse location</Label>
                  <Select value={warehousePlaceId} onValueChange={handleWarehouseLocationChange}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select warehouse location" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="__none__">Select location</SelectItem>
                      {warehousePlaceOptions.map(option => (
                        <SelectItem key={option.id} value={option.id}>
                          <span className="flex items-center gap-2">
                            {option.label}
                            {option.id === expandedLineMaterialWarehousePlaceId && (
                              <Badge variant="outline" className="text-[10px] border-blue-500/60 text-blue-700 ml-1">
                                Current
                              </Badge>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5">
                  <Label>Qty to store</Label>
                  <Input
                    type="number"
                    min={1}
                    max={Math.max(
                      overDeliveredQty > 0 ? overDeliveredRemainingQty : (expandedLine?.deliveredQty ?? 0),
                      1,
                    )}
                    value={warehouseAllocationQty}
                    onChange={e => setWarehouseAllocationQty(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>

                <Button
                  onClick={addOverDeliveryAllocation}
                  disabled={
                    !canAddSourceLink ||
                    warehousePlaceId === '__none__' ||
                    (overDeliveredQty > 0 ? overDeliveredRemainingQty : (expandedLine?.deliveredQty ?? 0)) <= 0
                  }
                  className={
                    overDeliveredQty > 0
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }>
                  {overDeliveredQty > 0 ? 'Store Over-delivery' : 'Assign to Warehouse'}
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-border/50 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="text-xs">Source</TableHead>
                  <TableHead className="text-xs">Allocated Qty</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Created</TableHead>
                  <TableHead className="w-20">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(allocationsByLineId[expandedLineId] ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-20 text-center text-muted-foreground text-sm">
                      No source links yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  (allocationsByLineId[expandedLineId] ?? []).map(allocation => (
                    <TableRow
                      key={allocation.id}
                      className={`border-border/40 ${allocation.deleted ? 'opacity-50' : ''}`}>
                      <TableCell className="text-sm text-muted-foreground">{allocationLabel(allocation)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{allocation.allocatedQty}</TableCell>
                      <TableCell className="text-sm">
                        {allocation.fulfilled ? (
                          <Badge variant="secondary" className="text-[11px] bg-green-500/20 text-green-700">
                            Fulfilled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[11px]">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {allocation.createdByName} · {formatDate(allocation.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {!allocation.deleted && canDeleteSourceLink && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() => deleteAllocation(allocation.id, allocation.incomingDeliveryLineId)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {allocation.deleted && canDeleteSourceLink && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs px-2"
                              onClick={() => restoreAllocation(allocation.id, allocation.incomingDeliveryLineId)}>
                              Restore
                            </Button>
                          )}

                          {allocation.deleted && isAdmin && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() => hardDeleteAllocation(allocation.id, allocation.incomingDeliveryLineId)}>
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
        </section>
      )}
    </div>
  )
}
