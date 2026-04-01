'use client'

import {useState} from 'react'
import {Search, Plus, Pencil, ChevronDown, ChevronUp, Trash2, ExternalLink} from 'lucide-react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import type {Route} from 'next'
import {deleteMaterialSerialTrackedAction} from '@/serverFunctions/materialSerialTracked'
// replace with your real dialogue once you create it
import {MaterialSerialTrackedFormDialog} from '@/components/custom/serialTrackedFormDialog'

type SortField =
  | 'beNumber'
  | 'brandName'
  | 'management'
  | 'brandOrderNumber'
  | 'orderNumber'
  | 'shortDescription'
  | 'transactionType'
  | 'fromLocation'
  | 'toLocation'
  | 'preferredSupplier'
  | 'rejected'
  | 'createdBy'
  | 'deleted'

type SortDir = 'asc' | 'desc'
type FilterDeleted = 'not-deleted' | 'deleted' | 'all'

export type MappedMaterialSerialTracked = {
  id: string
  beNumber: string | null
  brandName: string | null
  management: string | null
  brandOrderNumber: string | null
  companyId: string | null
  orderNumber: string | null
  shortDescription: string | null
  longDescription: string | null
  transactionType: string | null
  materialGroupId: string | null
  fromLocation: string | null
  toLocation: string | null
  preferredSupplier: string | null
  rejected: boolean | null
  additionalInfo: string | null
  projectId: string | null
  becraCode: string | null
  warehousePlaceId: string | null
  warehousePlaceLabel: string | null
  createdBy: string | null
  createdByName: string | null
  deleted: boolean
  deletedAt?: string | null
  deletedByName?: string | null
}

function SortIcon({field, sortField, sortDir}: {field: SortField; sortField: SortField; sortDir: SortDir}) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? (
    <ChevronUp className="ml-1 inline h-3.5 w-3.5" />
  ) : (
    <ChevronDown className="ml-1 inline h-3.5 w-3.5" />
  )
}

function YesNoBadge({value}: {value: boolean}) {
  return value ? (
    <Badge className="border-0 bg-accent/15 font-medium text-accent">Yes</Badge>
  ) : (
    <Badge variant="secondary" className="font-medium text-muted-foreground">
      No
    </Badge>
  )
}

const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
const tdClass = 'whitespace-nowrap text-sm text-muted-foreground'

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
      {label}
      <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </TableHead>
  )
}

interface SerialTrackedTableProps {
  initialSerialTracked: MappedMaterialSerialTracked[]
  currentUserRole: string
  currentUserLevel: number
  companyOptions: {id: string; name: string}[]
  projectOptions: {id: string; name: string}[]
  materialGroupOptions: {id: string; name: string}[]
  warehousePlaceOptions: {id: string; label: string}[]
  departmentId: string
  materialOptions: {
    id: string
    beNumber: string
    brandName: string | null
    management: string | null
    brandOrderNr: string | null
    shortDescription: string
    longDescription: string | null
    materialGroupId: string
  }[]
}

