'use client'

import {useEffect, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Checkbox} from '@/components/ui/checkbox'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Textarea} from '@/components/ui/textarea'
import type {RecruitmentContractType, RecruitmentVacancy, RecruitmentWorkRegime} from '@/types/recruitment'

export interface RecruitmentVacancyFormValue {
  title: string
  description: string
  department: string
  contractType: RecruitmentContractType
  workRegime: RecruitmentWorkRegime
  salaryMin: string
  salaryMax: string
  publishWebsite: boolean
  publishVdab: boolean
  publishOther: boolean
  publishLinkedIn: boolean
  publishTempAgencies: boolean
  publishRecruitmentAgencies: boolean
  otherPublication: string
}

interface RecruitmentVacancyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vacancy: RecruitmentVacancy | null
  saving: boolean
  onSave: (form: RecruitmentVacancyFormValue) => Promise<void>
}

const departments = ['Admin', 'Engineering', 'Management', 'Technical support', 'Sales', 'HR', 'Finance', 'Operations']

const publicationOptions = [
  {key: 'publishWebsite', label: 'Website'},
  {key: 'publishVdab', label: 'VDAB'},
  {key: 'publishLinkedIn', label: 'LinkedIn'},
  {key: 'publishTempAgencies', label: 'Temp agency'},
  {key: 'publishRecruitmentAgencies', label: 'Recruitment Agencies'},
  {key: 'publishOther', label: 'Other'},
] as const

export function toNullableSalary(value: string) {
  return value.trim() === '' ? null : Number(value)
}

export function RecruitmentVacancyFormDialog({
  open,
  onOpenChange,
  vacancy,
  saving,
  onSave,
}: RecruitmentVacancyFormDialogProps) {
  const defaultForm = (): RecruitmentVacancyFormValue => ({
    title: '',
    description: '',
    department: 'Admin',
    contractType: 'permanent',
    workRegime: 'fulltime',
    salaryMin: '',
    salaryMax: '',
    publishWebsite: false,
    publishVdab: false,
    publishOther: false,
    publishLinkedIn: false,
    publishTempAgencies: false,
    publishRecruitmentAgencies: false,
    otherPublication: '',
  })

  const [form, setForm] = useState(defaultForm())

  useEffect(() => {
    if (!open) return
    if (!vacancy) {
      setForm(defaultForm())
      return
    }

    setForm({
      title: vacancy.title,
      description: vacancy.description ?? '',
      department: vacancy.department,
      contractType: vacancy.contractType,
      workRegime: vacancy.workRegime,
      salaryMin: vacancy.salaryMin == null ? '' : String(vacancy.salaryMin),
      salaryMax: vacancy.salaryMax == null ? '' : String(vacancy.salaryMax),
      publishWebsite: vacancy.publishWebsite,
      publishVdab: vacancy.publishVdab,
      publishOther: vacancy.publishOther,
      publishLinkedIn: vacancy.publishLinkedIn,
      publishTempAgencies: vacancy.publishTempAgencies,
      publishRecruitmentAgencies: vacancy.publishRecruitmentAgencies,
      otherPublication: vacancy.otherPublication ?? '',
    })
  }, [open, vacancy])

  const minSalary = toNullableSalary(form.salaryMin)
  const maxSalary = toNullableSalary(form.salaryMax)
  const isValid =
    form.title.trim() !== '' &&
    form.department.trim() !== '' &&
    (minSalary == null || maxSalary == null || maxSalary >= minSalary)

  function updatePublication(key: (typeof publicationOptions)[number]['key'], checked: boolean) {
    setForm(f => ({...f, [key]: checked}))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{vacancy ? 'Vacature wijzigen' : 'Vacature toevoegen'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Title *</Label>
            <Input value={form.title} onChange={event => setForm(f => ({...f, title: event.target.value}))} />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={event => setForm(f => ({...f, description: event.target.value}))}
              rows={4}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Department</Label>
            <Select value={form.department} onValueChange={value => setForm(f => ({...f, department: value}))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {departments.map(department => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Contract</Label>
              <Select
                value={form.contractType}
                onValueChange={value => setForm(f => ({...f, contractType: value as RecruitmentContractType}))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Regime</Label>
              <Select
                value={form.workRegime}
                onValueChange={value => setForm(f => ({...f, workRegime: value as RecruitmentWorkRegime}))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fulltime">Full-time</SelectItem>
                  <SelectItem value="parttime">Part-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Pay scale from</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.salaryMin}
                onChange={event => setForm(f => ({...f, salaryMin: event.target.value}))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Pay scale to</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.salaryMax}
                onChange={event => setForm(f => ({...f, salaryMax: event.target.value}))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-3">
            {publicationOptions.map(option => (
              <label key={option.key} className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                <Checkbox
                  checked={form[option.key]}
                  onCheckedChange={checked => updatePublication(option.key, checked === true)}
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Other publication</Label>
            <Input
              value={form.otherPublication}
              onChange={event => setForm(f => ({...f, otherPublication: event.target.value}))}
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
