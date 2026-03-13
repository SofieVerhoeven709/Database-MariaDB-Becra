'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Textarea} from '@/components/ui/textarea'
import type {MappedInventoryOrder} from '@/types/inventoryOrder'

export interface InventoryOption {
  id: string
  beNumber: string
  shortDescription: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: MappedInventoryOrder | null
  inventories: InventoryOption[]
  onSave: (entry: MappedInventoryOrder) => Promise<void>
}

function empty(): MappedInventoryOrder {
  return {
    id: '', inventoryId: '', inventoryBeNumber: null, inventoryDescription: null,
    orderNumber: '', orderDate: new Date().toISOString().split('T')[0],
    shortDescription: '', longDescription: null,
    createdAt: '', createdBy: '', createdByName: '', deleted: false, deletedAt: null, deletedBy: null,
  }
}

export function InventoryOrderFormDialog({open, onOpenChange, entry, inventories, onSave}: Props) {
  const [form, setForm] = useState<MappedInventoryOrder>(empty())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm(entry ?? empty())
  }, [open, entry])

  function set<K extends keyof MappedInventoryOrder>(key: K, value: MappedInventoryOrder[K]) {
    setForm(prev => ({...prev, [key]: value}))
  }

  async function handleSubmit() {
    if (!form.inventoryId || !form.orderNumber.trim() || !form.orderDate || !form.shortDescription.trim()) {
      return
    }
    setSaving(true)
    try {
      await onSave(form)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const canSubmit = Boolean(
    form.inventoryId && form.orderNumber.trim() && form.orderDate && form.shortDescription.trim()
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entry ? 'Edit Order Request' : 'New Order Request'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Inventory Item</Label>
            <Select value={form.inventoryId || '__none__'} onValueChange={v => set('inventoryId', v === '__none__' ? '' : v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select inventory item" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="__none__">— Select item —</SelectItem>
                {inventories.map(i => (
                  <SelectItem key={i.id} value={i.id}>{i.beNumber} – {i.shortDescription}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="orderNumber">Order Number</Label>
            <Input id="orderNumber" value={form.orderNumber} onChange={e => set('orderNumber', e.target.value)}
              placeholder="e.g. ORD-2026-001" className="bg-secondary border-border" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="orderDate">Order Date</Label>
            <Input id="orderDate" type="date" value={form.orderDate ? form.orderDate.split('T')[0] : ''}
              onChange={e => set('orderDate', e.target.value)} className="bg-secondary border-border" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Input id="shortDescription" value={form.shortDescription}
              onChange={e => set('shortDescription', e.target.value)}
              placeholder="Brief description" className="bg-secondary border-border" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="longDescription">Long Description</Label>
            <Textarea id="longDescription" value={form.longDescription ?? ''}
              onChange={e => set('longDescription', e.target.value || null)}
              placeholder="Detailed description…" className="bg-secondary border-border resize-none" rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !canSubmit} className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : entry ? 'Save Changes' : 'Create Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
