'use client'

import {useState} from 'react'
import {Search, Plus, Pencil, ChevronDown, ChevronUp, Trash2, ExternalLink, Check, X, RotateCcw} from 'lucide-react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import type {Route} from 'next'
import {
  addTrainingContactAction,
  updateTrainingContactAction,
  softDeleteTrainingContactAction,
  hardDeleteTrainingContactAction,
  undeleteTrainingContactAction,
} from '@/serverFunctions/training'

type FilterDeleted = 'not-deleted' | 'deleted' | 'all'
type SortField =
  | 'contactName'
  | 'trainingNumber'
  | 'trainingDate'
  | 'standard'
  | 'company'
  | 'attendeeNumber'
  | 'attended'
  | 'succeeded'
  | 'certificateSent'
  | 'certSentDate'
  | 'createdAt'
type SortDir = 'asc' | 'desc'

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function YesNoBadge({value}: {value: boolean}) {
  return value ? (
    <Badge className="bg-accent/15 text-accent border-0 font-medium text-xs">Yes</Badge>
  ) : (
    <Badge variant="secondary" className="text-muted-foreground font-medium text-xs">
      No
    </Badge>
  )
}

export interface MappedTrainingContactRow {
  id: string
  attendeeNumber: string | null
  succeeded: boolean
  attended: boolean
  certificateSent: boolean
  certSentDate: string | null
  createdAt: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedByName: string | null
  contact: {id: string; firstName: string; lastName: string; currentCompanyName: string | null}
  training: {
    id: string
    trainingNumber: string | null
    trainingDate: string
    trainingStandardDescriptionShort: string | null
  }
}

type ContactForm = {
  trainingId: string
  contactId: string
  attended: boolean
  succeeded: boolean
  certificateSent: boolean
  certSentDate: string
}
const emptyForm = (): ContactForm => ({
  trainingId: 'none',
  contactId: 'none',
  attended: false,
  succeeded: false,
  certificateSent: false,
  certSentDate: '',
})
type EditForm = {attended: boolean; succeeded: boolean; certificateSent: boolean; certSentDate: string}

interface TrainingContactTableProps {
  initialTrainingContacts: MappedTrainingContactRow[]
  currentUserRole: string
  currentUserLevel: number
  departmentId: string
  trainingOptions: {id: string; name: string}[]
  contactOptions: {id: string; name: string}[]
}

