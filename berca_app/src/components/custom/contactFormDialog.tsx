'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import type {MappedContact} from '@/types/contact'
import type {RoleLevelOption} from '@/types/roleLevel'
import {VisibilityForRoleTab, buildInitialVisibilityRows} from '@/components/custom/visibilityForRoleTab'
import type {VisibilityRow} from '@/components/custom/visibilityForRoleTab'

interface SelectOption {
  id: string
  name: string
}

interface ContactFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: MappedContact | null
  onSave: (
    contact: MappedContact,
    visibilityRows: VisibilityRow[],
    initialCompanyId?: string,
    initialRoleWithCompany?: string,
  ) => Promise<void>
  isAdmin: boolean
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  functionOptions: SelectOption[]
  departmentExternOptions: SelectOption[]
  titleOptions: SelectOption[]
  companyOptions: SelectOption[]
}

const emptyContact = (): MappedContact => ({
  id: '',
  firstName: '',
  lastName: '',
  mail1: null,
  mail2: null,
  mail3: null,
  generalPhone: null,
  homePhone: null,
  mobilePhone: null,
  info: null,
  birthDate: null,
  trough: null,
  description: null,
  infoCorrect: false,
  checkInfo: false,
  newYearCard: false,
  active: true,
  newsLetter: false,
  mailing: false,
  trainingAdvice: false,
  contactForTrainingAndAdvice: false,
  customerTrainingAndAdvice: false,
  potentialCustomerTrainingAndAdvice: false,
  potentialTeacherTrainingAndAdvice: false,
  teacherTrainingAndAdvice: false,
  participantTrainingAndAdvice: false,
  createdAt: new Date().toISOString(),
  createdBy: '',
  createdByName: '',
  functionId: null,
  functionName: null,
  departmentExternId: null,
  departmentExternName: null,
  titleId: null,
  titleName: null,
  businessCardId: null,
  targetId: '',
  deleted: false,
  deletedAt: null,
  deletedBy: null,
  deletedByName: null,
  currentCompanyName: null,
  currentRoleWithCompany: null,
  visibilityForRoles: [],
})

