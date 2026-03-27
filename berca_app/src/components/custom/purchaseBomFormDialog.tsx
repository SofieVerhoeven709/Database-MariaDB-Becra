'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import type {MappedPurchaseBom} from '@/types/purchaseBom'

interface PurchaseBomFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: MappedPurchaseBom | null
  onSave: (entry: MappedPurchaseBom) => Promise<void>
}

function empty(): MappedPurchaseBom {
  return {id: '', description: null, date: null, createdBy: '', createdByName: '', deleted: false, deletedAt: null, deletedBy: null}
}

export function PurchaseBomFormDialog({open, onOpenChange, entry, onSave}: PurchaseBomFormDialogProps) {
  const [form, setForm] = useState<MappedPurchaseBom>(empty())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm(entry ?? empty())
  }, [open, entry])

  function set<K extends keyof MappedPurchaseBom>(key: K, value: MappedPurchaseBom[K]) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>{entry ? 'Edit Purchase BOM' : 'New Purchase BOM'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={form.date ? form.date.split('T')[0] : ''}
              onChange={e => set('date', e.target.value || null)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description ?? ''}
              onChange={e => set('description', e.target.value || null)}
              placeholder="BOM description…"
              className="bg-secondary border-border resize-none"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : entry ? 'Save Changes' : 'Create Entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

