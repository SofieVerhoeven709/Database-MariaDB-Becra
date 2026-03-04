'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Search, Plus, Pencil, Trash2, ChevronDown, ChevronUp} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {TimeRegistryFormDialog, type TimeRegistryFormData} from '@/components/custom/timeRegistryFormDialog'
import type {EmployeeOption, HourTypeOption, WorkOrderOption} from '@/components/custom/timeRegistryFormDialog'
import type {MappedTimeRegistry} from '@/types/timeRegistry'
import {
  createTimeRegistryAction,
  updateTimeRegistryAction,
  softDeleteTimeRegistryAction,
  hardDeleteTimeRegistryAction,
  undeleteTimeRegistryAction,
} from '@/serverFunctions/timeRegistries'
import {combineDateAndTime} from '@/extra/workOrderHelpers'

// ─── Types ────────────────────────────────────────────────────────────────────
type SortField =
  | 'workDate'
  | 'workOrder'
  | 'activity'
  | 'hourType'
  | 'startTime'
  | 'endTime'
  | 'onSite'
  | 'invoiceTime'
  | 'createdBy'
  | 'createdAt'

type SortDir = 'asc' | 'desc'
type FilterDeleted = 'not-deleted' | 'deleted' | 'all'

function formatDate(iso: string | null | undefined) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function formatTime(iso: string | null | undefined) {
  if (!iso) return '-'
  return new Date(iso).toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})
}

