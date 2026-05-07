'use client'

import {useEffect, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Switch} from '@/components/ui/switch'
import {Textarea} from '@/components/ui/textarea'
import type {RecruitmentApplicant, RecruitmentContactType} from '@/types/recruitment'

export interface RecruitmentApplicantFormValue {
  candidateName: string
  profile: string
  contactDate: string
  interviewDate: string
  contactType: RecruitmentContactType
  description: string
  cvPath: string
  potential: boolean
  retained: boolean
}

interface RecruitmentApplicantFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicant: RecruitmentApplicant | null
  saving: boolean
  onSave: (form: RecruitmentApplicantFormValue) => Promise<void>
}

function toDateInputValue(iso: string | null) {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function toNullableDate(date: string) {
  return date ? new Date(`${date}T00:00:00`) : null
}

export function RecruitmentApplicantFormDialog({
  open,
  onOpenChange,
  applicant,
  saving,
  onSave,
}: RecruitmentApplicantFormDialogProps) {
  const defaultForm = (): RecruitmentApplicantFormValue => ({
    candidateName: '',
    profile: '',
    contactDate: '',
    interviewDate: '',
    contactType: 'email',
    description: '',
    cvPath: '',
    potential: false,
    retained: false,
  })

  const [form, setForm] = useState(defaultForm())

  useEffect(() => {
    if (!open) return
    if (!applicant) {
      setForm(defaultForm())
      return
    }

    setForm({
      candidateName: applicant.candidateName,
      profile: applicant.profile ?? '',
      contactDate: toDateInputValue(applicant.contactDate),
      interviewDate: toDateInputValue(applicant.interviewDate),
      contactType: applicant.contactType,
      description: applicant.description ?? '',
      cvPath: applicant.cvPath ?? '',
      potential: applicant.potential,
      retained: applicant.retained,
    })
  }, [applicant, open])

  const isValid = form.candidateName.trim() !== ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{applicant ? 'Change applicant' : 'Add applicant'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Name applicant *</Label>
            <Input
              value={form.candidateName}
              onChange={event => setForm(f => ({...f, candidateName: event.target.value}))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Type contact</Label>
            <Select
              value={form.contactType}
              onValueChange={value => setForm(f => ({...f, contactType: value as RecruitmentContactType}))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Contact date</Label>
            <Input
              type="date"
              value={form.contactDate}
              onChange={event => setForm(f => ({...f, contactDate: event.target.value}))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Interview date</Label>
            <Input
              type="date"
              value={form.interviewDate}
              onChange={event => setForm(f => ({...f, interviewDate: event.target.value}))}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Profile</Label>
            <Textarea
              value={form.profile}
              onChange={event => setForm(f => ({...f, profile: event.target.value}))}
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Notes interview</Label>
            <Textarea
              value={form.description}
              onChange={event => setForm(f => ({...f, description: event.target.value}))}
              rows={4}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>CV reference on the server</Label>
            <Input value={form.cvPath} onChange={event => setForm(f => ({...f, cvPath: event.target.value}))} />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label>Potential</Label>
            <Switch checked={form.potential} onCheckedChange={checked => setForm(f => ({...f, potential: checked}))} />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label>Retained</Label>
            <Switch checked={form.retained} onCheckedChange={checked => setForm(f => ({...f, retained: checked}))} />
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
