'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import type {MappedPurchaseDetail} from '@/types/purchase'

export interface DetailOption {
  id: string
  name: string
}

export interface QuoteLineOption extends DetailOption {
  materialId: string
  materialDemandId: string | null
  quantity: number
  unitPrice: string
  minQuantity: number | null
}

interface PurchaseDetailFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  detail: MappedPurchaseDetail | null
  purchaseId: string
  materialOptions: DetailOption[]
  materialDemandOptions: DetailOption[]
  quoteLineOptions: QuoteLineOption[]
  onSave: (detail: MappedPurchaseDetail) => Promise<void>
}

const STATUS_OPTIONS = ['OPEN', 'ORDERED', 'RECEIVED', 'CANCELLED']

function emptyDetail(purchaseId: string): MappedPurchaseDetail {
  return {
    id: '',
    purchaseId,
    quoteSupplierLineId: null,
    materialId: '',
    materialLabel: '',
    materialDemandId: null,
    unitPrice: '0.00',
    quantity: 1,
    minQuantity: null,
    lineStatus: 'OPEN',
    additionalInfo: null,
    createdAt: null,
    createdBy: '',
    createdByName: '',
    deleted: false,
    deletedAt: null,
    deletedBy: null,
  }
}

export function PurchaseDetailFormDialog({
  open,
  onOpenChange,
  detail,
  purchaseId,
  materialOptions,
  materialDemandOptions,
  quoteLineOptions,
  onSave,
}: PurchaseDetailFormDialogProps) {
  const [form, setForm] = useState<MappedPurchaseDetail>(emptyDetail(purchaseId))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(detail ?? emptyDetail(purchaseId))
    }
  }, [open, detail, purchaseId])

  function set<K extends keyof MappedPurchaseDetail>(key: K, value: MappedPurchaseDetail[K]) {
    setForm(prev => {
      const next = {...prev, [key]: value}
      if (key === 'materialId') {
        const match = materialOptions.find(opt => opt.id === value)
        next.materialLabel = match?.name ?? ''
      }
      if (key === 'quoteSupplierLineId') {
        const line = quoteLineOptions.find(opt => opt.id === value)
        if (line) {
          next.materialId = line.materialId
          next.materialDemandId = line.materialDemandId
          next.quantity = line.quantity
          next.unitPrice = line.unitPrice
          next.minQuantity = line.minQuantity
          next.materialLabel = line.name
        }
      }
      return next
    })
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

  const isEdit = !!detail
  const canSubmit = !!form.materialId && form.quantity > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Line Item' : 'New Line Item'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Quote Line (optional)</Label>
            <Select
              value={form.quoteSupplierLineId ?? '__none__'}
              onValueChange={v => set('quoteSupplierLineId', v === '__none__' ? null : v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select quote line" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="__none__">Manual line (no quote)</SelectItem>
                {quoteLineOptions.map(line => (
                  <SelectItem key={line.id} value={line.id}>
                    {line.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>Material</Label>
            <Select value={form.materialId || '__none__'} onValueChange={v => set('materialId', v === '__none__' ? '' : v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="__none__">Select material</SelectItem>
                {materialOptions.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>Material Demand (optional)</Label>
            <Select
              value={form.materialDemandId ?? '__none__'}
              onValueChange={v => set('materialDemandId', v === '__none__' ? null : v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select demand" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="__none__">- None -</SelectItem>
                {materialDemandOptions.map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="unitPrice">Unit Price (EUR)</Label>
              <Input
                id="unitPrice"
                type="number"
                min={0}
                step="any"
                value={form.unitPrice ?? ''}
                onChange={e => set('unitPrice', e.target.value || '0.00')}
                placeholder="0.00"
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={form.quantity ?? ''}
                onChange={e => set('quantity', e.target.value ? parseInt(e.target.value, 10) : 1)}
                placeholder="1"
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="minQuantity">Min Quantity</Label>
              <Input
                id="minQuantity"
                type="number"
                min={0}
                step={1}
                value={form.minQuantity ?? ''}
                onChange={e => set('minQuantity', e.target.value ? parseInt(e.target.value, 10) : null)}
                placeholder="0"
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Line Status</Label>
            <Select value={form.lineStatus ?? 'OPEN'} onValueChange={v => set('lineStatus', v)}>
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

          <div className="grid gap-1.5">
            <Label htmlFor="additionalInfo">Additional Info</Label>
            <Input
              id="additionalInfo"
              value={form.additionalInfo ?? ''}
              onChange={e => set('additionalInfo', e.target.value || null)}
              placeholder="Any extra notes"
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
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Line Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
