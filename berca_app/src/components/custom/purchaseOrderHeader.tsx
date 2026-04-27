'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Pencil, Save, X, Calendar, Building2, FileText, Hash, CreditCard, User} from 'lucide-react'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {updatePurchaseAction} from '@/serverFunctions/purchases'

// ── Types ────────────────────────────────────────────────────────────────────

export interface PurchaseHeaderData {
  id: string
  purchaseNumber: string | null
  description: string | null
  status: string | null
  purchaseDate: Date | null
  companyId: string | null
  companyName: string | null
  quoteSupplierId: string | null
  quoteNumber: string | null
  paymentConditionId: string | null
  paymentConditionName: string | null
  customerPoNumber: string | null
  bocNumber: string | null
  bocCustomerName: string | null
  bocDescription: string | null
  bocCreatedAt: Date | null
  bocStatus: string | null
  additionalInfo: string | null
  createdByName: string
}

export interface CompanyOption {
  id: string
  name: string
}

export interface PaymentConditionOption {
  id: string
  name: string
}

interface PurchaseOrderHeaderProps {
  purchase: PurchaseHeaderData
  companyOptions: CompanyOption[]
  paymentConditionOptions: PaymentConditionOption[]
  canEdit: boolean
}

// ── Constants ────────────────────────────────────────────────────────────────

const PURCHASE_STATUSES = ['DRAFT', 'ORDERED', 'PARTIAL_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED'] as const

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  ORDERED: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  PARTIAL_RECEIVED: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
  RECEIVED: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  CLOSED: 'bg-green-500/10 text-green-600 border-green-500/30',
  CANCELLED: 'bg-red-500/10 text-red-600 border-red-500/30',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date | string | null | undefined) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function toInputDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

// ── Component ────────────────────────────────────────────────────────────────

