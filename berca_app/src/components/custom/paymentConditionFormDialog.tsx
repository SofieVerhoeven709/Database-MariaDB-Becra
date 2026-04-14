'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import type {MappedPaymentCondition} from '@/types/quoteSupplier'

interface PaymentConditionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentCondition: MappedPaymentCondition | null
  onSave: (name: string, id?: string) => Promise<void>
}

export function PaymentConditionFormDialog({
  open,
  onOpenChange,
  paymentCondition,
  onSave,
}: PaymentConditionFormDialogProps) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(paymentCondition?.name ?? '')
  }, [paymentCondition?.id, open])

  async function handleSubmit() {
    setSaving(true)
    try {
      await onSave(name.trim(), paymentCondition?.id)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle>{paymentCondition ? 'Edit Payment Condition' : 'New Payment Condition'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5 py-2">
          <Label className="text-xs text-muted-foreground">Name *</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Net 30"
            className="bg-secondary border-border"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : paymentCondition ? 'Save Changes' : 'Create Condition'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

