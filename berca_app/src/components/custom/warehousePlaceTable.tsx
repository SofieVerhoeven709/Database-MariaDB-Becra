'use client'
import {useState} from 'react'
import {Search, Plus, Pencil, Trash2, ChevronUp, ChevronDown} from 'lucide-react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {TableCsvActions} from '@/components/custom/tableCsvActions'
import {WarehousePlaceFormDialog} from '@/components/custom/warehousePlaceFormDialog'
import type {MappedWarehousePlace} from '@/types/warehousePlace'
import {
  createWarehousePlaceAction,
  updateWarehousePlaceAction,
  deleteWarehousePlaceAction,
} from '@/serverFunctions/warehousePlaces'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
/* type SortField = 'abbreviation' | 'beNumber' | 'place' | 'quantityInStock'*/
type SortField = 'abbreviation' | 'beNumber' | 'place' | 'xCoordinate' | 'yCoordinate' | 'zCoordinate'
/* | 'quantityInStock' */
type SortDir = 'asc' | 'desc'
type FilterStatus = 'all' | 'active' | 'deleted'

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
  materials: {id: string; beNumber: string; name: string | null; shortDescription: string}[]
}

export function WarehousePlaceTable({initialItems, materials}: WarehousePlaceTableProps) {
  const [items, setItems] = useState(initialItems)
  const [search, setSearch] = useState('')

  const [sortField, setSortField] = useState<SortField>('abbreviation')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

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
    .filter(m => {
      if (filterStatus === 'active') return !m.deleted
      if (filterStatus === 'deleted') return m.deleted
      return true
    })
    /*.sort((a, b) => {
      const aVal = String(a[sortField] ?? '')
      const bVal = String(b[sortField] ?? '')
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })*/
    .sort((a, b) => {
      const sortValue = (item: MappedWarehousePlace) => {
        switch (sortField) {
          case 'xCoordinate':
            return String(item.shelf ?? '')
          case 'yCoordinate':
            return String(item.column ?? '')
          case 'zCoordinate':
            return String(item.layer ?? '')
          default:
            return String(item[sortField] ?? '')
        }
      }

      const aVal = sortValue(a)
      const bVal = sortValue(b)
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })

  async function handleSave(form: Partial<MappedWarehousePlace> & {id: string}) {
    const savedItem: MappedWarehousePlace = {
      id: form.id,
      abbreviation: form.abbreviation ?? '',
      beNumber: form.beNumber || null,
      serialTrackedId: form.serialTrackedId ?? null,
      place: form.place || null,
      shelf: form.shelf || null,
      column: form.column || null,
      layer: form.layer || null,
      layerPlace: form.layerPlace || null,
      information: form.information || null,
      quantityInStock: form.quantityInStock ?? 0,
      createdAt: editingItem?.createdAt ?? new Date().toISOString(),
      createdBy: editingItem?.createdBy ?? '',
      createdByName: editingItem?.createdByName ?? '',
      deleted: false,
      deletedAt: null,
      deletedBy: null,
    }

    if (editingItem) {
      await updateWarehousePlaceAction({
        id: form.id,
        abbreviation: form.abbreviation || undefined,
        beNumber: form.beNumber || null,
        place: form.place || undefined,
        shelf: form.shelf || undefined,
        column: form.column || undefined,
        layer: form.layer || undefined,
        layerPlace: form.layerPlace || undefined,
        information: form.information || undefined,
        quantityInStock: form.quantityInStock ?? 0,
      })
      setItems(prev => prev.map(item => (item.id === form.id ? savedItem : item)))
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
      setItems(prev => [savedItem, ...prev])
    }
    setDialogOpen(false)
    setEditingItem(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this warehouse place?')) return
    await deleteWarehousePlaceAction({id})
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const columns: {key: SortField; label: string}[] = [
    {key: 'abbreviation', label: 'Abbreviation'},
    {key: 'beNumber', label: 'Material Number (BE/IOS)'},
    {key: 'place', label: 'Warehouse'},
    /*{key: 'place', label: 'Place'},*/
    /*{key: 'shelf', label: 'Shelf'},*/
    /*{key: 'column', label: 'Column'},*/
    {key: 'xCoordinate', label: 'X'},
    {key: 'yCoordinate', label: 'Y'},
    {key: 'zCoordinate', label: 'Z'},
    /* {key: 'quantityInStock', label: 'Qty In Stock'}, */
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-secondary border-border"
            placeholder="Search places..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as FilterStatus)}>
          <SelectTrigger className="w-30 bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Not deleted</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
        <TableCsvActions filename="warehouse-place-table.csv" />
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
              <TableHead className="w-22.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
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
                  <TableCell className="text-sm">
                    {item.shelf ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.column ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.layer ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-50 truncate" title={item.information ?? ''}>
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
                  {/*
                  <TableCell className="text-sm">
                    {item.place ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.shelf ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.column ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.layer ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.layerPlace ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  */}
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
        materials={materials}
        onSave={handleSave}
      />
    </div>
  )
}
