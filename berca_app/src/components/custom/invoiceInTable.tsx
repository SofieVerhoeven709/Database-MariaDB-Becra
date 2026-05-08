'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import type {Route} from 'next'
import {Search, Plus, Pencil, ChevronDown, ChevronUp, Trash2, ExternalLink} from 'lucide-react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import type {MappedInvoiceIn, InvoiceLookup, VatMarginOption, InvoicePurchaseLookup} from '@/types/invoice'
import {
  createInvoiceInAction,
  softDeleteInvoiceInAction,
  hardDeleteInvoiceInAction,
  undeleteInvoiceInAction,
} from '@/serverFunctions/invoices'
import {InvoiceInFormDialog} from '@/components/custom/invoiceInFormDialog'
import {TableCsvActions} from '@/components/custom/tableCsvActions'

import {getCsvValue, isTruthyCsvValue, normalizeCsvLookup, type CsvRow} from '@/lib/csv'

type SortField =
  | 'invoiceNumber'
  | 'clientInvoiceNumber'
  | 'description'
  | 'invoiceDate'
  | 'dueDate'
  | 'invoiceStatus'
  | 'paymentMethod'
  | 'invoiceType'
  | 'vatMargin'
  | 'company'
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
  return 'Could not create invoice in.'
}

function parseCsvDate(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const dayMonthYear = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (dayMonthYear) {
    const [, day, month, rawYear] = dayMonthYear
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear
    const parsed = new Date(Number(year), Number(month) - 1, Number(day))
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed
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

interface InvoiceInTableProps {
  initialInvoices: MappedInvoiceIn[]
  currentUserRole: string
  currentUserLevel: number
  departmentId: string
  invoiceTypes: InvoiceLookup[]
  paymentMethods: InvoiceLookup[]
  invoiceSentTypes: InvoiceLookup[]
  invoiceStatuses: InvoiceLookup[]
  vatMargins: VatMarginOption[]
  companyOptions: InvoiceLookup[]
  purchaseOptions: InvoicePurchaseLookup[]
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

export function InvoiceInTable({
  initialInvoices,
  currentUserRole,
  currentUserLevel,
  departmentId,
  invoiceTypes,
  paymentMethods,
  invoiceSentTypes,
  invoiceStatuses,
  vatMargins,
  companyOptions,
  purchaseOptions,
}: InvoiceInTableProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canEdit = currentUserLevel >= 40
  const canCreate = currentUserLevel >= 60
  const canDelete = currentUserLevel >= 80
  const canManageVisibility = currentUserLevel >= 80

  const [search, setSearch] = useState('')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [sortField, setSortField] = useState<SortField>('invoiceDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<MappedInvoiceIn | null>(null)

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filtered = initialInvoices
    // Client-side filter/sort for responsive tables.
    .filter(inv => {
      if (filterDeleted === 'not-deleted' && inv.deleted) return false
      if (filterDeleted === 'deleted' && !inv.deleted) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.clientInvoiceNumber?.toLowerCase().includes(q) ?? false) ||
        (inv.poNumber?.toLowerCase().includes(q) ?? false) ||
        inv.companyName.toLowerCase().includes(q) ||
        inv.invoiceStatusName.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const s = (x: string | null, y: string | null) => dir * (x ?? '').localeCompare(y ?? '')
      const n = (x: boolean, y: boolean) => dir * (Number(x) - Number(y))
      switch (sortField) {
        case 'invoiceNumber':
          return s(a.invoiceNumber, b.invoiceNumber)
        case 'clientInvoiceNumber':
          return s(a.clientInvoiceNumber, b.clientInvoiceNumber)
        case 'invoiceDate':
          return s(a.invoiceDate, b.invoiceDate)
        case 'dueDate':
          return s(a.dueDate, b.dueDate)
        case 'invoiceStatus':
          return s(a.invoiceStatusName, b.invoiceStatusName)
        case 'paymentMethod':
          return s(a.paymentMethodName, b.paymentMethodName)
        case 'invoiceType':
          return s(a.invoiceTypeName, b.invoiceTypeName)
        case 'vatMargin':
          return dir * (a.vatMarginVat - b.vatMarginVat)
        case 'company':
          return s(a.companyName, b.companyName)
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

  async function handleSoftDelete(inv: MappedInvoiceIn) {
    await softDeleteInvoiceInAction({id: inv.id})
    router.refresh()
  }
  async function handleHardDelete(inv: MappedInvoiceIn) {
    await hardDeleteInvoiceInAction({id: inv.id})
    router.refresh()
  }
  async function handleUndelete(inv: MappedInvoiceIn) {
    await undeleteInvoiceInAction({id: inv.id})
    router.refresh()
  }

  function resolveLookupId(value: string, options: InvoiceLookup[]) {
    if (!value) return null
    const normalizedValue = normalizeCsvLookup(value)
    return (
      options.find(option => option.id === value || normalizeCsvLookup(option.name) === normalizedValue)?.id ?? null
    )
  }

  function resolveVatMarginId(value: string) {
    if (!value) return null
    const normalizedValue = normalizeCsvLookup(value.replace('%', ''))
    return vatMargins.find(option => option.id === value || String(option.vat) === normalizedValue)?.id ?? null
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
      const invoiceDate = parseCsvDate(getCsvValue(row, ['Invoice Date', 'Date', 'invoiceDate']))
      const dueDate = parseCsvDate(getCsvValue(row, ['Due Date', 'dueDate']))
      const invoiceTypeId = resolveLookupId(getCsvValue(row, ['Invoice Type', 'invoiceType']), invoiceTypes)
      const paymentMethodId = resolveLookupId(getCsvValue(row, ['Payment Method', 'paymentMethod']), paymentMethods)
      const invoiceSentTypeId = resolveLookupId(
        getCsvValue(row, ['Sent Type', 'Invoice Sent Type', 'invoiceSentType']),
        invoiceSentTypes,
      )
      const invoiceStatusId = resolveLookupId(
        getCsvValue(row, ['Status', 'Invoice Status', 'invoiceStatus']),
        invoiceStatuses,
      )
      const vatMarginId = resolveVatMarginId(getCsvValue(row, ['VAT', 'VAT Margin', 'vatMargin']))
      const companyId = resolveLookupId(getCsvValue(row, ['Company', 'company']), companyOptions)

      if (!invoiceDate) errors.push(`Row ${rowNumber}: Invoice Date is required or invalid.`)
      if (!dueDate) errors.push(`Row ${rowNumber}: Due Date is required or invalid.`)
      if (!invoiceTypeId) errors.push(`Row ${rowNumber}: Invoice Type could not be matched.`)
      if (!paymentMethodId) errors.push(`Row ${rowNumber}: Payment Method could not be matched.`)
      if (!invoiceSentTypeId) errors.push(`Row ${rowNumber}: Invoice Sent Type could not be matched.`)
      if (!invoiceStatusId) errors.push(`Row ${rowNumber}: Invoice Status could not be matched.`)
      if (!vatMarginId) errors.push(`Row ${rowNumber}: VAT Margin could not be matched.`)
      if (!companyId) errors.push(`Row ${rowNumber}: Company could not be matched.`)
      if (
        !invoiceDate ||
        !dueDate ||
        !invoiceTypeId ||
        !paymentMethodId ||
        !invoiceSentTypeId ||
        !invoiceStatusId ||
        !vatMarginId ||
        !companyId
      ) {
        continue
      }

      try {
        await createInvoiceInAction({
          invoiceNumber: getCsvValue(row, ['Invoice #', 'Invoice Number', 'invoiceNumber']) || undefined,
          poNumber: getCsvValue(row, ['PO Number', 'poNumber']) || null,
          clientInvoiceNumber: getCsvValue(row, ['Client Invoice Number', 'clientInvoiceNumber']) || null,
          description: getCsvValue(row, ['Description', 'description']) || null,
          invoiceDate,
          dueDate,
          reminderSent: isTruthyCsvValue(getCsvValue(row, ['Reminder Sent', 'reminderSent'])),
          outstanding: isTruthyCsvValue(getCsvValue(row, ['Outstanding', 'outstanding'])),
          invoiceTypeId,
          paymentMethodId,
          invoiceSentTypeId,
          invoiceStatusId,
          vatMarginId,
          companyId,
        })
        created += 1
      } catch (error) {
        errors.push(`Row ${rowNumber}: ${csvErrorMessage(error)}`)
      }
    }

    if (created > 0) router.refresh()

    window.alert(
      errors.length > 0
        ? `Created ${created} invoice in record(s). ${errors.slice(0, 5).join(' ')}${
            errors.length > 5 ? ` +${errors.length - 5} more error(s).` : ''
          }`
        : `Created ${created} invoice in record(s).`,
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
              placeholder="Search invoice #, company, status…"
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
        <TableCsvActions filename="invoice-in-table.csv" onUpload={handleUploadCsv} />

        {canCreate && (
          <Button
            onClick={() => {
              setEditingInvoice(null)
              setDialogOpen(true)
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
            <Plus className="h-4 w-4" />
            New Invoice In
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <Th field="invoiceNumber" label="Invoice #" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th
                field="clientInvoiceNumber"
                label="Client Invoice #"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="description" label="Description" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="company" label="Company" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th
                field="invoiceDate"
                label="Invoice Date"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="dueDate" label="Due Date" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="invoiceStatus" label="Status" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="paymentMethod" label="Payment" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="invoiceType" label="Type" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="vatMargin" label="VAT %" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
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
                <TableCell colSpan={showDeletedCols ? 16 : 14} className="h-32 text-center text-muted-foreground">
                  No invoices found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(inv => (
                <TableRow
                  key={inv.id}
                  className={`border-border/40 hover:bg-secondary/50 ${inv.deleted ? 'opacity-50' : ''}`}>
                  <TableCell className={`${tdClass} text-foreground font-medium`}>
                    <Link
                      href={`/departments/${departmentId}/invoicesIn/${inv.id}` as Route}
                      className="hover:text-accent hover:underline transition-colors">
                      {inv.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell className={tdClass}>{inv.clientInvoiceNumber ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{inv.description ?? '-'}</TableCell>
                  <TableCell className={`${tdClass} text-foreground`}>{inv.companyName}</TableCell>
                  <TableCell className={tdClass}>{formatDate(inv.invoiceDate)}</TableCell>
                  <TableCell className={tdClass}>{formatDate(inv.dueDate)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-border text-muted-foreground font-normal">
                      {inv.invoiceStatusName}
                    </Badge>
                  </TableCell>
                  <TableCell className={tdClass}>{inv.paymentMethodName}</TableCell>
                  <TableCell className={tdClass}>{inv.invoiceTypeName}</TableCell>
                  <TableCell className={tdClass}>{inv.vatMarginVat}%</TableCell>
                  <TableCell>
                    <BoolBadge value={inv.outstanding} />
                  </TableCell>
                  <TableCell>
                    <BoolBadge value={inv.reminderSent} />
                  </TableCell>
                  <TableCell className={tdClass}>{formatDate(inv.createdAt)}</TableCell>
                  <TableCell className={tdClass}>{inv.createdByName}</TableCell>
                  {showDeletedCols && (
                    <>
                      <TableCell className={tdClass}>{formatDate(inv.deletedAt)}</TableCell>
                      <TableCell className={tdClass}>{inv.deletedByName ?? '-'}</TableCell>
                    </>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/departments/${departmentId}/invoicesIn/${inv.id}` as Route}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      {!inv.deleted && (
                        <>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                              onClick={() => {
                                setEditingInvoice(inv)
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
                              onClick={() => handleSoftDelete(inv)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                      {inv.deleted && (
                        <>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary px-2"
                              onClick={() => handleUndelete(inv)}>
                              Restore
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => handleHardDelete(inv)}>
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
        Showing {filtered.length} of {initialInvoices.length} incoming invoices
      </div>

      <InvoiceInFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        invoice={editingInvoice}
        invoiceTypes={invoiceTypes}
        paymentMethods={paymentMethods}
        invoiceSentTypes={invoiceSentTypes}
        invoiceStatuses={invoiceStatuses}
        vatMargins={vatMargins}
        companyOptions={companyOptions}
        purchaseOptions={purchaseOptions}
        onSaved={() => {
          setDialogOpen(false)
          router.refresh()
        }}
      />
    </div>
  )
}
