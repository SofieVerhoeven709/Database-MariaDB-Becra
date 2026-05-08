'use client'

import {useState} from 'react'
import {getCsvValue, isTruthyCsvValue, normalizeCsvLookup, type CsvRow} from '@/lib/csv'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import type {Route} from 'next'
import {Search, Plus, Pencil, ChevronDown, ChevronUp, Trash2, ExternalLink} from 'lucide-react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import type {MappedBoq, BoqLookup} from '@/types/billOfQuantity'
import {
  createBoqAction,
  softDeleteBoqAction,
  hardDeleteBoqAction,
  undeleteBoqAction,
} from '@/serverFunctions/billOfQuantities'
import {BoqFormDialog} from '@/components/custom/billOfQuantityFormDialog'
import type {ProjectOption} from '@/components/custom/billOfQuantityFormDialog'
import {TableCsvActions} from '@/components/custom/tableCsvActions'

type SortField =
  | 'boqNumber'
  | 'clientReference'
  | 'boqDate'
  | 'dueDate'
  | 'sentDate'
  | 'boqStatus'
  | 'paymentMethod'
  | 'boqType'
  | 'outstanding'
  | 'reminderSent'
  | 'createdAt'
  | 'createdBy'

type SortDir = 'asc' | 'desc'
type FilterDeleted = 'not-deleted' | 'deleted' | 'all'

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function csvErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Could not create BoQ.'
}

function parseCsvDate(value: string, defaultToToday = false) {
  const trimmed = value.trim()
  if (!trimmed) return defaultToToday ? new Date() : null
  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function findLookup(options: BoqLookup[], value: string) {
  if (!value) return null
  const normalized = normalizeCsvLookup(value)
  return options.find(option => option.id === value || normalizeCsvLookup(option.name) === normalized) ?? null
}

function SortIcon({field, sortField, sortDir}: {field: SortField; sortField: SortField; sortDir: SortDir}) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? (
    <ChevronUp className="inline h-3.5 w-3.5 ml-1" />
  ) : (
    <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
  )
}

function BoolBadge({value}: {value: boolean}) {
  return value ? (
    <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
  ) : (
    <Badge variant="secondary" className="text-muted-foreground font-medium">
      No
    </Badge>
  )
}

