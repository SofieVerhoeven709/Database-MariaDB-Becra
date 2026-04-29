'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import type {IncomingDeliveryOption, MappedIncomingDelivery} from '@/types/incomingDelivery'
import {generateIncomingDeliveryNumber} from '@/lib/utils'

interface IncomingDeliveryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: MappedIncomingDelivery | null
  purchaseOptions: IncomingDeliveryOption[]
  onSave: (entry: MappedIncomingDelivery) => Promise<void>
}

const STATUS_OPTIONS = ['DRAFT', 'RECEIVED', 'PARTIAL', 'CLOSED', 'CANCELLED']

function emptyDelivery(): MappedIncomingDelivery {
  // Defaults used for a new incoming delivery form.
  return {
    id: '',
    incomingDeliveryNumber: generateIncomingDeliveryNumber(),
    purchaseId: null,
    purchaseNumber: null,
    purchaseDescription: null,
    status: 'DRAFT',
    deliveryDate: new Date().toISOString(),
    receivedAt: null,
    description: null,
    additionalInfo: null,
    createdAt: new Date().toISOString(),
    createdBy: '',
    createdByName: '',
    deleted: false,
    deletedAt: null,
    deletedBy: null,
    lineCount: 0,
    orderedQtyTotal: 0,
    acceptedQtyTotal: 0,
    isFullyDelivered: false,
  }
}

export function IncomingDeliveryFormDialog({
  open,
  onOpenChange,
  entry,
  purchaseOptions,
  onSave,
}: IncomingDeliveryFormDialogProps) {
  const [form, setForm] = useState<MappedIncomingDelivery>(emptyDelivery())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(entry ?? emptyDelivery())
    }
  }, [open, entry])

  function set<K extends keyof MappedIncomingDelivery>(key: K, value: MappedIncomingDelivery[K]) {
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
  const canSubmit = !!form.incomingDeliveryNumber.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Incoming Delivery' : 'New Incoming Delivery'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="incomingDeliveryNumber">Delivery Number</Label>
            <div className="flex gap-2">
              <Input
                id="incomingDeliveryNumber"
                value={form.incomingDeliveryNumber}
                onChange={e => set('incomingDeliveryNumber', e.target.value)}
                placeholder="e.g. DEL2026041301"
                className="bg-secondary border-border flex-1"
              />
              {!isEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 px-3 border-border text-xs shrink-0"
                  onClick={() => set('incomingDeliveryNumber', generateIncomingDeliveryNumber())}>
                  Regenerate
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Purchase Order (optional)</Label>
            <Select
              value={form.purchaseId ?? '__none__'}
              onValueChange={v => set('purchaseId', v === '__none__' ? null : v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select purchase order" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="__none__">No linked purchase</SelectItem>
                {purchaseOptions.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name} {option.description ? `- ${option.description}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={value => set('status', value)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {STATUS_OPTIONS.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="deliveryDate">Delivery Date</Label>
            <Input
              id="deliveryDate"
              type="date"
              value={form.deliveryDate ? form.deliveryDate.slice(0, 10) : ''}
              // Convert date input back to ISO for storage.
              onChange={e =>
                set('deliveryDate', e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString())
              }
              className="bg-secondary border-border"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="receivedAt">Received At (optional)</Label>
            <Input
              id="receivedAt"
              type="datetime-local"
              value={form.receivedAt ? form.receivedAt.slice(0, 16) : ''}
              // Normalize local datetime input to ISO.
              onChange={e => set('receivedAt', e.target.value ? new Date(e.target.value).toISOString() : null)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description ?? ''}
              onChange={e => set('description', e.target.value || null)}
              placeholder="Delivery notes"
              className="bg-secondary border-border"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="additionalInfo">Additional Info</Label>
            <Input
              id="additionalInfo"
              value={form.additionalInfo ?? ''}
              onChange={e => set('additionalInfo', e.target.value || null)}
              placeholder="Carrier, tracking, remarks"
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
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Delivery'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
