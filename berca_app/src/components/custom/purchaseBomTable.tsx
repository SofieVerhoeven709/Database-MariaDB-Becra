'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Search, ChevronDown, ChevronUp, Plus, Pencil, Trash2} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {PurchaseBomFormDialog} from '@/components/custom/purchaseBomFormDialog'
import type {MappedPurchaseBom} from '@/types/purchaseBom'
import {createPurchaseBomAction, updatePurchaseBomAction, softDeletePurchaseBomAction, hardDeletePurchaseBomAction} from '@/serverFunctions/purchaseBoms'

type SortField = 'date' | 'description' | 'createdByName'
type SortDir = 'asc' | 'desc'

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function SortIcon({field, sortField, sortDir}: {field: SortField; sortField: SortField; sortDir: SortDir}) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? <ChevronUp className="inline h-3.5 w-3.5 ml-1" /> : <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
}

interface Props {
  initialEntries: MappedPurchaseBom[]
  currentUserRole: string
  currentUserLevel: number
}

const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

export function PurchaseBomTable({initialEntries, currentUserRole, currentUserLevel}: Props) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MappedPurchaseBom | null>(null)

  const filtered = initialEntries
    .filter(e => {
      if (!search) return true
      const q = search.toLowerCase()
      return (e.description ?? '').toLowerCase().includes(q) || (e.createdByName ?? '').toLowerCase().includes(q)
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const cmp = (x: string | null | undefined, y: string | null | undefined) => dir * (x ?? '').localeCompare(y ?? '')
      switch (sortField) {
        case 'date': return cmp(a.date, b.date)
        case 'description': return cmp(a.description, b.description)
        case 'createdByName': return cmp(a.createdByName, b.createdByName)
        default: return 0
      }
    })

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }

  async function handleSave(e: MappedPurchaseBom) {
    if (editing) {
      await updatePurchaseBomAction({id: e.id, description: e.description, date: e.date})
    } else {
      await createPurchaseBomAction({description: e.description, date: e.date})
    }
    setEditing(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (isAdmin) await hardDeletePurchaseBomAction({id})
    else await softDeletePurchaseBomAction({id})
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search description…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-secondary border-border placeholder:text-muted-foreground/60" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{filtered.length} / {initialEntries.length}</span>
          <Button onClick={() => { setEditing(null); setDialogOpen(true) }} className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
            <Plus className="h-4 w-4" /> New BOM
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className={thClass} onClick={() => toggleSort('date')}>
                Date <SortIcon field="date" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('description')}>
                Description <SortIcon field="description" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('createdByName')}>
                Created By <SortIcon field="createdByName" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className="w-20"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-28 text-center text-muted-foreground">
                  No purchase BOM entries found.
                </TableCell>
              </TableRow>
            ) : filtered.map(entry => (
              <TableRow key={entry.id} className="border-border/40 hover:bg-secondary/50">
                <TableCell className={tdClass}>{formatDate(entry.date)}</TableCell>
                <TableCell className={`${tdClass} max-w-[300px] truncate text-foreground`}>{entry.description ?? '—'}</TableCell>
                <TableCell className={tdClass}>{entry.createdByName}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                      onClick={() => { setEditing(entry); setDialogOpen(true) }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(entry.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PurchaseBomFormDialog open={dialogOpen} onOpenChange={setDialogOpen} entry={editing} onSave={handleSave} />
    </div>
  )
}

