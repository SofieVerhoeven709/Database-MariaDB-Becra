'use client'
import {useState} from 'react'
import {Search, Plus, Pencil, Trash2, ChevronUp, ChevronDown} from 'lucide-react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {MaterialPlaceFormDialog} from '@/components/custom/materialPlaceFormDialog'
import type {MappedMaterialPlace, MaterialPlaceEmployeeOption} from '@/types/materialPlace'
import {
  createMaterialPlaceAction,
  updateMaterialPlaceAction,
  deleteMaterialPlaceAction,
} from '@/serverFunctions/materialPlaces'
import {useRouter} from 'next/navigation'
import {encodeMaterialPlaceField} from '@/extra/materialPlace'

type SortField = 'abbreviation' | 'beNumber' | 'place' | 'storageEmployeeName' | 'quantityInStock'
type SortDir = 'asc' | 'desc'
type DeletedFilter = 'active' | 'deleted' | 'all'

function SortIcon({field, sortField, sortDir}: {field: SortField; sortField: SortField; sortDir: SortDir}) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? (
    <ChevronUp className="inline h-3.5 w-3.5 ml-1" />
  ) : (
    <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
  )
}

interface MaterialPlaceTableProps {
  initialItems: MappedMaterialPlace[]
  employees: MaterialPlaceEmployeeOption[]
}

export function MaterialPlaceTable({initialItems, employees}: MaterialPlaceTableProps) {
  const router = useRouter()
  const [items] = useState(initialItems)
  const [search, setSearch] = useState('')
  const [deletedFilter, setDeletedFilter] = useState<DeletedFilter>('active')
  const [sortField, setSortField] = useState<SortField>('abbreviation')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MappedMaterialPlace | null>(null)

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  function formatDateTime(value: string | null): string {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleString()
  }

  const filtered = items
    .filter(i => {
      if (deletedFilter === 'all') return true
      return deletedFilter === 'deleted' ? i.deleted : !i.deleted
    })
    .filter(i => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        (i.abbreviation ?? '').toLowerCase().includes(q) ||
        (i.beNumber ?? '').toLowerCase().includes(q) ||
        (i.place ?? '').toLowerCase().includes(q) ||
        (i.storageEmployeeName ?? '').toLowerCase().includes(q) ||
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

  async function handleSave(form: Partial<MappedMaterialPlace> & {id: string}) {
    if (editingItem) {
      await updateMaterialPlaceAction({
        id: form.id,
        abbreviation: form.abbreviation || undefined,
        beNumber: form.beNumber || undefined,
        place: encodeMaterialPlaceField(form.place, form.storageEmployeeId) || undefined,
        shelf: form.shelf || undefined,
        column: form.column || undefined,
        layer: form.layer || undefined,
        layerPlace: form.layerPlace || undefined,
        information: form.information || undefined,
        quantityInStock: form.quantityInStock ?? 0,
      })
    } else {
      await createMaterialPlaceAction({
        id: form.id,
        abbreviation: form.abbreviation ?? '',
        beNumber: form.beNumber || undefined,
        place: encodeMaterialPlaceField(form.place, form.storageEmployeeId) || undefined,
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
    if (!confirm('Are you sure you want to delete this material place?')) return
    await deleteMaterialPlaceAction({id})
    router.refresh()
  }

  const columns: {key: SortField; label: string}[] = [
    {key: 'abbreviation', label: 'Abbreviation'},
    {key: 'beNumber', label: 'BE Number'},
    {key: 'place', label: 'Place'},
    {key: 'storageEmployeeName', label: 'Storage Employee'},
    {key: 'quantityInStock', label: 'Qty In Stock'},
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-secondary border-border"
            placeholder="Search material places..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={deletedFilter} onValueChange={v => setDeletedFilter(v as DeletedFilter)}>
          <SelectTrigger className="w-[180px] bg-secondary border-border">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active only</SelectItem>
            <SelectItem value="deleted">Deleted only</SelectItem>
            <SelectItem value="all">All statuses</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            setEditingItem(null)
            setDialogOpen(true)
          }}
          className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New material place
        </Button>
      </div>

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
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deleted</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</TableHead>
              <TableHead className="w-[90px] text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 5} className="text-center text-muted-foreground py-10">
                  No material places found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(item => (
                <TableRow key={item.id} className="hover:bg-secondary/50 transition-colors">
                  <TableCell className="text-sm font-medium">{item.abbreviation}</TableCell>
                  <TableCell className="text-sm">
                    {item.beNumber ?? <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-sm">{item.place ?? <span className="text-muted-foreground">-</span>}</TableCell>
                  <TableCell className="text-sm">
                    {item.storageEmployeeName ?? <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-sm font-semibold">{item.quantityInStock}</TableCell>
                  <TableCell
                    className="text-sm text-muted-foreground max-w-[200px] truncate"
                    title={item.information ?? ''}>
                    {item.information ?? <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex flex-col leading-tight">
                      <span>{item.createdByName || '-'}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.deleted ? (
                      <div className="flex flex-col leading-tight">
                        <span>{item.deletedByName || '-'}</span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(item.deletedAt)}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.deleted ? (
                      <Badge variant="destructive">Deleted</Badge>
                    ) : (
                      <Badge variant="secondary">Active</Badge>
                    )}
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
        Showing {filtered.length} of {items.length} material place{items.length !== 1 ? 's' : ''}
      </p>

      <MaterialPlaceFormDialog
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open)
          if (!open) setEditingItem(null)
        }}
        item={editingItem}
        employees={employees}
        onSave={handleSave}
      />
    </div>
  )
}

