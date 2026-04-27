'use client'

import {useEffect, useMemo, useState} from 'react'
import {useRouter} from 'next/navigation'
import type {Route} from 'next'
import {CalendarClock, MapPin, Timer, UserRound, X} from 'lucide-react'
import type {HrEvaluationMeeting} from '@/types/hrEvaluationMeeting'

const HR_POPUP_SESSION_KEY = 'dashboard-hr-meeting-popup-seen'
const ENABLE_SESSION_GATING = true

interface DashboardHrMeetingPopupProps {
  meetings: HrEvaluationMeeting[]
  scheduleHref: string | null
}

function formatDateRange(startAt: string, endAt: string) {
  const start = new Date(startAt)
  const end = new Date(endAt)

  return {
    date: new Intl.DateTimeFormat('nl-BE', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(start),
    time: `${new Intl.DateTimeFormat('nl-BE', {hour: '2-digit', minute: '2-digit'}).format(start)} - ${new Intl.DateTimeFormat(
      'nl-BE',
      {hour: '2-digit', minute: '2-digit'},
    ).format(end)}`,
  }
}

export function DashboardHrMeetingPopup({meetings, scheduleHref}: DashboardHrMeetingPopupProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const firstMeeting = meetings[0]
  const formatted = useMemo(
    () => (firstMeeting ? formatDateRange(firstMeeting.startAt, firstMeeting.endAt) : null),
    [firstMeeting],
  )

  useEffect(() => {
    if (!meetings.length) return

    if (!ENABLE_SESSION_GATING) {
      setOpen(true)
      return
    }

    const hasSeenPopup = window.sessionStorage.getItem(HR_POPUP_SESSION_KEY) === '1'
    if (hasSeenPopup) {
      setOpen(false)
      return
    }

    setOpen(true)
    window.sessionStorage.setItem(HR_POPUP_SESSION_KEY, '1')
  }, [meetings.length])

  if (!open || !firstMeeting || !formatted) return null

  const isClickable = Boolean(scheduleHref)

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-50">
      <div
        className={`pointer-events-auto relative w-88 max-w-[calc(100vw-2rem)] rounded-lg border border-purple-300/70 bg-purple-50 p-4 pr-10 text-sm text-purple-950 shadow-lg dark:border-purple-700/70 dark:bg-purple-950/40 dark:text-purple-100 ${
          isClickable ? 'cursor-pointer' : ''
        }`}
        onClick={() => {
          if (scheduleHref) router.push(scheduleHref as Route)
        }}>
        <button
          type="button"
          className="absolute right-2 top-2 rounded p-1 text-purple-900/80 transition hover:bg-purple-200/70 hover:text-purple-950 dark:text-purple-100/80 dark:hover:bg-purple-900/50"
          onClick={e => {
            e.stopPropagation()
            setOpen(false)
          }}
          aria-label="Close HR meeting reminder">
          <X className="h-4 w-4" />
        </button>

        <div className="mb-3 flex items-start gap-2">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">HR gesprek gepland</p>
            <p className="text-xs text-purple-800/80 dark:text-purple-200/80">
              {meetings.length > 1 ? `${meetings.length} meetings soon` : formatted.date}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex gap-2">
            <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <span className="font-medium">Who:</span> {firstMeeting.employeeName}
            </span>
          </div>
          <div className="flex gap-2">
            <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <span className="font-medium">Type of meeting:</span> {firstMeeting.conversationType}
            </span>
          </div>
          <div className="flex gap-2">
            <Timer className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <span className="font-medium">Time:</span> {formatted.time}
            </span>
          </div>
          <div className="flex gap-2">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <span className="font-medium">Location:</span> {firstMeeting.place}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
