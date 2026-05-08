'use client'

import {useState} from 'react'
import {Search, Plus, Pencil, ChevronDown, ChevronUp, Trash2, RotateCcw} from 'lucide-react'
import {DepartmentFormDialog} from '@/components/custom/departmentFormDialog'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {TableCsvActions} from '@/components/custom/tableCsvActions'
import {getCsvValue, type CsvRow} from '@/lib/csv'
import {Badge} from '@/components/ui/badge'
import {useRouter} from 'next/navigation'
import type {MappedDepartment} from '@/types/department'
import {
  createDepartmentAction,
  softDeleteDepartmentAction,
  hardDeleteDepartmentAction,
  undeleteDepartmentAction,
} from '@/serverFunctions/departments'

type SortField = 'name' | 'number' | 'description' | 'createdAt' | 'createdBy' | 'deleted'
type SortDir = 'asc' | 'desc'
type FilterDeleted = 'not-deleted' | 'deleted' | 'all'

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function csvErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Could not create department.'
}

function parseOptionalNumber(value: string) {
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

interface DepartmentTableProps {
  initialDepartments: MappedDepartment[]
  currentUserRole: string
  currentUserLevel: number
}

export function DepartmentTable({initialDepartments, currentUserRole, currentUserLevel}: DepartmentTableProps) {
  const router = useRouter()
  // Role/level gates control delete/restore actions.
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canDelete = currentUserRole === 'Administrator' || currentUserLevel >= 80

  const [search, setSearch] = useState('')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<MappedDepartment | null>(null)

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  // Apply search/deleted filters before sorting the list.
  const filtered = initialDepartments
    .filter(d => {
      if (filterDeleted === 'not-deleted' && d.deleted) return false
      if (filterDeleted === 'deleted' && !d.deleted) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        d.name?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.number?.toString().includes(q)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const s = (x: string | null, y: string | null) => dir * (x ?? '').localeCompare(y ?? '')
      const n = (x: number | null, y: number | null) => dir * ((x ?? 0) - (y ?? 0))
      switch (sortField) {
        case 'name':
          return s(a.name, b.name)
        case 'number':
          return n(a.number, b.number)
        case 'description':
          return s(a.description, b.description)
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

  async function handleSoftDelete(d: MappedDepartment) {
    await softDeleteDepartmentAction({id: d.id})
    router.refresh()
  }

  async function handleHardDelete(d: MappedDepartment) {
    await hardDeleteDepartmentAction({id: d.id})
    router.refresh()
  }

  async function handleUndelete(d: MappedDepartment) {
    await undeleteDepartmentAction({id: d.id})
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
      const name = getCsvValue(row, ['Name', 'Department', 'name'])

      if (!name) {
        errors.push(`Row ${rowNumber}: Name is required.`)
        continue
      }

      try {
        await createDepartmentAction({
          name,
          number: parseOptionalNumber(getCsvValue(row, ['Number', 'Department Number', 'number'])),
          color: getCsvValue(row, ['Color', 'color']) || null,
          icon: getCsvValue(row, ['Icon', 'icon']) || null,
          description: getCsvValue(row, ['Description', 'description']) || null,
        })
        created += 1
      } catch (error) {
        errors.push(`Row ${rowNumber}: ${csvErrorMessage(error)}`)
      }
    }

    if (created > 0) router.refresh()
    window.alert(
      errors.length
        ? `Created ${created} department(s). ${errors.slice(0, 5).join(' ')}${
            errors.length > 5 ? ` +${errors.length - 5} more error(s).` : ''
          }`
        : `Created ${created} department(s).`,
    )
  }

  const showDeletedCols = filterDeleted !== 'not-deleted'
  const colCount = showDeletedCols ? 10 : 7

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, description…"
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
        <TableCsvActions filename="departments-table.csv" onUpload={handleUploadCsv} />
        <Button
          onClick={() => {
            setEditingDepartment(null)
            setDialogOpen(true)
          }}
          className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
          <Plus className="h-4 w-4" />
          New Department
        </Button>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <Th field="name" label="Name" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="number" label="Number" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <TableHead className="whitespace-nowrap text-xs">Color</TableHead>
              <TableHead className="whitespace-nowrap text-xs">Icon</TableHead>
              <Th field="description" label="Description" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
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
                  No departments found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(d => (
                <TableRow
                  key={d.id}
                  className={`border-border/40 hover:bg-secondary/50 ${d.deleted ? 'opacity-50' : ''}`}>
                  <TableCell className={`${tdClass} text-foreground font-medium`}>{d.name}</TableCell>
                  <TableCell className={tdClass}>{d.number ?? '-'}</TableCell>
                  <TableCell className={tdClass}>
                    {d.color ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded-sm border border-border flex-shrink-0"
                          style={{backgroundColor: d.color}}
                        />
                        <span>{d.color}</span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className={tdClass}>{d.icon ?? '-'}</TableCell>
                  <TableCell className={tdClass}>
                    <span className="max-w-[200px] truncate inline-block">{d.description ?? '-'}</span>
                  </TableCell>
                  <TableCell className={tdClass}>{formatDate(d.createdAt)}</TableCell>
                  <TableCell className={tdClass}>{d.createdByName}</TableCell>
                  {showDeletedCols && (
                    <>
                      <TableCell>
                        {d.deleted ? (
                          <Badge variant="destructive" className="font-medium">
                            Yes
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No</span>
                        )}
                      </TableCell>
                      <TableCell className={tdClass}>{formatDate(d.deletedAt)}</TableCell>
                      <TableCell className={tdClass}>{d.deletedByName ?? '-'}</TableCell>
                    </>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {!d.deleted && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                            onClick={() => {
                              setEditingDepartment(d)
                              setDialogOpen(true)
                            }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleSoftDelete(d)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                      {d.deleted && (
                        <>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:bg-secondary hover:text-foreground"
                              onClick={() => handleUndelete(d)}>
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span className="sr-only">Restore department {d.id}</span>
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => handleHardDelete(d)}>
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
        Showing {filtered.length} of {initialDepartments.length} departments
      </div>

      <DepartmentFormDialog open={dialogOpen} onOpenChange={setDialogOpen} department={editingDepartment} />
    </div>
  )
}
