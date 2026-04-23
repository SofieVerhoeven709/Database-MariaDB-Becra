'use client'

import {ReactNode, useEffect, useRef, useState} from 'react'

interface StickyTableScrollProps {
  children: ReactNode
  className?: string
}

export function StickyTableScroll({children, className = ''}: StickyTableScrollProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const tableScrollRef = useRef<HTMLDivElement | null>(null)
  const bottomScrollRef = useRef<HTMLDivElement | null>(null)

  const [bottomScrollbarWidth, setBottomScrollbarWidth] = useState(0)
  const [tableScrollWidth, setTableScrollWidth] = useState(0)
  const [hasOverflow, setHasOverflow] = useState(false)
  const [isInView, setIsInView] = useState(false)

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
  }, [])

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

  const showStickyScrollbar = hasOverflow && isInView

  return (
    <>
      <div ref={wrapperRef} className={`rounded-xl border border-border ${className}`}>
        <div ref={tableScrollRef} className="overflow-x-auto">
          {children}
        </div>
      </div>

      {showStickyScrollbar && (
        <div className="fixed bottom-0 left-0 z-50 w-full border-t border-border bg-background/95 backdrop-blur">
          <div className="w-full px-4">
            <div
              ref={bottomScrollRef}
              className="overflow-x-scroll overflow-y-hidden"
              style={{width: bottomScrollbarWidth, height: 16}}>
              <div style={{width: tableScrollWidth, height: 1}} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
