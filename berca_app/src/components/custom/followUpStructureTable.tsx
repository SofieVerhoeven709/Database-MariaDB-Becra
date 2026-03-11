'use client'

import {useState} from 'react'
import {Search, Plus, Pencil, ChevronDown, ChevronUp, Trash2, ExternalLink} from 'lucide-react'
import {FollowUpStructureFormDialog} from '@/components/custom/followUpStructureFormDialog'
import type {VisibilityRow} from '@/components/custom/visibilityForRoleTab'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import type {MappedFollowUpStructure} from '@/types/followUpStructure'
import type {RoleLevelOption} from '@/types/roleLevel'
import {
  createFollowUpStructureAction,
  updateFollowUpStructureAction,
  softDeleteFollowUpStructureAction,
  hardDeleteFollowUpStructureAction,
  undeleteFollowUpStructureAction,
} from '@/serverFunctions/followUpStructures'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import type {Route} from 'next'

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField =
  | 'contactDate'
  | 'item'
  | 'activityDescription'
  | 'taskDescription'
  | 'statusName'
  | 'urgencyTypeName'
  | 'contactName'
  | 'ownedByName'
  | 'executedByName'
  | 'taskForName'
  | 'actionAgenda'
  | 'closedAgenda'
  | 'taskStartDate'
  | 'taskCompleteDate'
  | 'recurringActive'
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

