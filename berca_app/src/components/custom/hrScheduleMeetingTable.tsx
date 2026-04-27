'use client'

import {useMemo, useState} from 'react'
import {useRouter} from 'next/navigation'
import {CalendarClock, CheckCircle2, MapPin, Pencil, Plus, Search, Timer, Trash2, UserRound} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import type {HrEvaluationEmployeeOption, HrEvaluationMeeting, HrEvaluationStatus} from '@/types/hrEvaluationMeeting'
import {
  combineHrScheduleMeetingDateTime,
  HrScheduleMeetingFormDialog,
  type HrScheduleMeetingFormValue,
} from '@/components/custom/hrScheduleMeetingFormDialog'
import {
  createHrEvaluationMeetingAction,
  deleteHrEvaluationMeetingAction,
  updateHrEvaluationMeetingAction,
} from '@/serverFunctions/hrEvaluationMeetings'

interface HrScheduleMeetingTableProps {
  meetings: HrEvaluationMeeting[]
  employees: HrEvaluationEmployeeOption[]
  departmentId: string
}

type StatusFilter = HrEvaluationStatus | 'all'

function formatDate(startAt: string) {
  return new Intl.DateTimeFormat('nl-BE', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(startAt))
}

function formatTimeRange(startAt: string, endAt: string) {
  const formatter = new Intl.DateTimeFormat('nl-BE', {hour: '2-digit', minute: '2-digit'})
  return `${formatter.format(new Date(startAt))} - ${formatter.format(new Date(endAt))}`
}

function statusBadge(status: HrEvaluationStatus) {
  if (status === 'completed') {
    return <Badge className="border-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Completed</Badge>
  }
  if (status === 'cancelled') return <Badge variant="secondary">Cancelled</Badge>
  return <Badge variant="outline">Planned</Badge>
}

export function HrScheduleMeetingTable({meetings, employees, departmentId}: HrScheduleMeetingTableProps) {
  const router = useRouter()
  const [nameFilter, setNameFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<HrEvaluationMeeting | null>(null)

  const filteredMeetings = useMemo(() => {
    const normalizedFilter = nameFilter.trim().toLowerCase()

    return meetings.filter(meeting => {
      if (statusFilter !== 'all' && meeting.status !== statusFilter) return false
      if (!normalizedFilter) return true
      return meeting.employeeName.toLowerCase().includes(normalizedFilter)
    })
  }, [meetings, nameFilter, statusFilter])

  function openCreateDialog() {
    setEditingMeeting(null)
    setOpen(true)
  }

  function openEditDialog(meeting: HrEvaluationMeeting) {
    setEditingMeeting(meeting)
    setOpen(true)
  }

  async function handleSave(form: HrScheduleMeetingFormValue) {
    setSaving(true)
    try {
      const startAt = combineHrScheduleMeetingDateTime(form.date, form.startTime)
      const endAt = combineHrScheduleMeetingDateTime(form.date, form.endTime)
      const payload = {
        departmentId,
        employeeId: form.employeeId,
        conversationType: form.conversationType.trim(),
        startAt,
        endAt,
        place: form.place.trim() || null,
        status: form.status,
        notes: form.notes.trim() || null,
      }

      if (editingMeeting) {
        const nextCompletedAt = form.status === 'completed' ? new Date(editingMeeting.completedAt ?? new Date()) : null

        await updateHrEvaluationMeetingAction({
          ...payload,
          id: editingMeeting.id,
          completedAt: nextCompletedAt,
        })
      } else {
        await createHrEvaluationMeetingAction(payload)
      }

      setOpen(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(meeting: HrEvaluationMeeting) {
    await deleteHrEvaluationMeetingAction({id: meeting.id, departmentId})
    router.refresh()
  }

  async function handleMarkCompleted(meeting: HrEvaluationMeeting) {
    await updateHrEvaluationMeetingAction({
      id: meeting.id,
      departmentId,
      employeeId: meeting.employeeId,
      conversationType: meeting.conversationType,
      startAt: new Date(meeting.startAt),
      endAt: new Date(meeting.endAt),
      place: meeting.place,
      status: 'completed',
      notes: meeting.notes,
      completedAt: new Date(),
    })
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">HR Schedule meetings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Plan evaluations and maintain history for inspection.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={nameFilter}
              onChange={event => setNameFilter(event.target.value)}
              placeholder="Filter op naam"
              className="pl-9"
            />
          </label>
          <Select value={statusFilter} onValueChange={value => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            New Schedule Meeting
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <span className="inline-flex items-center gap-2">
                  <UserRound className="h-4 w-4" />
                  Wie?
                </span>
              </TableHead>
              <TableHead>
                <span className="inline-flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  Type of meeting
                </span>
              </TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>
                <span className="inline-flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  Time
                </span>
              </TableHead>
              <TableHead>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </span>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMeetings.map(meeting => (
              <TableRow key={meeting.id}>
                <TableCell className="font-medium">{meeting.employeeName}</TableCell>
                <TableCell>{meeting.conversationType}</TableCell>
                <TableCell>{formatDate(meeting.startAt)}</TableCell>
                <TableCell>{formatTimeRange(meeting.startAt, meeting.endAt)}</TableCell>
                <TableCell>{meeting.place ?? '-'}</TableCell>
                <TableCell>{statusBadge(meeting.status)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {meeting.status === 'planned' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMarkCompleted(meeting)}
                        aria-label="Mark evaluation completed">
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(meeting)}
                      aria-label="Edit evaluation">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(meeting)}
                      aria-label="Delete evaluation">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!filteredMeetings.length && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                  No meetings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <HrScheduleMeetingFormDialog
        open={open}
        onOpenChange={setOpen}
        meeting={editingMeeting}
        employees={employees}
        saving={saving}
        onSave={handleSave}
      />
    </div>
  )
}
