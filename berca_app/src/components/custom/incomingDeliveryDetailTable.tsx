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
} from '@/types/incomingDelivery'
import {
  createIncomingDeliveryLineAction,
  updateIncomingDeliveryLineAction,
  softDeleteIncomingDeliveryLineAction,
  createIncomingDeliveryLineAllocationAction,
  softDeleteIncomingDeliveryLineAllocationAction,
} from '@/serverFunctions/incomingDeliveries'
import {INCOMING_PERMISSION_LEVELS} from '@/constants'

interface MaterialOption {
  id: string
  label: string
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
  const [form, setForm] = useState<LineFormState>(emptyLineForm())
  const [saving, setSaving] = useState(false)
  const [editingLineId, setEditingLineId] = useState<string | null>(null)
  const [expandedLineId, setExpandedLineId] = useState<string | null>(null)
  const [allocationSourceId, setAllocationSourceId] = useState<string>('__none__')
  const [allocationQty, setAllocationQty] = useState('1')

  const materialById = useMemo(() => new Map(materialOptions.map(option => [option.id, option])), [materialOptions])
  const lineById = useMemo(() => new Map(lines.map(line => [line.id, line])), [lines])

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

  async function deleteAllocation(allocationId: string, lineId: string) {
    if (!canDeleteSourceLink) return
    await softDeleteIncomingDeliveryLineAllocationAction({
      id: allocationId,
      incomingDeliveryLineId: lineId,
      incomingDeliveryId,
    })

    router.refresh()
  }

  const sourceOptionsForExpandedLine = (() => {
    if (!expandedLineId) return []
    const line = lineById.get(expandedLineId)
    if (!line) return []
    return materialDemandSourceOptions.filter(option => option.materialId === line.materialId)
  })()

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
              onCheckedChange={checked => setForm(prev => ({...prev, notCorrect: checked === true, notCorrectReason: checked === true ? prev.notCorrectReason : ''}))}
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
            <Input value={form.orderedQty} onChange={e => setForm(prev => ({...prev, orderedQty: e.target.value}))} type="number" min={0} className="bg-secondary border-border" />
          </div>
          <div className="grid gap-1.5">
            <Label>Delivered</Label>
            <Input value={form.deliveredQty} onChange={e => setForm(prev => ({...prev, deliveredQty: e.target.value}))} type="number" min={0} className="bg-secondary border-border" />
          </div>
          <div className="grid gap-1.5">
            <Label>Accepted</Label>
            <Input value={form.acceptedQty} onChange={e => setForm(prev => ({...prev, acceptedQty: e.target.value}))} type="number" min={0} className="bg-secondary border-border" />
          </div>
          <div className="grid gap-1.5">
            <Label>Rejected</Label>
            <Input value={form.rejectedQty} onChange={e => setForm(prev => ({...prev, rejectedQty: e.target.value}))} type="number" min={0} className="bg-secondary border-border" />
          </div>
          <div className="grid gap-1.5">
            <Label>Backorder</Label>
            <Input value={form.backorderQty} onChange={e => setForm(prev => ({...prev, backorderQty: e.target.value}))} type="number" min={0} className="bg-secondary border-border" />
          </div>
          <div className="grid gap-1.5">
            <Label>Unit price</Label>
            <Input value={form.unitPrice} onChange={e => setForm(prev => ({...prev, unitPrice: e.target.value}))} type="number" min={0} step="0.01" className="bg-secondary border-border" />
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
              <TableHead className="w-28"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">No incoming lines yet.</TableCell>
              </TableRow>
            ) : (
              lines.map(line => (
                <TableRow key={line.id} className="border-border/40 hover:bg-secondary/50">
                  <TableCell className="text-sm text-foreground">{line.materialLabel || materialById.get(line.materialId)?.label || line.materialId}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{line.orderedQty}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{line.deliveredQty}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{line.acceptedQty}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{line.backorderQty}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatMoney(line.unitPrice)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[11px]">{line.lineStatus}</Badge>
                  </TableCell>
                  <TableCell>
                    {line.notCorrect ? <Badge variant="destructive" className="text-[10px]">Not correct</Badge> : '—'}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={expandedLineId === line.id ? 'secondary' : 'outline'}
                      className="h-7 text-xs"
                      onClick={() => {
                        setExpandedLineId(expandedLineId === line.id ? null : line.id)
                        setAllocationSourceId('__none__')
                        setAllocationQty('1')
                      }}>
                      <Link2 className="h-3.5 w-3.5 mr-1" />
                      {line.allocationCount} source{line.allocationCount === 1 ? '' : 's'}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => loadLine(line)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => deleteLine(line.id)}>
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
      </section>

      {expandedLineId && (
        <section className="rounded-xl border border-border/60 bg-card p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-foreground">Material demand source links</h3>
            <span className="text-xs text-muted-foreground">Add lvl {INCOMING_PERMISSION_LEVELS.addSourceLink}+, delete lvl {INCOMING_PERMISSION_LEVELS.deleteSourceLink}+</span>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_140px_auto] items-end">
            <div className="grid gap-1.5">
              <Label>Source</Label>
              <Select value={allocationSourceId} onValueChange={setAllocationSourceId}>
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
              <Input type="number" min={1} value={allocationQty} onChange={e => setAllocationQty(e.target.value)} className="bg-secondary border-border" />
            </div>

            <Button
              onClick={addAllocation}
              disabled={!canAddSourceLink || allocationSourceId === '__none__'}
              title={`Requires role level ${INCOMING_PERMISSION_LEVELS.addSourceLink}+`}
              className="bg-accent text-accent-foreground hover:bg-accent/80">
              Add Link
            </Button>
          </div>

          <div className="rounded-lg border border-border/50 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="text-xs">Source</TableHead>
                  <TableHead className="text-xs">Allocated Qty</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Created</TableHead>
                  <TableHead className="w-20"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(allocationsByLineId[expandedLineId] ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-20 text-center text-muted-foreground text-sm">No source links yet.</TableCell>
                  </TableRow>
                ) : (
                  (allocationsByLineId[expandedLineId] ?? []).map(allocation => (
                    <TableRow key={allocation.id} className="border-border/40">
                      <TableCell className="text-sm text-muted-foreground">{allocation.materialDemandSourceLabel}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{allocation.allocatedQty}</TableCell>
                      <TableCell className="text-sm">
                        {allocation.fulfilled ? (
                          <Badge variant="secondary" className="text-[11px] bg-green-500/20 text-green-700">
                            Fulfilled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[11px]">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {allocation.createdByName} · {formatDate(allocation.createdAt)}
                      </TableCell>
                      <TableCell>
                        {canDeleteSourceLink && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            title={`Requires role level ${INCOMING_PERMISSION_LEVELS.deleteSourceLink}+`}
                            onClick={() => deleteAllocation(allocation.id, allocation.incomingDeliveryLineId)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
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


