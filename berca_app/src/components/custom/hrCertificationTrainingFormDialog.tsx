'use client'

import {useEffect, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Textarea} from '@/components/ui/textarea'
import type {
  HrAbsence,
  HrAbsenceType,
  HrCertificationTraining,
  HrCertificationTrainingEmployeeOption,
  HrRecurrenceInterval,
  HrTrainingType,
} from '@/types/hrCertificationTraining'

export interface HrCertificationTrainingFormValue {
  employeeId: string
  trainingName: string
  trainingType: HrTrainingType
  recurrenceInterval: HrRecurrenceInterval
  trainingDate: string
  certificateValidUntil: string
  providerName: string
  additionalInfo: string
}

export interface HrAbsenceFormValue {
  employeeId: string
  year: string
  absenceType: HrAbsenceType
  days: string
  additionalInfo: string
}

interface HrCertificationTrainingFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: HrCertificationTraining | null
  employees: HrCertificationTrainingEmployeeOption[]
  saving: boolean
  onSave: (form: HrCertificationTrainingFormValue) => Promise<void>
}

interface HrAbsenceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  absence: HrAbsence | null
  employees: HrCertificationTrainingEmployeeOption[]
  saving: boolean
  onSave: (form: HrAbsenceFormValue) => Promise<void>
}

