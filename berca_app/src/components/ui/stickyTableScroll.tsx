'use client'

import {ReactNode, useEffect, useRef, useState} from 'react'
import {createPortal} from 'react-dom'

interface StickyTableScrollProps {
  children: ReactNode
  className?: string
}

export function StickyTableScroll({children, className = ''}: StickyTableScrollProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const tableScrollRef = useRef<HTMLDivElement | null>(null)
  const bottomScrollRef = useRef<HTMLDivElement | null>(null)

  const [mounted, setMounted] = useState(false)
  const [bottomScrollbarWidth, setBottomScrollbarWidth] = useState(0)
  const [tableScrollWidth, setTableScrollWidth] = useState(0)
  const [hasOverflow, setHasOverflow] = useState(false)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const wrapperEl = wrapperRef.current
    if (!wrapperEl || !mounted) return

    const tableEl = wrapperEl.querySelector<HTMLDivElement>('[data-slot="table-container"]')
    if (!tableEl) return

    tableScrollRef.current = tableEl

    const updateSizes = () => {
      const clientWidth = tableEl.clientWidth
      const scrollWidth = tableEl.scrollWidth

      setBottomScrollbarWidth(clientWidth)
      setTableScrollWidth(scrollWidth)
      setHasOverflow(scrollWidth > clientWidth + 1)
    }

    updateSizes()

    window.addEventListener('resize', updateSizes)

    const resizeObserver = new ResizeObserver(updateSizes)
    resizeObserver.observe(tableEl)

    return () => {
      window.removeEventListener('resize', updateSizes)
      resizeObserver.disconnect()
    }
  }, [mounted])

  useEffect(() => {
    const tableEl = tableScrollRef.current
    const bottomEl = bottomScrollRef.current
    if (!tableEl || !bottomEl || !mounted) return

    let syncingFromTable = false
    let syncingFromBottom = false

    const handleTableScroll = () => {
      if (syncingFromBottom) return
      syncingFromTable = true
      bottomEl.scrollLeft = tableEl.scrollLeft
      syncingFromTable = false
    }

    const handleBottomScroll = () => {
      if (syncingFromTable) return
      syncingFromBottom = true
      tableEl.scrollLeft = bottomEl.scrollLeft
      syncingFromBottom = false
    }

    bottomEl.scrollLeft = tableEl.scrollLeft

    tableEl.addEventListener('scroll', handleTableScroll)
    bottomEl.addEventListener('scroll', handleBottomScroll)

    return () => {
      tableEl.removeEventListener('scroll', handleTableScroll)
      bottomEl.removeEventListener('scroll', handleBottomScroll)
    }
  }, [mounted, hasOverflow, tableScrollWidth])

  useEffect(() => {
    const wrapperEl = wrapperRef.current
    if (!wrapperEl) return

    const observer = new IntersectionObserver(
      entries => {
        setIsInView(entries[0]?.isIntersecting ?? false)
      },
      {threshold: 0},
    )

    observer.observe(wrapperEl)
    return () => observer.disconnect()
  }, [])

  const stickyScrollbar = (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-border bg-background"
      style={{
        opacity: mounted && hasOverflow && isInView ? 1 : 0,
        pointerEvents: mounted && hasOverflow && isInView ? 'auto' : 'none',
      }}>
      <div
        ref={bottomScrollRef}
        className="mx-auto overflow-x-scroll overflow-y-hidden"
        style={{width: bottomScrollbarWidth, height: 16}}>
        <div style={{width: tableScrollWidth, height: 1}} />
      </div>
    </div>
  )

  return (
    <>
      <div ref={wrapperRef} className={`rounded-xl border border-border ${className}`}>
        {children}
      </div>
      {mounted ? createPortal(stickyScrollbar, document.body) : null}
    </>
  )
}
