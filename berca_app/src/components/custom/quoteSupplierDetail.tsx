'use client'

import Link from 'next/link'
import type {Route} from 'next'
import {useMemo, useState} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowLeft, Check, FileText, Pencil, Save, Trash2, X} from 'lucide-react'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Checkbox} from '@/components/ui/checkbox'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Switch} from '@/components/ui/switch'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Textarea} from '@/components/ui/textarea'
import type {MappedQuoteSupplierDetail} from '@/types/quoteSupplier'
import {
  createQuoteSupplierLineAction,
  deleteQuoteSupplierLineAction,
  selectQuoteSupplierLineAction,
  updateQuoteSupplierLineAction,
} from '@/serverFunctions/quoteSupplierLines'
import {updateQuoteSupplierAction} from '@/serverFunctions/quoteSuppliers'
import {
  createQuoteSupplierMiscLineAction,
  updateQuoteSupplierMiscLineAction,
  deleteQuoteSupplierMiscLineAction,
} from '@/serverFunctions/quoteSupplierMiscLines'

// ── Prop types ───────────────────────────────────────────────────────────────

interface QuoteSupplierDetailProps {
  quote: MappedQuoteSupplierDetail
  departmentId: string
  currentUserRole: string
  currentUserLevel: number
  materialOptions: Array<{id: string; beNumber: string | null; name: string | null; shortDescription: string | null}>
  materialDemandOptions: Array<{id: string; materialId: string; label: string}>
  companyOptions: Array<{id: string; name: string}>
  paymentConditionOptions: Array<{id: string; name: string}>
  defaultMaterialId?: string
  defaultMaterialDemandId?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
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

function materialLabel(m: {beNumber: string | null; shortDescription: string | null; name: string | null; id: string}) {
  return [m.beNumber, m.shortDescription ?? m.name].filter(Boolean).join(' — ') || m.id
}

function getLifecycleStatus(
  quote: MappedQuoteSupplierDetail,
): 'pending' | 'sent' | 'received' | 'approved' | 'rejected' {
  if (quote.rejected) return 'rejected'
  if (quote.acceptedForPOB) return 'approved'
  if (quote.received) return 'received'
  if (quote.sent) return 'sent'
  return 'pending'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function QuoteSupplierDetail({
  quote,
  departmentId,
  currentUserRole,
  currentUserLevel,
  materialOptions,
  materialDemandOptions,
  companyOptions,
  paymentConditionOptions,
  defaultMaterialId,
  defaultMaterialDemandId,
}: QuoteSupplierDetailProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canEdit = currentUserLevel >= 40
  const canEditNumber = currentUserLevel >= 80
  const isApprovedLocked = quote.acceptedForPOB && currentUserLevel < 80
  const canEditLines = currentUserLevel >= 40 && !isApprovedLocked
  const canCreateLines = currentUserLevel >= 60 && !quote.sent && !isApprovedLocked
  const canDeleteLines = currentUserLevel >= 80 && !isApprovedLocked
  const lifecycleStatus = getLifecycleStatus(quote)

  // Misc lines are available once sent or received, and locked once approved for PO.
  const canManageMiscLines = currentUserLevel >= 40 && (quote.sent || quote.received) && !quote.acceptedForPOB

  // ── Header edit state ────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [form, setForm] = useState({
    quoteNumber: quote.quoteNumber,
    quotationNumber: quote.quotationNumber,
    companyId: quote.companyId,
    description: quote.description,
    rejected: quote.rejected,
    additionalInfo: quote.additionalInfo,
    acceptedForPOB: quote.acceptedForPOB,
    validUntil: quote.validUntil ? quote.validUntil.slice(0, 10) : '',
    deliveryTimeDays: quote.deliveryTimeDays,
    paymentConditionId: quote.paymentConditionId,
  })

  function handleCancel() {
    setForm({
      quoteNumber: quote.quoteNumber,
      quotationNumber: quote.quotationNumber,
      companyId: quote.companyId,
      description: quote.description,
      rejected: quote.rejected,
      additionalInfo: quote.additionalInfo,
      acceptedForPOB: quote.acceptedForPOB,
      validUntil: quote.validUntil ? quote.validUntil.slice(0, 10) : '',
      deliveryTimeDays: quote.deliveryTimeDays,
      paymentConditionId: quote.paymentConditionId,
    })
    setSaveError(null)
    setEditing(false)
  }

