'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {createWorkOrderAction, updateWorkOrderAction} from '@/serverFunctions/workOrders'
import {generateWorkOrderNumber} from '@/lib/utils'
import type {MappedWorkOrder} from '@/types/workOrder'
import {useRouter} from 'next/navigation'

interface ProjectOption {
  id: string
  name: string
}

interface WorkOrderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workOrder: MappedWorkOrder | null
  projectOptions: ProjectOption[]
}

function toInputDate(iso: string | null | undefined) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function emptyForm() {
  return {
    workOrderNumber: generateWorkOrderNumber(),
    description: '',
    additionalInfo: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    projectId: '',
    hoursMaterialClosed: false,
    invoiceSent: false,
    completed: false,
  }
}

export function WorkOrderFormDialog({open, onOpenChange, workOrder, projectOptions}: WorkOrderFormDialogProps) {
  const router = useRouter()
  const isEdit = !!workOrder
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm())

  useEffect(() => {
    if (workOrder) {
      setForm({
        workOrderNumber: workOrder.workOrderNumber ?? generateWorkOrderNumber(),
        description: workOrder.description ?? '',
        additionalInfo: workOrder.additionalInfo ?? '',
        startDate: toInputDate(workOrder.startDate),
        endDate: toInputDate(workOrder.endDate),
        projectId: workOrder.projectId,
        hoursMaterialClosed: workOrder.hoursMaterialClosed,
        invoiceSent: workOrder.invoiceSent,
        completed: workOrder.completed,
      })
    } else if (open) {
      setForm(emptyForm())
    }
  }, [workOrder?.id, open])

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({...prev, [key]: value}))
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      const payload = {
        workOrderNumber: form.workOrderNumber || null,
        description: form.description || null,
        additionalInfo: form.additionalInfo || null,
        startDate: new Date(form.startDate),
        endDate: form.endDate ? new Date(form.endDate) : null,
        projectId: form.projectId,
        hoursMaterialClosed: form.hoursMaterialClosed,
        invoiceSent: form.invoiceSent,
        completed: form.completed,
      }

      if (isEdit) {
        await updateWorkOrderAction({...payload, id: workOrder.id})
      } else {
        await createWorkOrderAction({...payload, redirectToProject: false})
      }

      onOpenChange(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const canSubmit = !!form.projectId && !!form.startDate

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? 'Edit Work Order' : 'New Work Order'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-5 py-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Work Order Number</Label>
            <Input value={form.workOrderNumber} readOnly className="bg-secondary border-border" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Project *</Label>
            <Select value={form.projectId} onValueChange={v => set('projectId', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {projectOptions.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Start Date *</Label>
            <Input
              type="date"
              value={form.startDate}
              onChange={e => set('startDate', e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">End Date</Label>
            <Input
              type="date"
              value={form.endDate}
              onChange={e => set('endDate', e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
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

          <div className="sm:col-span-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(
              [
                {key: 'hoursMaterialClosed', label: 'Hours / Material Closed'},
                {key: 'invoiceSent', label: 'Invoice Sent'},
                {key: 'completed', label: 'Completed'},
              ] as const
            ).map(({key, label}) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Switch checked={form[key]} onCheckedChange={v => set(key, v)} />
              </div>
            ))}
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
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Work Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
