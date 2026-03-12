'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import type {MappedPurchase} from '@/types/purchase'

export interface PurchaseOption {
  id: string
  name: string
}

interface PurchaseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchase: MappedPurchase | null
  companies: PurchaseOption[]
  projects: PurchaseOption[]
  onSave: (purchase: MappedPurchase) => Promise<void>
}

const STATUS_OPTIONS = ['Pending', 'Ordered', 'Delivered', 'Cancelled', 'On Hold']

function emptyPurchase(): MappedPurchase {
  return {
    id: '',
    orderNumber: null,
    brandName: null,
    purchaseDate: null,
    status: null,
    companyId: null,
    companyName: null,
    projectId: null,
    projectNumber: null,
    projectName: null,
    updatedAt: null,
    createdBy: '',
    createdByName: '',
    preferredSupplier: null,
    description: null,
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
  projects,
  onSave,
}: PurchaseFormDialogProps) {
  const [form, setForm] = useState<MappedPurchase>(emptyPurchase())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(purchase ?? emptyPurchase())
    }
  }, [open, purchase])

  function set<K extends keyof MappedPurchase>(key: K, value: MappedPurchase[K]) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Order number */}
          <div className="grid gap-1.5">
            <Label htmlFor="orderNumber">Order Number</Label>
            <Input
              id="orderNumber"
              value={form.orderNumber ?? ''}
              onChange={e => set('orderNumber', e.target.value || null)}
              placeholder="e.g. PO-2026-001"
              className="bg-secondary border-border"
            />
          </div>

          {/* Purchase date */}
          <div className="grid gap-1.5">
            <Label htmlFor="purchaseDate">Purchase Date</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={form.purchaseDate ? form.purchaseDate.slice(0, 10) : ''}
              onChange={e => set('purchaseDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
              className="bg-secondary border-border"
            />
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

          {/* Company (supplier) */}
          <div className="grid gap-1.5">
            <Label>Supplier Company</Label>
            <Select value={form.companyId ?? ''} onValueChange={v => set('companyId', v || null)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {companies.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project */}
          <div className="grid gap-1.5">
            <Label>Project</Label>
            <Select value={form.projectId ?? ''} onValueChange={v => set('projectId', v || null)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brand name */}
          <div className="grid gap-1.5">
            <Label htmlFor="brandName">Brand Name</Label>
            <Input
              id="brandName"
              value={form.brandName ?? ''}
              onChange={e => set('brandName', e.target.value || null)}
              placeholder="e.g. Siemens"
              className="bg-secondary border-border"
            />
          </div>

          {/* Preferred supplier */}
          <div className="grid gap-1.5">
            <Label htmlFor="preferedSupplier">Preferred Supplier</Label>
            <Input
              id="preferedSupplier"
              value={form.preferredSupplier ?? ''}
              onChange={e => set('preferredSupplier', e.target.value || null)}
              placeholder="e.g. PartsCo"
              className="bg-secondary border-border"
            />
          </div>

          {/* Description */}
          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description ?? ''}
              onChange={e => set('description', e.target.value || null)}
              placeholder="Short description"
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
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
