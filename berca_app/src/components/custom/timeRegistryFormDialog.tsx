'use client'

import {useEffect, useState} from 'react'
import {X} from 'lucide-react'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import type {MappedTimeRegistry} from '@/types/timeRegistry'

export interface EmployeeOption {
  id: string
  firstName: string
  lastName: string
}

export interface HourTypeOption {
  id: string
  name: string
}

export interface WorkOrderOption {
  id: string
  workOrderNumber: string | null
}

export type TimeRegistryFormData = {
  activityDescription: string
  additionalInfo: string
  invoiceInfo: string
  workDate: string
  startTime: string
  endTime: string
  startBreak: string
  endBreak: string
  invoiceTime: boolean
  onSite: boolean
  hourTypeId: string
  workOrderId: string
  employeeIds: string[]
}

const emptyForm = (defaultWorkOrderId = '', currentUserId = ''): TimeRegistryFormData => ({
  activityDescription: '',
  additionalInfo: '',
  invoiceInfo: '',
  workDate: '',
  startTime: '',
  endTime: '',
  startBreak: '',
  endBreak: '',
  invoiceTime: false,
  onSite: false,
  hourTypeId: '',
  workOrderId: defaultWorkOrderId,
  employeeIds: currentUserId ? [currentUserId] : [],
})

function toInputDate(iso: string | null | undefined) {
  if (!iso) return ''
  return new Date(iso).toISOString().slice(0, 10)
}

function toInputTime(iso: string | null | undefined) {
  if (!iso) return ''
  return new Date(iso).toISOString().slice(11, 16)
}