function SortIcon({field, sortField, sortDir}: {field: SortField; sortField: SortField; sortDir: SortDir}) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? (
    <ChevronUp className="inline h-3.5 w-3.5 ml-1" />
  ) : (
    <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface TimeRegistryTableProps {
  initialTimeRegistries: MappedTimeRegistry[]
  employees: EmployeeOption[]
  hourTypes: HourTypeOption[]
  workOrders: WorkOrderOption[]
  currentUserRole: string
  currentUserLevel: number
  currentUserId: string
}

const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

// ─── Component ────────────────────────────────────────────────────────────────
export function TimeRegistryTable({
  initialTimeRegistries,
  employees,
  hourTypes,
  workOrders,
  currentUserRole,
  currentUserLevel,
  currentUserId,
}: TimeRegistryTableProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  const [search, setSearch] = useState('')
  const [filterWorkOrder, setFilterWorkOrder] = useState<string>('all')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [sortField, setSortField] = useState<SortField>('workDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MappedTimeRegistry | null>(null)

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  function getEmployeeName(id: string) {
    const emp = employees.find(e => e.id === id)
    return emp ? `${emp.firstName} ${emp.lastName}` : '-'
  }

  const filtered = initialTimeRegistries
    .filter(tr => {
      if (filterDeleted === 'not-deleted' && tr.deleted) return false
      if (filterDeleted === 'deleted' && !tr.deleted) return false
      if (filterWorkOrder !== 'all' && tr.workOrderId !== filterWorkOrder) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        (tr.activityDescription?.toLowerCase().includes(q) ?? false) ||
        (tr.workOrderNumber?.toLowerCase().includes(q) ?? false) ||
        tr.hourTypeName.toLowerCase().includes(q) ||
        `${tr.employeeFirstName} ${tr.employeeLastName}`.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const cmpStr = (x: string | null | undefined, y: string | null | undefined) =>
        dir * (x ?? '').localeCompare(y ?? '')
      const cmpBool = (x: boolean, y: boolean) => dir * (Number(x) - Number(y))
      switch (sortField) {
        case 'workDate':
          return cmpStr(a.workDate, b.workDate)
        case 'workOrder':
          return cmpStr(a.workOrderNumber, b.workOrderNumber)
        case 'activity':
          return cmpStr(a.activityDescription, b.activityDescription)
        case 'hourType':
          return cmpStr(a.hourTypeName, b.hourTypeName)
        case 'startTime':
          return cmpStr(a.startTime, b.startTime)
        case 'endTime':
          return cmpStr(a.endTime, b.endTime)
        case 'onSite':
          return cmpBool(a.onSite, b.onSite)
        case 'invoiceTime':
          return cmpBool(a.invoiceTime, b.invoiceTime)
        case 'createdBy':
          return cmpStr(`${a.employeeFirstName} ${a.employeeLastName}`, `${b.employeeFirstName} ${b.employeeLastName}`)
        case 'createdAt':
          return cmpStr(a.createdAt, b.createdAt)
        default:
          return 0
      }
    })

  function buildPayload(f: TimeRegistryFormData) {
    return {
      activityDescription: f.activityDescription || null,
      additionalInfo: f.additionalInfo || null,
      invoiceInfo: f.invoiceInfo || null,
      workDate: new Date(f.workDate),
      startTime: combineDateAndTime(f.workDate, f.startTime)!,
      endTime: combineDateAndTime(f.workDate, f.endTime),
      startBreak: combineDateAndTime(f.workDate, f.startBreak),
      endBreak: combineDateAndTime(f.workDate, f.endBreak),
      invoiceTime: f.invoiceTime,
      onSite: f.onSite,
      hourTypeId: f.hourTypeId,
      workOrderId: f.workOrderId,
      employeeIds: f.employeeIds,
    }
  }

  async function handleSave(formData: TimeRegistryFormData) {
    const payload = buildPayload(formData)
    if (editingRecord) {
      await updateTimeRegistryAction({...payload, id: editingRecord.id})
    } else {
      await createTimeRegistryAction(payload)
    }
    setEditingRecord(null)
    router.refresh()
  }

  async function handleSoftDelete(id: string) {
    await softDeleteTimeRegistryAction({id})
    router.refresh()
  }

  async function handleHardDelete(id: string) {
    await hardDeleteTimeRegistryAction({id})
    router.refresh()
  }

  async function handleUndelete(id: string) {
    await undeleteTimeRegistryAction({id})
    router.refresh()
  }

  const totalCols = filterDeleted !== 'not-deleted' ? 13 : 11

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activity, work order, hour type..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border placeholder:text-muted-foreground/60 focus-visible:ring-accent"
            />
          </div>

          {/* Work order filter */}
          <Select value={filterWorkOrder} onValueChange={setFilterWorkOrder}>
            <SelectTrigger className="w-[200px] bg-secondary border-border">
              <SelectValue placeholder="All Work Orders" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Work Orders</SelectItem>
              {workOrders.map(wo => (
                <SelectItem key={wo.id} value={wo.id}>
                  {wo.workOrderNumber ?? wo.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Deleted filter */}
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
            setEditingRecord(null)
            setDialogOpen(true)
          }}
          className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
          <Plus className="h-4 w-4" />
          New Time Registry
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className={thClass} onClick={() => toggleSort('workDate')}>
                Work Date <SortIcon field="workDate" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('workOrder')}>
                Work Order <SortIcon field="workOrder" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('activity')}>
                Activity <SortIcon field="activity" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('hourType')}>
                Hour Type <SortIcon field="hourType" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('startTime')}>
                Start <SortIcon field="startTime" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('endTime')}>
                End <SortIcon field="endTime" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('onSite')}>
                On Site <SortIcon field="onSite" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('invoiceTime')}>
                Invoice Time <SortIcon field="invoiceTime" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('createdBy')}>
                Created By <SortIcon field="createdBy" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass}>Employees</TableHead>
              {filterDeleted !== 'not-deleted' && (
                <>
                  <TableHead className={thClass}>Deleted</TableHead>
                  <TableHead className={thClass}>Deleted At</TableHead>
                  <TableHead className={thClass}>Deleted By</TableHead>
                </>
              )}
              <TableHead className="w-20">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={totalCols} className="h-32 text-center text-muted-foreground">
                  No time registries found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(tr => (
                <TableRow
                  key={tr.id}
                  className={`border-border/40 hover:bg-secondary/50 ${tr.deleted ? 'opacity-50' : ''}`}>
                  <TableCell className={tdClass}>{formatDate(tr.workDate)}</TableCell>
                  <TableCell className={tdClass}>
                    <Badge
                      variant="outline"
                      className="border-border text-muted-foreground font-normal whitespace-nowrap">
                      {tr.workOrderNumber ?? '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className={tdClass}>
                    <span className="max-w-[200px] truncate inline-block">{tr.activityDescription ?? '-'}</span>
                  </TableCell>
                  <TableCell className={tdClass}>{tr.hourTypeName}</TableCell>
                  <TableCell className={tdClass}>{formatTime(tr.startTime)}</TableCell>
                  <TableCell className={tdClass}>{formatTime(tr.endTime)}</TableCell>
                  <TableCell>
                    {tr.onSite ? (
                      <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground font-medium">
                        No
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {tr.invoiceTime ? (
                      <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground font-medium">
                        No
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className={tdClass}>
                    {tr.employeeFirstName} {tr.employeeLastName}
                  </TableCell>
                  <TableCell className={tdClass}>
                    <div className="flex flex-wrap gap-1">
                      {tr.additionalEmployees.length === 0 ? (
                        <span>-</span>
                      ) : (
                        <>
                          {tr.additionalEmployees.slice(0, 2).map(e => (
                            <Badge key={e.id} variant="secondary" className="text-xs font-normal">
                              {e.employeeFirstName} {e.employeeLastName}
                            </Badge>
                          ))}
                          {tr.additionalEmployees.length > 2 && (
                            <Badge variant="secondary" className="text-xs font-normal">
                              +{tr.additionalEmployees.length - 2}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                  {filterDeleted !== 'not-deleted' && (
                    <>
                      <TableCell>
                        {tr.deleted ? (
                          <Badge variant="destructive" className="font-medium">
                            Yes
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No</span>
                        )}
                      </TableCell>
                      <TableCell className={tdClass}>{formatDate(tr.deletedAt)}</TableCell>
                      <TableCell className={tdClass}>{tr.deletedBy ? getEmployeeName(tr.deletedBy) : '-'}</TableCell>
                    </>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {tr.deleted ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary px-2"
                            onClick={() => handleUndelete(tr.id)}>
                            Restore
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() => handleHardDelete(tr.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                            onClick={() => {
                              setEditingRecord(tr)
                              setDialogOpen(true)
                            }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleSoftDelete(tr.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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
        Showing {filtered.length} of {initialTimeRegistries.length} time registries
      </div>

      <TimeRegistryFormDialog
        open={dialogOpen}
        onOpenChange={open => {
          if (!open) setEditingRecord(null)
          setDialogOpen(open)
        }}
        timeRegistry={editingRecord}
        employees={employees}
        hourTypes={hourTypes}
        workOrders={workOrders}
        currentUserId={currentUserId}
        onSave={handleSave}
      />
    </div>
  )
}
