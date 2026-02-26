'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Pencil, X, Plus, Trash2, ExternalLink} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {
  createTimeRegistryAction,
  updateTimeRegistryAction,
  softDeleteTimeRegistryAction,
  hardDeleteTimeRegistryAction,
  undeleteTimeRegistryAction,
} from '@/serverFunctions/timeRegistries'
import type {EmployeeOption, HourTypeOption, PermissionProps, TimeRegistryRow} from '@/types/workOrder'
import {
  combineDateAndTime,
  formatDate,
  formatDateTime,
  tdClass,
  thClass,
  toInputDate,
  toInputTime,
} from '@/extra/workOrderHelpers'

// ─── Local types ──────────────────────────────────────────────────────────────
interface WorkOrderTimeRegistriesProps {
  timeRegistries: TimeRegistryRow[]
  workOrderId: string
  projectId: string
  employees: EmployeeOption[]
  hourTypes: HourTypeOption[]
  permissions: PermissionProps
}

type TimeRegistryForm = {
  activityDescription: string
  additionalInfo: string
  invoiceInfo: string
  workDate: string
  startTime: string
  endTime: string
  startBreak: string
  endBreak: string
  invoiceTime: boolean
  onSite: boolean
  hourTypeId: string
  employeeIds: string[]
}

const emptyForm = (): TimeRegistryForm => ({
  activityDescription: '',
  additionalInfo: '',
  invoiceInfo: '',
  workDate: '',
  startTime: '',
  endTime: '',
  startBreak: '',
  endBreak: '',
  invoiceTime: false,
  onSite: false,
  hourTypeId: '',
  employeeIds: [],
})

