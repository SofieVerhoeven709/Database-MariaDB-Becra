'use client'

import {useState} from 'react'
import {Search, Plus, Pencil, ChevronDown, ChevronUp, Trash2, ExternalLink, RotateCcw} from 'lucide-react'
import {WorkOrderStructureFormDialog} from '@/components/custom/workOrderStructureFormDialog'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {TableCsvActions} from '@/components/custom/tableCsvActions'
import {getCsvValue, normalizeCsvLookup, type CsvRow} from '@/lib/csv'
import {Badge} from '@/components/ui/badge'
import {useRouter} from 'next/navigation'
import type {MappedWorkOrderStructure, MaterialOption} from '@/types/workOrderStructure'
import {
  createWorkOrderStructureAction,
  softDeleteWorkOrderStructureAction,
  hardDeleteWorkOrderStructureAction,
  undeleteWorkOrderStructureAction,
} from '@/serverFunctions/workOrderStructures'

type SortField =
  | 'workOrderNumber'
  | 'materialName'
  | 'clientNumber'
  | 'tag'
  | 'quantity'
  | 'shortDescription'
  | 'createdAt'
  | 'createdBy'
  | 'deleted'

type SortDir = 'asc' | 'desc'
type FilterDeleted = 'not-deleted' | 'deleted' | 'all'

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function csvErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Could not create work order structure.'
}

function findNamedOption<T extends {id: string; name: string}>(options: T[], value: string) {
  if (!value) return null
  const normalized = normalizeCsvLookup(value)
  return options.find(option => option.id === value || normalizeCsvLookup(option.name) === normalized) ?? null
}

function findMaterialOption(options: MaterialOption[], value: string) {
  if (!value) return null
  const normalized = normalizeCsvLookup(value)
  return (
    options.find(
      option =>
        option.id === value ||
        normalizeCsvLookup(option.name) === normalized ||
        normalizeCsvLookup(option.beNumber) === normalized,
    ) ?? null
  )
}

function parseOptionalInt(value: string) {
  if (!value.trim()) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? null : parsed
}

function SortIcon({field, sortField, sortDir}: {field: SortField; sortField: SortField; sortDir: SortDir}) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? (
    <ChevronUp className="inline h-3.5 w-3.5 ml-1" />
  ) : (
    <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
  )
}

const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

function Th({
  field,
  label,
  sortField,
  sortDir,
  onSort,
}: {
  field: SortField
  label: string
  sortField: SortField
  sortDir: SortDir
  onSort: (f: SortField) => void
}) {
  return (
    <TableHead className={thClass} onClick={() => onSort(field)}>
      {label} <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </TableHead>
  )
}

interface WorkOrderStructureTableProps {
  initialStructures: MappedWorkOrderStructure[]
  currentUserRole: string
  currentUserLevel: number
  workOrderOptions: {id: string; name: string}[]
  materialOptions: MaterialOption[]
  departmentId: string
}