interface FollowUpStructureTableProps {
  initialStructures: MappedFollowUpStructure[]
  currentUserRole: string
  currentUserLevel: number
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  department: string
  statusOptions: SelectOption[]
  urgencyTypeOptions: SelectOption[]
  employeeOptions: SelectOption[]
  contactOptions: SelectOption[]
  followUpOptions: SelectOption[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FollowUpStructureTable({
  initialStructures,
  currentUserRole,
  currentUserLevel,
  roleLevelOptions,
  defaultVisibleRoleNames,
  department,
  statusOptions,
  urgencyTypeOptions,
  employeeOptions,
  contactOptions,
  followUpOptions,
}: FollowUpStructureTableProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canDelete = currentUserRole === 'Administrator' || currentUserLevel >= 80
  const canEdit = currentUserLevel >= 20

  const [search, setSearch] = useState('')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('contactDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStructure, setEditingStructure] = useState<MappedFollowUpStructure | null>(null)

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  // ─── Filter + sort ─────────────────────────────────────────────────────────

  const filtered = initialStructures
    .filter(s => {
      if (filterDeleted === 'not-deleted' && s.deleted) return false
      if (filterDeleted === 'deleted' && !s.deleted) return false
      if (filterStatus !== 'all' && s.statusId !== filterStatus) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        (s.activityDescription?.toLowerCase().includes(q) ?? false) ||
        (s.item?.toLowerCase().includes(q) ?? false) ||
        (s.taskDescription?.toLowerCase().includes(q) ?? false) ||
        s.contactName.toLowerCase().includes(q) ||
        s.ownedByName.toLowerCase().includes(q) ||
        s.taskForName.toLowerCase().includes(q) ||
        s.statusName.toLowerCase().includes(q) ||
        s.urgencyTypeName.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const s = (x: string | null, y: string | null) => dir * (x ?? '').localeCompare(y ?? '')
      const n = (x: boolean, y: boolean) => dir * (Number(x) - Number(y))
      switch (sortField) {
        case 'contactDate':
          return s(a.contactDate, b.contactDate)
        case 'item':
          return s(a.item, b.item)
        case 'activityDescription':
          return s(a.activityDescription, b.activityDescription)
        case 'taskDescription':
          return s(a.taskDescription, b.taskDescription)
        case 'statusName':
          return s(a.statusName, b.statusName)
        case 'urgencyTypeName':
          return s(a.urgencyTypeName, b.urgencyTypeName)
        case 'contactName':
          return s(a.contactName, b.contactName)
        case 'ownedByName':
          return s(a.ownedByName, b.ownedByName)
        case 'executedByName':
          return s(a.executedByName, b.executedByName)
        case 'taskForName':
          return s(a.taskForName, b.taskForName)
        case 'actionAgenda':
          return s(a.actionAgenda, b.actionAgenda)
        case 'closedAgenda':
          return s(a.closedAgenda, b.closedAgenda)
        case 'taskStartDate':
          return s(a.taskStartDate, b.taskStartDate)
        case 'taskCompleteDate':
          return s(a.taskCompleteDate, b.taskCompleteDate)
        case 'recurringActive':
          return n(a.recurringActive, b.recurringActive)
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

  async function handleSave(s: MappedFollowUpStructure, visibilityRows: VisibilityRow[]) {
    const core = {
      activityDescription: s.activityDescription,
      additionalInfo: s.additionalInfo,
      actionAgenda: s.actionAgenda ? new Date(s.actionAgenda) : null,
      closedAgenda: s.closedAgenda ? new Date(s.closedAgenda) : null,
      recurringItem: s.recurringItem,
      item: s.item,
      contactDate: new Date(s.contactDate),
      taskDescription: s.taskDescription,
      taskStartDate: s.taskStartDate ? new Date(s.taskStartDate) : null,
      taskCompleteDate: s.taskCompleteDate ? new Date(s.taskCompleteDate) : null,
      recurringActive: s.recurringActive,
      ownedBy: s.ownedBy,
      executedBy: s.executedBy,
      taskFor: s.taskFor,
      statusId: s.statusId,
      urgencyTypeId: s.urgencyTypeId,
      followUpId: s.followUpId,
      contactId: s.contactId,
    }

    if (editingStructure) {
      await updateFollowUpStructureAction({id: s.id, ...core, visibilityForRoles: visibilityRows})
    } else {
      await createFollowUpStructureAction({...core, visibilityForRoles: visibilityRows})
    }
    setDialogOpen(false)
    router.refresh()
  }

  const showDeletedCols = filterDeleted !== 'not-deleted'
  const baseColCount = 18
  const colCount = showDeletedCols ? baseColCount + 3 : baseColCount

  return (
    <div className="flex flex-col gap-6">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1 flex-wrap">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search item, contact, task…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border placeholder:text-muted-foreground/60 focus-visible:ring-accent"
            />
          </div>
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
              setEditingStructure(null)
              setDialogOpen(true)
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
            <Plus className="h-4 w-4" />
            New Entry
          </Button>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <Th
                field="contactDate"
                label="Contact Date"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="item" label="Item" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th
                field="activityDescription"
                label="Activity"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="taskDescription" label="Task" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="contactName" label="Contact" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="statusName" label="Status" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="urgencyTypeName" label="Urgency" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="ownedByName" label="Owned By" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th
                field="executedByName"
                label="Executed By"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="taskForName" label="Task For" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
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
              <Th
                field="taskStartDate"
                label="Task Start"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th
                field="taskCompleteDate"
                label="Task Complete"
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
                  No follow-up entries found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(s => (
                <TableRow
                  key={s.id}
                  className={`border-border/40 hover:bg-secondary/50 ${s.deleted ? 'opacity-50' : ''}`}>
                  <TableCell className={`${tdClass} text-foreground font-medium`}>
                    <Link
                      href={`/departments/${department}/followupstructure/${s.id}` as Route}
                      className="hover:text-accent hover:underline transition-colors">
                      {formatDate(s.contactDate)}
                    </Link>
                  </TableCell>
                  <TableCell className={tdClass}>{s.item ?? '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs">
                    <p className="truncate max-w-[180px]" title={s.activityDescription ?? ''}>
                      {s.activityDescription ?? '-'}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs">
                    <p className="truncate max-w-[180px]" title={s.taskDescription ?? ''}>
                      {s.taskDescription ?? '-'}
                    </p>
                  </TableCell>
                  <TableCell className={tdClass}>{s.contactName}</TableCell>
                  <TableCell className={tdClass}>{s.statusName}</TableCell>
                  <TableCell className={tdClass}>{s.urgencyTypeName}</TableCell>
                  <TableCell className={tdClass}>{s.ownedByName}</TableCell>
                  <TableCell className={tdClass}>{s.executedByName}</TableCell>
                  <TableCell className={tdClass}>{s.taskForName}</TableCell>
                  <TableCell className={tdClass}>{formatDate(s.actionAgenda)}</TableCell>
                  <TableCell className={tdClass}>{formatDate(s.closedAgenda)}</TableCell>
                  <TableCell className={tdClass}>{formatDate(s.taskStartDate)}</TableCell>
                  <TableCell className={tdClass}>{formatDate(s.taskCompleteDate)}</TableCell>
                  <TableCell>
                    <YesNoBadge value={s.recurringActive} />
                  </TableCell>
                  <TableCell className={tdClass}>{formatDate(s.createdAt)}</TableCell>
                  <TableCell className={tdClass}>{s.createdByName}</TableCell>
                  {showDeletedCols && (
                    <>
                      <TableCell>
                        {s.deleted ? (
                          <Badge variant="destructive" className="font-medium">
                            Yes
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No</span>
                        )}
                      </TableCell>
                      <TableCell className={tdClass}>{formatDate(s.deletedAt)}</TableCell>
                      <TableCell className={tdClass}>{s.deletedByName ?? '-'}</TableCell>
                    </>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/departments/${department}/followupstructure/${s.id}` as Route}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10">
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span className="sr-only">View entry</span>
                        </Button>
                      </Link>
                      {!s.deleted && canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          onClick={() => {
                            setEditingStructure(s)
                            setDialogOpen(true)
                          }}>
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="sr-only">Edit entry</span>
                        </Button>
                      )}
                      {!s.deleted && canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={async () => {
                            await softDeleteFollowUpStructureAction({id: s.id})
                            router.refresh()
                          }}>
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete entry</span>
                        </Button>
                      )}
                      {s.deleted && canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary px-2"
                          onClick={async () => {
                            await undeleteFollowUpStructureAction({id: s.id})
                            router.refresh()
                          }}>
                          Restore
                        </Button>
                      )}
                      {s.deleted && isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={async () => {
                            await hardDeleteFollowUpStructureAction({id: s.id})
                            router.refresh()
                          }}>
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Permanently delete entry</span>
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
        Showing {filtered.length} of {initialStructures.length} entries
      </div>

      <FollowUpStructureFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        structure={editingStructure}
        onSave={handleSave}
        isAdmin={isAdmin}
        roleLevelOptions={roleLevelOptions}
        defaultVisibleRoleNames={defaultVisibleRoleNames}
        statusOptions={statusOptions}
        urgencyTypeOptions={urgencyTypeOptions}
        employeeOptions={employeeOptions}
        contactOptions={contactOptions}
        followUpOptions={followUpOptions}
      />
    </div>
  )
}
