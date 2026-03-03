'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Pencil, X, Plus, Trash2, ExternalLink} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {TimeRegistryFormDialog, type TimeRegistryFormData} from '@/components/custom/timeRegistryFormDialog'
import type {EmployeeOption, HourTypeOption} from '@/components/custom/timeRegistryFormDialog'
import {
  createTimeRegistryAction,
  updateTimeRegistryAction,
  softDeleteTimeRegistryAction,
  hardDeleteTimeRegistryAction,
  undeleteTimeRegistryAction,
} from '@/serverFunctions/timeRegistries'
import type {PermissionProps, TimeRegistryRow} from '@/types/workOrder'
import {combineDateAndTime, formatDate, formatDateTime, tdClass, thClass} from '@/extra/workOrderHelpers'

interface WorkOrderTimeRegistriesProps {
  timeRegistries: TimeRegistryRow[]
  workOrderId: string
  projectId: string
  employees: EmployeeOption[]
  hourTypes: HourTypeOption[]
  permissions: PermissionProps
  currentUserId: string
}

type InlineForm = {
  activityDescription: string
  workDate: string
  startTime: string
  endTime: string
  invoiceTime: boolean
  onSite: boolean
  hourTypeId: string
  employeeIds: string[]
}

const emptyInlineForm = (): InlineForm => ({
  activityDescription: '',
  workDate: '',
  startTime: '',
  endTime: '',
  invoiceTime: false,
  onSite: false,
  hourTypeId: '',
  employeeIds: [],
})

