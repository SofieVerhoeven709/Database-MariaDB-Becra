'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import type {MappedQuoteSupplier} from '@/types/quoteSupplier'

export interface CompanyOption {
  id: string
  name: string
}

export interface PaymentConditionOption {
  id: string
  name: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: MappedQuoteSupplier | null
  companies: CompanyOption[]
  paymentConditions: PaymentConditionOption[]
  defaultQuoteNumber: string
  defaultCompanyId?: string
  canEditNumber: boolean
  onSave: (entry: MappedQuoteSupplier) => Promise<void>
}

function empty(): MappedQuoteSupplier {
  return {
    id: '',
    quoteNumber: '',
    quotationNumber: null,
    companyId: '',
    companyName: '',
    description: null,
    rejected: false,
    additionalInfo: null,
    acceptedForPOB: false,
    validUntil: null,
    deliveryTimeDays: null,
    paymentConditionId: null,
    paymentConditionName: null,
    createdBy: '',
    createdByName: '',
    deleted: false,
    deletedAt: null,
    deletedBy: null,
    deletedByName: null,
    lineCount: 0,
    sent: false,
    received: false,
  }
}

export function QuoteSupplierFormDialog({
  open,
  onOpenChange,
  entry,
  companies,
  paymentConditions,
  defaultQuoteNumber,
  defaultCompanyId,
  canEditNumber,
  onSave,
}: Props) {
  const [form, setForm] = useState<MappedQuoteSupplier>(empty())
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const isEdit = !!entry

  useEffect(() => {
    if (!open) return
    if (entry) {
      setForm(entry)
      setSaveError(null)
      return
    }
    // Seed new quotes with defaults and optional preselected supplier.
    setForm({...empty(), quoteNumber: defaultQuoteNumber, companyId: defaultCompanyId ?? ''})
    setSaveError(null)
  }, [open, entry, defaultQuoteNumber, defaultCompanyId])

  function set<K extends keyof MappedQuoteSupplier>(key: K, value: MappedQuoteSupplier[K]) {
    setForm(prev => ({...prev, [key]: value}))
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      setSaveError(null)
      await onSave(form)
      onOpenChange(false)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save quote supplier.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entry ? 'Edit Supplier Quote' : 'New Supplier Quote'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {saveError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {saveError}
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="quoteNumber">Quote Number</Label>
            {!isEdit || canEditNumber ? (
              <div className="flex gap-2">
                <Input
                  id="quoteNumber"
                  value={form.quoteNumber}
                  onChange={e => set('quoteNumber', e.target.value)}
                  placeholder="e.g. Q1000000"
                  className="bg-secondary border-border"
                />
                {!isEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 px-3 border-border text-xs shrink-0"
                    onClick={() => set('quoteNumber', defaultQuoteNumber)}>
                    Regenerate
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex h-10 items-center rounded-md border border-border bg-secondary/40 px-3 text-sm text-muted-foreground cursor-not-allowed select-none">
                {form.quoteNumber}
              </div>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="quotationNumber">Quotation Number</Label>
            <Input
              id="quotationNumber"
              value={form.quotationNumber ?? ''}
              onChange={e => set('quotationNumber', e.target.value || null)}
              placeholder="Supplier quotation reference"
              className="bg-secondary border-border"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Supplier</Label>
            <Select
              value={form.companyId || '__none__'}
              onValueChange={v => set('companyId', v === '__none__' ? '' : v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="__none__">— Select supplier —</SelectItem>
                {companies.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="validUntil">Valid Until</Label>
            <Input
              id="validUntil"
              type="date"
              value={form.validUntil ? form.validUntil.split('T')[0] : ''}
              // Store the ISO date part only; the backend handles full Date conversion.
              onChange={e => set('validUntil', e.target.value || null)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="deliveryTimeDays">Delivery Time (days)</Label>
            <Input
              id="deliveryTimeDays"
              type="number"
              value={form.deliveryTimeDays ?? ''}
              onChange={e => set('deliveryTimeDays', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="e.g. 14"
              className="bg-secondary border-border"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Payment Condition</Label>
            <Select
              value={form.paymentConditionId ?? '__none__'}
              onValueChange={v => set('paymentConditionId', v === '__none__' ? null : v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select payment condition" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="__none__">— No payment condition —</SelectItem>
                {paymentConditions.map(pc => (
                  <SelectItem key={pc.id} value={pc.id}>
                    {pc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="additionalInfo">Additional Info</Label>
            <Input
              id="additionalInfo"
              value={form.additionalInfo ?? ''}
              onChange={e => set('additionalInfo', e.target.value || null)}
              placeholder="Extra notes"
              className="bg-secondary border-border"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description ?? ''}
              onChange={e => set('description', e.target.value || null)}
              placeholder="Detailed description…"
              className="bg-secondary border-border resize-none"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="rejected"
                checked={form.rejected}
                onCheckedChange={(checked: boolean) => set('rejected', checked)}
              />
              <Label htmlFor="rejected">Rejected</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="acceptedForPOB"
                checked={form.acceptedForPOB ?? false}
                onCheckedChange={(checked: boolean) => set('acceptedForPOB', checked)}
              />
              <Label htmlFor="acceptedForPOB">Accepted for PO</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : entry ? 'Save Changes' : 'Create Quote'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
