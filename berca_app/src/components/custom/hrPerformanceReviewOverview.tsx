'use client'

import {useMemo, useState} from 'react'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Textarea} from '@/components/ui/textarea'
import {useRouter} from 'next/navigation'
import {CalendarCheck2, Clock3, Pencil, Plus, Search, TimerReset, Trash2, UserRound} from 'lucide-react'
import type {
  HrPerformanceOvertime,
  HrPerformanceProjectOption,
  HrPerformanceReviewRow,
  HrPerformanceTimeRegistryOption,
} from '@/types/hrPerformanceReview'
import {
  createHrEmployeeOvertimeAction,
  deleteHrEmployeeOvertimeAction,
  updateHrEmployeeOvertimeAction,
  updateHrPerformanceSettingsAction,
} from '@/serverFunctions/hrPerformanceReview'

interface HrPerformanceReviewOverviewProps {
  rows: HrPerformanceReviewRow[]
  projects: HrPerformanceProjectOption[]
  timeRegistryOptions: HrPerformanceTimeRegistryOption[]
  departmentId: string
  canManageOvertime: boolean
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('nl-BE', {day: '2-digit', month: 'short', year: 'numeric'}).format(new Date(value))
}

function scheduleLabel(value: string) {
  if (value === 'fixed') return 'Fixed'
  if (value === 'variable') return 'Variable'
  return value
}

function overtimeBadge(row: HrPerformanceReviewRow) {
  if (!row.overtimeTrackingEnabled) return <Badge variant="secondary">Not active</Badge>
  if (!row.maxOvertimeHours) return <Badge variant="outline">No limit</Badge>
  if (Number(row.overtimeRemainingHours ?? 0) <= 0) return <Badge variant="destructive">Limit reached</Badge>
  return <Badge className="border-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Active</Badge>
}

type SettingsForm = {
  weeklyWorkHours: string
  workScheduleType: 'fixed' | 'variable'
  overtimeTrackingEnabled: boolean
  maxOvertimeHours: string
}

type OvertimeForm = {
  projectId: string
  sourceTimeRegistryId: string
  overtimeDate: string
  hours: string
  description: string
}

