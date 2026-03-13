'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Search, ChevronDown, ChevronUp, Plus, Pencil, Trash2} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {InventoryOrderFormDialog, type InventoryOption} from '@/components/custom/inventoryOrderFormDialog'
import type {MappedInventoryOrder} from '@/types/inventoryOrder'
import {
  createInventoryOrderAction,
  updateInventoryOrderAction,
  softDeleteInventoryOrderAction,
  hardDeleteInventoryOrderAction,
} from '@/serverFunctions/inventoryOrders'

type SortField = 'orderDate' | 'orderNumber' | 'shortDescription' | 'inventoryBeNumber'
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
  initialEntries: MappedInventoryOrder[]
  inventories: InventoryOption[]
  currentUserRole: string
  currentUserLevel: number
}

const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

export function InventoryOrderTable({initialEntries, inventories, currentUserRole, currentUserLevel}: Props) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('orderDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MappedInventoryOrder | null>(null)

  const filtered = initialEntries
    .filter(e => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        e.orderNumber.toLowerCase().includes(q) ||
        (e.shortDescription ?? '').toLowerCase().includes(q) ||
        (e.inventoryBeNumber ?? '').toLowerCase().includes(q) ||
        (e.inventoryDescription ?? '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const cmp = (x: string | null | undefined, y: string | null | undefined) => dir * (x ?? '').localeCompare(y ?? '')
      switch (sortField) {
        case 'orderDate': return cmp(a.orderDate, b.orderDate)
        case 'orderNumber': return cmp(a.orderNumber, b.orderNumber)
        case 'shortDescription': return cmp(a.shortDescription, b.shortDescription)
        case 'inventoryBeNumber': return cmp(a.inventoryBeNumber, b.inventoryBeNumber)
        default: return 0
      }
    })

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }

  async function handleSave(e: MappedInventoryOrder) {
    if (editing) {
      await updateInventoryOrderAction({
        id: e.id, inventoryId: e.inventoryId, orderNumber: e.orderNumber,
        orderDate: e.orderDate, shortDescription: e.shortDescription, longDescription: e.longDescription,
      })
    } else {
      await createInventoryOrderAction({
        inventoryId: e.inventoryId, orderNumber: e.orderNumber,
        orderDate: e.orderDate, shortDescription: e.shortDescription, longDescription: e.longDescription,
      })
    }
    setEditing(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (isAdmin) await hardDeleteInventoryOrderAction({id})
    else await softDeleteInventoryOrderAction({id})
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search order, description, BE…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-secondary border-border placeholder:text-muted-foreground/60" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{filtered.length} / {initialEntries.length}</span>
          <Button onClick={() => { setEditing(null); setDialogOpen(true) }} className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
            <Plus className="h-4 w-4" /> New Request
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className={thClass} onClick={() => toggleSort('orderDate')}>
                Order Date <SortIcon field="orderDate" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('orderNumber')}>
                Order # <SortIcon field="orderNumber" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('inventoryBeNumber')}>
                Inventory Item <SortIcon field="inventoryBeNumber" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('shortDescription')}>
                Description <SortIcon field="shortDescription" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className="text-xs whitespace-nowrap">Created By</TableHead>
              <TableHead className="w-20"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                  No order requests found.
                </TableCell>
              </TableRow>
            ) : filtered.map(entry => (
              <TableRow key={entry.id} className="border-border/40 hover:bg-secondary/50">
                <TableCell className={tdClass}>{formatDate(entry.orderDate)}</TableCell>
                <TableCell className={`${tdClass} font-medium text-foreground`}>{entry.orderNumber}</TableCell>
                <TableCell className={tdClass}>
                  <div className="flex flex-col gap-0.5">
                    <span>{entry.inventoryBeNumber ?? '—'}</span>
                    {entry.inventoryDescription && (
                      <span className="text-[11px] text-muted-foreground">{entry.inventoryDescription}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className={`${tdClass} max-w-[200px] truncate`}>{entry.shortDescription}</TableCell>
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

      <InventoryOrderFormDialog open={dialogOpen} onOpenChange={setDialogOpen} entry={editing} inventories={inventories} onSave={handleSave} />
    </div>
  )
}