export function WorkOrderStructureTable({
  initialStructures,
  currentUserRole,
  currentUserLevel,
  workOrderOptions,
  materialOptions,
  departmentId,
}: WorkOrderStructureTableProps) {
  const router = useRouter()
  // Role/level gates control delete/restore actions.
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canDelete = currentUserRole === 'Administrator' || currentUserLevel >= 80

  const [search, setSearch] = useState('')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [sortField, setSortField] = useState<SortField>('workOrderNumber')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStructure, setEditingStructure] = useState<MappedWorkOrderStructure | null>(null)

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  // Apply search/deleted filters before sorting the list.
  const filtered = initialStructures
    .filter(s => {
      if (filterDeleted === 'not-deleted' && s.deleted) return false
      if (filterDeleted === 'deleted' && !s.deleted) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        s.workOrderNumber?.toLowerCase().includes(q) ||
        s.materialName?.toLowerCase().includes(q) ||
        s.materialBeNumber?.toLowerCase().includes(q) ||
        s.clientNumber?.toLowerCase().includes(q) ||
        s.tag?.toLowerCase().includes(q) ||
        s.shortDescription?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const s = (x: string | null, y: string | null) => dir * (x ?? '').localeCompare(y ?? '')
      const n = (x: number | null, y: number | null) => dir * ((x ?? 0) - (y ?? 0))
      switch (sortField) {
        case 'workOrderNumber':
          return s(a.workOrderNumber, b.workOrderNumber)
        case 'materialName':
          return s(a.materialName, b.materialName)
        case 'clientNumber':
          return s(a.clientNumber, b.clientNumber)
        case 'tag':
          return s(a.tag, b.tag)
        case 'quantity':
          return n(a.quantity, b.quantity)
        case 'shortDescription':
          return s(a.shortDescription, b.shortDescription)
        case 'createdAt':
          return s(a.createdAt, b.createdAt)
        case 'createdBy':
          return s(a.createdByName, b.createdByName)
        case 'deleted':
          return dir * (Number(a.deleted) - Number(b.deleted))
        default:
          return 0
      }
    })

  async function handleSoftDelete(s: MappedWorkOrderStructure) {
    await softDeleteWorkOrderStructureAction({id: s.id})
    router.refresh()
  }

  async function handleHardDelete(s: MappedWorkOrderStructure) {
    await hardDeleteWorkOrderStructureAction({id: s.id})
    router.refresh()
  }

  async function handleUndelete(s: MappedWorkOrderStructure) {
    await undeleteWorkOrderStructureAction({id: s.id})
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
      const workOrderValue = getCsvValue(row, ['Work Order', 'Work Order Number', 'workOrderId'])
      const workOrder = findNamedOption(workOrderOptions, workOrderValue)
      const materialValue = getCsvValue(row, ['Material', 'Material Number', 'materialId'])
      const material = findMaterialOption(materialOptions, materialValue)

      if (!workOrder) {
        errors.push(`Row ${rowNumber}: Work Order could not be matched.`)
        continue
      }

      if (!material) {
        errors.push(`Row ${rowNumber}: Material could not be matched.`)
        continue
      }

      try {
        await createWorkOrderStructureAction({
          workOrderId: workOrder.id,
          materialId: material.id,
          clientNumber: getCsvValue(row, ['Client Number', 'clientNumber']) || null,
          tag: getCsvValue(row, ['Tag', 'tag']) || null,
          quantity: parseOptionalInt(getCsvValue(row, ['Quantity', 'Qty', 'quantity'])),
          shortDescription: getCsvValue(row, ['Short Description', 'Description', 'shortDescription']) || null,
          longDescription: getCsvValue(row, ['Long Description', 'longDescription']) || null,
          additionalInfo: getCsvValue(row, ['Additional Info', 'additionalInfo']) || null,
        })
        created += 1
      } catch (error) {
        errors.push(`Row ${rowNumber}: ${csvErrorMessage(error)}`)
      }
    }

    if (created > 0) router.refresh()
    window.alert(
      errors.length
        ? `Created ${created} work order structure(s). ${errors.slice(0, 5).join(' ')}${
            errors.length > 5 ? ` +${errors.length - 5} more error(s).` : ''
          }`
        : `Created ${created} work order structure(s).`,
    )
  }

  const showDeletedCols = filterDeleted !== 'not-deleted'
  const colCount = showDeletedCols ? 14 : 11

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search work order, material, tag…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border placeholder:text-muted-foreground/60 focus-visible:ring-accent"
            />
          </div>
          <Select value={filterDeleted} onValueChange={v => setFilterDeleted(v as FilterDeleted)}>
            <SelectTrigger className="w-[150px] bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="not-deleted">Not Deleted</SelectItem>
              <SelectItem value="deleted">Deleted Only</SelectItem>
              <SelectItem value="all">Show All</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <TableCsvActions filename="work-order-structure-table.csv" onUpload={handleUploadCsv} />
        <Button
          onClick={() => {
            setEditingStructure(null)
            setDialogOpen(true)
          }}
          className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
          <Plus className="h-4 w-4" />
          New Structure
        </Button>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <Th
                field="workOrderNumber"
                label="Work Order"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="materialName" label="Material" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="clientNumber" label="Client #" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="tag" label="Tag" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="quantity" label="Qty" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th
                field="shortDescription"
                label="Short Description"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="createdAt" label="Created At" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="createdBy" label="Created By" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              {showDeletedCols && (
                <>
                  <Th field="deleted" label="Deleted" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <TableHead className="whitespace-nowrap text-xs">Deleted At</TableHead>
                  <TableHead className="whitespace-nowrap text-xs">Deleted By</TableHead>
                </>
              )}
              <TableHead className="w-24">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="h-32 text-center text-muted-foreground">
                  No structures found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(s => (
                <TableRow
                  key={s.id}
                  className={`border-border/40 hover:bg-secondary/50 ${s.deleted ? 'opacity-50' : ''}`}>
                  <TableCell className={`${tdClass} text-foreground font-medium`}>{s.workOrderNumber ?? '-'}</TableCell>
                  <TableCell className={tdClass}>
                    <span className="font-medium text-foreground">{s.materialBeNumber}</span>
                    {s.materialName && <span className="ml-1 text-muted-foreground">— {s.materialName}</span>}
                  </TableCell>
                  <TableCell className={tdClass}>{s.clientNumber ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{s.tag ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{s.quantity ?? '-'}</TableCell>
                  <TableCell className={tdClass}>
                    <span className="max-w-[200px] truncate inline-block">{s.shortDescription ?? '-'}</span>
                  </TableCell>
                  <TableCell className={tdClass}>{formatDate(s.createdAt)}</TableCell>
                  <TableCell className={tdClass}>{s.createdByName}</TableCell>
                  {showDeletedCols && (
                    <>
                      <TableCell>
                        {s.deleted ? (
                          <Badge variant="destructive" className="font-medium">
                            Yes
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No</span>
                        )}
                      </TableCell>
                      <TableCell className={tdClass}>{formatDate(s.deletedAt)}</TableCell>
                      <TableCell className={tdClass}>{s.deletedByName ?? '-'}</TableCell>
                    </>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {!s.deleted && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                            onClick={() => {
                              setEditingStructure(s)
                              setDialogOpen(true)
                            }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleSoftDelete(s)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                      {s.deleted && (
                        <>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:bg-secondary hover:text-foreground"
                              onClick={() => handleUndelete(s)}>
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span className="sr-only">Restore structure {s.id}</span>
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => handleHardDelete(s)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
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

      <div className="text-xs text-muted-foreground">
        Showing {filtered.length} of {initialStructures.length} structures
      </div>

      <WorkOrderStructureFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        structure={editingStructure}
        workOrderOptions={workOrderOptions}
        materialOptions={materialOptions}
      />
    </div>
  )
}
