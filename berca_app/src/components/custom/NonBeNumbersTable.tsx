'use client'

import {Table, TableHeader, TableRow, TableHead, TableBody, TableCell} from '@/components/ui/table'
import {useState} from 'react'

export interface NonBeNumbersTableProps {
  materials: Array<{
    id: string
    IOSNumber?: string
    name?: string
    lotNumber?: string
    shortDescription?: string
    brandName?: string
    deleted?: boolean
  }>
}

export function NonBeNumbersTable({materials}: NonBeNumbersTableProps) {
  const [search, setSearch] = useState('')
  const filtered = materials.filter(m => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (m.IOSNumber ?? '').toLowerCase().includes(q) ||
      (m.name ?? '').toLowerCase().includes(q) ||
      (m.lotNumber ?? '').toLowerCase().includes(q) ||
      (m.shortDescription ?? '').toLowerCase().includes(q) ||
      (m.brandName ?? '').toLowerCase().includes(q)
    )
  })
  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-50">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className="pl-9 bg-secondary border-border rounded h-9 text-sm w-full"
            placeholder="Searching for materials..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded"
          onClick={() => {
            /* open add dialog */
          }}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" />
          </svg>
          New material
        </button>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                IOS Number
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Name
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                LOT Number
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Description
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Brand Name
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  No Non BE Number materials found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(m => (
                <TableRow key={m.id}>
                  <TableCell>{m.IOSNumber ?? ''}</TableCell>
                  <TableCell>{m.name ?? ''}</TableCell>
                  <TableCell>{m.lotNumber ?? ''}</TableCell>
                  <TableCell>{m.shortDescription ?? ''}</TableCell>
                  <TableCell>{m.brandName ?? ''}</TableCell>
                  <TableCell className="text-center">
                    {/* Edit and Delete actions, can be replaced with your dialog/actions */}
                    <button
                      onClick={() => {
                        /* open edit dialog for m */
                      }}
                      className="text-blue-600 hover:underline mr-2">
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        /* delete action for m */
                      }}
                      className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
