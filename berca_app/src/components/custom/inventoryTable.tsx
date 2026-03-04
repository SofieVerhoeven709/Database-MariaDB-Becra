'use client'
import {useState} from 'react'
import {Search, Plus, Pencil, Trash2, ChevronUp, ChevronDown, AlertTriangle} from 'lucide-react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {InventoryFormDialog} from '@/components/custom/inventoryFormDialog'
import type {MappedInventory} from '@/types/inventory'
import {createInventoryAction, updateInventoryAction, deleteInventoryAction} from '@/serverFunctions/inventory'
import {useRouter} from 'next/navigation'
interface MaterialOption {
  id: string
  beNumber: string
  name: string | null
  shortDescription: string
}
type SortField = 'beNumber' | 'shortDescription' | 'place' | 'quantityInStock' | 'materialName' | 'valid'
type SortDir = 'asc' | 'desc'
type FilterValid = 'all' | 'valid' | 'invalid'
function SortIcon({field, sortField, sortDir}: {field: SortField; sortField: SortField; sortDir: SortDir}) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? (
    <ChevronUp className="inline h-3.5 w-3.5 ml-1" />
  ) : (
    <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
  )
}
interface InventoryTableProps {
  initialItems: MappedInventory[]
  materials: MaterialOption[]
}
export function InventoryTable({initialItems, materials}: InventoryTableProps) {
  const router = useRouter()
  const [items] = useState(initialItems)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('beNumber')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [filterValid, setFilterValid] = useState<FilterValid>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MappedInventory | null>(null)
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
      if (filterValid === 'valid') return i.valid
      if (filterValid === 'invalid') return !i.valid
      return true
    })
    .filter(i => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        i.beNumber.toLowerCase().includes(q) ||
        i.shortDescription.toLowerCase().includes(q) ||
        i.place.toLowerCase().includes(q) ||
        (i.materialName ?? '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const aVal = String(a[sortField] ?? '')
      const bVal = String(b[sortField] ?? '')
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })
  async function handleSave(form: Partial<MappedInventory> & {id: string}) {
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== undefined) fd.append(k, String(v))
      })
      if (editingItem) {
        await updateInventoryAction({success: false}, fd)
      } else {
        await createInventoryAction({success: false}, fd)
      }
      setDialogOpen(false)
      setEditingItem(null)
      router.refresh()
    } catch (_e) {
      // handled by server actions
    }
  }
  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this inventory item?')) return
    const fd = new FormData()
    fd.append('id', id)
    await deleteInventoryAction({success: false}, fd)
    router.refresh()
  }
  const columns: {key: SortField; label: string}[] = [
    {key: 'beNumber', label: 'BE Number'},
    {key: 'materialName', label: 'Material'},
    {key: 'shortDescription', label: 'Description'},
    {key: 'place', label: 'Location'},
    {key: 'quantityInStock', label: 'In Stock'},
    {key: 'valid', label: 'Status'},
  ]
  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-secondary border-border"
            placeholder="Search inventory..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterValid} onValueChange={v => setFilterValid(v as FilterValid)}>
          <SelectTrigger className="w-36 bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="valid">Valid</SelectItem>
            <SelectItem value="invalid">Invalid</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            setEditingItem(null)
            setDialogOpen(true)
          }}
          className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New item
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
                Min/Max
              </TableHead>
              <TableHead className="w-[100px] text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="text-center text-muted-foreground py-10">
                  No inventory items found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(item => {
                const isLow = item.quantityInStock <= item.minQuantityInStock
                return (
                  <TableRow key={item.id} className="hover:bg-secondary/50 transition-colors">
                    <TableCell className="font-mono text-sm font-medium">{item.beNumber}</TableCell>
                    <TableCell className="text-sm">
                      {item.materialName ?? <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate" title={item.shortDescription}>
                      {item.shortDescription}
                    </TableCell>
                    <TableCell className="text-sm">{item.place}</TableCell>
                    <TableCell className="text-sm">
                      <span className={`font-semibold ${isLow ? 'text-destructive' : ''}`}>{item.quantityInStock}</span>
                      {isLow && <AlertTriangle className="inline ml-1 h-3.5 w-3.5 text-destructive" />}
                    </TableCell>
                    <TableCell>
                      {item.valid ? (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-green-500/15 text-green-700 dark:text-green-400">
                          Valid
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-red-500/15 text-red-700 dark:text-red-400">
                          Invalid
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.minQuantityInStock} / {item.maxQuantityInStock}
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
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {items.length} item{items.length !== 1 ? 's' : ''}
      </p>
      <InventoryFormDialog
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