export function SerialTrackedTable({
  initialSerialTracked,
  currentUserRole,
  currentUserLevel,
  companyOptions,
  projectOptions,
  materialGroupOptions,
  warehousePlaceOptions,
  departmentId,
  materialOptions,
}: SerialTrackedTableProps) {
  // DEBUG: Log incoming data and filtered data
  console.log('SerialTrackedTable initialSerialTracked:', initialSerialTracked)
  console.log('[SerialTrackedTable] initialSerialTracked:', initialSerialTracked)

  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canDelete = currentUserRole === 'Administrator' || currentUserLevel >= 80

  const [search, setSearch] = useState('')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [sortField, setSortField] = useState<SortField>('beNumber')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MappedMaterialSerialTracked | null>(null)

  const companyMap = new Map(companyOptions.map(c => [c.id, c.name]))
  const projectMap = new Map(projectOptions.map(p => [p.id, p.name]))
  const materialGroupMap = new Map(materialGroupOptions.map(mg => [mg.id, mg.name]))

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filtered = initialSerialTracked
    .filter(item => {
      if (filterDeleted === 'not-deleted' && item.deleted) return false
      if (filterDeleted === 'deleted' && !item.deleted) return false
      if (!search) return true

      const q = search.toLowerCase()
      return (
        item.beNumber?.toLowerCase().includes(q) ||
        item.brandName?.toLowerCase().includes(q) ||
        item.management?.toLowerCase().includes(q) ||
        item.brandOrderNumber?.toLowerCase().includes(q) ||
        item.orderNumber?.toLowerCase().includes(q) ||
        item.shortDescription?.toLowerCase().includes(q) ||
        item.transactionType?.toLowerCase().includes(q) ||
        item.fromLocation?.toLowerCase().includes(q) ||
        item.toLocation?.toLowerCase().includes(q) ||
        item.preferredSupplier?.toLowerCase().includes(q) ||
        item.createdByName?.toLowerCase().includes(q) ||
        (item.companyId ? companyMap.get(item.companyId)?.toLowerCase().includes(q) : false) ||
        (item.projectId ? projectMap.get(item.projectId)?.toLowerCase().includes(q) : false) ||
        (item.materialGroupId ? materialGroupMap.get(item.materialGroupId)?.toLowerCase().includes(q) : false) ||
        item.warehousePlaceLabel?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const s = (x: string | null, y: string | null) => dir * (x ?? '').localeCompare(y ?? '')
      const n = (x: boolean, y: boolean) => dir * (Number(x) - Number(y))

      switch (sortField) {
        case 'beNumber':
          return s(a.beNumber, b.beNumber)
        case 'brandName':
          return s(a.brandName, b.brandName)
        case 'management':
          return s(a.management, b.management)
        case 'brandOrderNumber':
          return s(a.brandOrderNumber, b.brandOrderNumber)
        case 'orderNumber':
          return s(a.orderNumber, b.orderNumber)
        case 'shortDescription':
          return s(a.shortDescription, b.shortDescription)
        case 'transactionType':
          return s(a.transactionType, b.transactionType)
        case 'fromLocation':
          return s(a.fromLocation, b.fromLocation)
        case 'toLocation':
          return s(a.toLocation, b.toLocation)
        case 'preferredSupplier':
          return s(a.preferredSupplier, b.preferredSupplier)
        case 'rejected':
          return n(!!a.rejected, !!b.rejected)
        case 'createdBy':
          return s(a.createdByName, b.createdByName)
        case 'deleted':
          return n(a.deleted, b.deleted)
        default:
          return 0
      }
    })

  // DEBUG: Log filtered data
  console.log('SerialTrackedTable filtered:', filtered)

  async function handleSoftDelete(item: MappedMaterialSerialTracked) {
    await deleteMaterialSerialTrackedAction({id: item.id})
    router.refresh()
  }

  async function handleHardDelete(_item: MappedMaterialSerialTracked) {
    // add later if you make a hard delete action
    router.refresh()
  }

  async function handleUndelete(_item: MappedMaterialSerialTracked) {
    // add later if you make an undelete action
    router.refresh()
  }

  const showDeletedCols = filterDeleted !== 'not-deleted'
  const colCount = showDeletedCols ? 17 : 14

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search serial tracked item…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border-border bg-secondary pl-10 placeholder:text-muted-foreground/60 focus-visible:ring-accent"
            />
          </div>

          <Select value={filterDeleted} onValueChange={v => setFilterDeleted(v as FilterDeleted)}>
            <SelectTrigger className="w-37.5 border-border bg-secondary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-card">
              <SelectItem value="not-deleted">Not Deleted</SelectItem>
              <SelectItem value="deleted">Deleted Only</SelectItem>
              <SelectItem value="all">Show All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {canDelete && (
          <Button
            onClick={() => {
              setEditingItem(null)
              setDialogOpen(true)
            }}
            className="gap-2 bg-accent text-accent-foreground hover:bg-accent/80">
            <Plus className="h-4 w-4" />
            New Serial Tracked
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <Th field="beNumber" label="BE Number" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th
                field="shortDescription"
                label="Description"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="brandName" label="Brand" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="management" label="Management" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th
                field="brandOrderNumber"
                label="Brand Order Nr"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th
                field="orderNumber"
                label="Order Number"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <TableHead className="whitespace-nowrap text-xs">Company</TableHead>
              <TableHead className="whitespace-nowrap text-xs">Material Group</TableHead>
              <TableHead className="whitespace-nowrap text-xs">Project</TableHead>
              <TableHead className="whitespace-nowrap text-xs">Stock Location</TableHead>
              <Th field="fromLocation" label="From" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="toLocation" label="To" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="rejected" label="Rejected" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
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
                  No serial tracked items found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(item => (
                <TableRow
                  key={item.id}
                  className={`border-border/40 hover:bg-secondary/50 ${item.deleted ? 'opacity-50' : ''}`}>
                  <TableCell className={`${tdClass} font-medium text-foreground`}>
                    <Link
                      href={`/departments/${departmentId}/serialTracked/${item.id}` as Route}
                      className="transition-colors hover:text-accent hover:underline">
                      {item.beNumber ?? '-'}
                    </Link>
                  </TableCell>

                  <TableCell className={tdClass}>
                    <span className="inline-block max-w-45 truncate">{item.shortDescription ?? '-'}</span>
                  </TableCell>

                  <TableCell className={tdClass}>{item.brandName ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{item.management ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{item.brandOrderNumber ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{item.orderNumber ?? '-'}</TableCell>
                  <TableCell className={tdClass}>
                    {item.companyId ? (companyMap.get(item.companyId) ?? '-') : '-'}
                  </TableCell>
                  <TableCell className={tdClass}>
                    {item.materialGroupId ? (materialGroupMap.get(item.materialGroupId) ?? '-') : '-'}
                  </TableCell>
                  <TableCell className={tdClass}>
                    {item.projectId ? (projectMap.get(item.projectId) ?? '-') : '-'}
                  </TableCell>
                  <TableCell className={tdClass}>{item.warehousePlaceLabel ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{item.fromLocation ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{item.toLocation ?? '-'}</TableCell>

                  <TableCell>
                    <YesNoBadge value={!!item.rejected} />
                  </TableCell>

                  <TableCell className={tdClass}>{item.createdByName ?? '-'}</TableCell>

                  {showDeletedCols && (
                    <>
                      <TableCell>
                        {item.deleted ? (
                          <Badge variant="destructive" className="font-medium">
                            Yes
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell className={tdClass}>
                        {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString('en-GB') : '-'}
                      </TableCell>
                      <TableCell className={tdClass}>{item.deletedByName ?? '-'}</TableCell>
                    </>
                  )}

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/departments/${departmentId}/serialTracked/${item.id}` as Route}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:bg-accent/10 hover:text-accent">
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span className="sr-only">View {item.beNumber ?? item.id}</span>
                        </Button>
                      </Link>

                      {!item.deleted && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-secondary hover:text-foreground"
                            onClick={() => {
                              setEditingItem(item)
                              setDialogOpen(true)
                            }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleSoftDelete(item)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      )}

                      {item.deleted && (
                        <>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                              onClick={() => handleUndelete(item)}>
                              Restore
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => handleHardDelete(item)}>
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
        Showing {filtered.length} of {initialSerialTracked.length} serial tracked items
      </div>

      <MaterialSerialTrackedFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        materialSerialTracked={editingItem as any}
        companyOptions={companyOptions}
        projectOptions={projectOptions}
        materialGroupOptions={materialGroupOptions}
        warehousePlaceOptions={warehousePlaceOptions}
        materialOptions={materialOptions}
        departmentId={departmentId}
      />
    </div>
  )
}
