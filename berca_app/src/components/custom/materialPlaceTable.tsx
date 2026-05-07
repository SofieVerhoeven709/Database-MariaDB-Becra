'use client'
import {useState} from 'react'
import {Search, Plus, Pencil, Trash2, ChevronUp, ChevronDown, Copy, RotateCcw} from 'lucide-react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {TableCsvActions} from '@/components/custom/tableCsvActions'
import {getCsvValue, type CsvRow} from '@/lib/csv'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {MaterialPlaceFormDialog} from '@/components/custom/materialPlaceFormDialog'
import type {MappedMaterialPlace} from '@/types/materialPlace'
import {
  createMaterialPlaceAction,
  updateMaterialPlaceAction,
  deleteMaterialPlaceAction,
  restoreMaterialPlaceAction,
} from '@/serverFunctions/materialPlaces'
import {useRouter} from 'next/navigation'

type SortField = 'abbreviation' | 'beNumber' | 'place' | 'quantityInStock'
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

function csvErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Could not create material place.'
}

interface MaterialPlaceTableProps {
  initialItems: MappedMaterialPlace[]
  materials: {id: string; beNumber: string; name: string | null; shortDescription: string}[]
}

export function MaterialPlaceTable({initialItems, materials}: MaterialPlaceTableProps) {
  const router = useRouter()
  const items = initialItems
  const [search, setSearch] = useState('')
  const [deletedFilter, setDeletedFilter] = useState<DeletedFilter>('active')
  const [sortField, setSortField] = useState<SortField>('abbreviation')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MappedMaterialPlace | null>(null)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'duplicate'>('create')

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
    if (dialogMode === 'edit' && editingItem) {
      await updateMaterialPlaceAction({
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
      await createMaterialPlaceAction({
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
    await deleteMaterialPlaceAction({id})
    router.refresh()
  }

  async function handleRestore(id: string) {
    if (!confirm('Restore this warehouse place?')) return
    await restoreMaterialPlaceAction({id})
    router.refresh()
  }

  async function handleUploadCsv(rows: CsvRow[]) {
    if (rows.length === 0) {
      window.alert('The selected CSV file does not contain rows.')
      return
    }

    const errors: string[] = []
    let created = 0

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2
      const abbreviation = getCsvValue(row, ['Abbreviation', 'abbreviation'])

      if (!abbreviation) {
        errors.push(`Row ${rowNumber}: Abbreviation is required.`)
        continue
      }

      const quantityValue = getCsvValue(row, ['Qty In Stock', 'Quantity In Stock', 'quantityInStock'])
      const quantityInStock = quantityValue ? Number(quantityValue) : 0

      if (!Number.isFinite(quantityInStock) || quantityInStock < 0) {
        errors.push(`Row ${rowNumber}: Quantity in stock is invalid.`)
        continue
      }

      try {
        await createMaterialPlaceAction({
          id: crypto.randomUUID(),
          abbreviation,
          beNumber: getCsvValue(row, ['Material Number (BE/IOS)', 'BE Number', 'beNumber']) || undefined,
          place: getCsvValue(row, ['Warehouse Place', 'Warehouse', 'Place', 'place']) || undefined,
          shelf: getCsvValue(row, ['Shelf', 'X', 'shelf']) || undefined,
          column: getCsvValue(row, ['Column', 'Y', 'column']) || undefined,
          layer: getCsvValue(row, ['Layer', 'Z', 'layer']) || undefined,
          layerPlace: getCsvValue(row, ['Layer Place', 'layerPlace']) || undefined,
          information: getCsvValue(row, ['Information', 'information']) || undefined,
          quantityInStock,
        })
        created += 1
      } catch (error) {
        errors.push(`Row ${rowNumber}: ${csvErrorMessage(error)}`)
      }
    }

    if (created > 0) router.refresh()

    window.alert(
      errors.length > 0
        ? `Created ${created} material place(s). ${errors.slice(0, 5).join(' ')}${
            errors.length > 5 ? ` +${errors.length - 5} more error(s).` : ''
          }`
        : `Created ${created} material place(s).`,
    )
  }

  const columns: {key: SortField; label: string}[] = [
    {key: 'abbreviation', label: 'Abbreviation'},
    {key: 'beNumber', label: 'Material Number (BE/IOS)'},
    {key: 'place', label: 'Warehouse Place'},
    {key: 'quantityInStock', label: 'Qty In Stock'},
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-secondary border-border"
            placeholder="Search warehouse places..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={deletedFilter} onValueChange={v => setDeletedFilter(v as DeletedFilter)}>
          <SelectTrigger className="w-45 bg-secondary border-border">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active only</SelectItem>
            <SelectItem value="deleted">Deleted only</SelectItem>
            <SelectItem value="all">All statuses</SelectItem>
          </SelectContent>
        </Select>
        <TableCsvActions filename="material-place-table.csv" onUpload={handleUploadCsv} />
        <Button
          onClick={() => {
            setDialogMode('create')
            setEditingItem(null)
            setDialogOpen(true)
          }}
          className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New warehouse place
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
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Created
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Deleted
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Status
              </TableHead>
              <TableHead className="w-22.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 5} className="text-center text-muted-foreground py-10">
                  No warehouse places found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(item => (
                <TableRow key={item.id} className="hover:bg-secondary/50 transition-colors">
                  <TableCell className="text-sm font-medium">{item.abbreviation}</TableCell>
                  <TableCell className="text-sm">
                    {item.beNumber ?? <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.place ?? <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-sm font-semibold">{item.quantityInStock}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-50 truncate" title={item.information ?? ''}>
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
                      {item.deleted ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                          title="Restore"
                          onClick={() => handleRestore(item.id)}>
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              setDialogMode('edit')
                              setEditingItem(item)
                              setDialogOpen(true)
                            }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              setDialogMode('duplicate')
                              setEditingItem(item)
                              setDialogOpen(true)
                            }}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {items.length} warehouse place{items.length !== 1 ? 's' : ''}
      </p>

      <MaterialPlaceFormDialog
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open)
          if (!open) setEditingItem(null)
        }}
        item={editingItem}
        mode={dialogMode}
        materials={materials}
        onSave={handleSave}
      />
    </div>
  )
}
