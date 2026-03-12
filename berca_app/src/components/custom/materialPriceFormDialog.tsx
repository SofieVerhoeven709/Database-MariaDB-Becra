'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Textarea} from '@/components/ui/textarea'
import type {MappedMaterialPrice} from '@/types/materialPrice'

export interface MaterialPriceOption {
  id: string
  name: string
}

interface MaterialPriceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: MappedMaterialPrice | null
  companies: MaterialPriceOption[]
  onSave: (entry: MappedMaterialPrice) => Promise<void>
}

function emptyEntry(): MappedMaterialPrice {
  return {
    id: '',
    beNumber: null,
    orderNr: null,
    quoteBecra: null,
    supplierOrderNr: null,
    brandOrderNr: null,
    shortDescription: null,
    longDescription: null,
    brandName: null,
    rejected: null,
    additionalInfo: null,
    unitPrice: null,
    quantityPrice: null,
    updatedAt: null,
    companyId: null,
    companyName: null,
    createdBy: '',
    createdByName: '',
    deleted: false,
    deletedAt: null,
    deletedBy: null,
  }
}

export function MaterialPriceFormDialog({open, onOpenChange, entry, companies, onSave}: MaterialPriceFormDialogProps) {
  const [form, setForm] = useState<MappedMaterialPrice>(emptyEntry())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm(entry ?? emptyEntry())
  }, [open, entry])

  function set<K extends keyof MappedMaterialPrice>(key: K, value: MappedMaterialPrice[K]) {
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

  const isEdit = !!entry

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Material Price' : 'New Material Price'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Supplier Company */}
          <div className="grid gap-1.5">
            <Label>Supplier Company</Label>
            <Select
              value={form.companyId ?? '__none__'}
              onValueChange={v => set('companyId', v === '__none__' ? null : v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="__none__">— No company —</SelectItem>
                {companies.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* BE Number */}
          <div className="grid gap-1.5">
            <Label htmlFor="beNumber">BE Number</Label>
            <Input
              id="beNumber"
              value={form.beNumber ?? ''}
              onChange={e => set('beNumber', e.target.value || null)}
              placeholder="e.g. BE-0001"
              className="bg-secondary border-border"
            />
          </div>

          {/* Short Description */}
          <div className="grid gap-1.5">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Input
              id="shortDescription"
              value={form.shortDescription ?? ''}
              onChange={e => set('shortDescription', e.target.value || null)}
              placeholder="Brief description"
              className="bg-secondary border-border"
            />
          </div>

          {/* Brand Name */}
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

          {/* Brand Order Nr */}
          <div className="grid gap-1.5">
            <Label htmlFor="brandOrderNr">Brand Order Nr</Label>
            <Input
              id="brandOrderNr"
              value={form.brandOrderNr ?? ''}
              onChange={e => set('brandOrderNr', e.target.value || null)}
              placeholder="Manufacturer part number"
              className="bg-secondary border-border"
            />
          </div>

          {/* Unit Price & Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="unitPrice">Unit Price (€)</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                value={form.unitPrice ?? ''}
                onChange={e => set('unitPrice', e.target.value || null)}
                placeholder="0.00"
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="quantityPrice">Quantity</Label>
              <Input
                id="quantityPrice"
                type="number"
                value={form.quantityPrice ?? ''}
                onChange={e => set('quantityPrice', e.target.value || null)}
                placeholder="1"
                className="bg-secondary border-border"
              />
            </div>
          </div>

          {/* Order Nr */}
          <div className="grid gap-1.5">
            <Label htmlFor="orderNr">Order Nr</Label>
            <Input
              id="orderNr"
              value={form.orderNr ?? ''}
              onChange={e => set('orderNr', e.target.value || null)}
              placeholder="Internal order number"
              className="bg-secondary border-border"
            />
          </div>

          {/* Supplier Order Nr */}
          <div className="grid gap-1.5">
            <Label htmlFor="supplierOrderNr">Supplier Order Nr</Label>
            <Input
              id="supplierOrderNr"
              value={form.supplierOrderNr ?? ''}
              onChange={e => set('supplierOrderNr', e.target.value || null)}
              placeholder="Supplier reference number"
              className="bg-secondary border-border"
            />
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

          {/* Long Description */}
          <div className="grid gap-1.5">
            <Label htmlFor="longDescription">Long Description</Label>
            <Textarea
              id="longDescription"
              value={form.longDescription ?? ''}
              onChange={e => set('longDescription', e.target.value || null)}
              placeholder="Detailed description"
              className="bg-secondary border-border resize-none"
              rows={3}
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
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
