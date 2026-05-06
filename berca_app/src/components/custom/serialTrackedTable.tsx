'use client'

import {useState} from 'react'
import {getCsvValue, isTruthyCsvValue, normalizeCsvLookup, type CsvRow} from '@/lib/csv'
import {Search, Plus, Pencil, ChevronDown, ChevronUp, Trash2, ExternalLink, Copy, RotateCcw} from 'lucide-react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {TableCsvActions} from '@/components/custom/tableCsvActions'
import {Badge} from '@/components/ui/badge'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import type {Route} from 'next'
import {
  createMaterialSerialTrackedAction,
  deleteMaterialSerialTrackedAction,
  undeleteMaterialSerialTrackedAction,
  hardDeleteMaterialSerialTrackedAction,
} from '@/serverFunctions/materialSerialTracked'
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
type InspectionStatusFilter = 'all' | 'overdue' | 'upcoming' | 'ok' | 'none'

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
  lastInspectionDate?: string | null
  nextInspectionDate?: string | null
  inspectionIntervalValue?: number | null
  inspectionIntervalUnit?: string | null
}

export type InspectionItem = {
  id: string
  beNumber: string | null
  shortDescription: string | null
  quantityRequired: number | null
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

function parseCsvDate(value: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function parsePositiveInt(value: string) {
  if (!value) return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function csvErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Could not create record.'
}

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
  managementEmployeeOptions?: {id: string; name: string}[]
  inspectionItemsBySerialTrackedId?: Record<string, InspectionItem[]>
  inspectionWarningDays?: number
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
  managementEmployeeOptions = [],
  inspectionItemsBySerialTrackedId,
  inspectionWarningDays,
}: SerialTrackedTableProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canDelete = currentUserRole === 'Administrator' || currentUserLevel >= 80

  const [search, setSearch] = useState('')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [inspectionStatusFilter, setInspectionStatusFilter] = useState<InspectionStatusFilter>('all')
  const [sortField, setSortField] = useState<SortField>('beNumber')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MappedMaterialSerialTracked | null>(null)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'duplicate'>('create')

  const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString('en-GB') : '-')
  const formatInspectionInterval = (value?: number | null, unit?: string | null) =>
    value ? `${value} ${unit ? unit.toLowerCase() + (value === 1 ? '' : 's') : 'days'}` : '-'

  const companyMap = new Map(companyOptions.map(c => [c.id, c.name]))
  const projectMap = new Map(projectOptions.map(p => [p.id, p.name]))
  const materialGroupMap = new Map(materialGroupOptions.map(mg => [mg.id, mg.name]))

  const inspectionWarningWindowDays = inspectionWarningDays ?? 0

  function getInspectionStatus(nextInspectionDate?: string | null): 'none' | 'overdue' | 'upcoming' | 'ok' {
    if (!nextInspectionDate || inspectionWarningWindowDays <= 0) return 'none'

    const targetDate = new Date(nextInspectionDate)
    if (Number.isNaN(targetDate.getTime())) return 'none'

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    targetDate.setHours(0, 0, 0, 0)

    const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return 'overdue'
    if (diffDays <= inspectionWarningWindowDays) return 'upcoming'
    return 'ok'
  }

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

      if (inspectionStatusFilter !== 'all') {
        const status = getInspectionStatus(item.nextInspectionDate)
        if (status !== inspectionStatusFilter) return false
      }

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

  const overdueCount = filtered.reduce(
    (count, item) => (getInspectionStatus(item.nextInspectionDate) === 'overdue' ? count + 1 : count),
    0,
  )
  const upcomingCount = filtered.reduce(
    (count, item) => (getInspectionStatus(item.nextInspectionDate) === 'upcoming' ? count + 1 : count),
    0,
  )

  async function handleSoftDelete(item: MappedMaterialSerialTracked) {
    if (!confirm('Are you sure you want to delete this serial tracked item?')) return
    await deleteMaterialSerialTrackedAction({id: item.id})
    router.refresh()
  }

  async function handleHardDelete(item: MappedMaterialSerialTracked) {
    if (!confirm('Permanently delete this serial tracked item? This cannot be undone.')) return
    await hardDeleteMaterialSerialTrackedAction({id: item.id})
    router.refresh()
  }

  async function handleUndelete(item: MappedMaterialSerialTracked) {
    if (!confirm('Restore this serial tracked item?')) return
    await undeleteMaterialSerialTrackedAction({id: item.id})
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
      const materialValue = getCsvValue(row, ['Material', 'BE Number', 'Material BE Number', 'materialId'])
      const material = materialOptions.find(
        option =>
          option.id === materialValue ||
          normalizeCsvLookup(option.beNumber) === normalizeCsvLookup(materialValue) ||
          normalizeCsvLookup(option.shortDescription) === normalizeCsvLookup(materialValue),
      )

      if (!material) {
        errors.push(`Row ${rowNumber}: Material could not be matched.`)
        continue
      }

      const companyValue = getCsvValue(row, ['Company', 'companyId'])
      const company = companyValue
        ? companyOptions.find(
            option =>
              option.id === companyValue || normalizeCsvLookup(option.name) === normalizeCsvLookup(companyValue),
          )
        : null
      const projectValue = getCsvValue(row, ['Project', 'projectId'])
      const project = projectValue
        ? projectOptions.find(
            option =>
              option.id === projectValue || normalizeCsvLookup(option.name) === normalizeCsvLookup(projectValue),
          )
        : null
      const groupValue = getCsvValue(row, ['Material Group', 'materialGroupId'])
      const materialGroup = groupValue
        ? materialGroupOptions.find(
            option => option.id === groupValue || normalizeCsvLookup(option.name) === normalizeCsvLookup(groupValue),
          )
        : null
      const warehouseValue = getCsvValue(row, ['Stock Location', 'Warehouse Place', 'warehousePlaceId'])
      const warehousePlace = warehouseValue
        ? warehousePlaceOptions.find(
            option =>
              option.id === warehouseValue || normalizeCsvLookup(option.label) === normalizeCsvLookup(warehouseValue),
          )
        : null

      if (companyValue && !company) {
        errors.push(`Row ${rowNumber}: Company could not be matched.`)
        continue
      }

      if (projectValue && !project) {
        errors.push(`Row ${rowNumber}: Project could not be matched.`)
        continue
      }

      if (groupValue && !materialGroup) {
        errors.push(`Row ${rowNumber}: Material Group could not be matched.`)
        continue
      }

      if (warehouseValue && !warehousePlace) {
        errors.push(`Row ${rowNumber}: Stock Location could not be matched.`)
        continue
      }

      const intervalValueText = getCsvValue(row, ['Inspection Interval Value', 'inspectionIntervalValue'])
      const intervalValue = parsePositiveInt(intervalValueText)
      const intervalUnit = getCsvValue(row, ['Inspection Interval Unit', 'inspectionIntervalUnit']).toUpperCase()

      if (intervalValueText && !intervalValue) {
        errors.push(`Row ${rowNumber}: Inspection Interval Value must be a positive whole number.`)
        continue
      }

      if (intervalUnit && !['DAY', 'WEEK', 'MONTH', 'YEAR'].includes(intervalUnit)) {
        errors.push(`Row ${rowNumber}: Inspection Interval Unit must be DAY, WEEK, MONTH, or YEAR.`)
        continue
      }

      try {
        await createMaterialSerialTrackedAction({
          id: crypto.randomUUID(),
          materialId: material.id,
          beNumber: getCsvValue(row, ['BE Number', 'beNumber']) || material.beNumber,
          brandName: getCsvValue(row, ['Brand', 'brandName']) || material.brandName,
          management: getCsvValue(row, ['Management', 'management']) || material.management,
          brandOrderNumber: getCsvValue(row, ['Brand Order Nr', 'brandOrderNumber']) || material.brandOrderNr,
          companyId: company?.id ?? null,
          orderNumber: getCsvValue(row, ['Order Number', 'orderNumber']) || null,
          shortDescription: getCsvValue(row, ['Description', 'Short Description']) || material.shortDescription,
          longDescription: getCsvValue(row, ['Long Description', 'longDescription']) || material.longDescription,
          transactionType: getCsvValue(row, ['Transaction Type', 'transactionType']) || null,
          materialGroupId: materialGroup?.id ?? material.materialGroupId,
          fromLocation: getCsvValue(row, ['From', 'fromLocation']) || null,
          toLocation: getCsvValue(row, ['To', 'toLocation']) || null,
          preferredSupplier: getCsvValue(row, ['Preferred Supplier', 'preferredSupplier']) || null,
          rejected: isTruthyCsvValue(getCsvValue(row, ['Rejected', 'rejected'])),
          additionalInfo: getCsvValue(row, ['Additional Info', 'additionalInfo']) || null,
          projectId: project?.id ?? null,
          becraCode: getCsvValue(row, ['Becra Code', 'becraCode']) || null,
          warehousePlaceId: warehousePlace?.id ?? null,
          createdBy: undefined,
          lastInspectionDate: parseCsvDate(getCsvValue(row, ['Last Inspection', 'lastInspectionDate'])),
          nextInspectionDate: parseCsvDate(getCsvValue(row, ['Next Inspection', 'nextInspectionDate'])),
          inspectionIntervalValue: intervalValue,
          inspectionIntervalUnit: intervalUnit ? (intervalUnit as 'DAY' | 'WEEK' | 'MONTH' | 'YEAR') : null,
        })
        created += 1
      } catch (error) {
        errors.push(`Row ${rowNumber}: ${csvErrorMessage(error)}`)
      }
    }

    if (created > 0) router.refresh()
    window.alert(
      errors.length
        ? `Created ${created} serial tracked item(s). ${errors.slice(0, 5).join(' ')}${
            errors.length > 5 ? ` +${errors.length - 5} more error(s).` : ''
          }`
        : `Created ${created} serial tracked item(s).`,
    )
  }

  const showDeletedCols = filterDeleted !== 'not-deleted'
  const showInspectionItemsColumn = Boolean(inspectionItemsBySerialTrackedId)
  const showInspectionStatusColumn = inspectionWarningWindowDays > 0
  const colCount =
    (showDeletedCols ? 20 : 17) + (showInspectionItemsColumn ? 1 : 0) + (showInspectionStatusColumn ? 1 : 0)

  return (
    <div className="flex flex-col gap-6">
      {inspectionWarningWindowDays > 0 && (overdueCount > 0 || upcomingCount > 0) && (
        <div className="rounded-lg border border-border/60 bg-secondary/40 px-4 py-3 text-sm text-foreground">
          {overdueCount > 0 && `${overdueCount} inspection${overdueCount === 1 ? '' : 's'} overdue`}
          {overdueCount > 0 && upcomingCount > 0 && ' - '}
          {upcomingCount > 0 &&
            `${upcomingCount} inspection${upcomingCount === 1 ? '' : 's'} within ${inspectionWarningWindowDays} day${inspectionWarningWindowDays === 1 ? '' : 's'}`}
        </div>
      )}

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

          {showInspectionStatusColumn && (
            <Select
              value={inspectionStatusFilter}
              onValueChange={v => setInspectionStatusFilter(v as InspectionStatusFilter)}>
              <SelectTrigger className="w-42 border-border bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                <SelectItem value="all">All inspections</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="upcoming">Inspection soon</SelectItem>
                <SelectItem value="ok">OK</SelectItem>
                <SelectItem value="none">No reminder date</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <TableCsvActions filename="serial-tracked-table.csv" onUpload={canDelete ? handleUploadCsv : undefined} />
        {canDelete && (
          <Button
            onClick={() => {
              setDialogMode('create')
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
              <TableHead className="whitespace-nowrap text-xs">Last Inspection</TableHead>
              <TableHead className="whitespace-nowrap text-xs">Inspection Interval</TableHead>
              <TableHead className="whitespace-nowrap text-xs">Next Inspection</TableHead>
              {showInspectionStatusColumn && (
                <TableHead className="whitespace-nowrap text-xs">Inspection Status</TableHead>
              )}
              {showInspectionItemsColumn && (
                <TableHead className="whitespace-nowrap text-xs">Inspection Items</TableHead>
              )}
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
                  <TableCell className={tdClass}>{formatDate(item.lastInspectionDate)}</TableCell>
                  <TableCell className={tdClass}>
                    {formatInspectionInterval(item.inspectionIntervalValue, item.inspectionIntervalUnit)}
                  </TableCell>
                  <TableCell className={tdClass}>{formatDate(item.nextInspectionDate)}</TableCell>
                  {showInspectionStatusColumn && (
                    <TableCell>
                      {(() => {
                        const status = getInspectionStatus(item.nextInspectionDate)
                        if (status === 'overdue') {
                          return <Badge variant="destructive">Overdue</Badge>
                        }
                        if (status === 'upcoming') {
                          return <Badge variant="warning">Inspection soon</Badge>
                        }
                        return <span className="text-sm text-muted-foreground">-</span>
                      })()}
                    </TableCell>
                  )}
                  {showInspectionItemsColumn && (
                    <TableCell className={tdClass}>
                      {(() => {
                        const inspectionItems = inspectionItemsBySerialTrackedId?.[item.id] ?? []
                        if (inspectionItems.length === 0) return '-'

                        return inspectionItems
                          .map(i => {
                            const label = [i.beNumber, i.shortDescription].filter(Boolean).join(' - ')
                            if (!label) return null
                            return i.quantityRequired ? `${label} (x${i.quantityRequired})` : label
                          })
                          .filter(Boolean)
                          .join(', ')
                      })()}
                    </TableCell>
                  )}

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
                              setDialogMode('edit')
                              setEditingItem(item)
                              setDialogOpen(true)
                            }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-secondary hover:text-foreground"
                            onClick={() => {
                              setDialogMode('duplicate')
                              setEditingItem(item)
                              setDialogOpen(true)
                            }}>
                            <Copy className="h-3.5 w-3.5" />
                            <span className="sr-only">Duplicate {item.beNumber ?? item.id}</span>
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
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:bg-secondary hover:text-foreground"
                              onClick={() => handleUndelete(item)}>
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span className="sr-only">Restore {item.beNumber ?? item.id}</span>
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
        mode={dialogMode}
        companyOptions={companyOptions}
        projectOptions={projectOptions}
        materialGroupOptions={materialGroupOptions}
        warehousePlaceOptions={warehousePlaceOptions}
        materialOptions={materialOptions}
        managementEmployeeOptions={managementEmployeeOptions}
        departmentId={departmentId}
      />
    </div>
  )
}
