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
    const tableEl = tableScrollRef.current
    const bottomEl = bottomScrollRef.current
    if (!tableEl || !bottomEl) return

    let syncingFromTable = false
    let syncingFromBottom = false

    const updateSizes = () => {
      const clientWidth = tableEl.clientWidth
      const scrollWidth = tableEl.scrollWidth

      setBottomScrollbarWidth(clientWidth)
      setTableScrollWidth(scrollWidth)
      setHasOverflow(scrollWidth > clientWidth + 1)
    }

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

    updateSizes()

    tableEl.addEventListener('scroll', handleTableScroll)
    bottomEl.addEventListener('scroll', handleBottomScroll)
    window.addEventListener('resize', updateSizes)

    const resizeObserver = new ResizeObserver(updateSizes)
    resizeObserver.observe(tableEl)

    return () => {
      tableEl.removeEventListener('scroll', handleTableScroll)
      bottomEl.removeEventListener('scroll', handleBottomScroll)
      window.removeEventListener('resize', updateSizes)
      resizeObserver.disconnect()
    }
  }, [mounted])

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

  const showStickyScrollbar = mounted && hasOverflow && isInView

  const stickyScrollbar = showStickyScrollbar ? (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-border bg-background">
      <div
        ref={bottomScrollRef}
        className="mx-auto overflow-x-scroll overflow-y-hidden"
        style={{width: bottomScrollbarWidth, height: 16}}>
        <div style={{width: tableScrollWidth, height: 1}} />
      </div>
    </div>
  ) : null

  return (
    <>
      <div ref={wrapperRef} className={`rounded-xl border border-border ${className}`}>
        <div ref={tableScrollRef} className="overflow-x-auto">
          {children}
        </div>
      </div>

      {mounted && createPortal(stickyScrollbar, document.body)}
    </>
  )
}