function toDateInput(iso: string | null) {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function defaultCertificationForm(): HrCertificationTrainingFormValue {
  return {
    employeeId: '',
    trainingName: '',
    trainingType: 'one_time',
    recurrenceInterval: 'none',
    trainingDate: '',
    certificateValidUntil: '',
    providerName: '',
    additionalInfo: '',
  }
}

function defaultAbsenceForm(): HrAbsenceFormValue {
  return {
    employeeId: '',
    year: String(new Date().getFullYear()),
    absenceType: 'ADV',
    days: '',
    additionalInfo: '',
  }
}

export function toHrDate(date: string) {
  return new Date(`${date}T00:00:00`)
}

export function trainingTypeLabel(type: HrTrainingType) {
  switch (type) {
    case 'recurring':
      return 'Recurring course'
    case 'certification':
      return 'Course with certification'
    default:
      return 'One time course'
  }
}

export function absenceTypeLabel(type: HrAbsenceType) {
  switch (type) {
    case 'VACATION':
      return 'Vakantiedagen'
    case 'SICKNESS':
      return 'Ziekte'
    case 'SMALL_LEAVE':
      return 'Klein verlet'
    case 'HOLIDAY':
      return 'Feestdag'
    default:
      return 'ADV'
  }
}

export function HrCertificationTrainingFormDialog({
  open,
  onOpenChange,
  record,
  employees,
  saving,
  onSave,
}: HrCertificationTrainingFormDialogProps) {
  const [form, setForm] = useState<HrCertificationTrainingFormValue>(defaultCertificationForm())

  useEffect(() => {
    if (!open) return

    if (!record) {
      setForm(defaultCertificationForm())
      return
    }

    setForm({
      employeeId: record.employeeId,
      trainingName: record.trainingName,
      trainingType: record.trainingType,
      recurrenceInterval: record.recurrenceInterval,
      trainingDate: toDateInput(record.trainingDate),
      certificateValidUntil: toDateInput(record.certificateValidUntil),
      providerName: record.providerName,
      additionalInfo: record.additionalInfo ?? '',
    })
  }, [open, record])

  const requiresValidity = form.trainingType === 'certification' || form.trainingType === 'recurring'
  const isValid =
    form.employeeId !== '' &&
    form.trainingName.trim() !== '' &&
    form.trainingDate !== '' &&
    form.providerName.trim() !== '' &&
    (!requiresValidity || form.certificateValidUntil !== '') &&
    (form.trainingType !== 'recurring' || form.recurrenceInterval !== 'none')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{record ? 'Opleiding wijzigen' : 'Opleiding toevoegen'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Werknemer *</Label>
            <Select
              value={form.employeeId || 'none'}
              onValueChange={value => setForm(f => ({...f, employeeId: value === 'none' ? '' : value}))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Kies werknemer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" disabled>
                  Kies werknemer
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
            <Label>Naam opleiding *</Label>
            <Input
              value={form.trainingName}
              onChange={event => setForm(f => ({...f, trainingName: event.target.value}))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Type opleiding *</Label>
            <Select
              value={form.trainingType}
              onValueChange={value =>
                setForm(f => ({
                  ...f,
                  trainingType: value as HrTrainingType,
                  recurrenceInterval: value === 'recurring' ? f.recurrenceInterval : 'none',
                }))
              }>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one_time">One time course</SelectItem>
                <SelectItem value="recurring">Recurring course</SelectItem>
                <SelectItem value="certification">Course with certification</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Herhaling</Label>
            <Select
              value={form.recurrenceInterval}
              disabled={form.trainingType !== 'recurring'}
              onValueChange={value => setForm(f => ({...f, recurrenceInterval: value as HrRecurrenceInterval}))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Niet recurrent</SelectItem>
                <SelectItem value="5y">5 jaar</SelectItem>
                <SelectItem value="10y">10 jaar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Datum opleiding *</Label>
            <Input
              type="date"
              value={form.trainingDate}
              onChange={event => setForm(f => ({...f, trainingDate: event.target.value}))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Geldigheid certificaat{requiresValidity ? ' *' : ''}</Label>
            <Input
              type="date"
              value={form.certificateValidUntil}
              onChange={event => setForm(f => ({...f, certificateValidUntil: event.target.value}))}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Naam opleidingsverstrekker *</Label>
            <Input
              value={form.providerName}
              onChange={event => setForm(f => ({...f, providerName: event.target.value}))}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Additional info</Label>
            <Textarea
              value={form.additionalInfo}
              onChange={event => setForm(f => ({...f, additionalInfo: event.target.value}))}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button type="button" onClick={() => onSave(form)} disabled={!isValid || saving}>
            Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function HrAbsenceFormDialog({
  open,
  onOpenChange,
  absence,
  employees,
  saving,
  onSave,
}: HrAbsenceFormDialogProps) {
  const [form, setForm] = useState<HrAbsenceFormValue>(defaultAbsenceForm())

  useEffect(() => {
    if (!open) return

    if (!absence) {
      setForm(defaultAbsenceForm())
      return
    }

    setForm({
      employeeId: absence.employeeId,
      year: String(absence.year),
      absenceType: absence.absenceType,
      days: String(absence.days),
      additionalInfo: absence.additionalInfo ?? '',
    })
  }, [absence, open])

  const days = Number(form.days)
  const year = Number(form.year)
  const isValid =
    form.employeeId !== '' && Number.isInteger(year) && year >= 2000 && year <= 2100 && !Number.isNaN(days) && days >= 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{absence ? 'Afwezigheid wijzigen' : 'Afwezigheid toevoegen'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Werknemer *</Label>
            <Select
              value={form.employeeId || 'none'}
              onValueChange={value => setForm(f => ({...f, employeeId: value === 'none' ? '' : value}))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Kies werknemer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" disabled>
                  Kies werknemer
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
            <Label>Jaar *</Label>
            <Input
              type="number"
              min="2000"
              max="2100"
              value={form.year}
              onChange={event => setForm(f => ({...f, year: event.target.value}))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Dagen *</Label>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={form.days}
              onChange={event => setForm(f => ({...f, days: event.target.value}))}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Type afwezigheid *</Label>
            <Select
              value={form.absenceType}
              onValueChange={value => setForm(f => ({...f, absenceType: value as HrAbsenceType}))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADV">ADV</SelectItem>
                <SelectItem value="VACATION">Vakantiedagen</SelectItem>
                <SelectItem value="SICKNESS">Ziekte</SelectItem>
                <SelectItem value="SMALL_LEAVE">Klein verlet</SelectItem>
                <SelectItem value="HOLIDAY">Feestdag</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Additional info</Label>
            <Textarea
              value={form.additionalInfo}
              onChange={event => setForm(f => ({...f, additionalInfo: event.target.value}))}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button type="button" onClick={() => onSave(form)} disabled={!isValid || saving}>
            Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default HrCertificationTrainingFormDialog
