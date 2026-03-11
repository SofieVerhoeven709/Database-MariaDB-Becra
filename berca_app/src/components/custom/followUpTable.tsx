'use client'

import {useState} from 'react'
import {Search, Plus, Pencil, ChevronDown, ChevronUp, Trash2, ExternalLink} from 'lucide-react'
import {FollowUpFormDialog} from '@/components/custom/followUpFormDialog'
import type {VisibilityRow} from '@/components/custom/visibilityForRoleTab'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import type {MappedFollowUp} from '@/types/followUp'
import type {RoleLevelOption} from '@/types/roleLevel'
import {
  createFollowUpAction,
  updateFollowUpAction,
  softDeleteFollowUpAction,
  hardDeleteFollowUpAction,
  undeleteFollowUpAction,
} from '@/serverFunctions/followUps'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import type {Route} from 'next'

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField =
  | 'activityDescription'
  | 'actionAgenda'
  | 'closedAgenda'
  | 'followUpTypeName'
  | 'statusName'
  | 'urgencyTypeName'
  | 'ownedByName'
  | 'executedByName'
  | 'targetTypeName'
  | 'itemClosed'
  | 'salesFollowUp'
  | 'nonConform'
  | 'periodicControl'
  | 'recurringActive'
  | 'review'
  | 'createdAt'
  | 'createdByName'
  | 'deleted'

type SortDir = 'asc' | 'desc'
type FilterDeleted = 'not-deleted' | 'deleted' | 'all'

