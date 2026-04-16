'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import type {MappedInvoiceIn, InvoiceLookup, VatMarginOption} from '@/types/invoice'
import {createInvoiceInAction, updateInvoiceInAction} from '@/serverFunctions/invoices'
// e.g. export async function getNextInvoiceInNumberAction(): Promise<string>
import {getNextInvoiceInNumberAction} from '@/serverFunctions/invoices'

interface InvoiceInFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: MappedInvoiceIn | null
  invoiceTypes: InvoiceLookup[]
  paymentMethods: InvoiceLookup[]
  invoiceSentTypes: InvoiceLookup[]
  invoiceStatuses: InvoiceLookup[]
  vatMargins: VatMarginOption[]
  companyOptions: InvoiceLookup[]
  onSaved: () => void
}

type FormState = {
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

function toDateInput(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toISOString().slice(0, 10)
}

function emptyForm(inv: MappedInvoiceIn | null): FormState {
  const today = new Date().toISOString().slice(0, 10)
  if (!inv) {
    return {
      invoiceNumber: '',
      poNumber: '',
      humanId: '',
      invoiceDate: today,
      dueDate: today,
      invoiceTypeId: '',
      paymentMethodId: '',
      invoiceSentTypeId: '',
      invoiceStatusId: '',
      vatMarginId: '',
      companyId: '',
      reminderSent: false,
      outstanding: false,
    }
  }
  return {
    invoiceNumber: inv.invoiceNumber,
    poNumber: inv.poNumber ?? '',
    humanId: inv.humanId ?? '',
    invoiceDate: toDateInput(inv.invoiceDate),
    dueDate: toDateInput(inv.dueDate),
    invoiceTypeId: inv.invoiceTypeId,
    paymentMethodId: inv.paymentMethodId,
    invoiceSentTypeId: inv.invoiceSentTypeId,
    invoiceStatusId: inv.invoiceStatusId,
    vatMarginId: inv.vatMarginId,
    companyId: inv.companyId,
    reminderSent: inv.reminderSent,
    outstanding: inv.outstanding,
  }
}

export function InvoiceInFormDialog({
  open,
  onOpenChange,
  invoice,
  invoiceTypes,
  paymentMethods,
  invoiceSentTypes,
  invoiceStatuses,
  vatMargins,
  companyOptions,
  onSaved,
}: InvoiceInFormDialogProps) {
  const [form, setForm] = useState<FormState>(() => emptyForm(invoice))
  const [saving, setSaving] = useState(false)
  const [numberLoading, setNumberLoading] = useState(false)
  const [numberError, setNumberError] = useState<string | null>(null)

  const isEdit = !!invoice

  // On open for create mode: fetch next invoice number
  useEffect(() => {
    const base = emptyForm(invoice)
    setForm(base)
    setNumberError(null)

    if (!invoice && open) {
      setNumberLoading(true)
      getNextInvoiceInNumberAction()
        .then(n => setForm(f => ({...f, invoiceNumber: n})))
        .catch(() => setNumberError('Could not fetch next number.'))
        .finally(() => setNumberLoading(false))
    }
  }, [invoice?.id, open])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({...f, [key]: value}))
    if (key === 'invoiceNumber') setNumberError(null)
  }

  async function handleRegenerate() {
    setNumberLoading(true)
    setNumberError(null)
    try {
      const n = await getNextInvoiceInNumberAction()
      setForm(f => ({...f, invoiceNumber: n}))
    } catch {
      setNumberError('Could not fetch next number.')
    } finally {
      setNumberLoading(false)
    }
  }

  const isValid =
    form.invoiceNumber.trim() &&
    form.invoiceDate &&
    form.dueDate &&
    form.invoiceTypeId &&
    form.paymentMethodId &&
    form.invoiceSentTypeId &&
    form.invoiceStatusId &&
    form.vatMarginId &&
    form.companyId

  async function handleSubmit() {
    if (!isValid) return
    setSaving(true)
    try {
      const payload = {
        invoiceNumber: form.invoiceNumber.trim(),
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
      }

      if (invoice) {
        await updateInvoiceInAction({id: invoice.id, ...payload})
      } else {
        await createInvoiceInAction(payload)
      }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? 'Edit Invoice In' : 'New Invoice In'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-5 py-3 sm:grid-cols-2">
          {/* Invoice Number */}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">
              Invoice Number *
              {isEdit && <span className="ml-1.5 text-muted-foreground/60">(locked — edit from detail page)</span>}
            </Label>
            {isEdit ? (
              <div className="flex h-10 items-center rounded-md border border-border bg-secondary/40 px-3 text-sm text-muted-foreground cursor-not-allowed select-none">
                {form.invoiceNumber}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex gap-2">
                  <Input
                    value={numberLoading ? '' : form.invoiceNumber}
                    placeholder={numberLoading ? 'Fetching next number…' : 'Invoice number…'}
                    onChange={e => set('invoiceNumber', e.target.value)}
                    disabled={numberLoading}
                    className={`bg-secondary border-border flex-1 ${numberError ? 'border-destructive' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 px-3 border-border text-xs shrink-0"
                    onClick={handleRegenerate}
                    disabled={numberLoading}>
                    {numberLoading ? 'Loading…' : 'Regenerate'}
                  </Button>
                </div>
                {numberError && <p className="text-xs text-destructive">{numberError}</p>}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Human ID</Label>
            <Input
              value={form.humanId}
              onChange={e => set('humanId', e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">PO Number</Label>
            <Input
              value={form.poNumber}
              onChange={e => set('poNumber', e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Company *</Label>
            <Select value={form.companyId} onValueChange={v => set('companyId', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select company…" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {companyOptions.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Invoice Date *</Label>
            <Input
              type="date"
              value={form.invoiceDate}
              onChange={e => set('invoiceDate', e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Due Date *</Label>
            <Input
              type="date"
              value={form.dueDate}
              onChange={e => set('dueDate', e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Invoice Type *</Label>
            <Select value={form.invoiceTypeId} onValueChange={v => set('invoiceTypeId', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select type…" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {invoiceTypes.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Status *</Label>
            <Select value={form.invoiceStatusId} onValueChange={v => set('invoiceStatusId', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select status…" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {invoiceStatuses.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Payment Method *</Label>
            <Select value={form.paymentMethodId} onValueChange={v => set('paymentMethodId', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select method…" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {paymentMethods.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Sent Type *</Label>
            <Select value={form.invoiceSentTypeId} onValueChange={v => set('invoiceSentTypeId', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select sent type…" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {invoiceSentTypes.map(st => (
                  <SelectItem key={st.id} value={st.id}>
                    {st.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">VAT Margin *</Label>
            <Select value={form.vatMarginId} onValueChange={v => set('vatMarginId', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select VAT…" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {vatMargins.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.vat}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2 grid grid-cols-2 gap-3">
            {[
              {key: 'outstanding' as const, label: 'Outstanding'},
              {key: 'reminderSent' as const, label: 'Reminder Sent'},
            ].map(({key, label}) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Switch checked={form[key]} onCheckedChange={v => set(key, v)} />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !isValid}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