export function TrainingContactTable({
  initialTrainingContacts,
  currentUserRole,
  currentUserLevel,
  departmentId,
  trainingOptions,
  contactOptions,
}: TrainingContactTableProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  // Level thresholds:
  //   >= 40  can edit + add participants
  //   >= 80  can delete
  const canEdit = currentUserLevel >= 40
  const canDelete = currentUserLevel >= 80

  const [search, setSearch] = useState('')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [sortField, setSortField] = useState<SortField>('trainingDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [addingRow, setAddingRow] = useState(false)
  const [addForm, setAddForm] = useState<ContactForm>(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({
    attended: false,
    succeeded: false,
    certificateSent: false,
    certSentDate: '',
  })

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const SortIcon = ({field}: {field: SortField}) => {
    if (sortField !== field) return null
    return sortDir === 'asc' ? (
      <ChevronUp className="inline h-3.5 w-3.5 ml-1" />
    ) : (
      <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
    )
  }

  const filtered = initialTrainingContacts
    .filter(tc => {
      if (filterDeleted === 'not-deleted' && tc.deleted) return false
      if (filterDeleted === 'deleted' && !tc.deleted) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        `${tc.contact.lastName} ${tc.contact.firstName}`.toLowerCase().includes(q) ||
        (tc.training.trainingNumber?.toLowerCase().includes(q) ?? false) ||
        (tc.training.trainingStandardDescriptionShort?.toLowerCase().includes(q) ?? false) ||
        (tc.contact.currentCompanyName?.toLowerCase().includes(q) ?? false) ||
        (tc.attendeeNumber?.toLowerCase().includes(q) ?? false)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const s = (x: string | null, y: string | null) => dir * (x ?? '').localeCompare(y ?? '')
      const n = (x: boolean, y: boolean) => dir * (Number(x) - Number(y))
      switch (sortField) {
        case 'contactName':
          return s(`${a.contact.lastName} ${a.contact.firstName}`, `${b.contact.lastName} ${b.contact.firstName}`)
        case 'trainingNumber':
          return s(a.training.trainingNumber, b.training.trainingNumber)
        case 'trainingDate':
          return s(a.training.trainingDate, b.training.trainingDate)
        case 'standard':
          return s(a.training.trainingStandardDescriptionShort, b.training.trainingStandardDescriptionShort)
        case 'company':
          return s(a.contact.currentCompanyName, b.contact.currentCompanyName)
        case 'attendeeNumber':
          return s(a.attendeeNumber, b.attendeeNumber)
        case 'attended':
          return n(a.attended, b.attended)
        case 'succeeded':
          return n(a.succeeded, b.succeeded)
        case 'certificateSent':
          return n(a.certificateSent, b.certificateSent)
        case 'certSentDate':
          return s(a.certSentDate, b.certSentDate)
        case 'createdAt':
          return s(a.createdAt, b.createdAt)
        default:
          return 0
      }
    })

  const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
  const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'
  const showDeletedCols = filterDeleted !== 'not-deleted'

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contact, training, company…"
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
        {canEdit && (
          <Button
            onClick={() => {
              setAddingRow(true)
              setAddForm(emptyForm())
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
            <Plus className="h-4 w-4" /> Add Participant
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className={thClass} onClick={() => toggleSort('contactName')}>
                Contact <SortIcon field="contactName" />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('company')}>
                Company <SortIcon field="company" />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('trainingNumber')}>
                Training # <SortIcon field="trainingNumber" />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('trainingDate')}>
                Date <SortIcon field="trainingDate" />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('standard')}>
                Standard <SortIcon field="standard" />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('attendeeNumber')}>
                Attendee # <SortIcon field="attendeeNumber" />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('attended')}>
                Attended <SortIcon field="attended" />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('succeeded')}>
                Succeeded <SortIcon field="succeeded" />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('certificateSent')}>
                Cert. Sent <SortIcon field="certificateSent" />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('certSentDate')}>
                Cert. Date <SortIcon field="certSentDate" />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('createdAt')}>
                Created At <SortIcon field="createdAt" />
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs">Created By</TableHead>
              {showDeletedCols && (
                <>
                  <TableHead className="whitespace-nowrap text-xs">Deleted</TableHead>
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
            {/* Add row */}
            {addingRow && (
              <TableRow className="border-border/40 bg-secondary/30">
                <TableCell>
                  <Select value={addForm.contactId} onValueChange={v => setAddForm(f => ({...f, contactId: v}))}>
                    <SelectTrigger className="h-7 text-xs bg-background border-border">
                      <SelectValue placeholder="Select contact…" />
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
                <TableCell />
                <TableCell colSpan={2}>
                  <Select value={addForm.trainingId} onValueChange={v => setAddForm(f => ({...f, trainingId: v}))}>
                    <SelectTrigger className="h-7 text-xs bg-background border-border">
                      <SelectValue placeholder="Select training…" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {trainingOptions.map(o => (
                        <SelectItem key={o.id} value={o.id} className="text-xs">
                          {o.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex h-7 items-center px-2 text-xs text-muted-foreground/60 italic">
                    Auto-generated
                  </div>
                </TableCell>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={addForm.attended}
                    onChange={e => setAddForm(f => ({...f, attended: e.target.checked}))}
                    className="h-3.5 w-3.5 accent-accent"
                  />
                </TableCell>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={addForm.succeeded}
                    onChange={e => setAddForm(f => ({...f, succeeded: e.target.checked}))}
                    className="h-3.5 w-3.5 accent-accent"
                  />
                </TableCell>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={addForm.certificateSent}
                    onChange={e => setAddForm(f => ({...f, certificateSent: e.target.checked}))}
                    className="h-3.5 w-3.5 accent-accent"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={addForm.certSentDate}
                    onChange={e => setAddForm(f => ({...f, certSentDate: e.target.value}))}
                    className="h-7 text-xs bg-background border-border"
                  />
                </TableCell>
                <TableCell />
                <TableCell />
                {showDeletedCols && (
                  <>
                    <TableCell />
                    <TableCell />
                    <TableCell />
                  </>
                )}
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-accent hover:bg-accent/10"
                      disabled={addForm.trainingId === 'none' || addForm.contactId === 'none'}
                      onClick={async () => {
                        if (addForm.trainingId === 'none' || addForm.contactId === 'none') return
                        await addTrainingContactAction({
                          trainingId: addForm.trainingId,
                          contactId: addForm.contactId,
                          attended: addForm.attended,
                          succeeded: addForm.succeeded,
                          certificateSent: addForm.certificateSent,
                          certSentDate: addForm.certSentDate ? new Date(addForm.certSentDate) : null,
                        })
                        setAddingRow(false)
                        router.refresh()
                      }}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:bg-secondary"
                      onClick={() => setAddingRow(false)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {filtered.length === 0 && !addingRow ? (
              <TableRow>
                <TableCell colSpan={showDeletedCols ? 16 : 13} className="h-32 text-center text-muted-foreground">
                  No training contacts found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(tc => {
                const isEditingThis = editingId === tc.id
                return (
                  <TableRow
                    key={tc.id}
                    className={`border-border/40 hover:bg-secondary/50 ${tc.deleted ? 'opacity-50' : ''}`}>
                    {isEditingThis ? (
                      <>
                        <TableCell className="text-sm text-foreground font-medium">
                          {tc.contact.lastName} {tc.contact.firstName}
                        </TableCell>
                        <TableCell className={tdClass}>{tc.contact.currentCompanyName ?? '-'}</TableCell>
                        <TableCell className={tdClass}>{tc.training.trainingNumber ?? '-'}</TableCell>
                        <TableCell className={tdClass}>{formatDate(tc.training.trainingDate)}</TableCell>
                        <TableCell className={tdClass}>{tc.training.trainingStandardDescriptionShort ?? '-'}</TableCell>
                        <TableCell className={tdClass}>{tc.attendeeNumber ?? '-'}</TableCell>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={editForm.attended}
                            onChange={e => setEditForm(f => ({...f, attended: e.target.checked}))}
                            className="h-3.5 w-3.5 accent-accent"
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={editForm.succeeded}
                            onChange={e => setEditForm(f => ({...f, succeeded: e.target.checked}))}
                            className="h-3.5 w-3.5 accent-accent"
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={editForm.certificateSent}
                            onChange={e => setEditForm(f => ({...f, certificateSent: e.target.checked}))}
                            className="h-3.5 w-3.5 accent-accent"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={editForm.certSentDate}
                            onChange={e => setEditForm(f => ({...f, certSentDate: e.target.value}))}
                            className="h-7 text-xs bg-background border-border"
                          />
                        </TableCell>
                        <TableCell className={tdClass}>{formatDate(tc.createdAt)}</TableCell>
                        <TableCell className={tdClass}>{tc.createdByName}</TableCell>
                        {showDeletedCols && (
                          <>
                            <TableCell />
                            <TableCell />
                            <TableCell />
                          </>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-accent hover:bg-accent/10"
                              onClick={async () => {
                                await updateTrainingContactAction({
                                  id: tc.id,
                                  attended: editForm.attended,
                                  succeeded: editForm.succeeded,
                                  certificateSent: editForm.certificateSent,
                                  certSentDate: editForm.certSentDate ? new Date(editForm.certSentDate) : null,
                                })
                                setEditingId(null)
                                router.refresh()
                              }}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:bg-secondary"
                              onClick={() => setEditingId(null)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className={`${tdClass} text-foreground font-medium`}>
                          <Link
                            href={`/departments/${departmentId}/contact/${tc.contact.id}` as Route}
                            className="hover:text-accent hover:underline transition-colors">
                            {tc.contact.lastName} {tc.contact.firstName}
                          </Link>
                        </TableCell>
                        <TableCell className={tdClass}>{tc.contact.currentCompanyName ?? '-'}</TableCell>
                        <TableCell className={`${tdClass} text-foreground font-medium`}>
                          <Link
                            href={`/departments/${departmentId}/course/${tc.training.id}` as Route}
                            className="hover:text-accent hover:underline transition-colors">
                            {tc.training.trainingNumber ?? '-'}
                          </Link>
                        </TableCell>
                        <TableCell className={tdClass}>{formatDate(tc.training.trainingDate)}</TableCell>
                        <TableCell className={tdClass}>{tc.training.trainingStandardDescriptionShort ?? '-'}</TableCell>
                        <TableCell className={tdClass}>{tc.attendeeNumber ?? '-'}</TableCell>
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
                        <TableCell className={tdClass}>{formatDate(tc.createdAt)}</TableCell>
                        <TableCell className={tdClass}>{tc.createdByName}</TableCell>
                        {showDeletedCols && (
                          <>
                            <TableCell>
                              {tc.deleted ? (
                                <Badge variant="destructive" className="text-xs">
                                  Yes
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">No</span>
                              )}
                            </TableCell>
                            <TableCell className={tdClass}>{formatDate(tc.deletedAt)}</TableCell>
                            <TableCell className={tdClass}>{tc.deletedByName ?? '-'}</TableCell>
                          </>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Link href={`/departments/${departmentId}/course/${tc.training.id}` as Route}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            {tc.deleted ? (
                              <>
                                {canEdit && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                    onClick={async () => {
                                      await undeleteTrainingContactAction({id: tc.id})
                                      router.refresh()
                                    }}>
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    <span className="sr-only">Restore {tc.contact.lastName} {tc.contact.firstName}</span>
                                  </Button>
                                )}
                                {isAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                    onClick={async () => {
                                      await hardDeleteTrainingContactAction({id: tc.id})
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
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                    onClick={() => {
                                      setEditingId(tc.id)
                                      setEditForm({
                                        attended: tc.attended,
                                        succeeded: tc.succeeded,
                                        certificateSent: tc.certificateSent,
                                        certSentDate: tc.certSentDate ? tc.certSentDate.slice(0, 10) : '',
                                      })
                                    }}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                {canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={async () => {
                                      await softDeleteTrainingContactAction({id: tc.id})
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

      <div className="text-xs text-muted-foreground">
        Showing {filtered.length} of {initialTrainingContacts.length} participants
      </div>
    </div>
  )
}
