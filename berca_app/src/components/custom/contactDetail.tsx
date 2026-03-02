'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowLeft, Pencil, X, Save, ExternalLink, Plus, Check, CalendarOff, Trash2} from 'lucide-react'
import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {updateContactAction} from '@/serverFunctions/contacts'
import {
  addCompanyContactAction,
  updateCompanyContactAction,
  endCompanyContactAction,
  softDeleteCompanyContactAction,
  undeleteCompanyContactAction,
  hardDeleteCompanyContactAction,
} from '@/serverFunctions/companyContact'
import {VisibilityForRoleTab, buildInitialVisibilityRows} from '@/components/custom/visibilityForRoleTab'
import type {VisibilityRow} from '@/components/custom/visibilityForRoleTab'
import type {Route} from 'next'
import type {RoleLevelOption} from '@/types/roleLevel'
import type {ContactDetailData} from '@/types/contact'

interface SelectOption {
  id: string
  name: string
}

interface ContactDetailProps {
  contact: ContactDetailData
  currentUserRole: string
  currentUserLevel: number
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  functionOptions: SelectOption[]
  departmentExternOptions: SelectOption[]
  titleOptions: SelectOption[]
  companyOptions: SelectOption[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function YesNoBadge({value}: {value: boolean}) {
  return value ? (
    <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
  ) : (
    <Badge variant="secondary" className="text-muted-foreground font-medium">
      No
    </Badge>
  )
}

function isActiveCompanyLink(endDate: string | null) {
  if (!endDate) return true
  return new Date(endDate) > new Date()
}

const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'
const thClass = 'whitespace-nowrap text-xs'

// ─── Component ────────────────────────────────────────────────────────────────
export function ContactDetail({
  contact,
  currentUserRole,
  currentUserLevel,
  roleLevelOptions,
  defaultVisibleRoleNames,
  functionOptions,
  departmentExternOptions,
  titleOptions,
  companyOptions,
}: ContactDetailProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canEdit = currentUserLevel >= 20

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAllCompanies, setShowAllCompanies] = useState(false)
  const [showDeletedCompanies, setShowDeletedCompanies] = useState(false)

  // ─── Company link state ────────────────────────────────────────────────────
  type CompanyForm = {companyId: string; roleWithCompany: string; startedDate: string; endDate: string}
  const emptyCompanyForm = (): CompanyForm => ({
    companyId: 'none',
    roleWithCompany: '',
    startedDate: new Date().toISOString().slice(0, 10),
    endDate: '',
  })
  const [addingCompany, setAddingCompany] = useState(false)
  const [companyForm, setCompanyForm] = useState<CompanyForm>(emptyCompanyForm)
  const [endPreviousActive, setEndPreviousActive] = useState(true)
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null)
  const [editCompanyForm, setEditCompanyForm] = useState<CompanyForm>(emptyCompanyForm)

  // ─── Edit form ─────────────────────────────────────────────────────────────
  const buildForm = () => ({
    firstName: contact.firstName,
    lastName: contact.lastName,
    mail1: contact.mail1 ?? '',
    mail2: contact.mail2 ?? '',
    mail3: contact.mail3 ?? '',
    generalPhone: contact.generalPhone ?? '',
    homePhone: contact.homePhone ?? '',
    mobilePhone: contact.mobilePhone ?? '',
    info: contact.info ?? '',
    birthDate: contact.birthDate ? contact.birthDate.slice(0, 10) : '',
    trough: contact.trough ?? '',
    description: contact.description ?? '',
    infoCorrect: contact.infoCorrect,
    checkInfo: contact.checkInfo,
    newYearCard: contact.newYearCard,
    active: contact.active,
    newsLetter: contact.newsLetter,
    mailing: contact.mailing,
    trainingAdvice: contact.trainingAdvice,
    contactForTrainingAndAdvice: contact.contactForTrainingAndAdvice,
    customerTrainingAndAdvice: contact.customerTrainingAndAdvice,
    potentialCustomerTrainingAndAdvice: contact.potentialCustomerTrainingAndAdvice,
    potentialTeacherTrainingAndAdvice: contact.potentialTeacherTrainingAndAdvice,
    teacherTrainingAndAdvice: contact.teacherTrainingAndAdvice,
    participantTrainingAndAdvice: contact.participantTrainingAndAdvice,
    functionId: contact.functionId ?? 'none',
    departmentExternId: contact.departmentExternId ?? 'none',
    titleId: contact.titleId ?? 'none',
  })

