'use client'

import {useState} from 'react'
import {Search, Plus, Pencil, ChevronDown, ChevronUp, Trash2, ExternalLink} from 'lucide-react'
import {ContactFormDialog} from '@/components/custom/contactFormDialog'
import type {VisibilityRow} from '@/components/custom/visibilityForRoleTab'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import type {MappedContact} from '@/types/contact'
import type {RoleLevelOption} from '@/types/roleLevel'
import {
  createContactAction,
  updateContactAction,
  softDeleteContactAction,
  hardDeleteContactAction,
  undeleteContactAction,
} from '@/serverFunctions/contacts'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import type {Route} from 'next'

type SortField =
  | 'lastName'
  | 'firstName'
  | 'currentCompanyName'
  | 'currentRoleWithCompany'
  | 'titleName'
  | 'functionName'
  | 'departmentExternName'
  | 'mail1'
  | 'mail2'
  | 'mail3'
  | 'generalPhone'
  | 'mobilePhone'
  | 'homePhone'
  | 'birthDate'
  | 'through'
  | 'active'
  | 'infoCorrect'
  | 'checkInfo'
  | 'newYearCard'
  | 'newsLetter'
  | 'mailing'
  | 'trainingAdvice'
  | 'contactForTrainingAndAdvice'
  | 'customerTrainingAndAdvice'
  | 'potentialCustomerTrainingAndAdvice'
  | 'potentialTeacherTrainingAndAdvice'
  | 'teacherTrainingAndAdvice'
  | 'participantTrainingAndAdvice'
  | 'createdAt'
  | 'createdBy'
  | 'deleted'

type SortDir = 'asc' | 'desc'
type FilterDeleted = 'not-deleted' | 'deleted' | 'all'

interface SelectOption {
  id: string
  name: string
}

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function SortIcon({field, sortField, sortDir}: {field: SortField; sortField: SortField; sortDir: SortDir}) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? (
    <ChevronUp className="inline h-3.5 w-3.5 ml-1" />
  ) : (
    <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
  )
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

const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

function Th({
  field,
  label,
  sortField,
  sortDir,
  onSort,
}: {
  field: SortField
  label: string
  sortField: SortField
  sortDir: SortDir
  onSort: (f: SortField) => void
}) {
  return (
    <TableHead className={thClass} onClick={() => onSort(field)}>
      {label} <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </TableHead>
  )
}

interface ContactTableProps {
  initialContacts: MappedContact[]
  currentUserRole: string
  currentUserLevel: number
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  department: string
  functionOptions: SelectOption[]
  departmentExternOptions: SelectOption[]
  titleOptions: SelectOption[]
  companyOptions: SelectOption[]
}

