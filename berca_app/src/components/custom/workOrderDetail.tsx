'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowLeft, Pencil, X, Save} from 'lucide-react'
import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import {Badge} from '@/components/ui/badge'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {createWorkOrderAction, updateWorkOrderAction} from '@/serverFunctions/workOrders'
import type {Route} from 'next'
import type {WorkOrderDetailData} from '@/extra/workOrders'
import {formatDate, thClass, toInputDate} from '@/extra/workOrderHelpers'
import type {EmployeeOption, HourTypeOption, MaterialOption} from '@/types/workOrder'
import {WorkOrderTimeRegistries} from '@/components/custom/workOrderTimeRegistries'
import {WorkOrderStructures} from '@/components/custom/workOrderStructures'
import {generateWorkOrderNumber} from '@/lib/utils'

interface WorkOrderDetailProps {
  workOrder: WorkOrderDetailData | null
  projectId: string
  employees: EmployeeOption[]
  hourTypes: HourTypeOption[]
  materials: MaterialOption[]
  currentUserLevel: number
  currentUserRole: string
}

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

  const [form, setForm] = useState({
    workOrderNumber: workOrder?.workOrderNumber ?? (isNew ? generateWorkOrderNumber() : ''),
    description: workOrder?.description ?? '',
    additionalInfo: workOrder?.additionalInfo ?? '',
    startDate: toInputDate(workOrder?.startDate) || new Date().toISOString().slice(0, 10),
    endDate: toInputDate(workOrder?.endDate),
    hoursMaterialClosed: workOrder?.hoursMaterialClosed ?? false,
    invoiceSent: workOrder?.invoiceSent ?? false,
    completed: workOrder?.completed ?? false,
  })

  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canDelete = currentUserRole === 'Administrator' || currentUserLevel >= 80 || currentUserRole === 'Project'

  const permissions = {
    canAdd: currentUserLevel >= 20,
    canDelete,
    isAdmin,
  }

  function handleCancel() {
    if (isNew) {
      router.back()
      return
    }
    setForm({
      workOrderNumber: workOrder.workOrderNumber ?? '',
      description: workOrder.description ?? '',
      additionalInfo: workOrder.additionalInfo ?? '',
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
        additionalInfo: form.additionalInfo || null,
        startDate: new Date(form.startDate),
        endDate: form.endDate ? new Date(form.endDate) : null,
        projectId,
        hoursMaterialClosed: form.hoursMaterialClosed,
        invoiceSent: form.invoiceSent,
        completed: form.completed,
      }
      if (isNew) {
        await createWorkOrderAction(payload)
      } else {
        await updateWorkOrderAction({...payload, id: workOrder.id})
        setEditing(false)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
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

      {/* Work Order info card */}
      <div className="rounded-xl border border-border/60 bg-card p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Work Order Number</Label>
            {editing ? (
              <Input
                value={form.workOrderNumber}
                readOnly
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
                rows={3}
                onChange={e => setForm(f => ({...f, description: e.target.value}))}
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
                value={form.additionalInfo}
                rows={3}
                onChange={e => setForm(f => ({...f, additionalInfo: e.target.value}))}
                className="bg-secondary border-border resize-none"
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{workOrder!.additionalInfo ?? '-'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs — existing records only */}
      {!isNew && (
        <Tabs defaultValue="timeregistries">
          <TabsList className="bg-secondary border border-border/60">
            <TabsTrigger value="timeregistries">
              Time Registries
              <Badge variant="secondary" className="ml-2 text-xs">
                {workOrder.TimeRegistry.filter(r => !r.deleted).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="structures">
              Structures
              <Badge variant="secondary" className="ml-2 text-xs">
                {workOrder.WorkOrderStructure.filter(s => !s.deleted).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="trainings">
              Trainings
              <Badge variant="secondary" className="ml-2 text-xs">
                {workOrder.Training.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeregistries" className="mt-3">
            <WorkOrderTimeRegistries
              timeRegistries={workOrder.TimeRegistry}
              workOrderId={workOrder.id}
              projectId={projectId}
              employees={employees}
              hourTypes={hourTypes}
              permissions={permissions}
            />
          </TabsContent>

          <TabsContent value="structures" className="mt-3">
            <WorkOrderStructures
              structures={workOrder.WorkOrderStructure}
              workOrderId={workOrder.id}
              materials={materials}
              permissions={permissions}
            />
          </TabsContent>

          <TabsContent value="trainings" className="mt-3">
            <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/60">
                    <TableHead className={thClass}>Training</TableHead>
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
                        <TableCell className="text-sm text-muted-foreground">{t.id}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
