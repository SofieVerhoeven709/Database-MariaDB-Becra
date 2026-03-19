'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import type {MappedInvoiceOut, InvoiceLookup, VatMarginOption} from '@/types/invoice'
import {createInvoiceOutAction, updateInvoiceOutAction} from '@/serverFunctions/invoices'

interface InvoiceOutFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: MappedInvoiceOut | null
  invoiceTypes: InvoiceLookup[]
  paymentMethods: InvoiceLookup[]
  invoiceSentTypes: InvoiceLookup[]
  invoiceStatuses: InvoiceLookup[]
  vatMargins: VatMarginOption[]
  contactOptions: InvoiceLookup[]
  onSaved: () => void
}

type FormState = {
  invoiceNumber: string
  poNumber: string
  humanId: string
  invoiceDate: string
  dueDate: string
  sentDate: string
  invoiceTypeId: string
  paymentMethodId: string
  invoiceSentTypeId: string
  invoiceStatusId: string
  vatMarginId: string
  reminderSent: boolean
  outstanding: boolean
}

function toDateInput(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toISOString().slice(0, 10)
}

function emptyForm(inv: MappedInvoiceOut | null): FormState {
  const today = new Date().toISOString().slice(0, 10)
  if (!inv) {
    return {
      invoiceNumber: '',
      poNumber: '',
      humanId: '',
      invoiceDate: today,
      dueDate: today,
      sentDate: '',
      invoiceTypeId: '',
      paymentMethodId: '',
      invoiceSentTypeId: '',
      invoiceStatusId: '',
      vatMarginId: '',
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
    sentDate: toDateInput(inv.sentDate),
    invoiceTypeId: inv.invoiceTypeId,
    paymentMethodId: inv.paymentMethodId,
    invoiceSentTypeId: inv.invoiceSentTypeId,
    invoiceStatusId: inv.invoiceStatusId,
    vatMarginId: inv.vatMarginId,
    reminderSent: inv.reminderSent,
    outstanding: inv.outstanding,
  }
}

export function InvoiceOutFormDialog({
  open,
  onOpenChange,
  invoice,
  invoiceTypes,
  paymentMethods,
  invoiceSentTypes,
  invoiceStatuses,
  vatMargins,
  onSaved,
}: InvoiceOutFormDialogProps) {
  const [form, setForm] = useState<FormState>(() => emptyForm(invoice))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(emptyForm(invoice))
  }, [invoice?.id, open])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({...f, [key]: value}))
  }

  const isValid =
    form.invoiceNumber.trim() &&
    form.invoiceDate &&
    form.dueDate &&
    form.invoiceTypeId &&
    form.paymentMethodId &&
    form.invoiceSentTypeId &&
    form.invoiceStatusId &&
    form.vatMarginId

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
        sentDate: form.sentDate ? new Date(form.sentDate) : null,
        invoiceTypeId: form.invoiceTypeId,
        paymentMethodId: form.paymentMethodId,
        invoiceSentTypeId: form.invoiceSentTypeId,
        invoiceStatusId: form.invoiceStatusId,
        vatMarginId: form.vatMarginId,
        reminderSent: form.reminderSent,
        outstanding: form.outstanding,
      }

      if (invoice) {
        await updateInvoiceOutAction({id: invoice.id, ...payload})
      } else {
        await createInvoiceOutAction(payload)
      }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  const isEdit = !!invoice

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? 'Edit Invoice Out' : 'New Invoice Out'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-5 py-3 sm:grid-cols-2">
          {/* Invoice Number */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Invoice Number *</Label>
            <Input
              value={form.invoiceNumber}
              onChange={e => set('invoiceNumber', e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          {/* Human ID */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Human ID</Label>
            <Input
              value={form.humanId}
              onChange={e => set('humanId', e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          {/* PO Number */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">PO Number</Label>
            <Input
              value={form.poNumber}
              onChange={e => set('poNumber', e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          {/* Invoice Date */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Invoice Date *</Label>
            <Input
              type="date"
              value={form.invoiceDate}
              onChange={e => set('invoiceDate', e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          {/* Due Date */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Due Date *</Label>
            <Input
              type="date"
              value={form.dueDate}
              onChange={e => set('dueDate', e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          {/* Sent Date */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Sent Date</Label>
            <Input
              type="date"
              value={form.sentDate}
              onChange={e => set('sentDate', e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          {/* Invoice Type */}
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

          {/* Invoice Status */}
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

          {/* Payment Method */}
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

          {/* Invoice Sent Type */}
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

          {/* VAT Margin */}
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

          {/* Toggles */}
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
