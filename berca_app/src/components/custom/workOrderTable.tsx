'use client'

import {useState} from 'react'
import {Search, Plus, Pencil, ChevronDown, ChevronUp, Trash2, ExternalLink} from 'lucide-react'
import {WorkOrderFormDialog} from '@/components/custom/workOrderFormDialog'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import type {Route} from 'next'
import type {MappedWorkOrder} from '@/types/workOrder'
import {
  softDeleteWorkOrderAction,
  hardDeleteWorkOrderAction,
  undeleteWorkOrderAction,
} from '@/serverFunctions/workOrders'

type SortField =
  | 'workOrderNumber'
  | 'description'
  | 'additionalInfo'
  | 'startDate'
  | 'endDate'
  | 'hoursMaterialClosed'
  | 'invoiceSent'
  | 'completed'
  | 'createdAt'
  | 'createdBy'
  | 'deleted'

type SortDir = 'asc' | 'desc'
type FilterDeleted = 'not-deleted' | 'deleted' | 'all'

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

interface WorkOrderTableProps {
  initialWorkOrders: MappedWorkOrder[]
  currentUserRole: string
  currentUserLevel: number
  projectOptions: {id: string; name: string}[]
  department: string
}

export function WorkOrderTable({
  initialWorkOrders,
  currentUserRole,
  currentUserLevel,
  projectOptions,
  department,
}: WorkOrderTableProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canDelete = currentUserRole === 'Administrator' || currentUserLevel >= 80

  const [search, setSearch] = useState('')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [sortField, setSortField] = useState<SortField>('workOrderNumber')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingWorkOrder, setEditingWorkOrder] = useState<MappedWorkOrder | null>(null)

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filtered = initialWorkOrders
    .filter(w => {
      if (filterDeleted === 'not-deleted' && w.deleted) return false
      if (filterDeleted === 'deleted' && !w.deleted) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        w.workOrderNumber?.toLowerCase().includes(q) ||
        w.description?.toLowerCase().includes(q) ||
        w.additionalInfo?.toLowerCase().includes(q) ||
        w.projectNumber?.toLowerCase().includes(q) ||
        w.createdByName?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const s = (x: string | null, y: string | null) => dir * (x ?? '').localeCompare(y ?? '')
      const n = (x: boolean, y: boolean) => dir * (Number(x) - Number(y))
      switch (sortField) {
        case 'workOrderNumber':
          return s(a.workOrderNumber, b.workOrderNumber)
        case 'description':
          return s(a.description, b.description)
        case 'additionalInfo':
          return s(a.additionalInfo, b.additionalInfo)
        case 'startDate':
          return s(a.startDate, b.startDate)
        case 'endDate':
          return s(a.endDate, b.endDate)
        case 'hoursMaterialClosed':
          return n(a.hoursMaterialClosed, b.hoursMaterialClosed)
        case 'invoiceSent':
          return n(a.invoiceSent, b.invoiceSent)
        case 'completed':
          return n(a.completed, b.completed)
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

  async function handleSoftDelete(w: MappedWorkOrder) {
    await softDeleteWorkOrderAction({id: w.id})
    router.refresh()
  }

  async function handleHardDelete(w: MappedWorkOrder) {
    await hardDeleteWorkOrderAction({id: w.id})
    router.refresh()
  }

  async function handleUndelete(w: MappedWorkOrder) {
    await undeleteWorkOrderAction({id: w.id})
    router.refresh()
  }

  const showDeletedCols = filterDeleted !== 'not-deleted'
  const colCount = showDeletedCols ? 15 : 12

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search work order, project, description…"
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
        {canDelete && (
          <Button
            onClick={() => {
              setEditingWorkOrder(null)
              setDialogOpen(true)
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
            <Plus className="h-4 w-4" />
            New Work Order
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <Th
                field="workOrderNumber"
                label="WO Number"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <TableHead className="whitespace-nowrap text-xs">Project</TableHead>
              <Th field="description" label="Description" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th
                field="additionalInfo"
                label="Additional Info"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="startDate" label="Start Date" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="endDate" label="End Date" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th
                field="hoursMaterialClosed"
                label="Hrs/Mat Closed"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th
                field="invoiceSent"
                label="Invoice Sent"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="completed" label="Completed" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
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
                  No work orders found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(w => (
                <TableRow
                  key={w.id}
                  className={`border-border/40 hover:bg-secondary/50 ${w.deleted ? 'opacity-50' : ''}`}>
                  <TableCell className={`${tdClass} text-foreground font-medium`}>
                    <Link
                      href={`/departments/${department}/workOrder/${w.id}` as Route}
                      className="hover:text-accent hover:underline transition-colors">
                      {w.workOrderNumber ?? '-'}
                    </Link>
                  </TableCell>
                  <TableCell className={tdClass}>
                    <Link
                      href={`/departments/project/project/${w.projectId}` as Route}
                      className="hover:text-accent hover:underline transition-colors">
                      {w.projectNumber}
                    </Link>
                  </TableCell>
                  <TableCell className={tdClass}>
                    <span className="max-w-[180px] truncate inline-block">{w.description ?? '-'}</span>
                  </TableCell>
                  <TableCell className={tdClass}>
                    <span className="max-w-[180px] truncate inline-block">{w.additionalInfo ?? '-'}</span>
                  </TableCell>
                  <TableCell className={tdClass}>{formatDate(w.startDate)}</TableCell>
                  <TableCell className={tdClass}>{formatDate(w.endDate)}</TableCell>
                  <TableCell>
                    <YesNoBadge value={w.hoursMaterialClosed} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={w.invoiceSent} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={w.completed} />
                  </TableCell>
                  <TableCell className={tdClass}>{formatDate(w.createdAt)}</TableCell>
                  <TableCell className={tdClass}>{w.createdByName}</TableCell>
                  {showDeletedCols && (
                    <>
                      <TableCell>
                        {w.deleted ? (
                          <Badge variant="destructive" className="font-medium">
                            Yes
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No</span>
                        )}
                      </TableCell>
                      <TableCell className={tdClass}>{formatDate(w.deletedAt)}</TableCell>
                      <TableCell className={tdClass}>{w.deletedByName ?? '-'}</TableCell>
                    </>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/departments/${department}/workOrder/${w.id}` as Route}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10">
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span className="sr-only">View {w.workOrderNumber}</span>
                        </Button>
                      </Link>
                      {!w.deleted && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                            onClick={() => {
                              setEditingWorkOrder(w)
                              setDialogOpen(true)
                            }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleSoftDelete(w)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                      {w.deleted && (
                        <>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary px-2"
                              onClick={() => handleUndelete(w)}>
                              Restore
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => handleHardDelete(w)}>
                              <Trash2 className="h-3.5 w-3.5" />
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
        Showing {filtered.length} of {initialWorkOrders.length} work orders
      </div>

      <WorkOrderFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workOrder={editingWorkOrder}
        projectOptions={projectOptions}
      />
    </div>
  )
}