  async function handleSave() {
    if (!form.quoteNumber.trim()) {
      setSaveError('Quote number is required.')
      return
    }
    if (!form.companyId) {
      setSaveError('Supplier is required.')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      await updateQuoteSupplierAction({
        id: quote.id,
        quoteNumber: form.quoteNumber.trim(),
        quotationNumber: form.quotationNumber || null,
        companyId: form.companyId,
        description: form.description || null,
        rejected: form.rejected ?? false,
        additionalInfo: form.additionalInfo || null,
        acceptedForPOB: form.acceptedForPOB ?? false,
        validUntil: form.validUntil || null,
        deliveryTimeDays: form.deliveryTimeDays,
        paymentConditionId: form.paymentConditionId || null,
      })
      setEditing(false)
      router.refresh()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save quote.')
    } finally {
      setSaving(false)
    }
  }

  // ── Line error / submitting state ────────────────────────────────────────
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [editingLineId, setEditingLineId] = useState<string | null>(null)

  // ── New line state ───────────────────────────────────────────────────────
  const [newMaterialId, setNewMaterialId] = useState(defaultMaterialId ?? '__none__')
  const [newMaterialDemandId, setNewMaterialDemandId] = useState(defaultMaterialDemandId ?? '__none__')
  const [newQuantity, setNewQuantity] = useState('1')
  const [newUnitPrice, setNewUnitPrice] = useState('')
  const [newMinQuantity, setNewMinQuantity] = useState('')
  const [newSupplierDescription, setNewSupplierDescription] = useState('')
  const [newNotDeliverable, setNewNotDeliverable] = useState(false)

  // ── Inline edit line state ───────────────────────────────────────────────
  const [editQuantity, setEditQuantity] = useState('1')
  const [editUnitPrice, setEditUnitPrice] = useState('')
  const [editMinQuantity, setEditMinQuantity] = useState('')
  const [editSupplierDescription, setEditSupplierDescription] = useState('')
  const [editNotDeliverable, setEditNotDeliverable] = useState(false)

  // ── Misc line state ──────────────────────────────────────────────────────
  const [miscError, setMiscError] = useState<string | null>(null)
  const [miscSubmitting, setMiscSubmitting] = useState(false)
  const [editingMiscLineId, setEditingMiscLineId] = useState<string | null>(null)

  const [newMiscDescription, setNewMiscDescription] = useState('')
  const [newMiscUnitPrice, setNewMiscUnitPrice] = useState('')

  const [editMiscDescription, setEditMiscDescription] = useState('')
  const [editMiscUnitPrice, setEditMiscUnitPrice] = useState('')

  const demandOptionsForSelectedMaterial = useMemo(() => {
    if (!newMaterialId || newMaterialId === '__none__') return materialDemandOptions
    return materialDemandOptions.filter(o => o.materialId === newMaterialId)
  }, [materialDemandOptions, newMaterialId])

  function startEdit(line: MappedQuoteSupplierDetail['lines'][number]) {
    setEditingLineId(line.id)
    setEditQuantity(String(line.quantity))
    setEditUnitPrice(String(line.unitPrice))
    setEditMinQuantity(line.minQuantity !== null ? String(line.minQuantity) : '')
    setEditSupplierDescription(line.supplierDescription ?? '')
    setEditNotDeliverable(line.notDeliverable)
  }

  function cancelEdit() {
    setEditingLineId(null)
    setEditQuantity('1')
    setEditUnitPrice('')
    setEditMinQuantity('')
    setEditSupplierDescription('')
    setEditNotDeliverable(false)
  }

  function startMiscEdit(miscLine: MappedQuoteSupplierDetail['miscLines'][number]) {
    setEditingMiscLineId(miscLine.id)
    setEditMiscDescription(miscLine.description)
    setEditMiscUnitPrice(String(miscLine.unitPrice))
  }

  function cancelMiscEdit() {
    setEditingMiscLineId(null)
    setEditMiscDescription('')
    setEditMiscUnitPrice('')
  }

