'use client'
import {useState} from 'react'
import {Search, Plus, Pencil, Trash2, ChevronUp, ChevronDown} from 'lucide-react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {WarehousePlaceFormDialog} from '@/components/custom/warehousePlaceFormDialog'
import type {MappedWarehousePlace} from '@/types/warehousePlace'
import {
  createWarehousePlaceAction,
  updateWarehousePlaceAction,
  deleteWarehousePlaceAction,
} from '@/serverFunctions/warehousePlaces'
import {useRouter} from 'next/navigation'

type SortField = 'abbreviation' | 'beNumber' | 'place' | 'quantityInStock'
type SortDir = 'asc' | 'desc'

function SortIcon({field, sortField, sortDir}: {field: SortField; sortField: SortField; sortDir: SortDir}) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? (
    <ChevronUp className="inline h-3.5 w-3.5 ml-1" />
  ) : (
    <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
  )
}

interface WarehousePlaceTableProps {
  initialItems: MappedWarehousePlace[]
}

export function WarehousePlaceTable({initialItems}: WarehousePlaceTableProps) {
  const router = useRouter()
  const [items] = useState(initialItems)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('abbreviation')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MappedWarehousePlace | null>(null)

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filtered = items
    .filter(i => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        (i.abbreviation ?? '').toLowerCase().includes(q) ||
        (i.beNumber ?? '').toLowerCase().includes(q) ||
        (i.place ?? '').toLowerCase().includes(q) ||
        (i.shelf ?? '').toLowerCase().includes(q) ||
        (i.column ?? '').toLowerCase().includes(q) ||
        (i.layer ?? '').toLowerCase().includes(q) ||
        (i.layerPlace ?? '').toLowerCase().includes(q) ||
        (i.information ?? '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const aVal = String(a[sortField] ?? '')
      const bVal = String(b[sortField] ?? '')
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })

  async function handleSave(form: Partial<MappedWarehousePlace> & {id: string}) {
    if (editingItem) {
      await updateWarehousePlaceAction({
        id: form.id,
        abbreviation: form.abbreviation || undefined,
        beNumber: form.beNumber || undefined,
        place: form.place || undefined,
        shelf: form.shelf || undefined,
        column: form.column || undefined,
        layer: form.layer || undefined,
        layerPlace: form.layerPlace || undefined,
        information: form.information || undefined,
        quantityInStock: form.quantityInStock ?? 0,
      })
    } else {
      await createWarehousePlaceAction({
        id: form.id,
        abbreviation: form.abbreviation ?? '',
        beNumber: form.beNumber || undefined,
        place: form.place || undefined,
        shelf: form.shelf || undefined,
        column: form.column || undefined,
        layer: form.layer || undefined,
        layerPlace: form.layerPlace || undefined,
        information: form.information || undefined,
        quantityInStock: form.quantityInStock ?? 0,
      })
    }
    setDialogOpen(false)
    setEditingItem(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this warehouse place?')) return
    await deleteWarehousePlaceAction({id})
    router.refresh()
  }

  const columns: {key: SortField; label: string}[] = [
    {key: 'abbreviation', label: 'Abbreviation'},
    {key: 'beNumber', label: 'BE Number'},
    {key: 'place', label: 'Place'},
    {key: 'quantityInStock', label: 'Qty In Stock'},
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-secondary border-border"
            placeholder="Search places..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button
          onClick={() => {
            setEditingItem(null)
            setDialogOpen(true)
          }}
          className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New place
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              {columns.map(col => (
                <TableHead
                  key={col.key}
                  className="cursor-pointer select-none text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  onClick={() => handleSort(col.key)}>
                  {col.label}
                  <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />
                </TableHead>
              ))}
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Information
              </TableHead>
              <TableHead className="w-[90px] text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="text-center text-muted-foreground py-10">
                  No warehouse places found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(item => (
                <TableRow key={item.id} className="hover:bg-secondary/50 transition-colors">
                  <TableCell className="text-sm font-medium">{item.abbreviation}</TableCell>
                  <TableCell className="text-sm">
                    {item.beNumber ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.place ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm font-semibold">{item.quantityInStock}</TableCell>
                  <TableCell
                    className="text-sm text-muted-foreground max-w-[200px] truncate"
                    title={item.information ?? ''}>
                    {item.information ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditingItem(item)
                          setDialogOpen(true)
                        }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {items.length} place{items.length !== 1 ? 's' : ''}
      </p>

      <WarehousePlaceFormDialog
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open)
          if (!open) setEditingItem(null)
        }}
        item={editingItem}
        onSave={handleSave}
      />
    </div>
  )
}