export function ContactFormDialog({
  open,
  onOpenChange,
  contact,
  onSave,
  isAdmin,
  roleLevelOptions,
  defaultVisibleRoleNames,
  functionOptions,
  departmentExternOptions,
  titleOptions,
  companyOptions,
}: ContactFormDialogProps) {
  const [form, setForm] = useState<MappedContact>(emptyContact())
  const [saving, setSaving] = useState(false)
  const [visibilityRows, setVisibilityRows] = useState<VisibilityRow[]>(() =>
    buildInitialVisibilityRows(contact?.visibilityForRoles ?? [], roleLevelOptions, defaultVisibleRoleNames),
  )
  // Company assignment — only used on create
  const [initialCompanyId, setInitialCompanyId] = useState<string>('none')
  const [initialRoleWithCompany, setInitialRoleWithCompany] = useState<string>('')

  useEffect(() => {
    const next = contact ?? emptyContact()
    setForm(next)
    setVisibilityRows(buildInitialVisibilityRows(next.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames))
    setInitialCompanyId('none')
    setInitialRoleWithCompany('')
  }, [contact?.id, open])

  function set<K extends keyof MappedContact>(key: K, value: MappedContact[K]) {
    setForm(prev => ({...prev, [key]: value}))
  }

  function str(v: string): string | null {
    return v.trim() || null
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      await onSave(
        form,
        visibilityRows,
        initialCompanyId !== 'none' ? initialCompanyId : undefined,
        initialRoleWithCompany || undefined,
      )
    } finally {
      setSaving(false)
    }
  }

  const isEdit = !!contact

  // ─── Field helpers ────────────────────────────────────────────────────────
  const textField = (
    key: keyof MappedContact,
    label: string,
    opts?: {type?: string; required?: boolean; placeholder?: string},
  ) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">
        {label}
        {opts?.required && ' *'}
      </Label>
      <Input
        type={opts?.type ?? 'text'}
        value={(form[key] as string | null) ?? ''}
        onChange={e => set(key, str(e.target.value) as MappedContact[typeof key])}
        placeholder={opts?.placeholder}
        className="bg-secondary border-border"
      />
    </div>
  )

  const toggleField = (key: keyof MappedContact, label: string) => (
    <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Switch checked={form[key] as boolean} onCheckedChange={v => set(key, v as MappedContact[typeof key])} />
    </div>
  )

  const selectField = (key: keyof MappedContact, label: string, options: SelectOption[]) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select
        value={(form[key] as string | null) ?? 'none'}
        onValueChange={v => set(key, (v === 'none' ? null : v) as MappedContact[typeof key])}>
        <SelectTrigger className="bg-secondary border-border">
          <SelectValue placeholder="None" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          <SelectItem value="none">None</SelectItem>
          {options.map(o => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? 'Edit Contact' : 'New Contact'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="identity">
          <TabsList className="bg-secondary border border-border/60 flex-wrap h-auto gap-1">
            <TabsTrigger value="identity">Identity</TabsTrigger>
            <TabsTrigger value="contact">Contact Info</TabsTrigger>
            <TabsTrigger value="flags">Flags</TabsTrigger>
            {isAdmin && <TabsTrigger value="visibility">Visibility</TabsTrigger>}
          </TabsList>

          {/* ── Identity ──────────────────────────────────────────────────── */}
          <TabsContent value="identity">
            <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">
              {textField('firstName', 'First Name', {required: true})}
              {textField('lastName', 'Last Name', {required: true})}

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Birth Date</Label>
                <Input
                  type="date"
                  value={form.birthDate ? form.birthDate.slice(0, 10) : ''}
                  onChange={e => set('birthDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="bg-secondary border-border"
                />
              </div>

              {textField('trough', 'Trough / Source')}

              {selectField('titleId', 'Title', titleOptions)}
              {selectField('functionId', 'Function', functionOptions)}
              {selectField('departmentExternId', 'External Department', departmentExternOptions)}

              {/* Company assignment — create only */}
              {!isEdit && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Assign to Company</Label>
                    <Select value={initialCompanyId} onValueChange={setInitialCompanyId}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="none">None</SelectItem>
                        {companyOptions.map(o => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {initialCompanyId !== 'none' && (
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs text-muted-foreground">Role at Company</Label>
                      <Input
                        value={initialRoleWithCompany}
                        onChange={e => setInitialRoleWithCompany(e.target.value)}
                        placeholder="e.g. CEO, Purchasing Manager…"
                        className="bg-secondary border-border"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Textarea
                  value={form.description ?? ''}
                  onChange={e => set('description', str(e.target.value))}
                  rows={2}
                  className="bg-secondary border-border resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Info</Label>
                <Textarea
                  value={form.info ?? ''}
                  onChange={e => set('info', str(e.target.value))}
                  rows={3}
                  className="bg-secondary border-border resize-none"
                />
              </div>
            </div>
          </TabsContent>

          {/* ── Contact Info ──────────────────────────────────────────────── */}
          <TabsContent value="contact">
            <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">
              {textField('mail1', 'Email 1', {type: 'email'})}
              {textField('mail2', 'Email 2', {type: 'email'})}
              {textField('mail3', 'Email 3', {type: 'email'})}
              {textField('generalPhone', 'General Phone', {type: 'tel'})}
              {textField('mobilePhone', 'Mobile Phone', {type: 'tel'})}
              {textField('homePhone', 'Home Phone', {type: 'tel'})}
            </div>
          </TabsContent>

          {/* ── Flags ─────────────────────────────────────────────────────── */}
          <TabsContent value="flags">
            <div className="py-3">
              <p className="text-xs text-muted-foreground mb-3">General</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mb-5">
                {toggleField('active', 'Active')}
                {toggleField('infoCorrect', 'Info Correct')}
                {toggleField('checkInfo', 'Check Info')}
                {toggleField('newYearCard', 'New Year Card')}
                {toggleField('newsLetter', 'Newsletter')}
                {toggleField('mailing', 'Mailing')}
              </div>
              <p className="text-xs text-muted-foreground mb-3">Training &amp; Advice</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {toggleField('trainingAdvice', 'Training Advice')}
                {toggleField('contactForTrainingAndAdvice', 'Contact for T&A')}
                {toggleField('customerTrainingAndAdvice', 'Customer T&A')}
                {toggleField('potentialCustomerTrainingAndAdvice', 'Pot. Customer T&A')}
                {toggleField('potentialTeacherTrainingAndAdvice', 'Pot. Teacher T&A')}
                {toggleField('teacherTrainingAndAdvice', 'Teacher T&A')}
                {toggleField('participantTrainingAndAdvice', 'Participant T&A')}
              </div>
            </div>
          </TabsContent>

          {/* ── Visibility ────────────────────────────────────────────────── */}
          {isAdmin && (
            <TabsContent value="visibility">
              <div className="py-3">
                <VisibilityForRoleTab
                  roleLevelOptions={roleLevelOptions}
                  value={visibilityRows}
                  onChange={setVisibilityRows}
                />
              </div>
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !form.firstName || !form.lastName}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Contact'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
