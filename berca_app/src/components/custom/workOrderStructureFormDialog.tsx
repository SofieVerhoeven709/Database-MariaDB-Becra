'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {createWorkOrderStructureAction, updateWorkOrderStructureAction} from '@/serverFunctions/workOrderStructures'
import type {MappedWorkOrderStructure, MaterialOption} from '@/types/workOrderStructure'
import {useRouter} from 'next/navigation'

interface WorkOrderOption {
  id: string
  name: string
}

interface WorkOrderStructureFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  structure: MappedWorkOrderStructure | null
  workOrderOptions: WorkOrderOption[]
  materialOptions: MaterialOption[]
}

function emptyForm() {
  return {
    clientNumber: '',
    tag: '',
    quantity: '',
    shortDescription: '',
    longDescription: '',
    additionalInfo: '',
    workOrderId: '',
    materialId: '',
  }
}

export function WorkOrderStructureFormDialog({
  open,
  onOpenChange,
  structure,
  workOrderOptions,
  materialOptions,
}: WorkOrderStructureFormDialogProps) {
  const router = useRouter()
  const isEdit = !!structure
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm())

  useEffect(() => {
    if (structure) {
      setForm({
        clientNumber: structure.clientNumber ?? '',
        tag: structure.tag ?? '',
        quantity: structure.quantity?.toString() ?? '',
        shortDescription: structure.shortDescription ?? '',
        longDescription: structure.longDescription ?? '',
        additionalInfo: structure.additionalInfo ?? '',
        workOrderId: structure.workOrderId,
        materialId: structure.materialId,
      })
    } else if (open) {
      setForm(emptyForm())
    }
  }, [structure?.id, open])

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({...prev, [key]: value}))
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      const payload = {
        clientNumber: form.clientNumber || null,
        tag: form.tag || null,
        quantity: form.quantity ? parseInt(form.quantity) : null,
        shortDescription: form.shortDescription || null,
        longDescription: form.longDescription || null,
        additionalInfo: form.additionalInfo || null,
        workOrderId: form.workOrderId,
        materialId: form.materialId,
      }

      if (isEdit) {
        await updateWorkOrderStructureAction({...payload, id: structure.id})
      } else {
        await createWorkOrderStructureAction(payload)
      }

      onOpenChange(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const canSubmit = !!form.workOrderId && !!form.materialId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? 'Edit Structure' : 'New Structure'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-5 py-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Work Order *</Label>
            <Select value={form.workOrderId} onValueChange={v => set('workOrderId', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select work order" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {workOrderOptions.map(w => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Material *</Label>
            <Select value={form.materialId} onValueChange={v => set('materialId', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {materialOptions.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.beNumber} — {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Client Number</Label>
            <Input
              value={form.clientNumber}
              onChange={e => set('clientNumber', e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Tag</Label>
            <Input value={form.tag} onChange={e => set('tag', e.target.value)} className="bg-secondary border-border" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Quantity</Label>
            <Input
              type="number"
              value={form.quantity}
              onChange={e => set('quantity', e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Short Description</Label>
            <Input
              value={form.shortDescription}
              onChange={e => set('shortDescription', e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Long Description</Label>
            <Textarea
              value={form.longDescription}
              onChange={e => set('longDescription', e.target.value)}
              rows={3}
              className="bg-secondary border-border resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Additional Info</Label>
            <Textarea
              value={form.additionalInfo}
              onChange={e => set('additionalInfo', e.target.value)}
              rows={3}
              className="bg-secondary border-border resize-none"
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !canSubmit}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Structure'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