// ─── Employee multi-select ────────────────────────────────────────────────────
function EmployeeMultiSelect({
  value,
  onChange,
  employees,
  compact = false,
}: {
  value: string[]
  onChange: (ids: string[]) => void
  employees: EmployeeOption[]
  compact?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      {!compact && <Label className="text-xs text-muted-foreground">Additional Employees</Label>}
      <div
        className={`flex flex-wrap gap-1 rounded-md border border-border bg-secondary ${compact ? 'p-1 min-h-[28px]' : 'p-2 min-h-[36px]'}`}>
        {value.map(id => {
          const emp = employees.find(e => e.id === id)
          return emp ? (
            <Badge
              key={id}
              variant="secondary"
              className="gap-1 cursor-pointer text-xs h-5"
              onClick={() => onChange(value.filter(v => v !== id))}>
              {emp.firstName} {emp.lastName}
              <X className="h-2.5 w-2.5" />
            </Badge>
          ) : null
        })}
      </div>
      <Select
        onValueChange={v => {
          if (!value.includes(v)) onChange([...value, v])
        }}>
        <SelectTrigger className={`${compact ? 'h-6 text-xs' : 'h-7 text-xs'} bg-secondary border-border`}>
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
}: WorkOrderTimeRegistriesProps) {
  const router = useRouter()
  const {canAdd, canDelete, isAdmin} = permissions

  const [showInline, setShowInline] = useState(false)
  const [inlineForm, setInlineForm] = useState(emptyForm())

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dialogForm, setDialogForm] = useState(emptyForm())

  const [detailId, setDetailId] = useState<string | null>(null)
  const [showDeleted, setShowDeleted] = useState(false)

  const detailRecord = detailId ? timeRegistries.find(tr => tr.id === detailId) : null

  function buildPayload(f: TimeRegistryForm) {
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

  function openEdit(tr: TimeRegistryRow) {
    setEditingId(tr.id)
    setDialogForm({
      activityDescription: tr.activityDescription ?? '',
      additionalInfo: tr.additionalInfo ?? '',
      invoiceInfo: tr.invoiceInfo ?? '',
      workDate: toInputDate(tr.workDate),
      startTime: toInputTime(tr.startTime),
      endTime: toInputTime(tr.endTime),
      startBreak: toInputTime(tr.startBreak),
      endBreak: toInputTime(tr.endBreak),
      invoiceTime: tr.invoiceTime,
      onSite: tr.onSite,
      hourTypeId: tr.HourType.id,
      employeeIds: tr.TimeRegistryEmployee.map(tre => tre.Employee.id),
    })
    setDialogOpen(true)
  }

  async function handleInlineSave() {
    await createTimeRegistryAction(buildPayload(inlineForm))
    setInlineForm(emptyForm())
    setShowInline(false)
    router.refresh()
  }

  async function handleDialogSave() {
    const payload = buildPayload(dialogForm)
    if (editingId) {
      await updateTimeRegistryAction({...payload, id: editingId})
    } else {
      await createTimeRegistryAction(payload)
    }
    setDialogForm(emptyForm())
    setEditingId(null)
    setDialogOpen(false)
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
                setInlineForm(emptyForm())
              }}>
              <Plus className="h-3 w-3" />
              {showInline ? 'Cancel inline' : 'Add inline'}
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/80 text-xs h-7"
              onClick={() => {
                setEditingId(null)
                setDialogForm(emptyForm())
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
                <TableCell>
                  <EmployeeMultiSelect
                    compact
                    value={inlineForm.employeeIds}
                    onChange={ids => setInlineForm(f => ({...f, employeeIds: ids}))}
                    employees={employees}
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
                            onClick={() => openEdit(tr)}>
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

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={open => {
          if (!open) {
            setEditingId(null)
            setDialogForm(emptyForm())
          }
          setDialogOpen(open)
        }}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingId ? 'Edit Time Registry' : 'Add Time Registry'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Work Date</Label>
                <Input
                  type="date"
                  value={dialogForm.workDate}
                  onChange={e => setDialogForm(f => ({...f, workDate: e.target.value}))}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Hour Type</Label>
                <Select value={dialogForm.hourTypeId} onValueChange={v => setDialogForm(f => ({...f, hourTypeId: v}))}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select hour type" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {hourTypes.map(ht => (
                      <SelectItem key={ht.id} value={ht.id}>
                        {ht.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Start Time</Label>
                <Input
                  type="time"
                  value={dialogForm.startTime}
                  onChange={e => setDialogForm(f => ({...f, startTime: e.target.value}))}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">End Time</Label>
                <Input
                  type="time"
                  value={dialogForm.endTime}
                  onChange={e => setDialogForm(f => ({...f, endTime: e.target.value}))}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Break Start</Label>
                <Input
                  type="time"
                  value={dialogForm.startBreak}
                  onChange={e => setDialogForm(f => ({...f, startBreak: e.target.value}))}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Break End</Label>
                <Input
                  type="time"
                  value={dialogForm.endBreak}
                  onChange={e => setDialogForm(f => ({...f, endBreak: e.target.value}))}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Activity Description</Label>
              <Textarea
                value={dialogForm.activityDescription}
                rows={2}
                onChange={e => setDialogForm(f => ({...f, activityDescription: e.target.value}))}
                className="bg-secondary border-border resize-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Invoice Info</Label>
              <Input
                value={dialogForm.invoiceInfo}
                onChange={e => setDialogForm(f => ({...f, invoiceInfo: e.target.value}))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Additional Info</Label>
              <Textarea
                value={dialogForm.additionalInfo}
                rows={2}
                onChange={e => setDialogForm(f => ({...f, additionalInfo: e.target.value}))}
                className="bg-secondary border-border resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                <Label className="text-xs text-muted-foreground">On Site</Label>
                <Switch checked={dialogForm.onSite} onCheckedChange={v => setDialogForm(f => ({...f, onSite: v}))} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                <Label className="text-xs text-muted-foreground">Invoice Time</Label>
                <Switch
                  checked={dialogForm.invoiceTime}
                  onCheckedChange={v => setDialogForm(f => ({...f, invoiceTime: v}))}
                />
              </div>
            </div>
            <EmployeeMultiSelect
              value={dialogForm.employeeIds}
              onChange={ids => setDialogForm(f => ({...f, employeeIds: ids}))}
              employees={employees}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border">
              Cancel
            </Button>
            <Button onClick={handleDialogSave} className="bg-accent text-accent-foreground hover:bg-accent/80">
              {editingId ? 'Save Changes' : 'Add Time Registry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