interface BoqTableProps {
  initialBoqs: MappedBoq[]
  currentUserRole: string
  currentUserLevel: number
  departmentId: string
  boqTypes: BoqLookup[]
  paymentMethods: BoqLookup[]
  boqSentTypes: BoqLookup[]
  boqStatuses: BoqLookup[]
  contactOptions: BoqLookup[]
  projectOptions: ProjectOption[]
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

export function BoqTable({
  initialBoqs,
  currentUserRole,
  currentUserLevel,
  departmentId,
  boqTypes,
  paymentMethods,
  boqSentTypes,
  boqStatuses,
  projectOptions,
}: BoqTableProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canEdit = currentUserLevel >= 40
  const canCreate = currentUserLevel >= 60
  const canDelete = currentUserLevel >= 80

  const [search, setSearch] = useState('')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [sortField, setSortField] = useState<SortField>('boqDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBoq, setEditingBoq] = useState<MappedBoq | null>(null)

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filtered = initialBoqs
    .filter(boq => {
      if (filterDeleted === 'not-deleted' && boq.deleted) return false
      if (filterDeleted === 'deleted' && !boq.deleted) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        boq.boqNumber.toLowerCase().includes(q) ||
        (boq.clientReference?.toLowerCase().includes(q) ?? false) ||
        (boq.poNumber?.toLowerCase().includes(q) ?? false) ||
        boq.boqStatusName.toLowerCase().includes(q) ||
        boq.paymentMethodName.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const s = (x: string | null, y: string | null) => dir * (x ?? '').localeCompare(y ?? '')
      const n = (x: boolean, y: boolean) => dir * (Number(x) - Number(y))
      switch (sortField) {
        case 'boqNumber':
          return s(a.boqNumber, b.boqNumber)
        case 'clientReference':
          return s(a.clientReference, b.clientReference)
        case 'boqDate':
          return s(a.boqDate, b.boqDate)
        case 'dueDate':
          return s(a.dueDate, b.dueDate)
        case 'sentDate':
          return s(a.sentDate, b.sentDate)
        case 'boqStatus':
          return s(a.boqStatusName, b.boqStatusName)
        case 'paymentMethod':
          return s(a.paymentMethodName, b.paymentMethodName)
        case 'boqType':
          return s(a.boqTypeName, b.boqTypeName)
        case 'outstanding':
          return n(a.outstanding, b.outstanding)
        case 'reminderSent':
          return n(a.reminderSent, b.reminderSent)
        case 'createdAt':
          return s(a.createdAt, b.createdAt)
        case 'createdBy':
          return s(a.createdByName, b.createdByName)
        default:
          return 0
      }
    })

  const showDeletedCols = filterDeleted !== 'not-deleted'

  async function handleSoftDelete(boq: MappedBoq) {
    await softDeleteBoqAction({id: boq.id})
    router.refresh()
  }
  async function handleHardDelete(boq: MappedBoq) {
    await hardDeleteBoqAction({id: boq.id})
    router.refresh()
  }
  async function handleUndelete(boq: MappedBoq) {
    await undeleteBoqAction({id: boq.id})
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
      const boqType = findLookup(boqTypes, getCsvValue(row, ['BoQ Type', 'Type', 'boqTypeId'])) ?? boqTypes[0]
      const paymentMethod =
        findLookup(paymentMethods, getCsvValue(row, ['Payment Method', 'paymentMethodId'])) ?? paymentMethods[0]
      const sentType = findLookup(boqSentTypes, getCsvValue(row, ['Sent Type', 'boqSentTypeId'])) ?? boqSentTypes[0]
      const status =
        findLookup(boqStatuses, getCsvValue(row, ['Status', 'BoQ Status', 'boqStatusId'])) ?? boqStatuses[0]
      const boqDate = parseCsvDate(getCsvValue(row, ['BoQ Date', 'Date', 'boqDate']), true)
      const dueDate = parseCsvDate(getCsvValue(row, ['Due Date', 'dueDate']), true)

      if (!boqType || !paymentMethod || !sentType || !status || !boqDate || !dueDate) {
        errors.push(`Row ${rowNumber}: Required lookup values are missing.`)
        continue
      }

      try {
        await createBoqAction({
          boqNumber: getCsvValue(row, ['BoQ #', 'BoQ Number', 'boqNumber']) || undefined,
          poNumber: getCsvValue(row, ['PO Number', 'poNumber']) || null,
          clientReference: getCsvValue(row, ['Client Reference', 'clientReference']) || null,
          boqDate,
          dueDate,
          sentDate: parseCsvDate(getCsvValue(row, ['Sent Date', 'sentDate'])),
          reminderSent: isTruthyCsvValue(getCsvValue(row, ['Reminder Sent', 'reminderSent'])),
          outstanding:
            !getCsvValue(row, ['Outstanding', 'outstanding']) ||
            isTruthyCsvValue(getCsvValue(row, ['Outstanding', 'outstanding'])),
          boqTypeId: boqType.id,
          paymentMethodId: paymentMethod.id,
          boqSentTypeId: sentType.id,
          boqStatusId: status.id,
          priceListId: null,
          workOrderIds: [],
        })
        created += 1
      } catch (error) {
        errors.push(`Row ${rowNumber}: ${csvErrorMessage(error)}`)
      }
    }

    if (created > 0) router.refresh()
    window.alert(
      errors.length
        ? `Created ${created} BoQ(s). ${errors.slice(0, 5).join(' ')}${
            errors.length > 5 ? ` +${errors.length - 5} more error(s).` : ''
          }`
        : `Created ${created} BoQ(s).`,
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search BoQ #, ID, status…"
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
        <TableCsvActions filename="bill-of-quantity-table.csv" onUpload={handleUploadCsv} />

        {canCreate && (
          <Button
            onClick={() => {
              setEditingBoq(null)
              setDialogOpen(true)
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
            <Plus className="h-4 w-4" />
            New BoQ
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <Th field="boqNumber" label="BoQ #" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th
                field="clientReference"
                label="Client Reference"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="boqDate" label="BoQ Date" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="dueDate" label="Due Date" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="sentDate" label="Sent Date" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="boqStatus" label="Status" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="paymentMethod" label="Payment" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="boqType" label="Type" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="outstanding" label="Outstanding" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="reminderSent" label="Reminder" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="createdAt" label="Created At" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="createdBy" label="Created By" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              {showDeletedCols && (
                <>
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
                <TableCell colSpan={showDeletedCols ? 15 : 13} className="h-32 text-center text-muted-foreground">
                  No bills of quantities found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(boq => (
                <TableRow
                  key={boq.id}
                  className={`border-border/40 hover:bg-secondary/50 ${boq.deleted ? 'opacity-50' : ''}`}>
                  <TableCell className={`${tdClass} text-foreground font-medium`}>
                    <Link
                      href={`/departments/${departmentId}/billOfQuantity/${boq.id}` as Route}
                      className="hover:text-accent hover:underline transition-colors">
                      {boq.boqNumber}
                    </Link>
                  </TableCell>
                  <TableCell className={tdClass}>{boq.clientReference ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{formatDate(boq.boqDate)}</TableCell>
                  <TableCell className={tdClass}>{formatDate(boq.dueDate)}</TableCell>
                  <TableCell className={tdClass}>{formatDate(boq.sentDate)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-border text-muted-foreground font-normal">
                      {boq.boqStatusName}
                    </Badge>
                  </TableCell>
                  <TableCell className={tdClass}>{boq.paymentMethodName}</TableCell>
                  <TableCell className={tdClass}>{boq.boqTypeName}</TableCell>
                  <TableCell>
                    <BoolBadge value={boq.outstanding} />
                  </TableCell>
                  <TableCell>
                    <BoolBadge value={boq.reminderSent} />
                  </TableCell>
                  <TableCell className={tdClass}>{formatDate(boq.createdAt)}</TableCell>
                  <TableCell className={tdClass}>{boq.createdByName}</TableCell>
                  {showDeletedCols && (
                    <>
                      <TableCell className={tdClass}>{formatDate(boq.deletedAt)}</TableCell>
                      <TableCell className={tdClass}>{boq.deletedByName ?? '-'}</TableCell>
                    </>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/departments/${departmentId}/billOfQuantity/${boq.id}` as Route}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      {!boq.deleted && (
                        <>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                              onClick={() => {
                                setEditingBoq(boq)
                                setDialogOpen(true)
                              }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleSoftDelete(boq)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                      {boq.deleted && (
                        <>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary px-2"
                              onClick={() => handleUndelete(boq)}>
                              Restore
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => handleHardDelete(boq)}>
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
        Showing {filtered.length} of {initialBoqs.length} bills of quantities
      </div>

      <BoqFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        boq={editingBoq}
        boqTypes={boqTypes}
        paymentMethods={paymentMethods}
        boqSentTypes={boqSentTypes}
        boqStatuses={boqStatuses}
        projectOptions={projectOptions}
        onSaved={() => {
          setDialogOpen(false)
          router.refresh()
        }}
      />
    </div>
  )
}
