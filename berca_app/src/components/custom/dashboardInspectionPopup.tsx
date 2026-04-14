'use client'

import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import type {Route} from 'next'
import {Bell, X} from 'lucide-react'

// Keep this key/toggle so we can easily reuse the same "show once per session" pattern later.
const INSPECTION_POPUP_SESSION_KEY = 'dashboard-inspection-popup-seen'
const ENABLE_SESSION_GATING = true

interface DashboardInspectionPopupProps {
  upcomingInspectionsCount: number
  inspectionWarningDays: number
  maintenanceHref: string | null
}

export function DashboardInspectionPopup({
  upcomingInspectionsCount,
  inspectionWarningDays,
  maintenanceHref,
}: DashboardInspectionPopupProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (upcomingInspectionsCount <= 0) return

    if (!ENABLE_SESSION_GATING) {
      setOpen(true)
      return
    }

    const hasSeenPopup = window.sessionStorage.getItem(INSPECTION_POPUP_SESSION_KEY) === '1'
    if (hasSeenPopup) {
      setOpen(false)
      return
    }

    setOpen(true)
    window.sessionStorage.setItem(INSPECTION_POPUP_SESSION_KEY, '1')
  }, [upcomingInspectionsCount])

  if (!open || upcomingInspectionsCount <= 0) return null

  const isClickable = Boolean(maintenanceHref)

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50">
      <div
        className={`pointer-events-auto relative w-80 rounded-lg border border-amber-300/60 bg-amber-50 p-4 pr-10 text-sm text-amber-900 shadow-lg dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200 ${
          isClickable ? 'cursor-pointer' : ''
        }`}
        onClick={() => {
          if (maintenanceHref) router.push(maintenanceHref as Route)
        }}>
        <button
          type="button"
          className="absolute right-2 top-2 rounded p-1 text-amber-900/80 transition hover:bg-amber-200/60 hover:text-amber-950 dark:text-amber-200/80 dark:hover:bg-amber-900/40"
          onClick={e => {
            e.stopPropagation()
            setOpen(false)
          }}
          aria-label="Close inspection reminder">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-2">
          <Bell className="mt-0.5 h-4 w-4" />
          <p>
            {upcomingInspectionsCount} inspection{upcomingInspectionsCount === 1 ? '' : 's'} soon (within{' '}
            {inspectionWarningDays} day{inspectionWarningDays === 1 ? '' : 's'}).
            {maintenanceHref ? ' Open Maintenance.' : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