  const [form, setForm] = useState(buildForm)
  const s = <K extends keyof ReturnType<typeof buildForm>>(key: K, v: ReturnType<typeof buildForm>[K]) =>
    setForm(f => ({...f, [key]: v}))

  // ─── Visibility ────────────────────────────────────────────────────────────
  const [visibilityRows, setVisibilityRows] = useState<VisibilityRow[]>(() =>
    buildInitialVisibilityRows(contact.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames),
  )

  function handleCancel() {
    setForm(buildForm())
    setVisibilityRows(buildInitialVisibilityRows(contact.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames))
    setEditing(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateContactAction({
        id: contact.id,
        firstName: form.firstName,
        lastName: form.lastName,
        mail1: form.mail1 || null,
        mail2: form.mail2 || null,
        mail3: form.mail3 || null,
        generalPhone: form.generalPhone || null,
        homePhone: form.homePhone || null,
        mobilePhone: form.mobilePhone || null,
        info: form.info || null,
        birthDate: form.birthDate ? new Date(form.birthDate) : null,
        trough: form.trough || null,
        description: form.description || null,
        infoCorrect: form.infoCorrect,
        checkInfo: form.checkInfo,
        newYearCard: form.newYearCard,
        active: form.active,
        newsLetter: form.newsLetter,
        mailing: form.mailing,
        trainingAdvice: form.trainingAdvice,
        contactForTrainingAndAdvice: form.contactForTrainingAndAdvice,
        customerTrainingAndAdvice: form.customerTrainingAndAdvice,
        potentialCustomerTrainingAndAdvice: form.potentialCustomerTrainingAndAdvice,
        potentialTeacherTrainingAndAdvice: form.potentialTeacherTrainingAndAdvice,
        teacherTrainingAndAdvice: form.teacherTrainingAndAdvice,
        participantTrainingAndAdvice: form.participantTrainingAndAdvice,
        functionId: form.functionId === 'none' ? null : form.functionId,
        departmentExternId: form.departmentExternId === 'none' ? null : form.departmentExternId,
        titleId: form.titleId === 'none' ? null : form.titleId,
        businessCardId: contact.businessCardId,
        visibilityForRoles: visibilityRows,
      })
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  console.log({
    total: contact.companies.length,
    deletedCount: contact.companies.filter(c => c.deleted === true).length,
    showDeletedCompanies,
  })

  // ─── Derived ───────────────────────────────────────────────────────────────
  const hasDeletedCompanies = contact.companies.some(cc => cc.deleted)
  const nonDeletedCompanies = contact.companies.filter(cc => !cc.deleted)
  const activeCompanies = nonDeletedCompanies.filter(cc => isActiveCompanyLink(cc.endDate))
  const visibleCompanies = showDeletedCompanies
    ? contact.companies
    : showAllCompanies
      ? nonDeletedCompanies
      : activeCompanies
  const activeProjects = contact.projects.filter(p => p.project.isOpen && !p.project.isClosed)
  const closedProjects = contact.projects.filter(p => p.project.isClosed || !p.project.isOpen)

  console.log({
    total: contact.companies.length,
    deletedCount: contact.companies.filter(c => c.deleted === true).length,
    showDeletedCompanies,
  })

  // ─── Reusable field renderers ──────────────────────────────────────────────
  const textRow = (label: string, val: string | null, formKey?: keyof typeof form, opts?: {type?: string}) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing && formKey ? (
        <Input
          type={opts?.type ?? 'text'}
          value={(form[formKey] as string) ?? ''}
          onChange={e => s(formKey, e.target.value as ReturnType<typeof buildForm>[typeof formKey])}
          className="bg-secondary border-border"
        />
      ) : (
        <p className="text-sm text-muted-foreground">{val || '-'}</p>
      )}
    </div>
  )

