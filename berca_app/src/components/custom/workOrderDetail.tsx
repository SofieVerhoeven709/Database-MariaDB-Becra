'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowLeft, Pencil, X, Save, Plus} from 'lucide-react'
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
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {
  createWorkOrderAction,
  updateWorkOrderAction,
  createTimeRegistryAction,
  createWorkOrderStructureAction,
} from '@/serverFunctions/workOrders'
import type {Route} from 'next'
import type {WorkOrderDetailData} from '@/extra/workOrders'

// ─── Option types ─────────────────────────────────────────────────────────────
interface EmployeeOption {
  id: string
  firstName: string
  lastName: string
}

interface HourTypeOption {
  id: string
  name: string
}

interface MaterialOption {
  id: string
  name: string
}

interface WorkOrderDetailProps {
  workOrder: WorkOrderDetailData | null
  projectId: string
  employees: EmployeeOption[]
  hourTypes: HourTypeOption[]
  materials: MaterialOption[]
  currentUserLevel: number
  currentUserRole: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(date: Date | null | undefined) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function formatDateTime(date: Date | null | undefined) {
  if (!date) return '-'
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toInputDate(date: Date | null | undefined) {
  if (!date) return ''
  return new Date(date).toISOString().slice(0, 10)
}

function toInputTime(date: Date | null | undefined) {
  if (!date) return ''
  return new Date(date).toTimeString().slice(0, 5)
}

const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'
const thClass = 'whitespace-nowrap text-xs'

const PERM = {timeRegistry: 20, structures: 60} as const

// ─── Empty states ─────────────────────────────────────────────────────────────
const emptyTimeRegistry = () => ({
  activityDescription: '',
  aditionalInfo: '',
  invoiceInfo: '',
  workDate: '',
  startTime: '',
  endTime: '',
  startBreak: '',
  endBreak: '',
  invoiceTime: false,
  onSite: false,
  hourtypeId: '',
  employeeIds: [] as string[],
})

const emptyStructure = () => ({
  clientNumber: '',
  tag: '',
  quantity: '',
  shortDesciption: '',
  longDescription: '',
  aditionalInfo: '',
  materialId: '',
})

// ─── Tab action bar ───────────────────────────────────────────────────────────
function TabActions({
  canAdd,
  onInline,
  onDialog,
  showInline,
}: {
  canAdd: boolean
  onInline: () => void
  onDialog: () => void
  showInline: boolean
}) {
  if (!canAdd) return null
  return (
    <div className="flex items-center gap-2 mb-3">
      <Button size="sm" variant="outline" className="gap-1.5 border-border text-xs h-7" onClick={onInline}>
        <Plus className="h-3 w-3" />
        {showInline ? 'Cancel inline' : 'Add inline'}
      </Button>
      <Button
        size="sm"
        className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/80 text-xs h-7"
        onClick={onDialog}>
        <Plus className="h-3 w-3" />
        Add via dialog
      </Button>
    </div>
  )
}

// ─── Employee multi-select ────────────────────────────────────────────────────
function EmployeeMultiSelect({
  value,
  onChange,
  employees,
}: {
  value: string[]
  onChange: (ids: string[]) => void
  employees: EmployeeOption[]
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">Additional Employees</Label>
      <div className="flex flex-wrap gap-1.5 p-2 rounded-md border border-border bg-secondary min-h-[36px]">
        {value.map(id => {
          const emp = employees.find(e => e.id === id)
          return emp ? (
            <Badge
              key={id}
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => onChange(value.filter(v => v !== id))}>
              {emp.firstName} {emp.lastName}
              <X className="h-3 w-3" />
            </Badge>
          ) : null
        })}
      </div>
      <Select
        onValueChange={v => {
          if (!value.includes(v)) onChange([...value, v])
        }}>
        <SelectTrigger className="h-7 text-xs bg-secondary border-border">
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
export function WorkOrderDetail({
  workOrder,
  projectId,
  employees,
  hourTypes,
  materials,
  currentUserLevel,
  currentUserRole,
}: WorkOrderDetailProps) {
  const router = useRouter()
  const isNew = workOrder === null

  const [editing, setEditing] = useState(isNew)
  const [saving, setSaving] = useState(false)

  // ─── Main form ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    workOrderNumber: workOrder?.workOrderNumber ?? '',
    description: workOrder?.description ?? '',
    aditionalInfo: workOrder?.aditionalInfo ?? '',
    startDate: toInputDate(workOrder?.startDate),
    endDate: toInputDate(workOrder?.endDate),
    hoursMaterialClosed: workOrder?.hoursMaterialClosed ?? false,
    invoiceSent: workOrder?.invoiceSent ?? false,
    completed: workOrder?.completed ?? false,
  })

  // ─── Inline row visibility ──────────────────────────────────────────────────
  const [showInlineTimeRegistry, setShowInlineTimeRegistry] = useState(false)
  const [showInlineStructure, setShowInlineStructure] = useState(false)

  // ─── Inline form states ─────────────────────────────────────────────────────
  const [inlineTimeRegistry, setInlineTimeRegistry] = useState(emptyTimeRegistry())
  const [inlineStructure, setInlineStructure] = useState(emptyStructure())

  // ─── Dialog visibility ──────────────────────────────────────────────────────
  const [dialogTimeRegistry, setDialogTimeRegistry] = useState(false)
  const [dialogStructure, setDialogStructure] = useState(false)

  // ─── Dialog form states ─────────────────────────────────────────────────────
  const [dialogTimeRegistryForm, setDialogTimeRegistryForm] = useState(emptyTimeRegistry())
  const [dialogStructureForm, setDialogStructureForm] = useState(emptyStructure())

  const can = (level: number) => currentUserLevel >= level

  // ─── Helpers to build date+time from separate inputs ────────────────────────
  function combineDateAndTime(date: string, time: string): Date | null {
    if (!date || !time) return null
    return new Date(`${date}T${time}`)
  }

  function handleCancel() {
    if (isNew) {
      router.back()
      return
    }
    setForm({
      workOrderNumber: workOrder.workOrderNumber ?? '',
      description: workOrder.description ?? '',
      aditionalInfo: workOrder.aditionalInfo ?? '',
      startDate: toInputDate(workOrder.startDate),
      endDate: toInputDate(workOrder.endDate),
      hoursMaterialClosed: workOrder.hoursMaterialClosed,
      invoiceSent: workOrder.invoiceSent,
      completed: workOrder.completed,
    })
    setEditing(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        workOrderNumber: form.workOrderNumber || null,
        description: form.description || null,
        aditionalInfo: form.aditionalInfo || null,
        startDate: new Date(form.startDate),
        endDate: form.endDate ? new Date(form.endDate) : null,
        projectId,
        hoursMaterialClosed: form.hoursMaterialClosed,
        invoiceSent: form.invoiceSent,
        completed: form.completed,
      }

      if (isNew) {
        await createWorkOrderAction(payload)
        // redirect happens server-side via redirect()
      } else {
        await updateWorkOrderAction({
          ...payload,
          id: workOrder.id,
        })
        setEditing(false)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleInlineTimeRegistrySave() {
    await createTimeRegistryAction({
      activityDescription: inlineTimeRegistry.activityDescription || null,
      workDate: new Date(inlineTimeRegistry.workDate),
      startTime: combineDateAndTime(inlineTimeRegistry.workDate, inlineTimeRegistry.startTime)!,
      endTime: combineDateAndTime(inlineTimeRegistry.workDate, inlineTimeRegistry.endTime),
      startBreak: null,
      endBreak: null,
      invoiceTime: inlineTimeRegistry.invoiceTime,
      onSite: inlineTimeRegistry.onSite,
      hourtypeId: inlineTimeRegistry.hourtypeId,
      workOrderId: workOrder!.id,
      employeeIds: [],
    })
    setInlineTimeRegistry(emptyTimeRegistry())
    setShowInlineTimeRegistry(false)
    router.refresh()
  }

  async function handleInlineStructureSave() {
    await createWorkOrderStructureAction({
      clientNumber: inlineStructure.clientNumber || null,
      tag: inlineStructure.tag || null,
      quantity: inlineStructure.quantity ? parseInt(inlineStructure.quantity) : null,
      shortDesciption: inlineStructure.shortDesciption || null,
      materialId: inlineStructure.materialId,
      workOrderId: workOrder!.id,
    })
    setInlineStructure(emptyStructure())
    setShowInlineStructure(false)
    router.refresh()
  }

  async function handleDialogTimeRegistrySave() {
    await createTimeRegistryAction({
      activityDescription: dialogTimeRegistryForm.activityDescription || null,
      aditionalInfo: dialogTimeRegistryForm.aditionalInfo || null,
      invoiceInfo: dialogTimeRegistryForm.invoiceInfo || null,
      workDate: new Date(dialogTimeRegistryForm.workDate),
      startTime: combineDateAndTime(dialogTimeRegistryForm.workDate, dialogTimeRegistryForm.startTime)!,
      endTime: combineDateAndTime(dialogTimeRegistryForm.workDate, dialogTimeRegistryForm.endTime),
      startBreak: combineDateAndTime(dialogTimeRegistryForm.workDate, dialogTimeRegistryForm.startBreak),
      endBreak: combineDateAndTime(dialogTimeRegistryForm.workDate, dialogTimeRegistryForm.endBreak),
      invoiceTime: dialogTimeRegistryForm.invoiceTime,
      onSite: dialogTimeRegistryForm.onSite,
      hourtypeId: dialogTimeRegistryForm.hourtypeId,
      workOrderId: workOrder!.id,
      employeeIds: dialogTimeRegistryForm.employeeIds,
    })
    setDialogTimeRegistryForm(emptyTimeRegistry())
    setDialogTimeRegistry(false)
    router.refresh()
  }

  async function handleDialogStructureSave() {
    await createWorkOrderStructureAction({
      clientNumber: dialogStructureForm.clientNumber || null,
      tag: dialogStructureForm.tag || null,
      quantity: dialogStructureForm.quantity ? parseInt(dialogStructureForm.quantity) : null,
      shortDesciption: dialogStructureForm.shortDesciption || null,
      longDescription: dialogStructureForm.longDescription || null,
      aditionalInfo: dialogStructureForm.aditionalInfo || null,
      materialId: dialogStructureForm.materialId,
      workOrderId: workOrder!.id,
    })
    setDialogStructureForm(emptyStructure())
    setDialogStructure(false)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/departments/project/project/${projectId}` as Route}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {isNew ? 'New Work Order' : (workOrder.workOrderNumber ?? 'Work Order')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isNew
                ? 'Fill in the details below to create a new work order'
                : `${workOrder.Project.projectNumber} · ${workOrder.Project.projectName}`}
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
                {saving ? 'Saving…' : isNew ? 'Create' : 'Save'}
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

      {/* Work Order info */}
      <div className="rounded-xl border border-border/60 bg-card p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Work Order Number</Label>
            {editing ? (
              <Input
                value={form.workOrderNumber}
                onChange={e => setForm(f => ({...f, workOrderNumber: e.target.value}))}
                className="bg-secondary border-border"
                placeholder="e.g. WO-2024-001"
              />
            ) : (
              <p className="text-sm text-foreground font-medium">{workOrder!.workOrderNumber ?? '-'}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Start Date</Label>
            {editing ? (
              <Input
                type="date"
                value={form.startDate}
                onChange={e => setForm(f => ({...f, startDate: e.target.value}))}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{formatDate(workOrder!.startDate)}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">End Date</Label>
            {editing ? (
              <Input
                type="date"
                value={form.endDate}
                onChange={e => setForm(f => ({...f, endDate: e.target.value}))}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{formatDate(workOrder!.endDate)}</p>
            )}
          </div>

          {!isNew && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Created By</Label>
                <p className="text-sm text-muted-foreground">
                  {workOrder.Employee.firstName} {workOrder.Employee.lastName}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Created At</Label>
                <p className="text-sm text-muted-foreground">{formatDate(workOrder.createdAt)}</p>
              </div>
            </>
          )}

          <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(
              [
                {key: 'hoursMaterialClosed', label: 'Hours / Material Closed'},
                {key: 'invoiceSent', label: 'Invoice Sent'},
                {key: 'completed', label: 'Completed'},
              ] as const
            ).map(({key, label}) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                {editing ? (
                  <Switch checked={form[key]} onCheckedChange={v => setForm(f => ({...f, [key]: v}))} />
                ) : workOrder![key] ? (
                  <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
                ) : (
                  <Badge variant="secondary" className="text-muted-foreground font-medium">
                    No
                  </Badge>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
            <Label className="text-xs text-muted-foreground">Description</Label>
            {editing ? (
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({...f, description: e.target.value}))}
                rows={3}
                className="bg-secondary border-border resize-none"
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{workOrder!.description ?? '-'}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
            <Label className="text-xs text-muted-foreground">Additional Info</Label>
            {editing ? (
              <Textarea
                value={form.aditionalInfo}
                onChange={e => setForm(f => ({...f, aditionalInfo: e.target.value}))}
                rows={3}
                className="bg-secondary border-border resize-none"
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{workOrder!.aditionalInfo ?? '-'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs — only for existing records */}
      {!isNew && (
        <Tabs defaultValue="timeregistries">
          <TabsList className="bg-secondary border border-border/60">
            <TabsTrigger value="timeregistries">
              Time Registries
              <Badge variant="secondary" className="ml-2 text-xs">
                {workOrder.TimeRegistry.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="structures">
              Structures
              <Badge variant="secondary" className="ml-2 text-xs">
                {workOrder.WorkOrderStructure.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="trainings">
              Trainings
              <Badge variant="secondary" className="ml-2 text-xs">
                {workOrder.Training.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* ── Time Registries ───────────────────────────────────────────────── */}
          <TabsContent value="timeregistries" className="mt-3">
            <TabActions
              canAdd={can(PERM.timeRegistry)}
              onInline={() => {
                setShowInlineTimeRegistry(v => !v)
                setInlineTimeRegistry(emptyTimeRegistry())
              }}
              onDialog={() => {
                setDialogTimeRegistryForm(emptyTimeRegistry())
                setDialogTimeRegistry(true)
              }}
              showInline={showInlineTimeRegistry}
            />
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {showInlineTimeRegistry && (
                    <TableRow className="bg-secondary/30 border-border/40">
                      <TableCell>
                        <Input
                          type="date"
                          value={inlineTimeRegistry.workDate}
                          onChange={e => setInlineTimeRegistry(f => ({...f, workDate: e.target.value}))}
                          className="h-7 text-xs bg-secondary border-border"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Activity"
                          value={inlineTimeRegistry.activityDescription}
                          onChange={e => setInlineTimeRegistry(f => ({...f, activityDescription: e.target.value}))}
                          className="h-7 text-xs bg-secondary border-border"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={inlineTimeRegistry.hourtypeId}
                          onValueChange={v => setInlineTimeRegistry(f => ({...f, hourtypeId: v}))}>
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
                          value={inlineTimeRegistry.startTime}
                          onChange={e => setInlineTimeRegistry(f => ({...f, startTime: e.target.value}))}
                          className="h-7 text-xs bg-secondary border-border"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="time"
                          value={inlineTimeRegistry.endTime}
                          onChange={e => setInlineTimeRegistry(f => ({...f, endTime: e.target.value}))}
                          className="h-7 text-xs bg-secondary border-border"
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={inlineTimeRegistry.onSite}
                          onCheckedChange={v => setInlineTimeRegistry(f => ({...f, onSite: v}))}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={inlineTimeRegistry.invoiceTime}
                          onCheckedChange={v => setInlineTimeRegistry(f => ({...f, invoiceTime: v}))}
                        />
                      </TableCell>
                      <TableCell colSpan={1}>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-accent text-accent-foreground hover:bg-accent/80"
                            onClick={handleInlineTimeRegistrySave}>
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-border"
                            onClick={() => setShowInlineTimeRegistry(false)}>
                            Cancel
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {workOrder.TimeRegistry.length === 0 && !showInlineTimeRegistry ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                        No time registries found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    workOrder.TimeRegistry.map(tr => (
                      <TableRow key={tr.id} className="border-border/40 hover:bg-secondary/50">
                        <TableCell className={tdClass}>{formatDate(tr.workDate)}</TableCell>
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
                              tr.TimeRegistryEmployee.map(tre => (
                                <Badge key={tre.id} variant="secondary" className="text-xs font-normal">
                                  {tre.Employee.firstName} {tre.Employee.lastName}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── Structures ────────────────────────────────────────────────────── */}
          <TabsContent value="structures" className="mt-3">
            <TabActions
              canAdd={can(PERM.structures)}
              onInline={() => {
                setShowInlineStructure(v => !v)
                setInlineStructure(emptyStructure())
              }}
              onDialog={() => {
                setDialogStructureForm(emptyStructure())
                setDialogStructure(true)
              }}
              showInline={showInlineStructure}
            />
            <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/60">
                    <TableHead className={thClass}>Client #</TableHead>
                    <TableHead className={thClass}>Tag</TableHead>
                    <TableHead className={thClass}>Description</TableHead>
                    <TableHead className={thClass}>Qty</TableHead>
                    <TableHead className={thClass}>Material</TableHead>
                    <TableHead className={thClass}>Target</TableHead>
                    <TableHead className={thClass}>Created By</TableHead>
                    <TableHead className={thClass}>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {showInlineStructure && (
                    <TableRow className="bg-secondary/30 border-border/40">
                      <TableCell>
                        <Input
                          placeholder="Client #"
                          value={inlineStructure.clientNumber}
                          onChange={e => setInlineStructure(f => ({...f, clientNumber: e.target.value}))}
                          className="h-7 text-xs bg-secondary border-border"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Tag"
                          value={inlineStructure.tag}
                          onChange={e => setInlineStructure(f => ({...f, tag: e.target.value}))}
                          className="h-7 text-xs bg-secondary border-border"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Description"
                          value={inlineStructure.shortDesciption}
                          onChange={e => setInlineStructure(f => ({...f, shortDesciption: e.target.value}))}
                          className="h-7 text-xs bg-secondary border-border"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={inlineStructure.quantity}
                          onChange={e => setInlineStructure(f => ({...f, quantity: e.target.value}))}
                          className="h-7 text-xs bg-secondary border-border w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={inlineStructure.materialId}
                          onValueChange={v => setInlineStructure(f => ({...f, materialId: v}))}>
                          <SelectTrigger className="h-7 text-xs bg-secondary border-border">
                            <SelectValue placeholder="Material" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {materials.map(m => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell colSpan={2}>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-accent text-accent-foreground hover:bg-accent/80"
                            onClick={handleInlineStructureSave}>
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-border"
                            onClick={() => setShowInlineStructure(false)}>
                            Cancel
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {workOrder.WorkOrderStructure.length === 0 && !showInlineStructure ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        No structures found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    workOrder.WorkOrderStructure.map(s => (
                      <TableRow key={s.id} className="border-border/40 hover:bg-secondary/50">
                        <TableCell className={`${tdClass} text-foreground font-medium`}>
                          {s.clientNumber ?? '-'}
                        </TableCell>
                        <TableCell className={tdClass}>{s.tag ?? '-'}</TableCell>
                        <TableCell className={tdClass}>
                          <span className="max-w-[180px] truncate inline-block">{s.shortDesciption ?? '-'}</span>
                        </TableCell>
                        <TableCell className={tdClass}>{s.quantity ?? '-'}</TableCell>
                        <TableCell className={tdClass}>{s.Material.name}</TableCell>
                        <TableCell className={tdClass}>
                          {s.Employee.firstName} {s.Employee.lastName}
                        </TableCell>
                        <TableCell className={tdClass}>{formatDate(s.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── Trainings ─────────────────────────────────────────────────────── */}
          <TabsContent value="trainings" className="mt-3">
            <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/60">
                    <TableHead className={thClass}>Training</TableHead>
                    {/* Extend columns once Training model fields are shared */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workOrder.Training.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={1} className="h-24 text-center text-muted-foreground">
                        No trainings found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    workOrder.Training.map(t => (
                      <TableRow key={t.id} className="border-border/40 hover:bg-secondary/50">
                        <TableCell className={tdClass}>{t.id}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* ── Time Registry Dialog ───────────────────────────────────────────────── */}
      <Dialog open={dialogTimeRegistry} onOpenChange={setDialogTimeRegistry}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Time Registry</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Work Date</Label>
                <Input
                  type="date"
                  value={dialogTimeRegistryForm.workDate}
                  onChange={e => setDialogTimeRegistryForm(f => ({...f, workDate: e.target.value}))}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Hour Type</Label>
                <Select
                  value={dialogTimeRegistryForm.hourtypeId}
                  onValueChange={v => setDialogTimeRegistryForm(f => ({...f, hourtypeId: v}))}>
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
                  value={dialogTimeRegistryForm.startTime}
                  onChange={e => setDialogTimeRegistryForm(f => ({...f, startTime: e.target.value}))}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">End Time</Label>
                <Input
                  type="time"
                  value={dialogTimeRegistryForm.endTime}
                  onChange={e => setDialogTimeRegistryForm(f => ({...f, endTime: e.target.value}))}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Break Start</Label>
                <Input
                  type="time"
                  value={dialogTimeRegistryForm.startBreak}
                  onChange={e => setDialogTimeRegistryForm(f => ({...f, startBreak: e.target.value}))}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Break End</Label>
                <Input
                  type="time"
                  value={dialogTimeRegistryForm.endBreak}
                  onChange={e => setDialogTimeRegistryForm(f => ({...f, endBreak: e.target.value}))}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Activity Description</Label>
              <Textarea
                value={dialogTimeRegistryForm.activityDescription}
                onChange={e => setDialogTimeRegistryForm(f => ({...f, activityDescription: e.target.value}))}
                rows={2}
                className="bg-secondary border-border resize-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Invoice Info</Label>
              <Input
                value={dialogTimeRegistryForm.invoiceInfo}
                onChange={e => setDialogTimeRegistryForm(f => ({...f, invoiceInfo: e.target.value}))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Additional Info</Label>
              <Textarea
                value={dialogTimeRegistryForm.aditionalInfo}
                onChange={e => setDialogTimeRegistryForm(f => ({...f, aditionalInfo: e.target.value}))}
                rows={2}
                className="bg-secondary border-border resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                <Label className="text-xs text-muted-foreground">On Site</Label>
                <Switch
                  checked={dialogTimeRegistryForm.onSite}
                  onCheckedChange={v => setDialogTimeRegistryForm(f => ({...f, onSite: v}))}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                <Label className="text-xs text-muted-foreground">Invoice Time</Label>
                <Switch
                  checked={dialogTimeRegistryForm.invoiceTime}
                  onCheckedChange={v => setDialogTimeRegistryForm(f => ({...f, invoiceTime: v}))}
                />
              </div>
            </div>
            <EmployeeMultiSelect
              value={dialogTimeRegistryForm.employeeIds}
              onChange={ids => setDialogTimeRegistryForm(f => ({...f, employeeIds: ids}))}
              employees={employees}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogTimeRegistry(false)} className="border-border">
              Cancel
            </Button>
            <Button
              onClick={handleDialogTimeRegistrySave}
              className="bg-accent text-accent-foreground hover:bg-accent/80">
              Add Time Registry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Structure Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={dialogStructure} onOpenChange={setDialogStructure}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Structure</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Client Number</Label>
                <Input
                  value={dialogStructureForm.clientNumber}
                  onChange={e => setDialogStructureForm(f => ({...f, clientNumber: e.target.value}))}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Tag</Label>
                <Input
                  value={dialogStructureForm.tag}
                  onChange={e => setDialogStructureForm(f => ({...f, tag: e.target.value}))}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Quantity</Label>
                <Input
                  type="number"
                  value={dialogStructureForm.quantity}
                  onChange={e => setDialogStructureForm(f => ({...f, quantity: e.target.value}))}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Short Description</Label>
                <Input
                  value={dialogStructureForm.shortDesciption}
                  onChange={e => setDialogStructureForm(f => ({...f, shortDesciption: e.target.value}))}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Material</Label>
              <Select
                value={dialogStructureForm.materialId}
                onValueChange={v => setDialogStructureForm(f => ({...f, materialId: v}))}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {materials.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Long Description</Label>
              <Textarea
                value={dialogStructureForm.longDescription}
                onChange={e => setDialogStructureForm(f => ({...f, longDescription: e.target.value}))}
                rows={2}
                className="bg-secondary border-border resize-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Additional Info</Label>
              <Textarea
                value={dialogStructureForm.aditionalInfo}
                onChange={e => setDialogStructureForm(f => ({...f, aditionalInfo: e.target.value}))}
                rows={2}
                className="bg-secondary border-border resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogStructure(false)} className="border-border">
              Cancel
            </Button>
            <Button onClick={handleDialogStructureSave} className="bg-accent text-accent-foreground hover:bg-accent/80">
              Add Structure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
