'use client'

import * as React from 'react'
import {createPortal} from 'react-dom'

import {cn} from '@/lib/utils'

function Table({className, ...props}: React.ComponentProps<'table'>) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const stickyScrollRef = React.useRef<HTMLDivElement | null>(null)
  const [mounted, setMounted] = React.useState(false)
  const [hasOverflow, setHasOverflow] = React.useState(false)
  const [isInView, setIsInView] = React.useState(false)
  const [hasOpenDialog, setHasOpenDialog] = React.useState(false)
  const [scrollWidth, setScrollWidth] = React.useState(0)
  const [containerRect, setContainerRect] = React.useState({left: 0, width: 0})

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    const container = containerRef.current
    if (!container || !mounted) return

    const updateMeasurements = () => {
      const rect = container.getBoundingClientRect()
      const nextScrollWidth = container.scrollWidth
      const nextClientWidth = container.clientWidth

      setContainerRect({left: rect.left, width: rect.width})
      setScrollWidth(nextScrollWidth)
      setHasOverflow(nextScrollWidth > nextClientWidth + 1)
    }

    updateMeasurements()

    const resizeObserver = new ResizeObserver(updateMeasurements)
    resizeObserver.observe(container)

    window.addEventListener('resize', updateMeasurements)
    window.addEventListener('scroll', updateMeasurements, true)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateMeasurements)
      window.removeEventListener('scroll', updateMeasurements, true)
    }
  }, [mounted])

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      entries => {
        setIsInView(entries[0]?.isIntersecting ?? false)
      },
      {threshold: 0},
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    if (!mounted) return

    const updateDialogState = () => {
      setHasOpenDialog(Boolean(document.querySelector('[data-slot="dialog-content"][data-state="open"]')))
    }

    updateDialogState()

    const observer = new MutationObserver(updateDialogState)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-state'],
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [mounted])

  React.useEffect(() => {
    const container = containerRef.current
    const stickyScroll = stickyScrollRef.current
    if (!container || !stickyScroll || !mounted) return

    let syncingFromContainer = false
    let syncingFromSticky = false

    const handleContainerScroll = () => {
      if (syncingFromSticky) return
      syncingFromContainer = true
      stickyScroll.scrollLeft = container.scrollLeft
      syncingFromContainer = false
    }

    const handleStickyScroll = () => {
      if (syncingFromContainer) return
      syncingFromSticky = true
      container.scrollLeft = stickyScroll.scrollLeft
      syncingFromSticky = false
    }

    stickyScroll.scrollLeft = container.scrollLeft
    container.addEventListener('scroll', handleContainerScroll)
    stickyScroll.addEventListener('scroll', handleStickyScroll)

    return () => {
      container.removeEventListener('scroll', handleContainerScroll)
      stickyScroll.removeEventListener('scroll', handleStickyScroll)
    }
  }, [mounted, hasOverflow, scrollWidth])

  const showStickyScroll = mounted && hasOverflow && isInView && !hasOpenDialog

  return (
    <div
      ref={containerRef}
      data-slot="table-container"
      className="relative w-full min-h-24 overflow-x-auto [scrollbar-gutter:stable]">
      <table data-slot="table" className={cn('w-full caption-bottom text-sm', className)} {...props} />
      {mounted
        ? createPortal(
            <div
              className="fixed bottom-0 z-[9999] border-t border-border bg-background"
              style={{
                left: containerRect.left,
                width: containerRect.width,
                opacity: showStickyScroll ? 1 : 0,
                pointerEvents: showStickyScroll ? 'auto' : 'none',
              }}>
              <div ref={stickyScrollRef} className="overflow-x-scroll overflow-y-hidden" style={{height: 16}}>
                <div style={{width: scrollWidth, height: 1}} />
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function TableHeader({className, ...props}: React.ComponentProps<'thead'>) {
  return <thead data-slot="table-header" className={cn('[&_tr]:border-b', className)} {...props} />
}

function TableBody({className, ...props}: React.ComponentProps<'tbody'>) {
  return <tbody data-slot="table-body" className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}

function TableFooter({className, ...props}: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn('bg-muted/50 border-t font-medium [&>tr]:last:border-b-0', className)}
      {...props}
    />
  )
}

function TableRow({className, ...props}: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn('hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors', className)}
      {...props}
    />
  )
}

function TableHead({className, ...props}: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  )
}

function TableCell({className, ...props}: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] [&.text-right_[data-slot=button][data-variant=ghost]]:size-7 [&.text-right_[data-slot=button][data-variant=ghost]]:[&_svg]:size-3.5',
        className,
      )}
      {...props}
    />
  )
}

function TableCaption({className, ...props}: React.ComponentProps<'caption'>) {
  return (
    <caption data-slot="table-caption" className={cn('text-muted-foreground mt-4 text-sm', className)} {...props} />
  )
}

export {Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption}
