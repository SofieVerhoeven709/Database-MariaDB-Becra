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

interface PurchaseDetailFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  detail: MappedPurchaseDetail | null
  purchaseId: string
  projects: DetailOption[]
  onSave: (detail: MappedPurchaseDetail) => Promise<void>
}

const STATUS_OPTIONS = ['Pending', 'Ordered', 'Delivered', 'Cancelled', 'On Hold']

function emptyDetail(purchaseId: string): MappedPurchaseDetail {
  return {
    id: '',
    purchaseId,
    projectId: null,
    projectNumber: null,
    projectName: null,
    beNumber: null,
    unitPrice: null,
    quantity: null,
    totalCost: null,
    status: null,
    additionalInfo: null,
    updatedAt: null,
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
  projects,
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
      // Auto-calculate totalCost when unitPrice or quantity changes
      if (key === 'unitPrice' || key === 'quantity') {
        const up = key === 'unitPrice' ? (value as number | null) : prev.unitPrice
        const qty = key === 'quantity' ? (value as number | null) : prev.quantity
        next.totalCost = up != null && qty != null ? up * qty : prev.totalCost
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Line Item' : 'New Line Item'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* BE Number */}
          <div className="grid gap-1.5">
            <Label htmlFor="beNumber">BE Number</Label>
            <Input
              id="beNumber"
              value={form.beNumber ?? ''}
              onChange={e => set('beNumber', e.target.value || null)}
              placeholder="e.g. BE-001"
              className="bg-secondary border-border"
            />
          </div>

          {/* Project */}
          <div className="grid gap-1.5">
            <Label>Project</Label>
            <Select
              value={form.projectId ?? '__none__'}
              onValueChange={v => set('projectId', v === '__none__' ? null : v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="__none__">— None —</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Unit price / Quantity / Total cost */}
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="unitPrice">Unit Price (€)</Label>
              <Input
                id="unitPrice"
                type="number"
                min={0}
                value={form.unitPrice ?? ''}
                onChange={e => set('unitPrice', e.target.value ? parseInt(e.target.value, 10) : null)}
                placeholder="0"
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={0}
                value={form.quantity ?? ''}
                onChange={e => set('quantity', e.target.value ? parseInt(e.target.value, 10) : null)}
                placeholder="0"
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="totalCost">Total Cost (€)</Label>
              <Input
                id="totalCost"
                type="number"
                min={0}
                value={form.totalCost ?? ''}
                onChange={e => set('totalCost', e.target.value ? parseInt(e.target.value, 10) : null)}
                placeholder="0"
                className="bg-secondary border-border"
              />
            </div>
          </div>

          {/* Status */}
          <div className="grid gap-1.5">
            <Label>Status</Label>
            <Select value={form.status ?? ''} onValueChange={v => set('status', v || null)}>
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

          {/* Additional Info */}
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
            disabled={saving}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Line Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
