'use client'

import {useMemo, useState} from 'react'
import {useRouter} from 'next/navigation'
import {Search, ChevronDown, ChevronUp, Plus, Pencil, Trash2} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import {MaterialPriceFormDialog, type MaterialPriceOption} from '@/components/custom/materialPriceFormDialog'
import type {MappedMaterialPrice} from '@/types/materialPrice'
import {
  createMaterialPriceAction,
  updateMaterialPriceAction,
  softDeleteMaterialPriceAction,
  hardDeleteMaterialPriceAction,
} from '@/serverFunctions/materialPrices'

type SortField = 'beNumber' | 'companyName' | 'brandName' | 'unitPrice' | 'updatedAt'
type SortDir = 'asc' | 'desc'

function SortIcon({field, sortField, sortDir}: {field: SortField; sortField: SortField; sortDir: SortDir}) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? (
    <ChevronUp className="inline h-3.5 w-3.5 ml-1" />
  ) : (
    <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
  )
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function formatPrice(val: string | null | undefined) {
  if (!val) return '-'
  const n = parseFloat(val)
  if (isNaN(n)) return '-'
  return new Intl.NumberFormat('en-BE', {style: 'currency', currency: 'EUR'}).format(n)
}

interface MaterialPriceTableProps {
  initialEntries: MappedMaterialPrice[]
  companies: MaterialPriceOption[]
  currentUserRole: string
  currentUserLevel: number
}

const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

export function MaterialPriceTable({
  initialEntries,
  companies,
  currentUserRole,
  currentUserLevel,
}: MaterialPriceTableProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  const companyFilterOptions = useMemo(() => {
    const seen = new Set<string>()
    const opts: MaterialPriceOption[] = []
    for (const e of initialEntries) {
      if (e.companyId && e.companyName && !seen.has(e.companyId)) {
        seen.add(e.companyId)
        opts.push({id: e.companyId, name: e.companyName})
      }
    }
    return opts.sort((a, b) => a.name.localeCompare(b.name))
  }, [initialEntries])

  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('updatedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MappedMaterialPrice | null>(null)

  const filtered = initialEntries
    .filter(e => {
      if (companyFilter !== 'all' && e.companyId !== companyFilter) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        (e.beNumber ?? '').toLowerCase().includes(q) ||
        (e.companyName ?? '').toLowerCase().includes(q) ||
        (e.brandName ?? '').toLowerCase().includes(q) ||
        (e.shortDescription ?? '').toLowerCase().includes(q) ||
        (e.brandOrderNr ?? '').toLowerCase().includes(q) ||
        (e.orderNr ?? '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const cmpStr = (x: string | null | undefined, y: string | null | undefined) =>
        dir * (x ?? '').localeCompare(y ?? '')
      switch (sortField) {
        case 'beNumber':
          return cmpStr(a.beNumber, b.beNumber)
        case 'companyName':
          return cmpStr(a.companyName, b.companyName)
        case 'brandName':
          return cmpStr(a.brandName, b.brandName)
        case 'unitPrice': {
          const pa = parseFloat(a.unitPrice ?? '0')
          const pb = parseFloat(b.unitPrice ?? '0')
          return dir * (pa - pb)
        }
        case 'updatedAt':
          return cmpStr(a.updatedAt, b.updatedAt)
        default:
          return 0
      }
    })

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  async function handleSave(e: MappedMaterialPrice) {
    if (editing) {
      await updateMaterialPriceAction({
        id: e.id,
        beNumber: e.beNumber,
        orderNr: e.orderNr,
        quoteBecra: e.quoteBecra,
        supplierOrderNr: e.supplierOrderNr,
        brandOrderNr: e.brandOrderNr,
        shortDescription: e.shortDescription,
        longDescription: e.longDescription,
        brandName: e.brandName,
        rejected: e.rejected,
        additionalInfo: e.additionalInfo,
        unitPrice: e.unitPrice ? parseFloat(e.unitPrice) : null,
        quantityPrice: e.quantityPrice ? parseInt(e.quantityPrice) : null,
        companyId: e.companyId,
      })
    } else {
      await createMaterialPriceAction({
        beNumber: e.beNumber,
        orderNr: e.orderNr,
        quoteBecra: e.quoteBecra,
        supplierOrderNr: e.supplierOrderNr,
        brandOrderNr: e.brandOrderNr,
        shortDescription: e.shortDescription,
        longDescription: e.longDescription,
        brandName: e.brandName,
        rejected: e.rejected,
        additionalInfo: e.additionalInfo,
        unitPrice: e.unitPrice ? parseFloat(e.unitPrice) : null,
        quantityPrice: e.quantityPrice ? parseInt(e.quantityPrice) : null,
        companyId: e.companyId,
      })
    }
    setEditing(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (isAdmin) {
      await hardDeleteMaterialPriceAction({id})
    } else {
      await softDeleteMaterialPriceAction({id})
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search BE number, brand, description…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border placeholder:text-muted-foreground/60 focus-visible:ring-accent"
            />
          </div>
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-[200px] bg-secondary border-border">
              <SelectValue placeholder="All companies" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All companies</SelectItem>
              {companyFilterOptions.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {filtered.length} / {initialEntries.length}
          </span>
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
            <Plus className="h-4 w-4" />
            New Entry
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className={thClass} onClick={() => toggleSort('beNumber')}>
                BE Number <SortIcon field="beNumber" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('companyName')}>
                Supplier <SortIcon field="companyName" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('brandName')}>
                Brand <SortIcon field="brandName" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className="text-xs whitespace-nowrap">Description</TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('unitPrice')}>
                Unit Price <SortIcon field="unitPrice" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className="text-xs whitespace-nowrap">Qty</TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('updatedAt')}>
                Updated <SortIcon field="updatedAt" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className="w-20">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                  No material price entries match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(entry => (
                <TableRow
                  key={entry.id}
                  className={`border-border/40 hover:bg-secondary/50 ${entry.deleted ? 'opacity-60' : ''}`}>
                  <TableCell className={`${tdClass} text-foreground font-medium`}>
                    <div className="flex flex-col gap-0.5">
                      <span>{entry.beNumber ?? '—'}</span>
                      {entry.orderNr ? (
                        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          {entry.orderNr}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className={tdClass}>
                    {entry.companyName ? (
                      <Badge variant="outline" className="border-border text-muted-foreground font-normal">
                        {entry.companyName}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </TableCell>
                  <TableCell className={tdClass}>
                    <div className="flex flex-col gap-0.5">
                      <span>{entry.brandName ?? '—'}</span>
                      {entry.brandOrderNr ? (
                        <span className="text-[11px] text-muted-foreground">{entry.brandOrderNr}</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className={`${tdClass} max-w-[200px] truncate`}>
                    {entry.shortDescription ?? '—'}
                  </TableCell>
                  <TableCell className={`${tdClass} text-foreground font-medium`}>
                    {formatPrice(entry.unitPrice)}
                  </TableCell>
                  <TableCell className={tdClass}>{entry.quantityPrice ?? '—'}</TableCell>
                  <TableCell className={tdClass}>{formatDate(entry.updatedAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                        onClick={() => {
                          setEditing(entry)
                          setDialogOpen(true)
                        }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(entry.id)}>
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

      <MaterialPriceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={editing}
        companies={companies}
        onSave={handleSave}
      />
    </div>
  )
}