// ─── Compact employee multi-select (inline row only) ─────────────────────────
function CompactEmployeeMultiSelect({
  value,
  onChange,
  employees,
  lockedId,
}: {
  value: string[]
  onChange: (ids: string[]) => void
  employees: EmployeeOption[]
  lockedId?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-1 rounded-md border border-border bg-secondary p-1 min-h-[28px]">
        {value.map(id => {
          const emp = employees.find(e => e.id === id)
          const isLocked = id === lockedId
          return emp ? (
            <Badge
              key={id}
              variant="secondary"
              className={`gap-1 text-xs h-5 ${isLocked ? 'cursor-default opacity-70' : 'cursor-pointer'}`}
              onClick={() => {
                if (!isLocked) onChange(value.filter(v => v !== id))
              }}>
              {emp.firstName} {emp.lastName}
              {isLocked ? null : <X className="h-2.5 w-2.5" />}
            </Badge>
          ) : null
        })}
      </div>
      <Select
        onValueChange={v => {
          if (!value.includes(v)) onChange([...value, v])
        }}>
        <SelectTrigger className="h-6 text-xs bg-secondary border-border">
          <SelectValue placeholder="Add employee…" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {employees
            .filter(e => !value.includes(e.id))
            .map(e => (
              <SelectItem key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export function WorkOrderTimeRegistries({
  timeRegistries,
  workOrderId,
  employees,
  hourTypes,
  permissions,
  currentUserId,
}: WorkOrderTimeRegistriesProps) {
  const router = useRouter()
  const {canAdd, canDelete, isAdmin} = permissions

  const emptyInlineFormWithUser = () => ({...emptyInlineForm(), employeeIds: [currentUserId]})

  const [showInline, setShowInline] = useState(false)
  const [inlineForm, setInlineForm] = useState(emptyInlineFormWithUser())

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TimeRegistryRow | null>(null)

  const [detailId, setDetailId] = useState<string | null>(null)
  const [showDeleted, setShowDeleted] = useState(false)

  const detailRecord = detailId ? timeRegistries.find(tr => tr.id === detailId) : null

  function buildInlinePayload(f: InlineForm) {
    return {
      activityDescription: f.activityDescription || null,
      additionalInfo: null,
      invoiceInfo: null,
      workDate: new Date(f.workDate),
      startTime: combineDateAndTime(f.workDate, f.startTime)!,
      endTime: combineDateAndTime(f.workDate, f.endTime),
      startBreak: null,
      endBreak: null,
      invoiceTime: f.invoiceTime,
      onSite: f.onSite,
      hourTypeId: f.hourTypeId,
      workOrderId,
      employeeIds: f.employeeIds,
    }
  }

  function buildDialogPayload(f: TimeRegistryFormData) {
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
      workOrderId,
      employeeIds: f.employeeIds,
    }
  }

  // Convert a TimeRegistryRow to a MappedTimeRegistry-like object for the dialog
  function rowToMapped(tr: TimeRegistryRow) {
    return {
      id: tr.id,
      activityDescription: tr.activityDescription ?? null,
      additionalInfo: tr.additionalInfo ?? null,
      invoiceInfo: tr.invoiceInfo ?? null,
      startTime: tr.startTime?.toISOString?.() ?? String(tr.startTime),
      endTime: tr.endTime?.toISOString?.() ?? (tr.endTime ? String(tr.endTime) : null),
      workDate: tr.workDate?.toISOString?.() ?? String(tr.workDate),
      startBreak: tr.startBreak?.toISOString?.() ?? (tr.startBreak ? String(tr.startBreak) : null),
      endBreak: tr.endBreak?.toISOString?.() ?? (tr.endBreak ? String(tr.endBreak) : null),
      createdAt: tr.createdAt?.toISOString?.() ?? String(tr.createdAt),
      invoiceTime: tr.invoiceTime,
      onSite: tr.onSite,
      createdBy: tr.createdBy,
      workOrderId: tr.workOrderId,
      hourTypeId: tr.HourType.id,
      deleted: tr.deleted,
      deletedAt: null,
      deletedBy: null,
      employeeFirstName: tr.Employee.firstName,
      employeeLastName: tr.Employee.lastName,
      hourTypeName: tr.HourType.name,
      workOrderNumber: null,
      additionalEmployees: tr.TimeRegistryEmployee.map(tre => ({
        id: tre.id,
        employeeId: tre.Employee.id,
        employeeFirstName: tre.Employee.firstName,
        employeeLastName: tre.Employee.lastName,
      })),
    }
  }

  async function handleInlineSave() {
    await createTimeRegistryAction(buildInlinePayload(inlineForm))
    setInlineForm(emptyInlineForm())
    setShowInline(false)
    router.refresh()
  }

  async function handleDialogSave(formData: TimeRegistryFormData) {
    const payload = buildDialogPayload(formData)
    if (editingRecord) {
      await updateTimeRegistryAction({...payload, id: editingRecord.id})
    } else {
      await createTimeRegistryAction(payload)
    }
    setEditingRecord(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    await softDeleteTimeRegistryAction({id})
    router.refresh()
  }

  async function handleUndelete(id: string) {
    await undeleteTimeRegistryAction({id})
    router.refresh()
  }

  async function handleHardDelete(id: string) {
    await hardDeleteTimeRegistryAction({id})
    router.refresh()
  }

  const filtered = timeRegistries.filter(tr => (showDeleted ? true : !tr.deleted))

  return (
    <>
      {/* Action bar */}
      <div className="flex items-center gap-2 mb-3">
        {canAdd && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-border text-xs h-7"
              onClick={() => {
                setShowInline(v => !v)
                setInlineForm(emptyInlineFormWithUser())
              }}>
              <Plus className="h-3 w-3" />
              {showInline ? 'Cancel inline' : 'Add inline'}
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/80 text-xs h-7"
              onClick={() => {
                setEditingRecord(null)
                setDialogOpen(true)
              }}>
              <Plus className="h-3 w-3" />
              Add via dialog
            </Button>
          </>
        )}
        {canDelete && (
          <Button
            size="sm"
            variant={showDeleted ? 'secondary' : 'outline'}
            className="gap-1.5 border-border text-xs h-7 ml-auto"
            onClick={() => setShowDeleted(v => !v)}>
            {showDeleted ? 'Hide deleted' : 'Show deleted'}
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className={thClass}>Work Date</TableHead>
              <TableHead className={thClass}>Activity</TableHead>
              <TableHead className={thClass}>Hour Type</TableHead>
              <TableHead className={thClass}>Start</TableHead>
              <TableHead className={thClass}>End</TableHead>
              <TableHead className={thClass}>On Site</TableHead>
              <TableHead className={thClass}>Invoice Time</TableHead>
              <TableHead className={thClass}>Created By</TableHead>
              <TableHead className={thClass}>Employees</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Inline add row */}
            {showInline && (
              <TableRow className="bg-secondary/30 border-border/40 align-top">
                <TableCell>
                  <Input
                    type="date"
                    value={inlineForm.workDate}
                    onChange={e => setInlineForm(f => ({...f, workDate: e.target.value}))}
                    className="h-7 text-xs bg-secondary border-border"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Activity"
                    value={inlineForm.activityDescription}
                    onChange={e => setInlineForm(f => ({...f, activityDescription: e.target.value}))}
                    className="h-7 text-xs bg-secondary border-border"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={inlineForm.hourTypeId}
                    onValueChange={v => setInlineForm(f => ({...f, hourTypeId: v}))}>
                    <SelectTrigger className="h-7 text-xs bg-secondary border-border">
                      <SelectValue placeholder="Hour type" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {hourTypes.map(ht => (
                        <SelectItem key={ht.id} value={ht.id}>
                          {ht.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    type="time"
                    value={inlineForm.startTime}
                    onChange={e => setInlineForm(f => ({...f, startTime: e.target.value}))}
                    className="h-7 text-xs bg-secondary border-border"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="time"
                    value={inlineForm.endTime}
                    onChange={e => setInlineForm(f => ({...f, endTime: e.target.value}))}
                    className="h-7 text-xs bg-secondary border-border"
                  />
                </TableCell>
                <TableCell>
                  <Switch checked={inlineForm.onSite} onCheckedChange={v => setInlineForm(f => ({...f, onSite: v}))} />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={inlineForm.invoiceTime}
                    onCheckedChange={v => setInlineForm(f => ({...f, invoiceTime: v}))}
                  />
                </TableCell>
                <TableCell colSpan={1}>
                  <CompactEmployeeMultiSelect
                    value={inlineForm.employeeIds}
                    onChange={ids => setInlineForm(f => ({...f, employeeIds: ids}))}
                    employees={employees}
                    lockedId={currentUserId}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-accent text-accent-foreground hover:bg-accent/80"
                      onClick={handleInlineSave}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-border"
                      onClick={() => setShowInline(false)}>
                      Cancel
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {filtered.length === 0 && !showInline ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                  No time registries found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(tr => (
                <TableRow
                  key={tr.id}
                  className={`border-border/40 hover:bg-secondary/50 ${tr.deleted ? 'opacity-50' : ''}`}>
                  <TableCell className={tdClass}>
                    <div className="flex items-center gap-1.5">
                      {tr.deleted && (
                        <Badge variant="destructive" className="text-xs font-normal h-4 px-1">
                          deleted
                        </Badge>
                      )}
                      {formatDate(tr.workDate)}
                    </div>
                  </TableCell>
                  <TableCell className={tdClass}>
                    <span className="max-w-[180px] truncate inline-block">{tr.activityDescription ?? '-'}</span>
                  </TableCell>
                  <TableCell className={tdClass}>{tr.HourType.name}</TableCell>
                  <TableCell className={tdClass}>{formatDateTime(tr.startTime)}</TableCell>
                  <TableCell className={tdClass}>{formatDateTime(tr.endTime)}</TableCell>
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
                    {tr.Employee.firstName} {tr.Employee.lastName}
                  </TableCell>
                  <TableCell className={tdClass}>
                    <div className="flex flex-wrap gap-1">
                      {tr.TimeRegistryEmployee.length === 0 ? (
                        <span>-</span>
                      ) : (
                        <>
                          {tr.TimeRegistryEmployee.slice(0, 2).map(tre => (
                            <Badge key={tre.id} variant="secondary" className="text-xs font-normal">
                              {tre.Employee.firstName} {tre.Employee.lastName}
                            </Badge>
                          ))}
                          {tr.TimeRegistryEmployee.length > 2 && (
                            <Badge variant="secondary" className="text-xs font-normal">
                              +{tr.TimeRegistryEmployee.length - 2}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {tr.deleted ? (
                        <>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary px-2"
                              onClick={() => handleUndelete(tr.id)}>
                              Restore
                            </Button>
                          )}
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
                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                            onClick={() => {
                              setEditingRecord(tr)
                              setDialogOpen(true)
                            }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(tr.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-accent/10"
                            onClick={() => setDetailId(tr.id)}>
                            <ExternalLink className="h-3.5 w-3.5" />
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

      {/* Add/Edit Dialog — reuses the shared form dialog, fixed to this work order */}
      <TimeRegistryFormDialog
        open={dialogOpen}
        onOpenChange={open => {
          if (!open) setEditingRecord(null)
          setDialogOpen(open)
        }}
        timeRegistry={editingRecord ? rowToMapped(editingRecord) : null}
        employees={employees}
        hourTypes={hourTypes}
        fixedWorkOrderId={workOrderId}
        currentUserId={currentUserId}
        onSave={handleDialogSave}
      />

      {/* Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={open => !open && setDetailId(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Time Registry Detail</DialogTitle>
          </DialogHeader>
          {detailRecord && (
            <div className="flex flex-col gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Work Date</Label>
                  <p className="text-sm text-foreground">{formatDate(detailRecord.workDate)}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Hour Type</Label>
                  <p className="text-sm text-foreground">{detailRecord.HourType.name}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Start</Label>
                  <p className="text-sm text-foreground">{formatDateTime(detailRecord.startTime)}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">End</Label>
                  <p className="text-sm text-foreground">{formatDateTime(detailRecord.endTime)}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Break Start</Label>
                  <p className="text-sm text-foreground">{formatDateTime(detailRecord.startBreak)}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Break End</Label>
                  <p className="text-sm text-foreground">{formatDateTime(detailRecord.endBreak)}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Created By</Label>
                  <p className="text-sm text-foreground">
                    {detailRecord.Employee.firstName} {detailRecord.Employee.lastName}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Created At</Label>
                  <p className="text-sm text-foreground">{formatDate(detailRecord.createdAt)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                  <Label className="text-xs text-muted-foreground">On Site</Label>
                  {detailRecord.onSite ? (
                    <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-muted-foreground font-medium">
                      No
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                  <Label className="text-xs text-muted-foreground">Invoice Time</Label>
                  {detailRecord.invoiceTime ? (
                    <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-muted-foreground font-medium">
                      No
                    </Badge>
                  )}
                </div>
              </div>
              {detailRecord.activityDescription && (
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Activity</Label>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{detailRecord.activityDescription}</p>
                </div>
              )}
              {detailRecord.invoiceInfo && (
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Invoice Info</Label>
                  <p className="text-sm text-foreground">{detailRecord.invoiceInfo}</p>
                </div>
              )}
              {detailRecord.additionalInfo && (
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Additional Info</Label>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{detailRecord.additionalInfo}</p>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">
                  Employees ({detailRecord.TimeRegistryEmployee.length})
                </Label>
                {detailRecord.TimeRegistryEmployee.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No additional employees.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {detailRecord.TimeRegistryEmployee.map(tre => (
                      <Badge key={tre.id} variant="secondary" className="font-normal">
                        {tre.Employee.firstName} {tre.Employee.lastName}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailId(null)} className="border-border">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
