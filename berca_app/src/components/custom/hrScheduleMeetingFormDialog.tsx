'use client'

import {useEffect, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Textarea} from '@/components/ui/textarea'
import type {HrEvaluationEmployeeOption, HrEvaluationMeeting, HrEvaluationStatus} from '@/types/hrEvaluationMeeting'

export interface HrScheduleMeetingFormValue {
  employeeId: string
  conversationType: string
  date: string
  startTime: string
  endTime: string
  place: string
  status: HrEvaluationStatus
  notes: string
}

interface HrScheduleMeetingFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  meeting: HrEvaluationMeeting | null
  employees: HrEvaluationEmployeeOption[]
  saving: boolean
  onSave: (form: HrScheduleMeetingFormValue) => Promise<void>
}

export function toHrScheduleMeetingDateTimeParts(iso: string) {
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  }
}

export function combineHrScheduleMeetingDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`)
}

function statusLabel(status: HrEvaluationStatus) {
  switch (status) {
    case 'completed':
      return 'Completed'
    case 'cancelled':
      return 'Cancelled'
    default:
      return 'Planned'
  }
}

export function HrScheduleMeetingFormDialog({
  open,
  onOpenChange,
  meeting,
  employees,
  saving,
  onSave,
}: HrScheduleMeetingFormDialogProps) {
  const defaultHrScheduleMeetingForm = (): HrScheduleMeetingFormValue => ({
    employeeId: '',
    conversationType: '',
    date: '',
    startTime: '',
    endTime: '',
    place: '',
    status: 'planned',
    notes: '',
  })

  const [form, setForm] = useState<HrScheduleMeetingFormValue>(defaultHrScheduleMeetingForm())
  useEffect(() => {
    if (!open) return

    if (!meeting) {
      setForm(defaultHrScheduleMeetingForm())
      return
    }

    const start = toHrScheduleMeetingDateTimeParts(meeting.startAt)
    const end = toHrScheduleMeetingDateTimeParts(meeting.endAt)
    setForm({
      employeeId: meeting.employeeId,
      conversationType: meeting.conversationType,
      date: start.date,
      startTime: start.time,
      endTime: end.time,
      place: meeting.place ?? '',
      status: meeting.status,
      notes: meeting.notes ?? '',
    })
  }, [meeting, open])

  const isValid =
    form.employeeId !== '' &&
    form.conversationType.trim() !== '' &&
    form.date !== '' &&
    form.startTime !== '' &&
    form.endTime !== '' &&
    combineHrScheduleMeetingDateTime(form.date, form.endTime).getTime() >
      combineHrScheduleMeetingDateTime(form.date, form.startTime).getTime()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{meeting ? 'Change meeting' : 'Plan meeting'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Employee *</Label>
            <Select
              value={form.employeeId || 'none'}
              onValueChange={value => setForm(f => ({...f, employeeId: value === 'none' ? '' : value}))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" disabled>
                  Choose employee
                </SelectItem>
                {employees.map(employee => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Type of meeting *</Label>
            <Input
              value={form.conversationType}
              onChange={event => setForm(f => ({...f, conversationType: event.target.value}))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Date *</Label>
            <Input type="date" value={form.date} onChange={event => setForm(f => ({...f, date: event.target.value}))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Start *</Label>
              <Input
                type="time"
                value={form.startTime}
                onChange={event => setForm(f => ({...f, startTime: event.target.value}))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Endtime</Label>
              <Input
                type="time"
                value={form.endTime}
                onChange={event => setForm(f => ({...f, endTime: event.target.value}))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Location</Label>
            <Input value={form.place} onChange={event => setForm(f => ({...f, place: event.target.value}))} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={value => setForm(f => ({...f, status: value as HrEvaluationStatus}))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">{statusLabel('planned')}</SelectItem>
                <SelectItem value="completed">{statusLabel('completed')}</SelectItem>
                <SelectItem value="cancelled">{statusLabel('cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Additional info/ proof</Label>
            <Textarea
              value={form.notes}
              onChange={event => setForm(f => ({...f, notes: event.target.value}))}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => onSave(form)} disabled={!isValid || saving}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default HrScheduleMeetingFormDialog
