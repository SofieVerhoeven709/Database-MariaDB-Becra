'use client'

import {useRef} from 'react'
import {Download, Upload} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {buildCsv, downloadCsv, parseCsv, type CsvRow} from '@/lib/csv'

interface TableCsvActionsProps {
  filename?: string
  onUpload?: (rows: CsvRow[], file: File) => void | Promise<void>
}

function findNextTable(start: HTMLElement | null) {
  let current: Element | null = start
  while (current) {
    let sibling = current.nextElementSibling
    while (sibling) {
      const table = sibling.matches('table') ? sibling : sibling.querySelector('table')
      if (table instanceof HTMLTableElement) return table
      sibling = sibling.nextElementSibling
    }
    current = current.parentElement
  }
  return document.querySelector('table')
}

function fileSafeName(value: string) {
  return (
    value
      .replace(/[^a-z0-9-_]+/gi, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase() || 'table'
  )
}

function exportTable(table: HTMLTableElement, filename: string) {
  const columns = Array.from(table.querySelectorAll('thead th'))
    .map((header, index) => ({
      index,
      label: header.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    }))
    .filter(header => header.label && !/^(actions|open|remove)$/i.test(header.label))

  const rows = Array.from(table.querySelectorAll('tbody tr'))
    .map(row => {
      const cells = Array.from(row.querySelectorAll('td'))
      return columns.map(column => cells[column.index]?.textContent?.replace(/\s+/g, ' ').trim() ?? '')
    })
    .filter(row => row.some(cell => cell))

  if (columns.length === 0) return
  downloadCsv(
    filename,
    buildCsv(
      columns.map(column => column.label),
      rows,
    ),
  )
}

export function TableCsvActions({filename = 'table.csv', onUpload}: TableCsvActionsProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div ref={rootRef} className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          const table = findNextTable(rootRef.current)
          if (table) exportTable(table, filename.endsWith('.csv') ? filename : `${fileSafeName(filename)}.csv`)
        }}
        className="flex items-center gap-2">
        <Download className="h-4 w-4" />
        Download CSV
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={async event => {
          const file = event.target.files?.[0]
          if (!file || !onUpload) return
          await onUpload(parseCsv(await file.text()), file)
          event.target.value = ''
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={!onUpload}
        title={onUpload ? 'Upload CSV' : 'CSV upload requires a table-specific importer'}
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2">
        <Upload className="h-4 w-4" />
        Upload CSV
      </Button>
    </div>
  )
}
