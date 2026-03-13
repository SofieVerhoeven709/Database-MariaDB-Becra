'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import type {MappedQuoteSupplier} from '@/types/quoteSupplier'

export interface ProjectOption {
  id: string
  name: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: MappedQuoteSupplier | null
  projects: ProjectOption[]
  onSave: (entry: MappedQuoteSupplier) => Promise<void>
}

function empty(): MappedQuoteSupplier {
  return {
    id: '', description: null, projectId: null, projectName: null,
    rejected: false, additionalInfo: null, link: null, payementCondition: null,
    acceptedForPOB: null, validUntill: null, deliveryTimeDays: null,
    createdBy: '', createdByName: '', deleted: false, deletedAt: null, deletedBy: null,
  }
}

export function QuoteSupplierFormDialog({open, onOpenChange, entry, projects, onSave}: Props) {
  const [form, setForm] = useState<MappedQuoteSupplier>(empty())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm(entry ?? empty())
  }, [open, entry])

  function set<K extends keyof MappedQuoteSupplier>(key: K, value: MappedQuoteSupplier[K]) {
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
      <DialogContent className="max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entry ? 'Edit Supplier Quote' : 'New Supplier Quote'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Project</Label>
            <Select value={form.projectId ?? '__none__'} onValueChange={v => set('projectId', v === '__none__' ? null : v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="__none__">— No project —</SelectItem>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="validUntill">Valid Until</Label>
            <Input id="validUntill" type="date"
              value={form.validUntill ? form.validUntill.split('T')[0] : ''}
              onChange={e => set('validUntill', e.target.value || null)}
              className="bg-secondary border-border" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="deliveryTimeDays">Delivery Time (days)</Label>
            <Input id="deliveryTimeDays" type="number"
              value={form.deliveryTimeDays ?? ''}
              onChange={e => set('deliveryTimeDays', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="e.g. 14" className="bg-secondary border-border" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="payementCondition">Payment Condition</Label>
            <Input id="payementCondition" value={form.payementCondition ?? ''}
              onChange={e => set('payementCondition', e.target.value || null)}
              placeholder="e.g. 30 days net" className="bg-secondary border-border" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="link">Link / Document</Label>
            <Input id="link" value={form.link ?? ''}
              onChange={e => set('link', e.target.value || null)}
              placeholder="https://…" className="bg-secondary border-border" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="additionalInfo">Additional Info</Label>
            <Input id="additionalInfo" value={form.additionalInfo ?? ''}
              onChange={e => set('additionalInfo', e.target.value || null)}
              placeholder="Extra notes" className="bg-secondary border-border" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={form.description ?? ''}
              onChange={e => set('description', e.target.value || null)}
              placeholder="Detailed description…" className="bg-secondary border-border resize-none" rows={3} />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch id="rejected" checked={form.rejected}
                onCheckedChange={(checked: boolean) => set('rejected', checked)} />
              <Label htmlFor="rejected">Rejected</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="acceptedForPOB" checked={form.acceptedForPOB ?? false}
                onCheckedChange={(checked: boolean) => set('acceptedForPOB', checked)} />
              <Label htmlFor="acceptedForPOB">Accepted for PO</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : entry ? 'Save Changes' : 'Create Quote'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

