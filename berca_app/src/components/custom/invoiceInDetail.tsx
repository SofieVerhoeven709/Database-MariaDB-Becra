'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowLeft, Pencil, X, Save} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {updateInvoiceInAction} from '@/serverFunctions/invoices'
import type {MappedInvoiceIn, InvoiceLookup, VatMarginOption} from '@/types/invoice'

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function toDateInput(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toISOString().slice(0, 10)
}

function BoolBadge({value}: {value: boolean}) {
  return value ? (
    <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
  ) : (
    <Badge variant="secondary" className="text-muted-foreground font-medium">
      No
    </Badge>
  )
}

interface InvoiceInDetailProps {
  invoice: MappedInvoiceIn
  invoiceTypes: InvoiceLookup[]
  paymentMethods: InvoiceLookup[]
  invoiceSentTypes: InvoiceLookup[]
  invoiceStatuses: InvoiceLookup[]
  vatMargins: VatMarginOption[]
  companyOptions: InvoiceLookup[]
  currentUserLevel: number
  currentUserRole: string
}

type EditForm = {
  invoiceNumber: string
  poNumber: string
  humanId: string
  invoiceDate: string
  dueDate: string
  invoiceTypeId: string
  paymentMethodId: string
  invoiceSentTypeId: string
  invoiceStatusId: string
  vatMarginId: string
  companyId: string
  reminderSent: boolean
  outstanding: boolean
}

export function InvoiceInDetail({
  invoice,
  invoiceTypes,
  paymentMethods,
  invoiceSentTypes,
  invoiceStatuses,
  vatMargins,
  companyOptions,
  currentUserLevel,
  currentUserRole,
}: InvoiceInDetailProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canEdit = currentUserLevel >= 40
  const canCreate = currentUserLevel >= 60
  const canDelete = currentUserLevel >= 80
  const canManageVisibility = currentUserLevel >= 80

  const buildForm = (): EditForm => ({
    invoiceNumber: invoice.invoiceNumber,
    poNumber: invoice.poNumber ?? '',
    humanId: invoice.humanId ?? '',
    invoiceDate: toDateInput(invoice.invoiceDate),
    dueDate: toDateInput(invoice.dueDate),
    invoiceTypeId: invoice.invoiceTypeId,
    paymentMethodId: invoice.paymentMethodId,
    invoiceSentTypeId: invoice.invoiceSentTypeId,
    invoiceStatusId: invoice.invoiceStatusId,
    vatMarginId: invoice.vatMarginId,
    companyId: invoice.companyId,
    reminderSent: invoice.reminderSent,
    outstanding: invoice.outstanding,
  })

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<EditForm>(buildForm)
  const s = <K extends keyof EditForm>(key: K, v: EditForm[K]) => setForm(f => ({...f, [key]: v}))

  async function handleSave() {
    setSaving(true)
    try {
      await updateInvoiceInAction({
        id: invoice.id,
        invoiceNumber: form.invoiceNumber,
        poNumber: form.poNumber || null,
        humanId: form.humanId || null,
        invoiceDate: new Date(form.invoiceDate),
        dueDate: new Date(form.dueDate),
        invoiceTypeId: form.invoiceTypeId,
        paymentMethodId: form.paymentMethodId,
        invoiceSentTypeId: form.invoiceSentTypeId,
        invoiceStatusId: form.invoiceStatusId,
        vatMarginId: form.vatMarginId,
        companyId: form.companyId,
        reminderSent: form.reminderSent,
        outstanding: form.outstanding,
      })
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setForm(buildForm())
    setEditing(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{invoice.invoiceNumber}</h1>
            <p className="text-sm text-muted-foreground">
              {invoice.companyName} · {invoice.invoiceTypeName} · {invoice.invoiceStatusName}
            </p>
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={handleCancel} className="gap-2 border-border">
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

      {/* Info card */}
      <div className="rounded-xl border border-border/60 bg-card p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Invoice Number */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Invoice Number</Label>
            <p className="text-sm text-muted-foreground">{invoice.invoiceNumber}</p>
          </div>

          {/* Human ID */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Human ID</Label>
            {editing ? (
              <Input
                value={form.humanId}
                onChange={e => s('humanId', e.target.value)}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{invoice.humanId ?? '-'}</p>
            )}
          </div>

          {/* PO Number */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">PO Number</Label>
            {editing ? (
              <Input
                value={form.poNumber}
                onChange={e => s('poNumber', e.target.value)}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{invoice.poNumber ?? '-'}</p>
            )}
          </div>

          {/* Company */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Company</Label>
            {editing ? (
              <Select value={form.companyId} onValueChange={v => s('companyId', v)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {companyOptions.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">{invoice.companyName}</p>
            )}
          </div>

          {/* Invoice Date */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Invoice Date</Label>
            {editing ? (
              <Input
                type="date"
                value={form.invoiceDate}
                onChange={e => s('invoiceDate', e.target.value)}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{formatDate(invoice.invoiceDate)}</p>
            )}
          </div>

          {/* Due Date */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Due Date</Label>
            {editing ? (
              <Input
                type="date"
                value={form.dueDate}
                onChange={e => s('dueDate', e.target.value)}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{formatDate(invoice.dueDate)}</p>
            )}
          </div>

          {/* Invoice Type */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Invoice Type</Label>
            {editing ? (
              <Select value={form.invoiceTypeId} onValueChange={v => s('invoiceTypeId', v)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {invoiceTypes.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">{invoice.invoiceTypeName}</p>
            )}
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            {editing ? (
              <Select value={form.invoiceStatusId} onValueChange={v => s('invoiceStatusId', v)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {invoiceStatuses.map(st => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline" className="border-border w-fit">
                {invoice.invoiceStatusName}
              </Badge>
            )}
          </div>

          {/* Payment Method */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Payment Method</Label>
            {editing ? (
              <Select value={form.paymentMethodId} onValueChange={v => s('paymentMethodId', v)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {paymentMethods.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">{invoice.paymentMethodName}</p>
            )}
          </div>

          {/* Sent Type */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Sent Type</Label>
            {editing ? (
              <Select value={form.invoiceSentTypeId} onValueChange={v => s('invoiceSentTypeId', v)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {invoiceSentTypes.map(st => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">{invoice.invoiceSentTypeName}</p>
            )}
          </div>

          {/* VAT */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">VAT Margin</Label>
            {editing ? (
              <Select value={form.vatMarginId} onValueChange={v => s('vatMarginId', v)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {vatMargins.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.vat}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">{invoice.vatMarginVat}%</p>
            )}
          </div>

          {/* Meta */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Created By</Label>
            <p className="text-sm text-muted-foreground">{invoice.createdByName}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Created At</Label>
            <p className="text-sm text-muted-foreground">{formatDate(invoice.createdAt)}</p>
          </div>
          {invoice.modifiedByName && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Last Modified By</Label>
              <p className="text-sm text-muted-foreground">
                {invoice.modifiedByName} · {formatDate(invoice.modifiedAt)}
              </p>
            </div>
          )}

          {/* Booleans */}
          <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-2 gap-3">
            {[
              {key: 'outstanding' as const, label: 'Outstanding'},
              {key: 'reminderSent' as const, label: 'Reminder Sent'},
            ].map(({key, label}) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                {editing ? (
                  <Switch checked={form[key]} onCheckedChange={v => s(key, v)} />
                ) : (
                  <BoolBadge value={invoice[key]} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