function toInputDate(value: string) {
  const date = new Date(value)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function HrPerformanceReviewOverview({
  rows,
  projects,
  timeRegistryOptions,
  departmentId,
  canManageOvertime,
}: HrPerformanceReviewOverviewProps) {
  const router = useRouter()
  const [filter, setFilter] = useState('')
  const [saving, setSaving] = useState(false)
  const [settingsEmployee, setSettingsEmployee] = useState<HrPerformanceReviewRow | null>(null)
  const [overtimeEmployee, setOvertimeEmployee] = useState<HrPerformanceReviewRow | null>(null)
  const [editingOvertime, setEditingOvertime] = useState<HrPerformanceOvertime | null>(null)
  const [settingsForm, setSettingsForm] = useState<SettingsForm>({
    weeklyWorkHours: '40',
    workScheduleType: 'fixed',
    overtimeTrackingEnabled: false,
    maxOvertimeHours: '',
  })
  const [overtimeForm, setOvertimeForm] = useState<OvertimeForm>({
    projectId: '',
    sourceTimeRegistryId: '',
    overtimeDate: '',
    hours: '',
    description: '',
  })

  const filteredRows = useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase()
    if (!normalizedFilter) return rows
    return rows.filter(row => row.employeeName.toLowerCase().includes(normalizedFilter))
  }, [filter, rows])

  const trackedOvertimeCount = rows.filter(row => row.overtimeTrackingEnabled).length
  const plannedReviewCount = rows.filter(row => row.nextPlannedReviewAt).length
  const eligibleTimeRegistryOptions = overtimeEmployee
    ? timeRegistryOptions.filter(option => option.employeeIds.includes(overtimeEmployee.employeeId))
    : []
  const selectedTimeRegistryOption =
    timeRegistryOptions.find(option => option.id === overtimeForm.sourceTimeRegistryId) ?? null

  function openSettingsDialog(row: HrPerformanceReviewRow) {
    if (!canManageOvertime) return

    setSettingsEmployee(row)
    setSettingsForm({
      weeklyWorkHours: row.weeklyWorkHours,
      workScheduleType: row.workScheduleType === 'variable' ? 'variable' : 'fixed',
      overtimeTrackingEnabled: row.overtimeTrackingEnabled,
      maxOvertimeHours: row.maxOvertimeHours ?? '',
    })
  }

  function openCreateOvertimeDialog(row: HrPerformanceReviewRow) {
    if (!canManageOvertime) return

    if (!row.overtimeTrackingEnabled) {
      openSettingsDialog(row)
      return
    }

    setOvertimeEmployee(row)
    setEditingOvertime(null)
    setOvertimeForm({
      projectId: '',
      sourceTimeRegistryId: '',
      overtimeDate: toInputDate(new Date().toISOString()),
      hours: '',
      description: '',
    })
  }

  function openEditOvertimeDialog(row: HrPerformanceReviewRow, overtime: HrPerformanceOvertime) {
    if (!canManageOvertime) return

    setOvertimeEmployee(row)
    setEditingOvertime(overtime)
    setOvertimeForm({
      projectId: overtime.projectId,
      sourceTimeRegistryId: overtime.sourceTimeRegistryId ?? '',
      overtimeDate: toInputDate(overtime.overtimeDate),
      hours: overtime.hours,
      description: overtime.description ?? '',
    })
  }

  async function handleSaveSettings() {
    if (!settingsEmployee) return
    setSaving(true)
    try {
      await updateHrPerformanceSettingsAction({
        departmentId,
        employeeId: settingsEmployee.employeeId,
        weeklyWorkHours: Number(settingsForm.weeklyWorkHours),
        workScheduleType: settingsForm.workScheduleType,
        overtimeTrackingEnabled: settingsForm.overtimeTrackingEnabled,
        maxOvertimeHours: settingsForm.maxOvertimeHours === '' ? null : Number(settingsForm.maxOvertimeHours),
      })
      setSettingsEmployee(null)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveOvertime() {
    if (!overtimeEmployee) return
    setSaving(true)
    try {
      const payload = {
        departmentId,
        employeeId: overtimeEmployee.employeeId,
        projectId: overtimeForm.projectId,
        sourceTimeRegistryId: overtimeForm.sourceTimeRegistryId,
        overtimeDate: new Date(`${overtimeForm.overtimeDate}T00:00:00`),
        hours: Number(overtimeForm.hours),
        description: overtimeForm.description.trim() || null,
      }

      if (editingOvertime) {
        await updateHrEmployeeOvertimeAction({...payload, id: editingOvertime.id})
      } else {
        await createHrEmployeeOvertimeAction(payload)
      }

      setOvertimeEmployee(null)
      setEditingOvertime(null)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteOvertime(overtime: HrPerformanceOvertime) {
    await deleteHrEmployeeOvertimeAction({id: overtime.id, departmentId})
    router.refresh()
  }

  function handleSelectTimeRegistry(sourceTimeRegistryId: string) {
    const option = timeRegistryOptions.find(row => row.id === sourceTimeRegistryId)

    setOvertimeForm(form => ({
      ...form,
      sourceTimeRegistryId,
      projectId: option?.projectId ?? '',
      overtimeDate: option ? toInputDate(option.workDate) : form.overtimeDate,
    }))
  }

  const settingsValid =
    settingsForm.weeklyWorkHours !== '' &&
    Number(settingsForm.weeklyWorkHours) >= 0 &&
    (settingsForm.maxOvertimeHours === '' || Number(settingsForm.maxOvertimeHours) >= 0)
  const overtimeValid =
    overtimeEmployee?.overtimeTrackingEnabled &&
    overtimeForm.sourceTimeRegistryId !== '' &&
    overtimeForm.projectId !== '' &&
    overtimeForm.overtimeDate !== '' &&
    Number(overtimeForm.hours) > 0

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserRound className="h-4 w-4" />
            Employees
          </div>
          <div className="mt-2 text-2xl font-semibold">{rows.length}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarCheck2 className="h-4 w-4" />
            Planned reviews
          </div>
          <div className="mt-2 text-2xl font-semibold">{plannedReviewCount}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TimerReset className="h-4 w-4" />
            Overtime active
          </div>
          <div className="mt-2 text-2xl font-semibold">{trackedOvertimeCount}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Performance Review</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of evaluations, standard work schedules and registered overtime.
          </p>
          {!canManageOvertime && (
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              You need HR manager permission to update work schedules or overtime.
            </p>
          )}
        </div>
        <label className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={event => setFilter(event.target.value)}
            placeholder="Filter by name"
            className="pl-9"
          />
        </label>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4" />
                  Work schedule
                </span>
              </TableHead>
              <TableHead>Overtime</TableHead>
              <TableHead>Limit</TableHead>
              <TableHead>Latest review</TableHead>
              <TableHead>Next review</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map(row => (
              <TableRow key={row.employeeId}>
                <TableCell>
                  <div className="font-medium">{row.employeeName}</div>
                  <div className="text-xs text-muted-foreground">{row.mail ?? '-'}</div>
                </TableCell>
                <TableCell>
                  {row.weeklyWorkHours}h/w - {scheduleLabel(row.workScheduleType)}
                </TableCell>
                <TableCell>{row.overtimeHours}h</TableCell>
                <TableCell>
                  {row.maxOvertimeHours ? `${row.overtimeRemainingHours}h available of ${row.maxOvertimeHours}h` : '-'}
                </TableCell>
                <TableCell>{formatDate(row.latestCompletedReviewAt)}</TableCell>
                <TableCell>{formatDate(row.nextPlannedReviewAt)}</TableCell>
                <TableCell>{overtimeBadge(row)}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openSettingsDialog(row)}
                      disabled={!canManageOvertime}>
                      <Pencil className="h-4 w-4" />
                      Settings
                    </Button>
                    <Button
                      type="button"
                      variant={row.overtimeTrackingEnabled ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => openCreateOvertimeDialog(row)}
                      disabled={!canManageOvertime}>
                      <Plus className="h-4 w-4" />
                      Overtime
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!filteredRows.length && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                  No employees found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.flatMap(row =>
              row.overtimeEntries.map(overtime => (
                <TableRow key={overtime.id}>
                  <TableCell className="font-medium">{row.employeeName}</TableCell>
                  <TableCell>{overtime.projectName}</TableCell>
                  <TableCell>{formatDate(overtime.overtimeDate)}</TableCell>
                  <TableCell>{overtime.hours}h</TableCell>
                  <TableCell>{overtime.description ?? '-'}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditOvertimeDialog(row, overtime)}
                        disabled={!canManageOvertime}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteOvertime(overtime)}
                        disabled={!canManageOvertime}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )),
            )}
            {!filteredRows.some(row => row.overtimeEntries.length > 0) && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                  No overtime entries found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(settingsEmployee)} onOpenChange={open => !open && setSettingsEmployee(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Work schedule and overtime</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Standard hours/week</Label>
              <Input
                type="number"
                min="0"
                step="0.25"
                value={settingsForm.weeklyWorkHours}
                onChange={event => setSettingsForm(form => ({...form, weeklyWorkHours: event.target.value}))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Work schedule</Label>
              <Select
                value={settingsForm.workScheduleType}
                onValueChange={value =>
                  setSettingsForm(form => ({...form, workScheduleType: value as 'fixed' | 'variable'}))
                }>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="variable">Variable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Track overtime</Label>
              <Select
                value={settingsForm.overtimeTrackingEnabled ? 'yes' : 'no'}
                onValueChange={value => setSettingsForm(form => ({...form, overtimeTrackingEnabled: value === 'yes'}))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Maximum overtime</Label>
              <Input
                type="number"
                min="0"
                step="0.25"
                value={settingsForm.maxOvertimeHours}
                onChange={event => setSettingsForm(form => ({...form, maxOvertimeHours: event.target.value}))}
                placeholder="No limit"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSettingsEmployee(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveSettings} disabled={!settingsValid || saving}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(overtimeEmployee)}
        onOpenChange={open => {
          if (!open) {
            setOvertimeEmployee(null)
            setEditingOvertime(null)
          }
        }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingOvertime ? 'Edit overtime' : 'Add overtime'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>On-site time registry *</Label>
              <Select
                value={overtimeForm.sourceTimeRegistryId || 'none'}
                onValueChange={value => handleSelectTimeRegistry(value === 'none' ? '' : value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose on-site time registry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>
                    Choose on-site time registry
                  </SelectItem>
                  {eligibleTimeRegistryOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!eligibleTimeRegistryOptions.length && (
                <span className="text-xs text-muted-foreground">
                  No on-site time registries found for this employee. Office hours cannot be registered as overtime.
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Project</Label>
              <Input
                value={
                  selectedTimeRegistryOption?.projectName ??
                  projects.find(project => project.id === overtimeForm.projectId)?.name ??
                  ''
                }
                disabled
                placeholder="Automatically set from on-site time registry"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Date *</Label>
              <Input
                type="date"
                value={overtimeForm.overtimeDate}
                onChange={event => setOvertimeForm(form => ({...form, overtimeDate: event.target.value}))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Number of hours *</Label>
              <Input
                type="number"
                min="0"
                step="0.25"
                value={overtimeForm.hours}
                onChange={event => setOvertimeForm(form => ({...form, hours: event.target.value}))}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={overtimeForm.description}
                onChange={event => setOvertimeForm(form => ({...form, description: event.target.value}))}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOvertimeEmployee(null)
                setEditingOvertime(null)
              }}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveOvertime} disabled={!overtimeValid || saving}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
