'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Search, Plus, Pencil, ChevronDown, ChevronUp, Trash2} from 'lucide-react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import {VatMarginFormDialog} from '@/components/custom/vatMarginFormDialog'
import {
  softDeleteVatMarginAction,
  hardDeleteVatMarginAction,
  undeleteVatMarginAction,
  createVatMarginAction,
} from '@/serverFunctions/invoices'
import {TableCsvActions} from '@/components/custom/tableCsvActions'
import {getCsvValue, normalizeCsvLookup, type CsvRow} from '@/lib/csv'

type SortField = 'vat' | 'countryName' | 'createdAt'
type SortDir = 'asc' | 'desc'
type FilterDeleted = 'not-deleted' | 'deleted' | 'all'

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function csvErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Could not create VAT margin.'
}

interface MappedVatMargin {
  id: string
  vat: number
  countryId: string | null
  countryName: string | null
  createdAt: string
  createdByName: string
  deletedAt: string | null
  deletedByName: string | null
  deleted: boolean
}

interface VatMarginTableProps {
  initialVatMargins: MappedVatMargin[]
  countries: Array<{id: string; name: string}>
  currentUserRole: string
  currentUserLevel: number
}

export function VatMarginTable({initialVatMargins, countries, currentUserRole, currentUserLevel}: VatMarginTableProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canEdit = currentUserLevel >= 40
  const canCreate = currentUserLevel >= 60
  const canDelete = currentUserLevel >= 80

  const [search, setSearch] = useState('')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [sortField, setSortField] = useState<SortField>('vat')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMargin, setEditingMargin] = useState<MappedVatMargin | null>(null)

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const SortIcon = ({field}: {field: SortField}) => {
    if (sortField !== field) return null
    return sortDir === 'asc' ? (
      <ChevronUp className="inline h-3.5 w-3.5 ml-1" />
    ) : (
      <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
    )
  }

  const showDeletedCols = filterDeleted !== 'not-deleted'
  const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
  const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

  const filteredMargins = initialVatMargins
    .filter(m => {
      const matchesSearch =
        m.vat.toString().includes(search) || (m.countryName?.toLowerCase().includes(search.toLowerCase()) ?? false)
      const matchesDeleted = filterDeleted === 'all' || (filterDeleted === 'not-deleted' ? !m.deleted : m.deleted)
      return matchesSearch && matchesDeleted
    })
    .sort((a, b) => {
      let aVal: any = a[sortField === 'countryName' ? 'countryName' : sortField]
      let bVal: any = b[sortField === 'countryName' ? 'countryName' : sortField]

      if (sortField === 'vat') {
        aVal = Number(aVal)
        bVal = Number(bVal)
      }

      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  async function handleUploadCsv(rows: CsvRow[]) {
    if (rows.length === 0) {
      window.alert('The selected CSV file does not contain rows.')
      return
    }
    const errors: string[] = []
    let created = 0

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2
      const vatValue = getCsvValue(row, ['VAT (%)', 'VAT', 'vat'])
      const countryValue = getCsvValue(row, ['Country', 'country', 'countryName'])
      const country =
        countryValue && normalizeCsvLookup(countryValue) !== 'global'
          ? countries.find(
              option =>
                option.id === countryValue || normalizeCsvLookup(option.name) === normalizeCsvLookup(countryValue),
            )
          : null

      if (!vatValue) {
        errors.push(`Row ${rowNumber}: Missing VAT value.`)
        continue
      }

      const vat = Number(vatValue.replace('%', '').replace(',', '.'))
      if (!Number.isFinite(vat) || vat < 0 || vat > 100) {
        errors.push(`Row ${rowNumber}: VAT must be a number between 0 and 100.`)
        continue
      }

      if (countryValue && normalizeCsvLookup(countryValue) !== 'global' && !country) {
        errors.push(`Row ${rowNumber}: Country could not be matched.`)
        continue
      }

      try {
        await createVatMarginAction({
          vat,
          countryId: country?.id ?? null,
        })
        created += 1
      } catch (error) {
        errors.push(`Row ${rowNumber}: ${csvErrorMessage(error)}`)
      }
    }
    if (created > 0) router.refresh()

    window.alert(
      errors.length > 0
        ? `Created ${created} vat(s). ${errors.slice(0, 5).join(' ')}${
            errors.length > 5 ? ` +${errors.length - 5} more error(s).` : ''
          }`
        : `Created ${created} vat(s).`,
    )
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by VAT or country…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-background border-border/40"
            />
          </div>
          <Select value={filterDeleted} onValueChange={v => setFilterDeleted(v as FilterDeleted)}>
            <SelectTrigger className="w-[180px] bg-background border-border/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not-deleted">Not Deleted</SelectItem>
              <SelectItem value="deleted">Deleted Only</SelectItem>
              <SelectItem value="all">Show All</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <TableCsvActions filename="vat-margin-table.csv" onUpload={canCreate ? handleUploadCsv : undefined} />

        {canCreate && (
          <Button
            onClick={() => {
              setEditingMargin(null)
              setDialogOpen(true)
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
            <Plus className="h-4 w-4" /> New VAT Margin
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className={thClass} onClick={() => toggleSort('vat')}>
                VAT (%) <SortIcon field="vat" />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('countryName')}>
                Country <SortIcon field="countryName" />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('createdAt')}>
                Created At <SortIcon field="createdAt" />
              </TableHead>
              <TableHead className="text-xs whitespace-nowrap">Created By</TableHead>
              {showDeletedCols && (
                <>
                  <TableHead className="text-xs whitespace-nowrap">Deleted</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Deleted At</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Deleted By</TableHead>
                </>
              )}
              <TableHead className="w-24">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMargins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showDeletedCols ? 8 : 5} className="h-32 text-center text-muted-foreground">
                  No VAT margins found.
                </TableCell>
              </TableRow>
            ) : (
              filteredMargins.map(m => (
                <TableRow
                  key={m.id}
                  className={`border-border/40 hover:bg-secondary/50 ${m.deleted ? 'opacity-50' : ''}`}>
                  <TableCell className={`${tdClass} text-foreground font-medium`}>{m.vat}%</TableCell>
                  <TableCell className={tdClass}>{m.countryName ?? 'Global'}</TableCell>
                  <TableCell className={tdClass}>{formatDate(m.createdAt)}</TableCell>
                  <TableCell className={tdClass}>{m.createdByName}</TableCell>
                  {showDeletedCols && (
                    <>
                      <TableCell>
                        {m.deleted ? (
                          <Badge variant="destructive">Yes</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No</span>
                        )}
                      </TableCell>
                      <TableCell className={tdClass}>{formatDate(m.deletedAt)}</TableCell>
                      <TableCell className={tdClass}>{m.deletedByName ?? '-'}</TableCell>
                    </>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {!m.deleted && canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          onClick={() => {
                            setEditingMargin(m)
                            setDialogOpen(true)
                          }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {!m.deleted && canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={async () => {
                            await softDeleteVatMarginAction({id: m.id})
                            router.refresh()
                          }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {m.deleted && (
                        <>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
                              onClick={async () => {
                                await undeleteVatMarginAction({id: m.id})
                                router.refresh()
                              }}>
                              Restore
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={async () => {
                                await hardDeleteVatMarginAction({id: m.id})
                                router.refresh()
                              }}>
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

      <VatMarginFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingMargin={editingMargin}
        countries={countries}
        onSuccess={() => {
          setEditingMargin(null)
          router.refresh()
        }}
      />
    </div>
  )
}