  async function handleCreateLine() {
    const quantity = Number.parseInt(newQuantity, 10)
    const unitPrice = Number.parseFloat(newUnitPrice)
    const minQuantity = newMinQuantity.trim() ? Number.parseInt(newMinQuantity, 10) : undefined

    if (!newMaterialId || newMaterialId === '__none__') {
      setError('Please select a material for the quote line.')
      return
    }
    if (Number.isNaN(quantity) || quantity < 1) {
      setError('Quantity must be at least 1.')
      return
    }
    if (Number.isNaN(unitPrice) || unitPrice <= 0) {
      setError('Unit price must be greater than 0.')
      return
    }
    if (minQuantity !== undefined && (Number.isNaN(minQuantity) || minQuantity < 0)) {
      setError('Minimum quantity cannot be negative.')
      return
    }

    try {
      setSubmitting(true)
      await createQuoteSupplierLineAction({
        quoteSupplierId: quote.id,
        materialId: newMaterialId,
        materialDemandId: newMaterialDemandId !== '__none__' ? newMaterialDemandId : undefined,
        quantity,
        unitPrice,
        minQuantity,
        supplierDescription: newSupplierDescription.trim() || undefined,
        notDeliverable: newNotDeliverable,
      })
      setError(null)
      setNewQuantity('1')
      setNewUnitPrice('')
      setNewMinQuantity('')
      setNewSupplierDescription('')
      setNewNotDeliverable(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create quote line.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdateLine(lineId: string) {
    const quantity = Number.parseInt(editQuantity, 10)
    const unitPrice = Number.parseFloat(editUnitPrice)
    const minQuantity = editMinQuantity.trim() ? Number.parseInt(editMinQuantity, 10) : undefined

    if (Number.isNaN(quantity) || quantity < 1) {
      setError('Quantity must be at least 1.')
      return
    }
    if (Number.isNaN(unitPrice) || unitPrice <= 0) {
      setError('Unit price must be greater than 0.')
      return
    }
    if (minQuantity !== undefined && (Number.isNaN(minQuantity) || minQuantity < 0)) {
      setError('Minimum quantity cannot be negative.')
      return
    }

    try {
      setSubmitting(true)
      await updateQuoteSupplierLineAction({
        id: lineId,
        quantity,
        unitPrice,
        minQuantity,
        supplierDescription: editSupplierDescription.trim() || null,
        notDeliverable: editNotDeliverable,
      })
      setError(null)
      cancelEdit()
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update quote line.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteLine(lineId: string) {
    try {
      setSubmitting(true)
      await deleteQuoteSupplierLineAction({id: lineId})
      setError(null)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete quote line.')
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleSelected(lineId: string, selected: boolean, materialDemandId: string | null) {
    try {
      setSubmitting(true)
      await selectQuoteSupplierLineAction({id: lineId, selected, materialDemandId: materialDemandId ?? undefined})
      setError(null)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update selection.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateMiscLine() {
    const unitPrice = Number.parseFloat(newMiscUnitPrice)
    if (!newMiscDescription.trim()) {
      setMiscError('Description is required.')
      return
    }
    if (Number.isNaN(unitPrice) || unitPrice <= 0) {
      setMiscError('Unit price must be greater than 0.')
      return
    }
    try {
      setMiscSubmitting(true)
      await createQuoteSupplierMiscLineAction({
        quoteSupplierId: quote.id,
        description: newMiscDescription.trim(),
        unitPrice,
      })
      setMiscError(null)
      setNewMiscDescription('')
      setNewMiscUnitPrice('')
      router.refresh()
    } catch (e) {
      setMiscError(e instanceof Error ? e.message : 'Could not create misc line.')
    } finally {
      setMiscSubmitting(false)
    }
  }

  async function handleUpdateMiscLine(miscLineId: string) {
    const unitPrice = Number.parseFloat(editMiscUnitPrice)
    if (!editMiscDescription.trim()) {
      setMiscError('Description is required.')
      return
    }
    if (Number.isNaN(unitPrice) || unitPrice <= 0) {
      setMiscError('Unit price must be greater than 0.')
      return
    }
    try {
      setMiscSubmitting(true)
      await updateQuoteSupplierMiscLineAction({
        id: miscLineId,
        description: editMiscDescription.trim(),
        unitPrice,
      })
      setMiscError(null)
      cancelMiscEdit()
      router.refresh()
    } catch (e) {
      setMiscError(e instanceof Error ? e.message : 'Could not update misc line.')
    } finally {
      setMiscSubmitting(false)
    }
  }

  async function handleDeleteMiscLine(miscLineId: string) {
    try {
      setMiscSubmitting(true)
      await deleteQuoteSupplierMiscLineAction({id: miscLineId})
      setMiscError(null)
      router.refresh()
    } catch (e) {
      setMiscError(e instanceof Error ? e.message : 'Could not delete misc line.')
    } finally {
      setMiscSubmitting(false)
    }
  }

  // Total misc cost shown as an informational sum under the misc table.
  const totalMiscCost = quote.miscLines.reduce((acc, ml) => acc + ml.unitPrice, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/departments/${departmentId}/orderQuote` as Route}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{quote.quoteNumber}</h1>
            <p className="text-sm text-muted-foreground">
              {quote.companyName} | {quote.lineCount} line(s) | Valid until {formatDate(quote.validUntil)}
            </p>
          </div>
        </div>

        {/* Lifecycle badge */}
        <div className="flex items-center gap-2">
          {lifecycleStatus === 'rejected' && (
            <Badge className="bg-red-500/15 text-red-700 border border-red-500/30">Rejected</Badge>
          )}
          {lifecycleStatus === 'approved' && (
            <Badge className="bg-green-500/15 text-green-700 border border-green-500/30">Approved</Badge>
          )}
          {lifecycleStatus === 'received' && (
            <Badge className="bg-blue-500/15 text-blue-700 border border-blue-500/30">Received</Badge>
          )}
          {lifecycleStatus === 'sent' && (
            <Badge className="bg-slate-500/15 text-slate-700 border border-slate-500/30">Sent</Badge>
          )}
          {lifecycleStatus === 'pending' && (
            <Badge className="bg-yellow-500/15 text-yellow-700 border border-yellow-500/30">Pending</Badge>
          )}
        </div>

        {/* Edit / Save / Cancel */}
        <div className="flex items-center gap-2">
          <Link href={`/api/orderQuote/${quote.id}/pdf` as Route}>
            <Button variant="outline" className="gap-2 border-border">
              <FileText className="h-4 w-4" />
              PDF
            </Button>
          </Link>
          {editing ? (
            <>
              <Button variant="outline" onClick={handleCancel} className="gap-2 border-border" disabled={saving}>
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2 bg-accent text-accent-foreground hover:bg-accent/80">
                <Save className="h-4 w-4" />
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </>
          ) : (
            canEdit &&
            !isApprovedLocked && (
              <Button onClick={() => setEditing(true)} variant="outline" className="gap-2 border-border">
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            )
          )}
        </div>
      </div>

      {saveError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {saveError}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Quote details card ── */}
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <h2 className="text-sm font-medium text-foreground mb-4">Quote details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Quote number */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground/80">Quote Number</Label>
            {editing ? (
              canEditNumber ? (
                <Input
                  value={form.quoteNumber}
                  onChange={e => setForm(f => ({...f, quoteNumber: e.target.value}))}
                  placeholder="e.g. Q1000000"
                  className="bg-secondary border-border"
                />
              ) : (
                <div className="flex h-10 items-center rounded-md border border-border bg-secondary/40 px-3 text-sm text-muted-foreground cursor-not-allowed select-none">
                  {form.quoteNumber}
                </div>
              )
            ) : (
              <div className="text-sm text-foreground mt-0.5">{quote.quoteNumber}</div>
            )}
          </div>

          {/* Quotation number */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground/80">Quotation Number</Label>
            {editing ? (
              <Input
                value={form.quotationNumber ?? ''}
                onChange={e => setForm(f => ({...f, quotationNumber: e.target.value || null}))}
                placeholder="Supplier reference"
                className="bg-secondary border-border"
              />
            ) : (
              <div className="text-sm text-foreground mt-0.5">{quote.quotationNumber ?? '—'}</div>
            )}
          </div>

          {/* Supplier */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground/80">Supplier</Label>
            {editing ? (
              <Select
                value={form.companyId || '__none__'}
                onValueChange={v => setForm(f => ({...f, companyId: v === '__none__' ? '' : v}))}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="__none__">— Select supplier —</SelectItem>
                  {companyOptions.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-foreground mt-0.5">{quote.companyName}</div>
            )}
          </div>

          {/* Payment condition */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground/80">Payment Condition</Label>
            {editing ? (
              <Select
                value={form.paymentConditionId ?? '__none__'}
                onValueChange={v => setForm(f => ({...f, paymentConditionId: v === '__none__' ? null : v}))}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="No payment condition" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="__none__">— No payment condition —</SelectItem>
                  {paymentConditionOptions.map(pc => (
                    <SelectItem key={pc.id} value={pc.id}>
                      {pc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-foreground mt-0.5">{quote.paymentConditionName ?? '—'}</div>
            )}
          </div>

          {/* Valid until */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground/80">Valid Until</Label>
            {editing ? (
              <Input
                type="date"
                value={form.validUntil}
                onChange={e => setForm(f => ({...f, validUntil: e.target.value}))}
                className="bg-secondary border-border"
              />
            ) : (
              <div className="text-sm text-foreground mt-0.5">{formatDate(quote.validUntil)}</div>
            )}
          </div>

          {/* Delivery time */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground/80">Delivery Time (days)</Label>
            {editing ? (
              <Input
                type="number"
                min={0}
                value={form.deliveryTimeDays ?? ''}
                onChange={e => setForm(f => ({...f, deliveryTimeDays: e.target.value ? Number(e.target.value) : null}))}
                placeholder="e.g. 14"
                className="bg-secondary border-border"
              />
            ) : (
              <div className="text-sm text-foreground mt-0.5">
                {quote.deliveryTimeDays !== null ? `${quote.deliveryTimeDays} day(s)` : '—'}
              </div>
            )}
          </div>

          {/* Additional info */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground/80">Additional Info</Label>
            {editing ? (
              <Input
                value={form.additionalInfo ?? ''}
                onChange={e => setForm(f => ({...f, additionalInfo: e.target.value || null}))}
                placeholder="Extra notes"
                className="bg-secondary border-border"
              />
            ) : (
              <div className="text-sm text-foreground mt-0.5 whitespace-pre-wrap">{quote.additionalInfo ?? '—'}</div>
            )}
          </div>

          {/* Description — full width textarea */}
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground/80">Description</Label>
            {editing ? (
              <Textarea
                value={form.description ?? ''}
                onChange={e => setForm(f => ({...f, description: e.target.value || null}))}
                placeholder="Detailed description…"
                className="bg-secondary border-border resize-none"
                rows={3}
              />
            ) : (
              <div className="text-sm text-foreground mt-0.5 whitespace-pre-wrap">{quote.description ?? '—'}</div>
            )}
          </div>

          {/* Rejected / Accepted for PO switches — edit mode only, matching the form dialog layout */}
          {editing && (
            <div className="md:col-span-2 flex flex-wrap items-center gap-6 pt-1">
              <div className="flex items-center gap-2">
                <Switch
                  id="rejected"
                  checked={form.rejected ?? false}
                  onCheckedChange={checked => setForm(f => ({...f, rejected: checked}))}
                />
                <Label htmlFor="rejected" className="text-sm font-normal cursor-pointer">
                  Rejected
                </Label>
              </div>
              {currentUserLevel >= 80 && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="acceptedForPOB"
                    checked={form.acceptedForPOB ?? false}
                    onCheckedChange={checked => setForm(f => ({...f, acceptedForPOB: checked}))}
                  />
                  <Label htmlFor="acceptedForPOB" className="text-sm font-normal cursor-pointer">
                    Accepted for PO
                  </Label>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {quote.sent && (
        <div className="rounded-md border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm text-sky-800">
          This quote is sent. You can no longer add new line items.
        </div>
      )}

      {isApprovedLocked && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800">
          This quote is approved. Only managers can edit it.
        </div>
      )}

      {/* ── Add line form ── */}
      {canCreateLines && (
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <h2 className="text-sm font-medium text-foreground mb-3">Add quote line</h2>
          <div className="grid gap-3 md:grid-cols-5">
            <div className="md:col-span-2">
              <Label className="text-xs">Material</Label>
              <Select
                value={newMaterialId}
                onValueChange={value => {
                  setNewMaterialId(value)
                  const first = materialDemandOptions.find(o => o.materialId === value)
                  if (first) setNewMaterialDemandId(first.id)
                }}>
                <SelectTrigger className="bg-secondary border-border mt-1">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="__none__">— Select material —</SelectItem>
                  {materialOptions.map(o => (
                    <SelectItem key={o.id} value={o.id}>
                      {materialLabel(o)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Material demand (optional)</Label>
              <Select value={newMaterialDemandId} onValueChange={setNewMaterialDemandId}>
                <SelectTrigger className="bg-secondary border-border mt-1">
                  <SelectValue placeholder="Select demand" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="__none__">— None —</SelectItem>
                  {demandOptionsForSelectedMaterial.map(o => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Qty</Label>
              <Input
                type="number"
                min={1}
                value={newQuantity}
                onChange={e => setNewQuantity(e.target.value)}
                className="bg-secondary border-border mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Unit Price</Label>
              <Input
                type="number"
                step="0.01"
                min={0.01}
                value={newUnitPrice}
                onChange={e => setNewUnitPrice(e.target.value)}
                className="bg-secondary border-border mt-1"
              />
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
            <div>
              <Label className="text-xs">Supplier description</Label>
              <Input
                value={newSupplierDescription}
                onChange={e => setNewSupplierDescription(e.target.value)}
                placeholder="Supplier reference, remark or alternative description…"
                className="bg-secondary border-border mt-1"
              />
            </div>
            <div className="w-40">
              <Label className="text-xs">Min Qty (optional)</Label>
              <Input
                type="number"
                min={0}
                value={newMinQuantity}
                onChange={e => setNewMinQuantity(e.target.value)}
                className="bg-secondary border-border mt-1"
              />
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border/60 bg-secondary/30 px-3 py-2">
              <Checkbox
                id="newNotDeliverable"
                checked={newNotDeliverable}
                onCheckedChange={checked => setNewNotDeliverable(checked === true)}
              />
              <Label htmlFor="newNotDeliverable" className="text-xs font-normal cursor-pointer">
                Not deliverable
              </Label>
            </div>
            <Button onClick={handleCreateLine} disabled={submitting}>
              Add Line
            </Button>
          </div>
        </div>
      )}

      {/* ── Lines table ── */}
      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className="text-xs">Material</TableHead>
              <TableHead className="text-xs">Supplier Description</TableHead>
              <TableHead className="text-xs">Demand</TableHead>
              <TableHead className="text-xs">Qty</TableHead>
              <TableHead className="text-xs">Min Qty</TableHead>
              <TableHead className="text-xs">Unit Price</TableHead>
              <TableHead className="text-xs">Flags</TableHead>
              <TableHead className="text-xs">Selected</TableHead>
              <TableHead className="w-24">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quote.lines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground text-sm">
                  No quote lines yet. Add one or more lines above.
                </TableCell>
              </TableRow>
            ) : (
              quote.lines.map(line => {
                const isEditing = editingLineId === line.id
                return (
                  <TableRow key={line.id} className="border-border/40 hover:bg-secondary/50">
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex flex-col">
                        <span className="text-foreground">{line.materialBeNumber ?? '—'}</span>
                        <span className="text-xs">
                          {line.materialShortDescription ?? line.materialName ?? line.materialId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground min-w-56">
                      {isEditing ? (
                        <Input
                          value={editSupplierDescription}
                          onChange={e => setEditSupplierDescription(e.target.value)}
                          className="h-8 bg-secondary border-border"
                        />
                      ) : (
                        (line.supplierDescription ?? '—')
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{line.materialDemandLabel ?? '—'}</TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {isEditing ? (
                        <Input
                          type="number"
                          min={1}
                          value={editQuantity}
                          onChange={e => setEditQuantity(e.target.value)}
                          className="h-8 bg-secondary border-border"
                        />
                      ) : (
                        line.quantity
                      )}
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {isEditing ? (
                        <Input
                          type="number"
                          min={0}
                          value={editMinQuantity}
                          onChange={e => setEditMinQuantity(e.target.value)}
                          className="h-8 bg-secondary border-border"
                        />
                      ) : (
                        (line.minQuantity ?? '—')
                      )}
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          min={0.01}
                          value={editUnitPrice}
                          onChange={e => setEditUnitPrice(e.target.value)}
                          className="h-8 bg-secondary border-border"
                        />
                      ) : (
                        formatMoney(line.unitPrice)
                      )}
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={editNotDeliverable}
                            onCheckedChange={checked => setEditNotDeliverable(checked === true)}
                          />
                          <span className="text-xs">Not deliverable</span>
                        </div>
                      ) : line.notDeliverable ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Not deliverable
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>

                    <TableCell>
                      <Button
                        size="sm"
                        variant={line.selected ? 'secondary' : 'outline'}
                        className="h-7 text-xs"
                        disabled={submitting}
                        onClick={() => toggleSelected(line.id, !line.selected, line.materialDemandId)}>
                        {line.selected ? 'Selected' : 'Select'}
                      </Button>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10"
                              disabled={submitting}
                              onClick={() => handleUpdateLine(line.id)}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:bg-secondary"
                              onClick={cancelEdit}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          canEditLines && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                              onClick={() => startEdit(line)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )
                        )}
                        {canDeleteLines && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            disabled={submitting}
                            onClick={() => handleDeleteLine(line.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Miscellaneous cost lines ── */}
      {/* Show this section whenever the quote is sent or received, regardless of approval state.
          Editing is only allowed before approval (canManageMiscLines). */}
      {(quote.sent || quote.received || quote.miscLines.length > 0) && (
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-medium text-foreground">Miscellaneous costs</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Additional costs (freight, handling, etc.) distributed proportionally across material prices on
                approval.
              </p>
            </div>
          </div>

          {miscError && (
            <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {miscError}
            </div>
          )}

          {/* Add misc line form */}
          {canManageMiscLines && (
            <div className="mb-4 flex items-end gap-3">
              <div className="flex-1">
                <Label className="text-xs">Description</Label>
                <Input
                  value={newMiscDescription}
                  onChange={e => setNewMiscDescription(e.target.value)}
                  placeholder="e.g. Freight, handling…"
                  className="bg-secondary border-border mt-1"
                />
              </div>
              <div className="w-36">
                <Label className="text-xs">Amount (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0.01}
                  value={newMiscUnitPrice}
                  onChange={e => setNewMiscUnitPrice(e.target.value)}
                  placeholder="0.00"
                  className="bg-secondary border-border mt-1"
                />
              </div>
              <Button onClick={handleCreateMiscLine} disabled={miscSubmitting}>
                Add
              </Button>
            </div>
          )}

          {/* Misc lines table */}
          <div className="rounded-lg border border-border/40 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  {canManageMiscLines && (
                    <TableHead className="w-20">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.miscLines.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={canManageMiscLines ? 3 : 2}
                      className="h-16 text-center text-muted-foreground text-sm">
                      No miscellaneous costs added yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  quote.miscLines.map(ml => {
                    const isEditingMisc = editingMiscLineId === ml.id
                    return (
                      <TableRow key={ml.id} className="border-border/40 hover:bg-secondary/50">
                        <TableCell className="text-sm text-foreground">
                          {isEditingMisc ? (
                            <Input
                              value={editMiscDescription}
                              onChange={e => setEditMiscDescription(e.target.value)}
                              className="h-8 bg-secondary border-border"
                            />
                          ) : (
                            ml.description
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-right text-muted-foreground">
                          {isEditingMisc ? (
                            <Input
                              type="number"
                              step="0.01"
                              min={0.01}
                              value={editMiscUnitPrice}
                              onChange={e => setEditMiscUnitPrice(e.target.value)}
                              className="h-8 bg-secondary border-border text-right"
                            />
                          ) : (
                            formatMoney(ml.unitPrice)
                          )}
                        </TableCell>
                        {canManageMiscLines && (
                          <TableCell>
                            <div className="flex items-center gap-1 justify-end">
                              {isEditingMisc ? (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10"
                                    disabled={miscSubmitting}
                                    onClick={() => handleUpdateMiscLine(ml.id)}>
                                    <Check className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-muted-foreground hover:bg-secondary"
                                    onClick={cancelMiscEdit}>
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                    onClick={() => startMiscEdit(ml)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                    disabled={miscSubmitting}
                                    onClick={() => handleDeleteMiscLine(ml.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })
                )}
                {/* Total row */}
                {quote.miscLines.length > 0 && (
                  <TableRow className="border-t border-border/60 bg-secondary/20 hover:bg-secondary/30">
                    <TableCell className="text-xs font-medium text-muted-foreground">Total misc costs</TableCell>
                    <TableCell className="text-sm font-semibold text-right text-foreground">
                      {formatMoney(totalMiscCost)}
                    </TableCell>
                    {canManageMiscLines && <TableCell />}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {quote.miscLines.length > 0 && !quote.acceptedForPOB && (
            <p className="mt-2 text-xs text-muted-foreground">
              {formatMoney(totalMiscCost)} will be distributed proportionally across deliverable material lines when
              this quote is approved for PO.
            </p>
          )}

          {quote.miscLines.length > 0 && quote.acceptedForPOB && (
            <p className="mt-2 text-xs text-muted-foreground">
              Misc costs were distributed into material prices at the time of approval.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