interface SelectOption {
  id: string
  name: string
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

function SortIcon({field, sortField, sortDir}: {field: SortField; sortField: SortField; sortDir: SortDir}) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? (
    <ChevronUp className="inline h-3.5 w-3.5 ml-1" />
  ) : (
    <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface FollowUpTableProps {
  initialFollowUps: MappedFollowUp[]
  currentUserRole: string
  currentUserLevel: number
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  department: string
  statusOptions: SelectOption[]
  urgencyTypeOptions: SelectOption[]
  followUpTypeOptions: SelectOption[]
  employeeOptions: SelectOption[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FollowUpTable({
  initialFollowUps,
  currentUserRole,
  currentUserLevel,
  roleLevelOptions,
  defaultVisibleRoleNames,
  department,
  statusOptions,
  urgencyTypeOptions,
  followUpTypeOptions,
  employeeOptions,
}: FollowUpTableProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canDelete = currentUserRole === 'Administrator' || currentUserLevel >= 80
  const canEdit = currentUserLevel >= 20

  const [search, setSearch] = useState('')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFollowUp, setEditingFollowUp] = useState<MappedFollowUp | null>(null)

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  // ─── Filter + sort ─────────────────────────────────────────────────────────

  const filtered = initialFollowUps
    .filter(f => {
      if (filterDeleted === 'not-deleted' && f.deleted) return false
      if (filterDeleted === 'deleted' && !f.deleted) return false
      if (filterType !== 'all' && f.followUpTypeId !== filterType) return false
      if (filterStatus !== 'all' && f.statusId !== filterStatus) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        (f.activityDescription?.toLowerCase().includes(q) ?? false) ||
        f.ownedByName.toLowerCase().includes(q) ||
        f.executedByName.toLowerCase().includes(q) ||
        f.statusName.toLowerCase().includes(q) ||
        f.followUpTypeName.toLowerCase().includes(q) ||
        f.urgencyTypeName.toLowerCase().includes(q) ||
        (f.targetTypeName?.toLowerCase().includes(q) ?? false)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const s = (x: string | null, y: string | null) => dir * (x ?? '').localeCompare(y ?? '')
      const n = (x: boolean, y: boolean) => dir * (Number(x) - Number(y))
      switch (sortField) {
        case 'activityDescription':
          return s(a.activityDescription, b.activityDescription)
        case 'actionAgenda':
          return s(a.actionAgenda, b.actionAgenda)
        case 'closedAgenda':
          return s(a.closedAgenda, b.closedAgenda)
        case 'followUpTypeName':
          return s(a.followUpTypeName, b.followUpTypeName)
        case 'statusName':
          return s(a.statusName, b.statusName)
        case 'urgencyTypeName':
          return s(a.urgencyTypeName, b.urgencyTypeName)
        case 'ownedByName':
          return s(a.ownedByName, b.ownedByName)
        case 'executedByName':
          return s(a.executedByName, b.executedByName)
        case 'targetTypeName':
          return s(a.targetTypeName, b.targetTypeName)
        case 'itemClosed':
          return n(a.itemClosed, b.itemClosed)
        case 'salesFollowUp':
          return n(a.salesFollowUp, b.salesFollowUp)
        case 'nonConform':
          return n(a.nonConform, b.nonConform)
        case 'periodicControl':
          return n(a.periodicControl, b.periodicControl)
        case 'recurringActive':
          return n(a.recurringActive, b.recurringActive)
        case 'review':
          return n(a.review, b.review)
        case 'createdAt':
          return s(a.createdAt, b.createdAt)
        case 'createdByName':
          return s(a.createdByName, b.createdByName)
        case 'deleted':
          return n(a.deleted, b.deleted)
        default:
          return 0
      }
    })

  // ─── Save handler ──────────────────────────────────────────────────────────

  async function handleSave(f: MappedFollowUp, visibilityRows: VisibilityRow[]) {
    const core = {
      activityDescription: f.activityDescription,
      additionalInfo: f.additionalInfo,
      actionAgenda: f.actionAgenda ? new Date(f.actionAgenda) : null,
      closedAgenda: f.closedAgenda ? new Date(f.closedAgenda) : null,
      recurringCallDays: f.recurringCallDays,
      itemClosed: f.itemClosed,
      salesFollowUp: f.salesFollowUp,
      nonConform: f.nonConform,
      periodicControl: f.periodicControl,
      recurringActive: f.recurringActive,
      review: f.review,
      ownedBy: f.ownedBy,
      executedBy: f.executedBy,
      statusId: f.statusId,
      urgencyTypeId: f.urgencyTypeId,
      followUpTypeId: f.followUpTypeId,
    }

    if (editingFollowUp) {
      await updateFollowUpAction({id: f.id, ...core, visibilityForRoles: visibilityRows})
    } else {
      await createFollowUpAction({...core, visibilityForRoles: visibilityRows})
    }
    setDialogOpen(false)
    router.refresh()
  }

  const showDeletedCols = filterDeleted !== 'not-deleted'
  const baseColCount = 19
  const colCount = showDeletedCols ? baseColCount + 3 : baseColCount

  return (
    <div className="flex flex-col gap-6">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1 flex-wrap">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search description, owner, status…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border placeholder:text-muted-foreground/60 focus-visible:ring-accent"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px] bg-secondary border-border">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Types</SelectItem>
              {followUpTypeOptions.map(o => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px] bg-secondary border-border">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Statuses</SelectItem>
              {statusOptions.map(o => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              setEditingFollowUp(null)
              setDialogOpen(true)
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
            <Plus className="h-4 w-4" />
            New Follow-up
          </Button>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <Th
                field="activityDescription"
                label="Description"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="followUpTypeName" label="Type" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="statusName" label="Status" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="urgencyTypeName" label="Urgency" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th
                field="targetTypeName"
                label="Target Type"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="ownedByName" label="Owned By" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th
                field="executedByName"
                label="Executed By"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th
                field="actionAgenda"
                label="Action Agenda"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th
                field="closedAgenda"
                label="Closed Agenda"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="itemClosed" label="Closed" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="salesFollowUp" label="Sales" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="nonConform" label="Non-conform" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th
                field="periodicControl"
                label="Periodic"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th
                field="recurringActive"
                label="Recurring"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="review" label="Review" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="createdAt" label="Created At" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th
                field="createdByName"
                label="Created By"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
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
                  No follow-ups found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(f => (
                <TableRow
                  key={f.id}
                  className={`border-border/40 hover:bg-secondary/50 ${f.deleted ? 'opacity-50' : ''}`}>
                  <TableCell className="text-sm text-foreground font-medium max-w-xs">
                    <p className="truncate max-w-[220px]" title={f.activityDescription ?? ''}>
                      {f.activityDescription ?? '-'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-border text-muted-foreground font-normal">
                      {f.followUpTypeName}
                    </Badge>
                  </TableCell>
                  <TableCell className={tdClass}>{f.statusName}</TableCell>
                  <TableCell className={tdClass}>{f.urgencyTypeName}</TableCell>
                  <TableCell className={tdClass}>{f.targetTypeName ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{f.ownedByName}</TableCell>
                  <TableCell className={tdClass}>{f.executedByName}</TableCell>
                  <TableCell className={tdClass}>{formatDate(f.actionAgenda)}</TableCell>
                  <TableCell className={tdClass}>{formatDate(f.closedAgenda)}</TableCell>
                  <TableCell>
                    <YesNoBadge value={f.itemClosed} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={f.salesFollowUp} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={f.nonConform} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={f.periodicControl} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={f.recurringActive} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={f.review} />
                  </TableCell>
                  <TableCell className={tdClass}>{formatDate(f.createdAt)}</TableCell>
                  <TableCell className={tdClass}>{f.createdByName}</TableCell>
                  {showDeletedCols && (
                    <>
                      <TableCell>
                        {f.deleted ? (
                          <Badge variant="destructive" className="font-medium">
                            Yes
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No</span>
                        )}
                      </TableCell>
                      <TableCell className={tdClass}>{formatDate(f.deletedAt)}</TableCell>
                      <TableCell className={tdClass}>{f.deletedByName ?? '-'}</TableCell>
                    </>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/departments/${department}/followup/${f.id}` as Route}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10">
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span className="sr-only">View follow-up</span>
                        </Button>
                      </Link>
                      {!f.deleted && canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          onClick={() => {
                            setEditingFollowUp(f)
                            setDialogOpen(true)
                          }}>
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="sr-only">Edit follow-up</span>
                        </Button>
                      )}
                      {!f.deleted && canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={async () => {
                            await softDeleteFollowUpAction({id: f.id})
                            router.refresh()
                          }}>
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete follow-up</span>
                        </Button>
                      )}
                      {f.deleted && canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary px-2"
                          onClick={async () => {
                            await undeleteFollowUpAction({id: f.id})
                            router.refresh()
                          }}>
                          Restore
                        </Button>
                      )}
                      {f.deleted && isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={async () => {
                            await hardDeleteFollowUpAction({id: f.id})
                            router.refresh()
                          }}>
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Permanently delete follow-up</span>
                        </Button>
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
        Showing {filtered.length} of {initialFollowUps.length} follow-ups
      </div>

      <FollowUpFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        followUp={editingFollowUp}
        onSave={handleSave}
        isAdmin={isAdmin}
        roleLevelOptions={roleLevelOptions}
        defaultVisibleRoleNames={defaultVisibleRoleNames}
        statusOptions={statusOptions}
        urgencyTypeOptions={urgencyTypeOptions}
        followUpTypeOptions={followUpTypeOptions}
        employeeOptions={employeeOptions}
      />
    </div>
  )
}