export function PurchaseOrderHeader({
  purchase,
  companyOptions,
  paymentConditionOptions,
  canEdit,
}: PurchaseOrderHeaderProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    purchaseNumber: purchase.purchaseNumber ?? '',
    description: purchase.description ?? '',
    status: purchase.status ?? 'DRAFT',
    purchaseDate: toInputDate(purchase.purchaseDate),
    companyId: purchase.companyId ?? '',
    paymentConditionId: purchase.paymentConditionId ?? '',
    customerPoNumber: purchase.customerPoNumber ?? '',
    bocNumber: purchase.bocNumber ?? '',
    bocCustomerName: purchase.bocCustomerName ?? '',
    bocDescription: purchase.bocDescription ?? '',
    bocCreatedAt: toInputDate(purchase.bocCreatedAt),
    bocStatus: purchase.bocStatus ?? '',
    additionalInfo: purchase.additionalInfo ?? '',
  })

  function handleCancel() {
    setForm({
      purchaseNumber: purchase.purchaseNumber ?? '',
      description: purchase.description ?? '',
      status: purchase.status ?? 'DRAFT',
      purchaseDate: toInputDate(purchase.purchaseDate),
      companyId: purchase.companyId ?? '',
      paymentConditionId: purchase.paymentConditionId ?? '',
      customerPoNumber: purchase.customerPoNumber ?? '',
      bocNumber: purchase.bocNumber ?? '',
      bocCustomerName: purchase.bocCustomerName ?? '',
      bocDescription: purchase.bocDescription ?? '',
      bocCreatedAt: toInputDate(purchase.bocCreatedAt),
      bocStatus: purchase.bocStatus ?? '',
      additionalInfo: purchase.additionalInfo ?? '',
    })
    setError(null)
    setEditing(false)
  }

  async function handleSave() {
    if (!form.purchaseNumber.trim()) {
      setError('Purchase number is required.')
      return
    }
    if (!form.purchaseDate) {
      setError('Purchase date is required.')
      return
    }
    if (!form.companyId) {
      setError('Supplier is required.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await updatePurchaseAction({
        id: purchase.id,
        purchaseNumber: form.purchaseNumber.trim(),
        description: form.description || null,
        status: form.status,
        purchaseDate: form.purchaseDate,
        companyId: form.companyId,
        paymentConditionId: form.paymentConditionId || null,
        customerPoNumber: form.customerPoNumber || null,
        bocNumber: form.bocNumber || null,
        bocCustomerName: form.bocCustomerName || null,
        bocDescription: form.bocDescription || null,
        bocCreatedAt: form.bocCreatedAt || null,
        bocStatus: form.bocStatus || null,
        additionalInfo: form.additionalInfo || null,
      })
      setEditing(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save purchase.')
    } finally {
      setSaving(false)
    }
  }

  const normalizedStatus =
    purchase.status && PURCHASE_STATUSES.includes(purchase.status as any) ? purchase.status : null

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 space-y-5">
      {/* ── Card header: title + status badge + edit controls ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            {editing ? (
              <Input
                value={form.purchaseNumber}
                onChange={e => setForm(f => ({...f, purchaseNumber: e.target.value}))}
                placeholder="Purchase number"
                className="bg-secondary border-border text-base font-semibold h-9 w-56"
              />
            ) : (
              <h1 className="text-xl font-semibold text-foreground">{purchase.purchaseNumber ?? 'Unnamed Order'}</h1>
            )}
            {normalizedStatus && !editing && (
              <Badge
                className={`border text-xs font-medium ${
                  STATUS_COLOR[normalizedStatus] ?? 'bg-accent/10 text-accent border-0'
                }`}>
                {normalizedStatus}
              </Badge>
            )}
            {editing && (
              <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                <SelectTrigger className="bg-secondary border-border h-9 w-44 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {PURCHASE_STATUSES.map(s => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {editing ? (
            <Input
              value={form.description}
              onChange={e => setForm(f => ({...f, description: e.target.value}))}
              placeholder="Description (optional)"
              className="bg-secondary border-border text-sm h-8 w-80"
            />
          ) : (
            purchase.description && <p className="text-sm text-muted-foreground">{purchase.description}</p>
          )}
        </div>

        {/* Edit / Save / Cancel */}
        {canEdit && (
          <div className="flex items-center gap-2 shrink-0">
            {editing ? (
              <>
                <Button variant="outline" onClick={handleCancel} className="gap-2 border-border" disabled={saving}>
                  <X className="h-4 w-4" />
                  Cancel
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
              <Button onClick={() => setEditing(true)} variant="outline" className="gap-2 border-border">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Row 1: Purchase Date / Supplier / Quote / PO Customer ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2 border-t border-border/50">
        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Purchase Date
          </Label>
          {editing ? (
            <Input
              type="date"
              value={form.purchaseDate}
              onChange={e => setForm(f => ({...f, purchaseDate: e.target.value}))}
              className="bg-secondary border-border h-8 text-sm"
            />
          ) : (
            <span className="text-sm text-foreground">{formatDate(purchase.purchaseDate)}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Building2 className="h-3 w-3" /> Supplier
          </Label>
          {editing ? (
            <Select
              value={form.companyId || '__none__'}
              onValueChange={v => setForm(f => ({...f, companyId: v === '__none__' ? '' : v}))}>
              <SelectTrigger className="bg-secondary border-border h-8 text-sm">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="__none__">— Select supplier —</SelectItem>
                {companyOptions.map(c => (
                  <SelectItem key={c.id} value={c.id} className="text-sm">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-sm text-foreground">{purchase.companyName ?? '—'}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <FileText className="h-3 w-3" /> Quote
          </Label>
          {/* Quote link is read-only — it's set at creation time */}
          <span className="text-sm text-foreground">{purchase.quoteNumber ?? 'Manual purchase'}</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Hash className="h-3 w-3" /> PO Customer
          </Label>
          {editing ? (
            <Input
              value={form.customerPoNumber}
              onChange={e => setForm(f => ({...f, customerPoNumber: e.target.value}))}
              placeholder="—"
              className="bg-secondary border-border h-8 text-sm"
            />
          ) : (
            <span className="text-sm text-foreground">{purchase.customerPoNumber ?? '—'}</span>
          )}
        </div>
      </div>

      {/* ── Row 2: BOC fields ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2 border-t border-border/50">
        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Hash className="h-3 w-3" /> BOC
          </Label>
          {editing ? (
            <Input
              value={form.bocNumber}
              onChange={e => setForm(f => ({...f, bocNumber: e.target.value}))}
              placeholder="—"
              className="bg-secondary border-border h-8 text-sm"
            />
          ) : (
            <span className="text-sm text-foreground">{purchase.bocNumber ?? '—'}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Building2 className="h-3 w-3" /> BOC Customer
          </Label>
          {editing ? (
            <Input
              value={form.bocCustomerName}
              onChange={e => setForm(f => ({...f, bocCustomerName: e.target.value}))}
              placeholder="—"
              className="bg-secondary border-border h-8 text-sm"
            />
          ) : (
            <span className="text-sm text-foreground">{purchase.bocCustomerName ?? '—'}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" /> BOC Date
          </Label>
          {editing ? (
            <Input
              type="date"
              value={form.bocCreatedAt}
              onChange={e => setForm(f => ({...f, bocCreatedAt: e.target.value}))}
              className="bg-secondary border-border h-8 text-sm"
            />
          ) : (
            <span className="text-sm text-foreground">{formatDate(purchase.bocCreatedAt)}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Hash className="h-3 w-3" /> BOC Status
          </Label>
          {editing ? (
            <Input
              value={form.bocStatus}
              onChange={e => setForm(f => ({...f, bocStatus: e.target.value}))}
              placeholder="—"
              className="bg-secondary border-border h-8 text-sm"
            />
          ) : (
            <span className="text-sm text-foreground">{purchase.bocStatus ?? '—'}</span>
          )}
        </div>
      </div>

      {/* ── Row 3: Payment / Created By ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2 border-t border-border/50">
        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <CreditCard className="h-3 w-3" /> Payment
          </Label>
          {editing ? (
            <Select
              value={form.paymentConditionId || '__none__'}
              onValueChange={v => setForm(f => ({...f, paymentConditionId: v === '__none__' ? '' : v}))}>
              <SelectTrigger className="bg-secondary border-border h-8 text-sm">
                <SelectValue placeholder="— None —" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="__none__">— None —</SelectItem>
                {paymentConditionOptions.map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-sm">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-sm text-foreground">{purchase.paymentConditionName ?? '—'}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3" /> Created By
          </Label>
          {/* Read-only — never editable */}
          <span className="text-sm text-foreground">{purchase.createdByName}</span>
        </div>
      </div>

      {/* ── Row 4: BOC Description / Additional Info ── */}
      {(editing || purchase.bocDescription || purchase.additionalInfo) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-border/50">
          {(editing || purchase.bocDescription) && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Description of BOC</Label>
              {editing ? (
                <Input
                  value={form.bocDescription}
                  onChange={e => setForm(f => ({...f, bocDescription: e.target.value}))}
                  placeholder="—"
                  className="bg-secondary border-border h-8 text-sm"
                />
              ) : (
                <span className="text-sm text-foreground">{purchase.bocDescription}</span>
              )}
            </div>
          )}

          {(editing || purchase.additionalInfo) && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Additional Info</Label>
              {editing ? (
                <Input
                  value={form.additionalInfo}
                  onChange={e => setForm(f => ({...f, additionalInfo: e.target.value}))}
                  placeholder="—"
                  className="bg-secondary border-border h-8 text-sm"
                />
              ) : (
                <span className="text-sm text-foreground">{purchase.additionalInfo}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