// ─── Employee multi-select ────────────────────────────────────────────────────
function EmployeeMultiSelect({
  value,
  onChange,
  employees,
  lockedId,
}: {
  value: string[]
  onChange: (ids: string[]) => void
  employees: EmployeeOption[]
  /** Employee id that cannot be removed (the creator) */
  lockedId?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">Additional Employees</Label>
      <div className="flex flex-wrap gap-1 rounded-md border border-border bg-secondary p-2 min-h-[36px]">
        {value.map(id => {
          const emp = employees.find(e => e.id === id)
          const isLocked = id === lockedId
          return emp ? (
            <Badge
              key={id}
              variant="secondary"
              className={`gap-1 text-xs h-5 ${isLocked ? 'cursor-default opacity-70' : 'cursor-pointer'}`}
              onClick={() => {
                if (!isLocked) onChange(value.filter(v => v !== id))
              }}>
              {emp.firstName} {emp.lastName}
              {isLocked ? null : <X className="h-2.5 w-2.5" />}
            </Badge>
          ) : null
        })}
      </div>
      <Select
        onValueChange={v => {
          if (!value.includes(v)) onChange([...value, v])
        }}>
        <SelectTrigger className="h-7 text-xs bg-secondary border-border">
          <SelectValue placeholder="Add employee…" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {employees
            .filter(e => !value.includes(e.id))
            .map(e => (
              <SelectItem key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface TimeRegistryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pass a record to edit; null to create */
  timeRegistry: MappedTimeRegistry | null
  employees: EmployeeOption[]
  hourTypes: HourTypeOption[]
  /** Available work orders — required on the standalone page, omit (or pass single) on the work order page */
  workOrders?: WorkOrderOption[]
  /** Fixed work order id used when the dialog is scoped to one work order */
  fixedWorkOrderId?: string
  /** The current user's employee id — pre-selected and locked in the employees list */
  currentUserId: string
  onSave: (data: TimeRegistryFormData) => Promise<void>
}

export function TimeRegistryFormDialog({
  open,
  onOpenChange,
  timeRegistry,
  employees,
  hourTypes,
  workOrders,
  fixedWorkOrderId,
  currentUserId,
  onSave,
}: TimeRegistryFormDialogProps) {
  const [form, setForm] = useState<TimeRegistryFormData>(emptyForm(fixedWorkOrderId, currentUserId))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (timeRegistry) {
      const existingIds = timeRegistry.additionalEmployees.map(e => e.employeeId)
      // Ensure creator is always present when editing too
      const employeeIds = existingIds.includes(currentUserId) ? existingIds : [currentUserId, ...existingIds]
      setForm({
        activityDescription: timeRegistry.activityDescription ?? '',
        additionalInfo: timeRegistry.additionalInfo ?? '',
        invoiceInfo: timeRegistry.invoiceInfo ?? '',
        workDate: toInputDate(timeRegistry.workDate),
        startTime: toInputTime(timeRegistry.startTime),
        endTime: toInputTime(timeRegistry.endTime),
        startBreak: toInputTime(timeRegistry.startBreak),
        endBreak: toInputTime(timeRegistry.endBreak),
        invoiceTime: timeRegistry.invoiceTime,
        onSite: timeRegistry.onSite,
        hourTypeId: timeRegistry.hourTypeId,
        workOrderId: timeRegistry.workOrderId,
        employeeIds,
      })
    } else {
      setForm(emptyForm(fixedWorkOrderId, currentUserId))
    }
  }, [open, timeRegistry, fixedWorkOrderId, currentUserId])

  function patch<K extends keyof TimeRegistryFormData>(key: K, value: TimeRegistryFormData[K]) {
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

  const isEdit = !!timeRegistry
  const showWorkOrderSelect = !fixedWorkOrderId && !!workOrders?.length

  return (
    <Dialog
      open={open}
      onOpenChange={open => {
        if (!open) setForm(emptyForm(fixedWorkOrderId, currentUserId))
        onOpenChange(open)
      }}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? 'Edit Time Registry' : 'Add Time Registry'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Work order selector — only shown on standalone page */}
          {showWorkOrderSelect && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Work Order *</Label>
              <Select value={form.workOrderId} onValueChange={v => patch('workOrderId', v)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select work order" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {workOrders.map(wo => (
                    <SelectItem key={wo.id} value={wo.id}>
                      {wo.workOrderNumber ?? wo.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Work Date *</Label>
              <Input
                type="date"
                value={form.workDate}
                onChange={e => patch('workDate', e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Hour Type *</Label>
              <Select value={form.hourTypeId} onValueChange={v => patch('hourTypeId', v)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select hour type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {hourTypes.map(ht => (
                    <SelectItem key={ht.id} value={ht.id}>
                      {ht.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Start Time *</Label>
              <Input
                type="time"
                value={form.startTime}
                onChange={e => patch('startTime', e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">End Time</Label>
              <Input
                type="time"
                value={form.endTime}
                onChange={e => patch('endTime', e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Break Start</Label>
              <Input
                type="time"
                value={form.startBreak}
                onChange={e => patch('startBreak', e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Break End</Label>
              <Input
                type="time"
                value={form.endBreak}
                onChange={e => patch('endBreak', e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Activity Description</Label>
            <Textarea
              value={form.activityDescription}
              rows={2}
              onChange={e => patch('activityDescription', e.target.value)}
              className="bg-secondary border-border resize-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Invoice Info</Label>
            <Input
              value={form.invoiceInfo}
              onChange={e => patch('invoiceInfo', e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Additional Info</Label>
            <Textarea
              value={form.additionalInfo}
              rows={2}
              onChange={e => patch('additionalInfo', e.target.value)}
              className="bg-secondary border-border resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
              <Label className="text-xs text-muted-foreground">On Site</Label>
              <Switch checked={form.onSite} onCheckedChange={v => patch('onSite', v)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
              <Label className="text-xs text-muted-foreground">Invoice Time</Label>
              <Switch checked={form.invoiceTime} onCheckedChange={v => patch('invoiceTime', v)} />
            </div>
          </div>

          <EmployeeMultiSelect
            value={form.employeeIds}
            onChange={ids => patch('employeeIds', ids)}
            employees={employees}
            lockedId={currentUserId}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              saving ||
              !form.workDate ||
              !form.startTime ||
              !form.hourTypeId ||
              (!fixedWorkOrderId && !form.workOrderId)
            }
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Time Registry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
