'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import type {MappedPurchase} from '@/types/purchase'
import {generatePurchaseNumber} from '@/lib/utils'

export interface PurchaseOption {
  id: string
  name: string
}

interface PurchaseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchase: MappedPurchase | null
  companies: PurchaseOption[]
  quoteSuppliers: PurchaseOption[]
  paymentConditions: PurchaseOption[]
  onSave: (purchase: MappedPurchase) => Promise<void>
}

type PurchaseFormState = MappedPurchase

const STATUS_OPTIONS = ['DRAFT', 'ORDERED', 'PARTIAL_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED']

function emptyPurchase(): PurchaseFormState {
  // Defaults for a brand-new purchase order form.
  return {
    id: '',
    purchaseNumber: generatePurchaseNumber(),
    customerPoNumber: null,
    bocNumber: null,
    purchaseDate: new Date().toISOString(),
    status: 'DRAFT',
    companyId: '',
    companyName: null,
    quoteSupplierId: null,
    quoteNumber: null,
    paymentConditionId: null,
    paymentConditionName: null,
    createdAt: null,
    createdBy: '',
    createdByName: '',
    description: null,
    additionalInfo: null,
    deleted: false,
    deletedAt: null,
    deletedBy: null,
  }
}

export function PurchaseFormDialog({
  open,
  onOpenChange,
  purchase,
  companies,
  quoteSuppliers,
  paymentConditions,
  onSave,
}: PurchaseFormDialogProps) {
  const [form, setForm] = useState<PurchaseFormState>(emptyPurchase())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(purchase ?? emptyPurchase())
    }
  }, [open, purchase])

  function set<K extends keyof PurchaseFormState>(key: K, value: PurchaseFormState[K]) {
    setForm(prev => ({...prev, [key]: value}))
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      await onSave(form)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const isEdit = !!purchase
  const canSubmit = !!form.purchaseNumber.trim() && !!form.companyId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Purchase number */}
          <div className="grid gap-1.5">
            <Label htmlFor="purchaseNumber">Purchase Number</Label>
            <div className="flex gap-2">
              <Input
                id="purchaseNumber"
                value={form.purchaseNumber ?? ''}
                onChange={e => set('purchaseNumber', e.target.value)}
                placeholder="e.g. Becra 26042001"
                className="bg-secondary border-border flex-1"
              />
              {!isEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 px-3 border-border text-xs shrink-0"
                  onClick={() => set('purchaseNumber', generatePurchaseNumber())}>
                  Regenerate
                </Button>
              )}
            </div>
          </div>

          {/* Customer PO number */}
          <div className="grid gap-1.5">
            <Label htmlFor="customerPoNumber">PO Number Customer</Label>
            <Input
              id="customerPoNumber"
              value={form.customerPoNumber ?? ''}
              onChange={e => set('customerPoNumber', e.target.value || null)}
              placeholder="Free input"
              className="bg-secondary border-border"
            />
          </div>

          {/* BOC number */}
          <div className="grid gap-1.5">
            <Label htmlFor="bocNumber">BOC Number</Label>
            <div className="flex gap-2">
              <Input
                id="bocNumber"
                value={form.bocNumber ?? ''}
                onChange={e => set('bocNumber', e.target.value || null)}
                placeholder="Enter BOC"
                className="bg-secondary border-border flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 px-3 border-border text-xs shrink-0"
                disabled={!form.customerPoNumber?.trim()}
                onClick={() => set('bocNumber', form.customerPoNumber?.trim() ?? null)}>
                From PO customer
              </Button>
            </div>
          </div>

          {/* Purchase date */}
          <div className="grid gap-1.5">
            <Label htmlFor="purchaseDate">Purchase Date</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={form.purchaseDate ? form.purchaseDate.slice(0, 10) : ''}
              // Convert the date input back to ISO for storage.
              onChange={e =>
                set('purchaseDate', e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString())
              }
              className="bg-secondary border-border"
            />
          </div>

          {/* Status */}
          <div className="grid gap-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => set('status', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Company (supplier) */}
          <div className="grid gap-1.5">
            <Label>Supplier Company</Label>
            <Select
              value={form.companyId || '__none__'}
              onValueChange={v => set('companyId', v === '__none__' ? '' : v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="__none__">Select company</SelectItem>
                {companies.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quote (optional) */}
          <div className="grid gap-1.5">
            <Label>Quote (optional)</Label>
            <Select
              value={form.quoteSupplierId ?? '__none__'}
              onValueChange={v => set('quoteSupplierId', v === '__none__' ? null : v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select quote" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="__none__">Manual purchase (no quote)</SelectItem>
                {quoteSuppliers.map(q => (
                  <SelectItem key={q.id} value={q.id}>
                    {q.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment condition */}
          <div className="grid gap-1.5">
            <Label>Payment condition</Label>
            <Select
              value={form.paymentConditionId ?? '__none__'}
              onValueChange={v => set('paymentConditionId', v === '__none__' ? null : v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select payment condition" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="__none__">— None —</SelectItem>
                {paymentConditions.map(pc => (
                  <SelectItem key={pc.id} value={pc.id}>
                    {pc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description ?? ''}
              onChange={e => set('description', e.target.value || null)}
              placeholder="Detailed description"
              className="bg-secondary border-border"
            />
          </div>

          {/* Additional info */}
          <div className="grid gap-1.5">
            <Label htmlFor="additionalInfo">Additional Info</Label>
            <Input
              id="additionalInfo"
              value={form.additionalInfo ?? ''}
              onChange={e => set('additionalInfo', e.target.value || null)}
              placeholder="Optional extra details"
              className="bg-secondary border-border"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !canSubmit}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
