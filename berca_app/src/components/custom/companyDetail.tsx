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
import {updateCompanyAction} from '@/serverFunctions/companies'
import {
  createCompanyAddressAction,
  updateCompanyAddressAction,
  softDeleteCompanyAddressAction,
  hardDeleteCompanyAddressAction,
  undeleteCompanyAddressAction,
} from '@/serverFunctions/companies'
import {
  addCompanyContactAction,
  updateCompanyContactAction,
  endCompanyContactAction,
  softDeleteCompanyContactAction,
  undeleteCompanyContactAction,
  hardDeleteCompanyContactAction,
} from '@/serverFunctions/companyContact'
import {createContactAndReturnIdAction} from '@/serverFunctions/contacts'
import {ContactFormDialog} from '@/components/custom/contactFormDialog'
import type {MappedContact} from '@/types/contact'
import {VisibilityForRoleTab, buildInitialVisibilityRows} from '@/components/custom/visibilityForRoleTab'
import type {VisibilityRow} from '@/components/custom/visibilityForRoleTab'
import type {Route} from 'next'
import type {RoleLevelOption} from '@/types/roleLevel'
import type {CompanyDetailData} from '@/types/company'

interface SelectOption {
  id: string
  name: string
}

interface CompanyDetailProps {
  company: CompanyDetailData
  companies: SelectOption[]
  currentUserRole: string
  currentUserLevel: number
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  departmentId: string
  contactOptions: SelectOption[]
  functionOptions: SelectOption[]
  departmentExternOptions: SelectOption[]
  titleOptions: SelectOption[]
}

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

function isActiveContact(endDate: string | null) {
  if (!endDate) return true
  return new Date(endDate) > new Date()
}

const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'
const thClass = 'whitespace-nowrap text-xs'