export function ContactTable({
  initialContacts,
  currentUserRole,
  currentUserLevel,
  roleLevelOptions,
  defaultVisibleRoleNames,
  department,
  functionOptions,
  departmentExternOptions,
  titleOptions,
  companyOptions,
}: ContactTableProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canDelete = currentUserRole === 'Administrator' || currentUserLevel >= 80

  const [search, setSearch] = useState('')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [sortField, setSortField] = useState<SortField>('lastName')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<MappedContact | null>(null)

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filtered = initialContacts
    .filter(c => {
      if (filterDeleted === 'not-deleted' && c.deleted) return false
      if (filterDeleted === 'deleted' && !c.deleted) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        (c.mail1?.toLowerCase().includes(q) ?? false) ||
        (c.mail2?.toLowerCase().includes(q) ?? false) ||
        (c.generalPhone?.toLowerCase().includes(q) ?? false) ||
        (c.mobilePhone?.toLowerCase().includes(q) ?? false) ||
        (c.functionName?.toLowerCase().includes(q) ?? false) ||
        (c.through?.toLowerCase().includes(q) ?? false)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const s = (x: string | null, y: string | null) => dir * (x ?? '').localeCompare(y ?? '')
      const n = (x: boolean, y: boolean) => dir * (Number(x) - Number(y))
      switch (sortField) {
        case 'lastName':
          return s(a.lastName, b.lastName)
        case 'firstName':
          return s(a.firstName, b.firstName)
        case 'currentCompanyName':
          return s(a.currentCompanyName, b.currentCompanyName)
        case 'currentRoleWithCompany':
          return s(a.currentRoleWithCompany, b.currentRoleWithCompany)
        case 'titleName':
          return s(a.titleName, b.titleName)
        case 'functionName':
          return s(a.functionName, b.functionName)
        case 'departmentExternName':
          return s(a.departmentExternName, b.departmentExternName)
        case 'mail1':
          return s(a.mail1, b.mail1)
        case 'mail2':
          return s(a.mail2, b.mail2)
        case 'mail3':
          return s(a.mail3, b.mail3)
        case 'generalPhone':
          return s(a.generalPhone, b.generalPhone)
        case 'mobilePhone':
          return s(a.mobilePhone, b.mobilePhone)
        case 'homePhone':
          return s(a.homePhone, b.homePhone)
        case 'birthDate':
          return s(a.birthDate, b.birthDate)
        case 'through':
          return s(a.through, b.through)
        case 'active':
          return n(a.active, b.active)
        case 'infoCorrect':
          return n(a.infoCorrect, b.infoCorrect)
        case 'checkInfo':
          return n(a.checkInfo, b.checkInfo)
        case 'newYearCard':
          return n(a.newYearCard, b.newYearCard)
        case 'newsLetter':
          return n(a.newsLetter, b.newsLetter)
        case 'mailing':
          return n(a.mailing, b.mailing)
        case 'trainingAdvice':
          return n(a.trainingAdvice, b.trainingAdvice)
        case 'contactForTrainingAndAdvice':
          return n(a.contactForTrainingAndAdvice, b.contactForTrainingAndAdvice)
        case 'customerTrainingAndAdvice':
          return n(a.customerTrainingAndAdvice, b.customerTrainingAndAdvice)
        case 'potentialCustomerTrainingAndAdvice':
          return n(a.potentialCustomerTrainingAndAdvice, b.potentialCustomerTrainingAndAdvice)
        case 'potentialTeacherTrainingAndAdvice':
          return n(a.potentialTeacherTrainingAndAdvice, b.potentialTeacherTrainingAndAdvice)
        case 'teacherTrainingAndAdvice':
          return n(a.teacherTrainingAndAdvice, b.teacherTrainingAndAdvice)
        case 'participantTrainingAndAdvice':
          return n(a.participantTrainingAndAdvice, b.participantTrainingAndAdvice)
        case 'createdAt':
          return s(a.createdAt, b.createdAt)
        case 'createdBy':
          return s(a.createdByName, b.createdByName)
        case 'deleted':
          return n(a.deleted, b.deleted)
        default:
          return 0
      }
    })

  async function handleSave(
    c: MappedContact,
    visibilityRows: VisibilityRow[],
    initialCompanyId?: string,
    initialRoleWithCompany?: string,
  ) {
    const core = {
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
    }

    if (editingContact) {
      await updateContactAction({id: c.id, ...core, visibilityForRoles: visibilityRows})
    } else {
      await createContactAction({
        ...core,
        visibilityForRoles: visibilityRows,
        initialCompanyId: initialCompanyId ?? null,
        initialRoleWithCompany: initialRoleWithCompany ?? null,
      })
    }
    setDialogOpen(false)
    router.refresh()
  }

  async function handleSoftDelete(c: MappedContact) {
    await softDeleteContactAction({id: c.id})
    router.refresh()
  }

  async function handleHardDelete(c: MappedContact) {
    await hardDeleteContactAction({id: c.id})
    router.refresh()
  }

  async function handleUndelete(c: MappedContact) {
    await undeleteContactAction({id: c.id})
    router.refresh()
  }

  const showDeletedCols = filterDeleted !== 'not-deleted'
  // base col count: 27 data cols + 1 actions = 28
  const baseColCount = 30
  const colCount = showDeletedCols ? baseColCount + 3 : baseColCount

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, email, phone, source…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border placeholder:text-muted-foreground/60 focus-visible:ring-accent"
            />
          </div>
          <Select value={filterDeleted} onValueChange={v => setFilterDeleted(v as FilterDeleted)}>
            <SelectTrigger className="w-[150px] bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="not-deleted">Not Deleted</SelectItem>
              <SelectItem value="deleted">Deleted Only</SelectItem>
              <SelectItem value="all">Show All</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => {
            setEditingContact(null)
            setDialogOpen(true)
          }}
          className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
          <Plus className="h-4 w-4" />
          New Contact
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <Th field="lastName" label="Last Name" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="firstName" label="First Name" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th
                field="currentCompanyName"
                label="Company"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th
                field="currentRoleWithCompany"
                label="Role at Company"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="titleName" label="Title" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="functionName" label="Function" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th
                field="departmentExternName"
                label="Ext. Dept"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="mail1" label="Email 1" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="mail2" label="Email 2" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="mail3" label="Email 3" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="generalPhone" label="Phone" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="mobilePhone" label="Mobile" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="homePhone" label="Home Phone" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="birthDate" label="Birth Date" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="through" label="Source" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="active" label="Active" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="infoCorrect" label="Info OK" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="checkInfo" label="Check Info" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="newYearCard" label="NY Card" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="newsLetter" label="Newsletter" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="mailing" label="Mailing" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="trainingAdvice" label="T&A" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th
                field="contactForTrainingAndAdvice"
                label="Contact T&A"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th
                field="customerTrainingAndAdvice"
                label="Customer T&A"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th
                field="potentialCustomerTrainingAndAdvice"
                label="Pot. Customer T&A"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th
                field="potentialTeacherTrainingAndAdvice"
                label="Pot. Teacher T&A"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th
                field="teacherTrainingAndAdvice"
                label="Teacher T&A"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th
                field="participantTrainingAndAdvice"
                label="Participant T&A"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="createdAt" label="Created At" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="createdBy" label="Created By" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              {showDeletedCols && (
                <>
                  <Th field="deleted" label="Deleted" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <TableHead className="whitespace-nowrap text-xs">Deleted At</TableHead>
                  <TableHead className="whitespace-nowrap text-xs">Deleted By</TableHead>
                </>
              )}
              <TableHead className="w-24">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="h-32 text-center text-muted-foreground">
                  No contacts found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(c => (
                <TableRow
                  key={c.id}
                  className={`border-border/40 hover:bg-secondary/50 ${c.deleted ? 'opacity-50' : ''}`}>
                  <TableCell className={`${tdClass} text-foreground font-medium`}>
                    <Link
                      href={`/departments/${department}/contact/${c.id}` as Route}
                      className="hover:text-accent hover:underline transition-colors">
                      {c.lastName}
                    </Link>
                  </TableCell>
                  <TableCell className={tdClass}>{c.firstName}</TableCell>
                  <TableCell className={tdClass}>{c.currentCompanyName ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{c.currentRoleWithCompany ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{c.titleName ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{c.functionName ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{c.departmentExternName ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{c.mail1 ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{c.mail2 ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{c.mail3 ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{c.generalPhone ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{c.mobilePhone ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{c.homePhone ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{formatDate(c.birthDate)}</TableCell>
                  <TableCell className={tdClass}>{c.through ?? '-'}</TableCell>
                  <TableCell>
                    <YesNoBadge value={c.active} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={c.infoCorrect} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={c.checkInfo} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={c.newYearCard} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={c.newsLetter} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={c.mailing} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={c.trainingAdvice} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={c.contactForTrainingAndAdvice} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={c.customerTrainingAndAdvice} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={c.potentialCustomerTrainingAndAdvice} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={c.potentialTeacherTrainingAndAdvice} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={c.teacherTrainingAndAdvice} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={c.participantTrainingAndAdvice} />
                  </TableCell>
                  <TableCell className={tdClass}>{formatDate(c.createdAt)}</TableCell>
                  <TableCell className={tdClass}>{c.createdByName}</TableCell>
                  {showDeletedCols && (
                    <>
                      <TableCell>
                        {c.deleted ? (
                          <Badge variant="destructive" className="font-medium">
                            Yes
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No</span>
                        )}
                      </TableCell>
                      <TableCell className={tdClass}>{formatDate(c.deletedAt)}</TableCell>
                      <TableCell className={tdClass}>{c.deletedByName ?? '-'}</TableCell>
                    </>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/departments/${department}/contact/${c.id}` as Route}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10">
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span className="sr-only">
                            View {c.firstName} {c.lastName}
                          </span>
                        </Button>
                      </Link>
                      {!c.deleted && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                            onClick={() => {
                              setEditingContact(c)
                              setDialogOpen(true)
                            }}>
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">
                              Edit {c.firstName} {c.lastName}
                            </span>
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleSoftDelete(c)}>
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="sr-only">
                                Delete {c.firstName} {c.lastName}
                              </span>
                            </Button>
                          )}
                        </>
                      )}
                      {c.deleted && (
                        <>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary px-2"
                              onClick={() => handleUndelete(c)}>
                              Restore
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => handleHardDelete(c)}>
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="sr-only">
                                Permanently delete {c.firstName} {c.lastName}
                              </span>
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-muted-foreground">
        Showing {filtered.length} of {initialContacts.length} contacts
      </div>

      <ContactFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contact={editingContact}
        onSave={handleSave}
        isAdmin={isAdmin}
        roleLevelOptions={roleLevelOptions}
        defaultVisibleRoleNames={defaultVisibleRoleNames}
        functionOptions={functionOptions}
        departmentExternOptions={departmentExternOptions}
        titleOptions={titleOptions}
        companyOptions={companyOptions}
      />
    </div>
  )
}
