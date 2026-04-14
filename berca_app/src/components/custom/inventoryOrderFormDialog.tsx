'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Textarea} from '@/components/ui/textarea'
import type {MappedInventoryOrder} from '@/types/inventoryOrder'
import {generateIncomingDeliveryNumber} from '@/lib/utils'

export interface InventoryOption {
  id: string
  beNumber: string | null
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
    id: '', materialId: '', inventoryBeNumber: null, inventoryDescription: null,
    orderNumber: generateIncomingDeliveryNumber('OR'), requestedQty: 1, orderDate: new Date().toISOString().split('T')[0],
    shortDescription: '', longDescription: null,
    createdAt: '', createdBy: '', createdByName: '',
    approved: false, approvedAt: null, approvedBy: null, approvedByName: null,
    rejected: false, rejectedAt: null, rejectedBy: null, rejectedByName: null,
    notDeliverable: false, notCorrect: false, notCorrectReason: null, snapshotTakenAt: null,
    deleted: false, deletedAt: null, deletedBy: null, deletedByName: null,
  }
}

export function InventoryOrderFormDialog({open, onOpenChange, entry, inventories, onSave}: Props) {
  const [form, setForm] = useState<MappedInventoryOrder>(empty())
  const [saving, setSaving] = useState(false)
  const [materialSearch, setMaterialSearch] = useState('')
  const isEdit = !!entry

  useEffect(() => {
    if (open) {
      setForm(entry ?? empty())
      setMaterialSearch('')
    }
  }, [open, entry])

  const filteredInventories = inventories.filter(i => {
    if (!materialSearch) return true
    const q = materialSearch.toLowerCase()
    return (
      (i.beNumber ?? '').toLowerCase().includes(q) ||
      (i.shortDescription ?? '').toLowerCase().includes(q)
    )
  })

  function set<K extends keyof MappedInventoryOrder>(key: K, value: MappedInventoryOrder[K]) {
    setForm(prev => ({...prev, [key]: value}))
  }

  async function handleSubmit() {
    if (!form.materialId || !form.orderNumber.trim() || !form.requestedQty || form.requestedQty < 1 || !form.orderDate || !form.shortDescription.trim()) {
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
    form.materialId && form.orderNumber.trim() && form.requestedQty >= 1 && form.orderDate && form.shortDescription.trim()
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
            <Input
              value={materialSearch}
              onChange={e => setMaterialSearch(e.target.value)}
              placeholder="Search by number or name..."
              className="bg-secondary border-border"
            />
            <Select value={form.materialId || '__none__'} onValueChange={v => set('materialId', v === '__none__' ? '' : v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select inventory item" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="__none__">— Select item —</SelectItem>
                {filteredInventories.length === 0 ? (
                  <SelectItem value="__no_results__" disabled>No matching materials found</SelectItem>
                ) : (
                  filteredInventories.map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.beNumber ?? '—'} – {i.shortDescription}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="orderNumber">Order Number</Label>
            <div className="flex gap-2">
              <Input id="orderNumber" value={form.orderNumber} onChange={e => set('orderNumber', e.target.value)}
                placeholder="e.g. OR2026041301" className="bg-secondary border-border flex-1" />
              {!isEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 px-3 border-border text-xs shrink-0"
                  onClick={() => set('orderNumber', generateIncomingDeliveryNumber('OR'))}>
                  Regenerate
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="requestedQty">Requested Quantity</Label>
            <Input id="requestedQty" type="number" min={1} value={form.requestedQty}
              onChange={e => set('requestedQty', Number.parseInt(e.target.value, 10) || 0)}
              className="bg-secondary border-border" />
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