export function CompanyDetail({
  company,
  companies,
  currentUserRole,
  currentUserLevel,
  roleLevelOptions,
  defaultVisibleRoleNames,
  departmentId,
  contactOptions,
  functionOptions,
  departmentExternOptions,
  titleOptions,
}: CompanyDetailProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canEdit = currentUserLevel >= 20
  const canDelete = currentUserRole === 'Administrator' || currentUserLevel >= 80

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAllContacts, setShowAllContacts] = useState(false)

  // ─── Edit form ─────────────────────────────────────────────────────────────
  const buildForm = () => ({
    name: company.name,
    number: company.number,
    mail: company.mail ?? '',
    businessPhone: company.businessPhone ?? '',
    website: company.website ?? '',
    vatNumber: company.vatNumber ?? '',
    bankNumber: company.bankNumber ?? '',
    iban: company.iban ?? '',
    bic: company.bic ?? '',
    becraCustomerNumber: company.becraCustomerNumber ?? '',
    becraWebsiteLogin: company.becraWebsiteLogin ?? '',
    notes: company.notes ?? '',
    companyId: company.companyId ?? 'none',
    supplier: company.supplier,
    preferredSupplier: company.preferredSupplier,
    companyActive: company.companyActive,
    newsLetter: company.newsLetter,
    customer: company.customer,
    potentialCustomer: company.potentialCustomer,
    headQuarters: company.headQuarters,
    potentialSubContractor: company.potentialSubContractor,
    subContractor: company.subContractor,
  })

  const [form, setForm] = useState(buildForm)
  const s = <K extends keyof ReturnType<typeof buildForm>>(key: K, v: ReturnType<typeof buildForm>[K]) =>
    setForm(f => ({...f, [key]: v}))

  // ─── Visibility ────────────────────────────────────────────────────────────
  const [visibilityRows, setVisibilityRows] = useState<VisibilityRow[]>(() =>
    buildInitialVisibilityRows(company.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames),
  )

  function handleCancel() {
    setForm(buildForm())
    setVisibilityRows(buildInitialVisibilityRows(company.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames))
    setEditing(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateCompanyAction({
        id: company.id,
        name: form.name,
        number: form.number,
        mail: form.mail || null,
        businessPhone: form.businessPhone || null,
        website: form.website || null,
        vatNumber: form.vatNumber || null,
        bankNumber: form.bankNumber || null,
        iban: form.iban || null,
        bic: form.bic || null,
        becraCustomerNumber: form.becraCustomerNumber || null,
        becraWebsiteLogin: form.becraWebsiteLogin || null,
        notes: form.notes || null,
        companyId: form.companyId === 'none' ? null : form.companyId,
        supplier: form.supplier,
        preferredSupplier: form.preferredSupplier,
        companyActive: form.companyActive,
        newsLetter: form.newsLetter,
        customer: form.customer,
        potentialCustomer: form.potentialCustomer,
        headQuarters: form.headQuarters,
        potentialSubContractor: form.potentialSubContractor,
        subContractor: form.subContractor,
        visibilityForRoles: visibilityRows,
      })
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  // ─── Address state ─────────────────────────────────────────────────────────
  type AddrForm = {
    street: string
    houseNumber: string
    busNumber: string
    zipCode: string
    place: string
    typeAdress: string
  }
  const emptyAddrForm = (): AddrForm => ({
    street: '',
    houseNumber: '',
    busNumber: '',
    zipCode: '',
    place: '',
    typeAdress: '',
  })

  const [addingAddr, setAddingAddr] = useState(false)
  const [newAddrForm, setNewAddrForm] = useState<AddrForm>(emptyAddrForm)
  const [editingAddrId, setEditingAddrId] = useState<string | null>(null)
  const [editAddrForm, setEditAddrForm] = useState<AddrForm>(emptyAddrForm)
  const [showDeletedAddrs, setShowDeletedAddrs] = useState(false)

  // ─── Address handlers ──────────────────────────────────────────────────────
  async function handleAddAddr() {
    await createCompanyAddressAction({
      companyId: company.id,
      street: newAddrForm.street || null,
      houseNumber: newAddrForm.houseNumber || null,
      busNumber: newAddrForm.busNumber || null,
      zipCode: newAddrForm.zipCode || null,
      place: newAddrForm.place || null,
      typeAdress: newAddrForm.typeAdress || null,
    })
    setAddingAddr(false)
    router.refresh()
  }

  async function handleSaveEditAddr(id: string) {
    await updateCompanyAddressAction({
      id,
      companyId: company.id,
      street: editAddrForm.street || null,
      houseNumber: editAddrForm.houseNumber || null,
      busNumber: editAddrForm.busNumber || null,
      zipCode: editAddrForm.zipCode || null,
      place: editAddrForm.place || null,
      typeAdress: editAddrForm.typeAdress || null,
    })
    setEditingAddrId(null)
    router.refresh()
  }

  async function handleSoftDeleteAddr(id: string) {
    await softDeleteCompanyAddressAction({id})
    router.refresh()
  }

  async function handleHardDeleteAddr(id: string) {
    await hardDeleteCompanyAddressAction({id})
    router.refresh()
  }

  async function handleUndeleteAddr(id: string) {
    await undeleteCompanyAddressAction({id})
    router.refresh()
  }

  function handleStartEditAddr(a: {
    id: string
    typeAdress: string | null
    street: string | null
    houseNumber: string | null
    busNumber: string | null
    zipCode: string | null
    place: string | null
  }) {
    setEditingAddrId(a.id)
    setEditAddrForm({
      typeAdress: a.typeAdress ?? '',
      street: a.street ?? '',
      houseNumber: a.houseNumber ?? '',
      busNumber: a.busNumber ?? '',
      zipCode: a.zipCode ?? '',
      place: a.place ?? '',
    })
  }

  // ─── Contact link state ────────────────────────────────────────────────────
  type ContactLinkForm = {contactId: string; roleWithCompany: string; startedDate: string; endDate: string}
  const emptyContactLinkForm = (): ContactLinkForm => ({
    contactId: 'none',
    roleWithCompany: '',
    startedDate: new Date().toISOString().slice(0, 10),
    endDate: '',
  })

  const [contacts, setContacts] = useState(contactOptions)
  const [addingContact, setAddingContact] = useState(false)
  const [contactLinkForm, setContactLinkForm] = useState<ContactLinkForm>(emptyContactLinkForm)
  const [endPreviousActive, setEndPreviousActive] = useState(true)
  const [editingContactLinkId, setEditingContactLinkId] = useState<string | null>(null)
  const [editContactLinkForm, setEditContactLinkForm] = useState<ContactLinkForm>(emptyContactLinkForm)
  const [showDeletedContacts, setShowDeletedContacts] = useState(false)
  const [contactDialogOpen, setContactDialogOpen] = useState(false)

  // ─── Contact link handlers ─────────────────────────────────────────────────
  async function handleAddContactLink() {
    if (contactLinkForm.contactId === 'none') return
    await addCompanyContactAction({
      contactId: contactLinkForm.contactId,
      companyId: company.id,
      roleWithCompany: contactLinkForm.roleWithCompany || null,
      startedDate: new Date(contactLinkForm.startedDate),
      endDate: contactLinkForm.endDate ? new Date(contactLinkForm.endDate) : null,
      endPreviousActive,
    })
    setAddingContact(false)
    router.refresh()
  }

  async function handleSaveEditContactLink(id: string) {
    await updateCompanyContactAction({
      id,
      roleWithCompany: editContactLinkForm.roleWithCompany || null,
      startedDate: new Date(editContactLinkForm.startedDate),
      endDate: editContactLinkForm.endDate ? new Date(editContactLinkForm.endDate) : null,
    })
    setEditingContactLinkId(null)
    router.refresh()
  }

  async function handleEndContactLink(id: string) {
    await endCompanyContactAction({id})
    router.refresh()
  }

  async function handleSoftDeleteContactLink(id: string) {
    await softDeleteCompanyContactAction({id})
    router.refresh()
  }

  async function handleUndeleteContactLink(id: string) {
    await undeleteCompanyContactAction({id})
    router.refresh()
  }

  async function handleHardDeleteContactLink(id: string) {
    await hardDeleteCompanyContactAction({id})
    router.refresh()
  }

  function handleStartEditContactLink(cc: {
    id: string
    contact: {id: string}
    roleWithCompany: string | null
    startedDate: string
    endDate: string | null
  }) {
    setEditingContactLinkId(cc.id)
    setEditContactLinkForm({
      contactId: cc.contact.id,
      roleWithCompany: cc.roleWithCompany ?? '',
      startedDate: cc.startedDate.slice(0, 10),
      endDate: cc.endDate ? cc.endDate.slice(0, 10) : '',
    })
  }

  async function handleSaveNewContact(c: MappedContact, visRows: VisibilityRow[]) {
    const created = await createContactAndReturnIdAction({
      firstName: c.firstName,
      lastName: c.lastName,
      mail1: c.mail1,
      mail2: c.mail2,
      mail3: c.mail3,
      generalPhone: c.generalPhone,
      homePhone: c.homePhone,
      mobilePhone: c.mobilePhone,
      info: c.info,
      birthDate: c.birthDate ? new Date(c.birthDate) : null,
      through: c.through,
      description: c.description,
      infoCorrect: c.infoCorrect,
      checkInfo: c.checkInfo,
      newYearCard: c.newYearCard,
      active: c.active,
      newsLetter: c.newsLetter,
      mailing: c.mailing,
      trainingAdvice: c.trainingAdvice,
      contactForTrainingAndAdvice: c.contactForTrainingAndAdvice,
      customerTrainingAndAdvice: c.customerTrainingAndAdvice,
      potentialCustomerTrainingAndAdvice: c.potentialCustomerTrainingAndAdvice,
      potentialTeacherTrainingAndAdvice: c.potentialTeacherTrainingAndAdvice,
      teacherTrainingAndAdvice: c.teacherTrainingAndAdvice,
      participantTrainingAndAdvice: c.participantTrainingAndAdvice,
      functionId: c.functionId,
      departmentExternId: c.departmentExternId,
      titleId: c.titleId,
      businessCardId: c.businessCardId,
      visibilityForRoles: visRows,
      initialCompanyId: company.id,
      initialRoleWithCompany: contactLinkForm.roleWithCompany || null,
    })
    setContacts(prev => [...prev, {id: created.id, name: `${c.firstName} ${c.lastName}`}])
    setContactDialogOpen(false)
    setAddingContact(false)
    router.refresh()
  }

  // ─── Derived ───────────────────────────────────────────────────────────────
  const linkedContactIds = new Set(company.contacts.filter(cc => !cc.deleted).map(cc => cc.contact.id))
  const activeContactCount = company.contacts.filter(cc => !cc.deleted && isActiveContact(cc.endDate)).length
  const hasDeletedContacts = company.contacts.some(cc => cc.deleted)
  const nonDeletedContacts = company.contacts.filter(cc => !cc.deleted)
  const activeContacts = nonDeletedContacts.filter(cc => isActiveContact(cc.endDate))
  const visibleContacts = showDeletedContacts ? company.contacts : showAllContacts ? nonDeletedContacts : activeContacts
  const activeProjects = company.projects.filter(p => p.isOpen && !p.isClosed)
  const closedProjects = company.projects.filter(p => p.isClosed || !p.isOpen)
  const visibleAddresses = company.addresses.filter(a => showDeletedAddrs || !a.deleted)

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
            <h1 className="text-lg font-semibold text-foreground">{company.name}</h1>
            <p className="text-sm text-muted-foreground">
              #{company.number}
              {company.parentCompanyName && ` · ${company.parentCompanyName}`}
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
      <div className="rounded-xl border border-border/60 bg-card p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              {key: 'name', label: 'Name'},
              {key: 'number', label: 'Number'},
              {key: 'mail', label: 'Email'},
              {key: 'businessPhone', label: 'Business Phone'},
              {key: 'website', label: 'Website'},
              {key: 'vatNumber', label: 'VAT Number'},
              {key: 'bankNumber', label: 'Bank Number'},
              {key: 'iban', label: 'IBAN'},
              {key: 'bic', label: 'BIC'},
              {key: 'becraCustomerNumber', label: 'Becra Customer #'},
              {key: 'becraWebsiteLogin', label: 'Becra Login'},
            ] as const
          ).map(({key, label}) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              {editing ? (
                <Input
                  value={form[key]}
                  onChange={e => s(key, e.target.value)}
                  className="bg-secondary border-border"
                  disabled={key === 'number'}
                />
              ) : (
                <p className="text-sm">
                  {key === 'website' && company.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-accent hover:underline">
                      {company.website}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">{company[key] ?? '-'}</span>
                  )}
                </p>
              )}
            </div>
          ))}

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Parent Company</Label>
            {editing ? (
              <Select value={form.companyId} onValueChange={v => s('companyId', v)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="none">None</SelectItem>
                  {companies
                    .filter(c => c.id !== company.id)
                    .map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                {company.parentCompanyName ? (
                  <Link
                    href={`/departments/${departmentId}/company/${company.companyId}` as Route}
                    className="hover:text-accent hover:underline">
                    {company.parentCompanyName}
                  </Link>
                ) : (
                  '-'
                )}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Created By</Label>
            <p className="text-sm text-muted-foreground">{company.createdByName}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Created At</Label>
            <p className="text-sm text-muted-foreground">{formatDate(company.createdAt)}</p>
          </div>

          <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(
              [
                {key: 'companyActive', label: 'Active'},
                {key: 'customer', label: 'Customer'},
                {key: 'potentialCustomer', label: 'Pot. Customer'},
                {key: 'supplier', label: 'Supplier'},
                {key: 'preferredSupplier', label: 'Pref. Supplier'},
                {key: 'subContractor', label: 'Sub-Contractor'},
                {key: 'potentialSubContractor', label: 'Pot. Sub-Con'},
                {key: 'headQuarters', label: 'Head Quarters'},
                {key: 'newsLetter', label: 'Newsletter'},
              ] as const
            ).map(({key, label}) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                {editing ? (
                  <Switch checked={form[key]} onCheckedChange={v => s(key, v)} />
                ) : (
                  <YesNoBadge value={company[key]} />
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
            <Label className="text-xs text-muted-foreground">Notes</Label>
            {editing ? (
              <Textarea
                value={form.notes}
                onChange={e => s('notes', e.target.value)}
                rows={3}
                className="bg-secondary border-border resize-none"
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{company.notes ?? '-'}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="contacts">
        <TabsList className="bg-secondary border border-border/60 flex-wrap h-auto gap-1">
          <TabsTrigger value="contacts">
            Contacts
            <Badge variant="secondary" className="ml-2 text-xs">
              {activeContactCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="projects">
            Projects
            <Badge variant="secondary" className="ml-2 text-xs">
              {company.projects.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="addresses">
            Addresses
            <Badge variant="secondary" className="ml-2 text-xs">
              {company.addresses.filter(a => !a.deleted).length}
            </Badge>
          </TabsTrigger>
          {company.subsidiaries.length > 0 && (
            <TabsTrigger value="subsidiaries">
              Subsidiaries
              <Badge variant="secondary" className="ml-2 text-xs">
                {company.subsidiaries.length}
              </Badge>
            </TabsTrigger>
          )}
          {isAdmin && <TabsTrigger value="visibility">Visibility</TabsTrigger>}
        </TabsList>

        {/* ── Contacts ─────────────────────────────────────────────────────── */}
        <TabsContent value="contacts" className="mt-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {nonDeletedContacts.length > activeContacts.length && !showDeletedContacts && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 border-border"
                  onClick={() => setShowAllContacts(v => !v)}>
                  {showAllContacts
                    ? `Active only (${activeContacts.length})`
                    : `Show all incl. ended (${nonDeletedContacts.length})`}
                </Button>
              )}
              {hasDeletedContacts && (
                <Button
                  size="sm"
                  variant={showDeletedContacts ? 'secondary' : 'outline'}
                  className="text-xs h-7 border-border"
                  onClick={() => setShowDeletedContacts(v => !v)}>
                  {showDeletedContacts ? 'Hide deleted' : 'Show deleted'}
                </Button>
              )}
            </div>
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 border-border gap-1"
                onClick={() => {
                  setAddingContact(true)
                  setContactLinkForm(emptyContactLinkForm())
                }}>
                <Plus className="h-3.5 w-3.5" /> Add Contact
              </Button>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className={thClass}>Name</TableHead>
                  <TableHead className={thClass}>Role at Company</TableHead>
                  <TableHead className={thClass}>Email</TableHead>
                  <TableHead className={thClass}>Phone</TableHead>
                  <TableHead className={thClass}>Mobile</TableHead>
                  <TableHead className={thClass}>Started</TableHead>
                  <TableHead className={thClass}>End Date</TableHead>
                  <TableHead className={thClass}>Status</TableHead>
                  <TableHead className="w-28">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* ── Add row ── */}
                {addingContact && (
                  <TableRow className="border-border/40 bg-secondary/30">
                    <TableCell>
                      <div className="flex gap-1">
                        <Select
                          value={contactLinkForm.contactId}
                          onValueChange={v => {
                            if (v === '__create__') {
                              setContactDialogOpen(true)
                            } else {
                              setContactLinkForm(f => ({...f, contactId: v}))
                            }
                          }}>
                          <SelectTrigger className="h-7 text-xs bg-background border-border min-w-[160px]">
                            <SelectValue placeholder="Select contact…" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {contacts
                              .filter(o => !linkedContactIds.has(o.id))
                              .map(o => (
                                <SelectItem key={o.id} value={o.id} className="text-xs">
                                  {o.name}
                                </SelectItem>
                              ))}
                            <SelectItem value="__create__" className="text-xs">
                              + Create New Contact
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 border-border shrink-0"
                          onClick={() => setContactDialogOpen(true)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={contactLinkForm.roleWithCompany}
                        placeholder="Role…"
                        onChange={e => setContactLinkForm(f => ({...f, roleWithCompany: e.target.value}))}
                        className="h-7 text-xs bg-background border-border"
                      />
                    </TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell />
                    <TableCell>
                      <Input
                        type="date"
                        value={contactLinkForm.startedDate}
                        onChange={e => setContactLinkForm(f => ({...f, startedDate: e.target.value}))}
                        className="h-7 text-xs bg-background border-border"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={contactLinkForm.endDate}
                        onChange={e => setContactLinkForm(f => ({...f, endDate: e.target.value}))}
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
                          disabled={contactLinkForm.contactId === 'none'}
                          onClick={handleAddContactLink}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:bg-secondary"
                          onClick={() => setAddingContact(false)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* ── Existing rows ── */}
                {visibleContacts.length === 0 && !addingContact ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-20 text-center text-muted-foreground">
                      No active contact links.
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleContacts.map(cc => {
                    const active = isActiveContact(cc.endDate)
                    const isEditingThis = editingContactLinkId === cc.id
                    return (
                      <TableRow
                        key={cc.id}
                        className={`border-border/40 hover:bg-secondary/50 ${cc.deleted ? 'opacity-40' : !active ? 'opacity-60' : ''}`}>
                        {isEditingThis ? (
                          <>
                            <TableCell>
                              <Select
                                value={editContactLinkForm.contactId}
                                onValueChange={v => setEditContactLinkForm(f => ({...f, contactId: v}))}>
                                <SelectTrigger className="h-7 text-xs bg-background border-border min-w-[160px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border">
                                  {contactOptions.map(o => (
                                    <SelectItem key={o.id} value={o.id} className="text-xs">
                                      {o.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={editContactLinkForm.roleWithCompany}
                                placeholder="Role…"
                                onChange={e => setEditContactLinkForm(f => ({...f, roleWithCompany: e.target.value}))}
                                className="h-7 text-xs bg-background border-border"
                              />
                            </TableCell>
                            <TableCell />
                            <TableCell />
                            <TableCell />
                            <TableCell>
                              <Input
                                type="date"
                                value={editContactLinkForm.startedDate}
                                onChange={e => setEditContactLinkForm(f => ({...f, startedDate: e.target.value}))}
                                className="h-7 text-xs bg-background border-border"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="date"
                                value={editContactLinkForm.endDate}
                                onChange={e => setEditContactLinkForm(f => ({...f, endDate: e.target.value}))}
                                className="h-7 text-xs bg-background border-border"
                              />
                            </TableCell>
                            <TableCell />
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-accent hover:bg-accent/10"
                                  onClick={() => handleSaveEditContactLink(cc.id)}>
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:bg-secondary"
                                  onClick={() => setEditingContactLinkId(null)}>
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className={`${tdClass} text-foreground font-medium`}>
                              {cc.contact.firstName} {cc.contact.lastName}
                            </TableCell>
                            <TableCell className={tdClass}>{cc.roleWithCompany ?? '-'}</TableCell>
                            <TableCell className={tdClass}>{cc.contact.mail1 ?? '-'}</TableCell>
                            <TableCell className={tdClass}>{cc.contact.generalPhone ?? '-'}</TableCell>
                            <TableCell className={tdClass}>{cc.contact.mobilePhone ?? '-'}</TableCell>
                            <TableCell className={tdClass}>{formatDate(cc.startedDate)}</TableCell>
                            <TableCell className={tdClass}>{formatDate(cc.endDate)}</TableCell>
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
                                        onClick={() => handleUndeleteContactLink(cc.id)}>
                                        Restore
                                      </Button>
                                    )}
                                    {isAdmin && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                        title="Permanently delete"
                                        onClick={() => handleHardDeleteContactLink(cc.id)}>
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
                                        onClick={() => handleStartEditContactLink(cc)}>
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                    {canEdit && active && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                                        title="End today"
                                        onClick={() => handleEndContactLink(cc.id)}>
                                        <CalendarOff className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                    <Link href={`/departments/${departmentId}/contact/${cc.contact.id}` as Route}>
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
                                        onClick={() => handleSoftDeleteContactLink(cc.id)}>
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
                      <TableHead className={thClass}>Main</TableHead>
                      <TableHead className={thClass}>Internal</TableHead>
                      <TableHead className={thClass}>Created By</TableHead>
                      <TableHead className="w-10">
                        <span className="sr-only">Open</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeProjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-20 text-center text-muted-foreground">
                          No active projects.
                        </TableCell>
                      </TableRow>
                    ) : (
                      activeProjects.map(p => (
                        <TableRow key={p.id} className="border-border/40 hover:bg-secondary/50">
                          <TableCell className={`${tdClass} text-foreground font-medium`}>{p.projectNumber}</TableCell>
                          <TableCell className={tdClass}>{p.projectName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-border text-muted-foreground font-normal">
                              {p.projectTypeName}
                            </Badge>
                          </TableCell>
                          <TableCell className={tdClass}>{formatDate(p.startDate)}</TableCell>
                          <TableCell className={tdClass}>{formatDate(p.endDate)}</TableCell>
                          <TableCell>
                            <YesNoBadge value={p.isMainProject} />
                          </TableCell>
                          <TableCell>
                            <YesNoBadge value={p.isIntern} />
                          </TableCell>
                          <TableCell className={tdClass}>{p.createdByName}</TableCell>
                          <TableCell>
                            <Link href={`/departments/project/project/${p.id}` as Route}>
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
                        <TableHead className={thClass}>Open</TableHead>
                        <TableHead className={thClass}>Closed</TableHead>
                        <TableHead className="w-10">
                          <span className="sr-only">Open</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {closedProjects.map(p => (
                        <TableRow key={p.id} className="border-border/40 hover:bg-secondary/50 opacity-60">
                          <TableCell className={`${tdClass} text-foreground font-medium`}>{p.projectNumber}</TableCell>
                          <TableCell className={tdClass}>{p.projectName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-border text-muted-foreground font-normal">
                              {p.projectTypeName}
                            </Badge>
                          </TableCell>
                          <TableCell className={tdClass}>{formatDate(p.startDate)}</TableCell>
                          <TableCell className={tdClass}>{formatDate(p.endDate)}</TableCell>
                          <TableCell>
                            <YesNoBadge value={p.isOpen} />
                          </TableCell>
                          <TableCell>
                            <YesNoBadge value={p.isClosed} />
                          </TableCell>
                          <TableCell>
                            <Link href={`/departments/project/project/${p.id}` as Route}>
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

        {/* ── Addresses ────────────────────────────────────────────────────── */}
        <TabsContent value="addresses" className="mt-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {company.addresses.some(a => a.deleted) && (
                <Button
                  size="sm"
                  variant={showDeletedAddrs ? 'secondary' : 'outline'}
                  className="text-xs h-7 border-border"
                  onClick={() => setShowDeletedAddrs(v => !v)}>
                  {showDeletedAddrs ? 'Hide deleted' : 'Show deleted'}
                </Button>
              )}
            </div>
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 border-border gap-1"
                onClick={() => {
                  setAddingAddr(true)
                  setNewAddrForm(emptyAddrForm())
                }}>
                <Plus className="h-3.5 w-3.5" /> Add Address
              </Button>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className={thClass}>Type</TableHead>
                  <TableHead className={thClass}>Street</TableHead>
                  <TableHead className={thClass}>House #</TableHead>
                  <TableHead className={thClass}>Bus #</TableHead>
                  <TableHead className={thClass}>Zip Code</TableHead>
                  <TableHead className={thClass}>Place</TableHead>
                  <TableHead className={thClass}>Status</TableHead>
                  <TableHead className="w-24">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* ── Add row ── */}
                {addingAddr && (
                  <TableRow className="border-border/40 bg-secondary/30">
                    {(['typeAdress', 'street', 'houseNumber', 'busNumber', 'zipCode', 'place'] as const).map(field => (
                      <TableCell key={field}>
                        <Input
                          value={newAddrForm[field]}
                          placeholder={field === 'typeAdress' ? 'e.g. Main…' : undefined}
                          onChange={e => setNewAddrForm(f => ({...f, [field]: e.target.value}))}
                          className="h-7 text-xs bg-background border-border"
                        />
                      </TableCell>
                    ))}
                    <TableCell />
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-accent hover:bg-accent/10"
                          onClick={handleAddAddr}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:bg-secondary"
                          onClick={() => setAddingAddr(false)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* ── Existing rows ── */}
                {visibleAddresses.length === 0 && !addingAddr ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-20 text-center text-muted-foreground">
                      No addresses recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleAddresses.map(a => {
                    const isEditingThis = editingAddrId === a.id
                    return (
                      <TableRow
                        key={a.id}
                        className={`border-border/40 hover:bg-secondary/50 ${a.deleted ? 'opacity-40' : ''}`}>
                        {isEditingThis ? (
                          <>
                            {(['typeAdress', 'street', 'houseNumber', 'busNumber', 'zipCode', 'place'] as const).map(
                              field => (
                                <TableCell key={field}>
                                  <Input
                                    value={editAddrForm[field]}
                                    onChange={e => setEditAddrForm(f => ({...f, [field]: e.target.value}))}
                                    className="h-7 text-xs bg-background border-border"
                                  />
                                </TableCell>
                              ),
                            )}
                            <TableCell />
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-accent hover:bg-accent/10"
                                  onClick={() => handleSaveEditAddr(a.id)}>
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:bg-secondary"
                                  onClick={() => setEditingAddrId(null)}>
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className={tdClass}>
                              {a.typeAdress ? (
                                <Badge variant="outline" className="text-xs border-border">
                                  {a.typeAdress}
                                </Badge>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell className={tdClass}>{a.street ?? '-'}</TableCell>
                            <TableCell className={tdClass}>{a.houseNumber ?? '-'}</TableCell>
                            <TableCell className={tdClass}>{a.busNumber ?? '-'}</TableCell>
                            <TableCell className={tdClass}>{a.zipCode ?? '-'}</TableCell>
                            <TableCell className={tdClass}>{a.place ?? '-'}</TableCell>
                            <TableCell>
                              {a.deleted ? (
                                <Badge variant="destructive" className="font-medium text-xs">
                                  Deleted
                                </Badge>
                              ) : (
                                <Badge className="bg-accent/15 text-accent border-0 font-medium text-xs">Active</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {a.deleted ? (
                                  <>
                                    {canEdit && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                        onClick={() => handleUndeleteAddr(a.id)}>
                                        Restore
                                      </Button>
                                    )}
                                    {isAdmin && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                        title="Permanently delete"
                                        onClick={() => handleHardDeleteAddr(a.id)}>
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
                                        onClick={() => handleStartEditAddr(a)}>
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                    {canDelete && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        title="Delete"
                                        onClick={() => handleSoftDeleteAddr(a.id)}>
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

        {/* ── Subsidiaries ─────────────────────────────────────────────────── */}
        {company.subsidiaries.length > 0 && (
          <TabsContent value="subsidiaries" className="mt-3">
            <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/60">
                    <TableHead className={thClass}>Name</TableHead>
                    <TableHead className={thClass}>Number</TableHead>
                    <TableHead className={thClass}>Active</TableHead>
                    <TableHead className="w-10">
                      <span className="sr-only">Open</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {company.subsidiaries.map(sub => (
                    <TableRow key={sub.id} className="border-border/40 hover:bg-secondary/50">
                      <TableCell className={`${tdClass} text-foreground font-medium`}>{sub.name}</TableCell>
                      <TableCell className={tdClass}>{sub.number}</TableCell>
                      <TableCell>
                        <YesNoBadge value={sub.companyActive} />
                      </TableCell>
                      <TableCell>
                        <Link href={`/departments/${departmentId}/company/${sub.id}` as Route}>
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
          </TabsContent>
        )}

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

      {/* ── Create contact dialog ───────────────────────────────────────────── */}
      <ContactFormDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        contact={null}
        onSave={handleSaveNewContact}
        isAdmin={isAdmin}
        roleLevelOptions={roleLevelOptions}
        defaultVisibleRoleNames={defaultVisibleRoleNames}
        functionOptions={functionOptions}
        departmentExternOptions={departmentExternOptions}
        titleOptions={titleOptions}
        companyOptions={companies}
      />
    </div>
  )
}