  const toggleRow = (label: string, val: boolean, formKey: keyof typeof form) => (
    <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing ? (
        <Switch
          checked={form[formKey] as boolean}
          onCheckedChange={v => s(formKey, v as ReturnType<typeof buildForm>[typeof formKey])}
        />
      ) : (
        <YesNoBadge value={val} />
      )}
    </div>
  )

  const selectRow = (label: string, val: string | null, formKey: keyof typeof form, options: SelectOption[]) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing ? (
        <Select
          value={(form[formKey] as string) ?? 'none'}
          onValueChange={v => s(formKey, v as ReturnType<typeof buildForm>[typeof formKey])}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue />
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
      ) : (
        <p className="text-sm text-muted-foreground">{val || '-'}</p>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {contact.firstName} {contact.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {[contact.titleName, contact.functionName].filter(Boolean).join(' · ') || 'Contact'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={handleCancel} className="gap-2 border-border">
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2 bg-accent text-accent-foreground hover:bg-accent/80">
                <Save className="h-4 w-4" />
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)} variant="outline" className="gap-2 border-border">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* ── Info card ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/60 bg-card p-6 flex flex-col gap-6">
        {/* Identity */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Identity</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {textRow('First Name', contact.firstName, 'firstName')}
            {textRow('Last Name', contact.lastName, 'lastName')}
            {/* Birth date */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Birth Date</Label>
              {editing ? (
                <Input
                  type="date"
                  value={form.birthDate}
                  onChange={e => s('birthDate', e.target.value)}
                  className="bg-secondary border-border"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{formatDate(contact.birthDate)}</p>
              )}
            </div>
            {textRow('Trough / Source', contact.trough, 'trough')}
            {selectRow('Title', contact.titleName, 'titleId', titleOptions)}
            {selectRow('Function', contact.functionName, 'functionId', functionOptions)}
            {selectRow('Ext. Department', contact.departmentExternName, 'departmentExternId', departmentExternOptions)}
            {/* Created By / At */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Created By</Label>
              <p className="text-sm text-muted-foreground">{contact.createdByName}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Created At</Label>
              <p className="text-sm text-muted-foreground">{formatDate(contact.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Contact Info</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {textRow('Email 1', contact.mail1, 'mail1', {type: 'email'})}
            {textRow('Email 2', contact.mail2, 'mail2', {type: 'email'})}
            {textRow('Email 3', contact.mail3, 'mail3', {type: 'email'})}
            {textRow('General Phone', contact.generalPhone, 'generalPhone', {type: 'tel'})}
            {textRow('Mobile Phone', contact.mobilePhone, 'mobilePhone', {type: 'tel'})}
            {textRow('Home Phone', contact.homePhone, 'homePhone', {type: 'tel'})}
          </div>
        </div>

        {/* Description / Info */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Description</Label>
            {editing ? (
              <Textarea
                value={form.description}
                onChange={e => s('description', e.target.value)}
                rows={2}
                className="bg-secondary border-border resize-none"
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contact.description || '-'}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Info</Label>
            {editing ? (
              <Textarea
                value={form.info}
                onChange={e => s('info', e.target.value)}
                rows={2}
                className="bg-secondary border-border resize-none"
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contact.info || '-'}</p>
            )}
          </div>
        </div>

        {/* Flags — General */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">General Flags</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {toggleRow('Active', contact.active, 'active')}
            {toggleRow('Info Correct', contact.infoCorrect, 'infoCorrect')}
            {toggleRow('Check Info', contact.checkInfo, 'checkInfo')}
            {toggleRow('New Year Card', contact.newYearCard, 'newYearCard')}
            {toggleRow('Newsletter', contact.newsLetter, 'newsLetter')}
            {toggleRow('Mailing', contact.mailing, 'mailing')}
          </div>
        </div>

        {/* Flags — Training */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Training &amp; Advice Flags
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {toggleRow('Training Advice', contact.trainingAdvice, 'trainingAdvice')}
            {toggleRow('Contact for T&A', contact.contactForTrainingAndAdvice, 'contactForTrainingAndAdvice')}
            {toggleRow('Customer T&A', contact.customerTrainingAndAdvice, 'customerTrainingAndAdvice')}
            {toggleRow(
              'Pot. Customer T&A',
              contact.potentialCustomerTrainingAndAdvice,
              'potentialCustomerTrainingAndAdvice',
            )}
            {toggleRow(
              'Pot. Teacher T&A',
              contact.potentialTeacherTrainingAndAdvice,
              'potentialTeacherTrainingAndAdvice',
            )}
            {toggleRow('Teacher T&A', contact.teacherTrainingAndAdvice, 'teacherTrainingAndAdvice')}
            {toggleRow('Participant T&A', contact.participantTrainingAndAdvice, 'participantTrainingAndAdvice')}
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="companies">
        <TabsList className="bg-secondary border border-border/60 flex-wrap h-auto gap-1">
          <TabsTrigger value="companies">
            Companies
            <Badge variant="secondary" className="ml-2 text-xs">
              {activeCompanies.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="projects">
            Projects
            <Badge variant="secondary" className="ml-2 text-xs">
              {contact.projects.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="trainings">
            Trainings
            <Badge variant="secondary" className="ml-2 text-xs">
              {contact.trainings.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="followups">
            Follow-ups
            <Badge variant="secondary" className="ml-2 text-xs">
              {contact.followUps.length}
            </Badge>
          </TabsTrigger>
          {isAdmin && <TabsTrigger value="visibility">Visibility</TabsTrigger>}
        </TabsList>

        {/* ── Companies ────────────────────────────────────────────────────── */}
        <TabsContent value="companies" className="mt-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {nonDeletedCompanies.length > activeCompanies.length && !showDeletedCompanies && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 border-border"
                  onClick={() => setShowAllCompanies(v => !v)}>
                  {showAllCompanies
                    ? `Active only (${activeCompanies.length})`
                    : `Show all incl. ended (${nonDeletedCompanies.length})`}
                </Button>
              )}
              {hasDeletedCompanies && (
                <Button
                  size="sm"
                  variant={showDeletedCompanies ? 'secondary' : 'outline'}
                  className="text-xs h-7 border-border"
                  onClick={() => setShowDeletedCompanies(v => !v)}>
                  {showDeletedCompanies ? 'Hide deleted' : 'Show deleted'}
                </Button>
              )}
            </div>
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 border-border gap-1"
                onClick={() => {
                  setAddingCompany(true)
                  setCompanyForm(emptyCompanyForm())
                }}>
                <Plus className="h-3.5 w-3.5" /> Add Company
              </Button>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className={thClass}>Company</TableHead>
                  <TableHead className={thClass}>Number</TableHead>
                  <TableHead className={thClass}>Role at Company</TableHead>
                  <TableHead className={thClass}>Started</TableHead>
                  <TableHead className={thClass}>End Date</TableHead>
                  <TableHead className={thClass}>End Active</TableHead>
                  <TableHead className={thClass}>Status</TableHead>
                  <TableHead className="w-28">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Add row */}
                {addingCompany && (
                  <TableRow className="border-border/40 bg-secondary/30">
                    <TableCell colSpan={2}>
                      <Select
                        value={companyForm.companyId}
                        onValueChange={v => setCompanyForm(f => ({...f, companyId: v}))}>
                        <SelectTrigger className="h-7 text-xs bg-background border-border">
                          <SelectValue placeholder="Select company…" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {companyOptions.map(o => (
                            <SelectItem key={o.id} value={o.id} className="text-xs">
                              {o.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={companyForm.roleWithCompany}
                        placeholder="Role…"
                        onChange={e => setCompanyForm(f => ({...f, roleWithCompany: e.target.value}))}
                        className="h-7 text-xs bg-background border-border"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={companyForm.startedDate}
                        onChange={e => setCompanyForm(f => ({...f, startedDate: e.target.value}))}
                        className="h-7 text-xs bg-background border-border"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={companyForm.endDate}
                        onChange={e => setCompanyForm(f => ({...f, endDate: e.target.value}))}
                        className="h-7 text-xs bg-background border-border"
                      />
                    </TableCell>
                    <TableCell>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={endPreviousActive}
                          onChange={e => setEndPreviousActive(e.target.checked)}
                          className="h-3.5 w-3.5 accent-accent"
                        />
                        End active
                      </label>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-accent hover:bg-accent/10"
                          disabled={companyForm.companyId === 'none'}
                          onClick={async () => {
                            if (companyForm.companyId === 'none') return
                            await addCompanyContactAction({
                              contactId: contact.id,
                              companyId: companyForm.companyId,
                              roleWithCompany: companyForm.roleWithCompany || null,
                              startedDate: new Date(companyForm.startedDate),
                              endDate: companyForm.endDate ? new Date(companyForm.endDate) : null,
                              endPreviousActive,
                            })
                            setAddingCompany(false)
                            router.refresh()
                          }}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:bg-secondary"
                          onClick={() => setAddingCompany(false)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* Existing rows */}
                {visibleCompanies.length === 0 && !addingCompany ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-20 text-center text-muted-foreground">
                      No active company links.
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleCompanies.map(cc => {
                    const active = isActiveCompanyLink(cc.endDate)
                    const isEditingThis = editingCompanyId === cc.id
                    return (
                      <TableRow
                        key={cc.id}
                        className={`border-border/40 hover:bg-secondary/50 ${cc.deleted ? 'opacity-40' : !active ? 'opacity-60' : ''}`}>
                        {isEditingThis ? (
                          <>
                            <TableCell colSpan={2}>
                              <Select
                                value={editCompanyForm.companyId}
                                onValueChange={v => setEditCompanyForm(f => ({...f, companyId: v}))}>
                                <SelectTrigger className="h-7 text-xs bg-background border-border">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border">
                                  {companyOptions.map(o => (
                                    <SelectItem key={o.id} value={o.id} className="text-xs">
                                      {o.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={editCompanyForm.roleWithCompany}
                                placeholder="Role…"
                                onChange={e => setEditCompanyForm(f => ({...f, roleWithCompany: e.target.value}))}
                                className="h-7 text-xs bg-background border-border"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="date"
                                value={editCompanyForm.startedDate}
                                onChange={e => setEditCompanyForm(f => ({...f, startedDate: e.target.value}))}
                                className="h-7 text-xs bg-background border-border"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="date"
                                value={editCompanyForm.endDate}
                                onChange={e => setEditCompanyForm(f => ({...f, endDate: e.target.value}))}
                                className="h-7 text-xs bg-background border-border"
                              />
                            </TableCell>
                            {/* End Active col — not applicable when editing existing */}
                            <TableCell />
                            {/* Status col */}
                            <TableCell />
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-accent hover:bg-accent/10"
                                  onClick={async () => {
                                    await updateCompanyContactAction({
                                      id: cc.id,
                                      roleWithCompany: editCompanyForm.roleWithCompany || null,
                                      startedDate: new Date(editCompanyForm.startedDate),
                                      endDate: editCompanyForm.endDate ? new Date(editCompanyForm.endDate) : null,
                                    })
                                    setEditingCompanyId(null)
                                    router.refresh()
                                  }}>
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:bg-secondary"
                                  onClick={() => setEditingCompanyId(null)}>
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className={`${tdClass} text-foreground font-medium`}>
                              {cc.company.name}
                            </TableCell>
                            <TableCell className={tdClass}>{cc.company.number}</TableCell>
                            <TableCell className={tdClass}>{cc.roleWithCompany ?? '-'}</TableCell>
                            <TableCell className={tdClass}>{formatDate(cc.startedDate)}</TableCell>
                            <TableCell className={tdClass}>{formatDate(cc.endDate)}</TableCell>
                            <TableCell />
                            <TableCell>
                              {cc.deleted ? (
                                <Badge variant="destructive" className="font-medium text-xs">
                                  Deleted
                                </Badge>
                              ) : active ? (
                                <Badge className="bg-accent/15 text-accent border-0 font-medium">Active</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-muted-foreground font-medium">
                                  Ended
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {cc.deleted ? (
                                  <>
                                    {canEdit && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                        onClick={async () => {
                                          await undeleteCompanyContactAction({id: cc.id})
                                          router.refresh()
                                        }}>
                                        Restore
                                      </Button>
                                    )}
                                    {isAdmin && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                        title="Permanently delete"
                                        onClick={async () => {
                                          await hardDeleteCompanyContactAction({id: cc.id})
                                          router.refresh()
                                        }}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    {canEdit && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                        onClick={() => {
                                          setEditingCompanyId(cc.id)
                                          setEditCompanyForm({
                                            companyId: cc.company.id,
                                            roleWithCompany: cc.roleWithCompany ?? '',
                                            startedDate: cc.startedDate.slice(0, 10),
                                            endDate: cc.endDate ? cc.endDate.slice(0, 10) : '',
                                          })
                                        }}>
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                    {canEdit && active && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                                        title="End today"
                                        onClick={async () => {
                                          await endCompanyContactAction({id: cc.id})
                                          router.refresh()
                                        }}>
                                        <CalendarOff className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                    <Link href={`/companies/${cc.company.id}` as Route}>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-accent/10">
                                        <ExternalLink className="h-3.5 w-3.5" />
                                      </Button>
                                    </Link>
                                    {canEdit && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        title="Delete"
                                        onClick={async () => {
                                          await softDeleteCompanyContactAction({id: cc.id})
                                          router.refresh()
                                        }}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Projects ─────────────────────────────────────────────────────── */}
        <TabsContent value="projects" className="mt-3">
          <div className="flex flex-col gap-6">
            {/* Active */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Active ({activeProjects.length})
              </p>
              <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/60">
                      <TableHead className={thClass}>Project #</TableHead>
                      <TableHead className={thClass}>Name</TableHead>
                      <TableHead className={thClass}>Type</TableHead>
                      <TableHead className={thClass}>Start</TableHead>
                      <TableHead className={thClass}>End</TableHead>
                      <TableHead className="w-10">
                        <span className="sr-only">Open</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeProjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                          No active projects.
                        </TableCell>
                      </TableRow>
                    ) : (
                      activeProjects.map(pc => (
                        <TableRow key={pc.id} className="border-border/40 hover:bg-secondary/50">
                          <TableCell className={`${tdClass} text-foreground font-medium`}>
                            {pc.project.projectNumber}
                          </TableCell>
                          <TableCell className={tdClass}>{pc.project.projectName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-border text-muted-foreground font-normal">
                              {pc.project.projectTypeName}
                            </Badge>
                          </TableCell>
                          <TableCell className={tdClass}>{formatDate(pc.project.startDate)}</TableCell>
                          <TableCell className={tdClass}>{formatDate(pc.project.endDate)}</TableCell>
                          <TableCell>
                            <Link href={`/departments/project/project/${pc.project.id}` as Route}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-accent/10">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Closed */}
            {closedProjects.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Closed / Not open ({closedProjects.length})
                </p>
                <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-border/60">
                        <TableHead className={thClass}>Project #</TableHead>
                        <TableHead className={thClass}>Name</TableHead>
                        <TableHead className={thClass}>Type</TableHead>
                        <TableHead className={thClass}>Start</TableHead>
                        <TableHead className={thClass}>End</TableHead>
                        <TableHead className="w-10">
                          <span className="sr-only">Open</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {closedProjects.map(pc => (
                        <TableRow key={pc.id} className="border-border/40 hover:bg-secondary/50 opacity-60">
                          <TableCell className={`${tdClass} text-foreground font-medium`}>
                            {pc.project.projectNumber}
                          </TableCell>
                          <TableCell className={tdClass}>{pc.project.projectName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-border text-muted-foreground font-normal">
                              {pc.project.projectTypeName}
                            </Badge>
                          </TableCell>
                          <TableCell className={tdClass}>{formatDate(pc.project.startDate)}</TableCell>
                          <TableCell className={tdClass}>{formatDate(pc.project.endDate)}</TableCell>
                          <TableCell>
                            <Link href={`/departments/project/project/${pc.project.id}` as Route}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-accent/10">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Trainings ────────────────────────────────────────────────────── */}
        <TabsContent value="trainings" className="mt-3">
          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className={thClass}>Training #</TableHead>
                  <TableHead className={thClass}>Standard</TableHead>
                  <TableHead className={thClass}>Training Date</TableHead>
                  <TableHead className={thClass}>Attended</TableHead>
                  <TableHead className={thClass}>Succeeded</TableHead>
                  <TableHead className={thClass}>Cert. Sent</TableHead>
                  <TableHead className={thClass}>Cert. Date</TableHead>
                  <TableHead className={thClass}>Registered By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contact.trainings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-20 text-center text-muted-foreground">
                      No trainings recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  contact.trainings.map(tc => (
                    <TableRow key={tc.id} className="border-border/40 hover:bg-secondary/50">
                      <TableCell className={`${tdClass} text-foreground font-medium`}>
                        {tc.training.trainingNumber ?? '-'}
                      </TableCell>
                      <TableCell className={tdClass}>{tc.training.trainingStandardDescriptionShort}</TableCell>
                      <TableCell className={tdClass}>{formatDate(tc.training.trainingDate)}</TableCell>
                      <TableCell>
                        <YesNoBadge value={tc.attended} />
                      </TableCell>
                      <TableCell>
                        <YesNoBadge value={tc.succeeded} />
                      </TableCell>
                      <TableCell>
                        <YesNoBadge value={tc.certificateSent} />
                      </TableCell>
                      <TableCell className={tdClass}>{formatDate(tc.certSentDate)}</TableCell>
                      <TableCell className={tdClass}>{tc.createdByName}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Follow-ups ───────────────────────────────────────────────────── */}
        <TabsContent value="followups" className="mt-3">
          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className={thClass}>Contact Date</TableHead>
                  <TableHead className={thClass}>Item</TableHead>
                  <TableHead className={thClass}>Activity</TableHead>
                  <TableHead className={thClass}>Task</TableHead>
                  <TableHead className={thClass}>Action Agenda</TableHead>
                  <TableHead className={thClass}>Closed Agenda</TableHead>
                  <TableHead className={thClass}>Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contact.followUps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                      No follow-ups recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  contact.followUps.map(fu => (
                    <TableRow key={fu.id} className="border-border/40 hover:bg-secondary/50">
                      <TableCell className={`${tdClass} text-foreground font-medium`}>
                        {formatDate(fu.contactDate)}
                      </TableCell>
                      <TableCell className={tdClass}>{fu.item ?? '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs">
                        <p className="truncate max-w-[200px]" title={fu.activityDescription ?? ''}>
                          {fu.activityDescription ?? '-'}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs">
                        <p className="truncate max-w-[200px]" title={fu.taskDescription ?? ''}>
                          {fu.taskDescription ?? '-'}
                        </p>
                      </TableCell>
                      <TableCell className={tdClass}>{formatDate(fu.actionAgenda)}</TableCell>
                      <TableCell className={tdClass}>{formatDate(fu.closedAgenda)}</TableCell>
                      <TableCell className={tdClass}>{fu.createdByName}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Visibility ───────────────────────────────────────────────────── */}
        {isAdmin && (
          <TabsContent value="visibility" className="mt-3">
            {editing ? (
              <VisibilityForRoleTab
                roleLevelOptions={roleLevelOptions}
                value={visibilityRows}
                onChange={setVisibilityRows}
              />
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">Click Edit to change visibility settings.</p>
                <div className="flex flex-wrap gap-3">
                  {roleLevelOptions.map(rl => {
                    const visible = visibilityRows.find(r => r.roleLevelId === rl.id)?.visible ?? false
                    return (
                      <div
                        key={rl.id}
                        className="flex flex-col items-start gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 w-60">
                        <div>
                          <p className="text-sm text-foreground">{rl.roleName}</p>
                          <p className="text-xs text-muted-foreground">
                            {rl.subRoleName} — level {rl.subRoleLevel}
                          </p>
                        </div>
                        <YesNoBadge value={visible} />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
