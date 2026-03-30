'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import type {Route} from 'next'
import {Search, Plus, Copy, Trash2, ChevronDown, ChevronUp, ExternalLink} from 'lucide-react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Switch} from '@/components/ui/switch'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import type {MappedPriceList} from '@/types/priceList'
import {
  createPriceListAction,
  clonePriceListAction,
  softDeletePriceListAction,
  hardDeletePriceListAction,
  undeletePriceListAction,
} from '@/serverFunctions/priceLists'

type SortField = 'name' | 'repeatUse' | 'itemCount' | 'companyCount' | 'createdAt' | 'createdBy'
type SortDir = 'asc' | 'desc'
type FilterDeleted = 'not-deleted' | 'deleted' | 'all'

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function SortIcon({field, sortField, sortDir}: {field: SortField; sortField: SortField; sortDir: SortDir}) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? (
    <ChevronUp className="inline h-3.5 w-3.5 ml-1" />
  ) : (
    <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
  )
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
    <TableHead className="cursor-pointer select-none whitespace-nowrap text-xs" onClick={() => onSort(field)}>
      {label} <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </TableHead>
  )
}

interface CreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cloneSource: MappedPriceList | null
  onSaved: () => void
}

function CreateOrCloneDialog({open, onOpenChange, cloneSource, onSaved}: CreateDialogProps) {
  const [name, setName] = useState('')
  const [repeatUse, setRepeatUse] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenChange = (v: boolean) => {
    if (v) {
      setName(cloneSource ? `Copy of ${cloneSource.name}` : '')
      setRepeatUse(cloneSource ? cloneSource.repeatUse : false)
      setError(null)
    }
    onOpenChange(v)
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    setSaving(true)
    try {
      if (cloneSource) {
        await clonePriceListAction({sourceId: cloneSource.id, name: name.trim(), repeatUse})
      } else {
        await createPriceListAction({name: name.trim(), repeatUse})
      }
      onSaved()
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {cloneSource ? `Clone "${cloneSource.name}"` : 'New Price List'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          {cloneSource && (
            <p className="text-xs text-muted-foreground">
              Creates a new price list with all items copied from the source.
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Name *</Label>
            <Input
              value={name}
              onChange={e => {
                setName(e.target.value)
                setError(null)
              }}
              placeholder="Price list name…"
              className={`bg-secondary border-border ${error ? 'border-destructive' : ''}`}
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
            <Label className="text-xs text-muted-foreground">Repeat Use</Label>
            <Switch checked={repeatUse} onCheckedChange={setRepeatUse} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : cloneSource ? 'Clone' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface PriceListTableProps {
  initialPriceLists: MappedPriceList[]
  currentUserRole: string
  currentUserLevel: number
  departmentId: string
}

const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

export function PriceListTable({
  initialPriceLists,
  currentUserRole,
  currentUserLevel,
  departmentId,
}: PriceListTableProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canCreate = currentUserLevel >= 60
  const canDelete = currentUserLevel >= 80

  const [search, setSearch] = useState('')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [cloneSource, setCloneSource] = useState<MappedPriceList | null>(null)

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filtered = initialPriceLists
    .filter(pl => {
      if (filterDeleted === 'not-deleted' && pl.deleted) return false
      if (filterDeleted === 'deleted' && !pl.deleted) return false
      if (!search) return true
      const q = search.toLowerCase()
      return pl.name.toLowerCase().includes(q) || pl.createdByName.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const s = (x: string, y: string) => dir * x.localeCompare(y)
      switch (sortField) {
        case 'name':
          return s(a.name, b.name)
        case 'repeatUse':
          return dir * (Number(a.repeatUse) - Number(b.repeatUse))
        case 'itemCount':
          return dir * (a.itemCount - b.itemCount)
        case 'companyCount':
          return dir * (a.companies.length - b.companies.length)
        case 'createdAt':
          return s(a.createdAt, b.createdAt)
        case 'createdBy':
          return s(a.createdByName, b.createdByName)
        default:
          return 0
      }
    })

  const showDeletedCols = filterDeleted !== 'not-deleted'

  async function handleSoftDelete(pl: MappedPriceList) {
    await softDeletePriceListAction({id: pl.id})
    router.refresh()
  }
  async function handleHardDelete(pl: MappedPriceList) {
    await hardDeletePriceListAction({id: pl.id})
    router.refresh()
  }
  async function handleUndelete(pl: MappedPriceList) {
    await undeletePriceListAction({id: pl.id})
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
              placeholder="Search name, created by…"
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
        {canCreate && (
          <Button
            onClick={() => {
              setCloneSource(null)
              setDialogOpen(true)
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
            <Plus className="h-4 w-4" /> New Price List
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <Th field="name" label="Name" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="itemCount" label="Items" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="companyCount" label="Companies" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="repeatUse" label="Repeat Use" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="createdAt" label="Created At" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="createdBy" label="Created By" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              {showDeletedCols && (
                <>
                  <TableHead className="whitespace-nowrap text-xs">Deleted At</TableHead>
                  <TableHead className="whitespace-nowrap text-xs">Deleted By</TableHead>
                </>
              )}
              <TableHead className="w-28">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showDeletedCols ? 9 : 7} className="h-32 text-center text-muted-foreground">
                  No price lists found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(pl => (
                <TableRow
                  key={pl.id}
                  className={`border-border/40 hover:bg-secondary/50 ${pl.deleted ? 'opacity-50' : ''}`}>
                  <TableCell className={`${tdClass} text-foreground font-medium`}>
                    <Link
                      href={`/departments/${departmentId}/priceList/${pl.id}` as Route}
                      className="hover:text-accent hover:underline transition-colors">
                      {pl.name}
                    </Link>
                  </TableCell>
                  <TableCell className={tdClass}>
                    <Badge variant="secondary" className="text-xs">
                      {pl.itemCount}
                    </Badge>
                  </TableCell>
                  <TableCell className={tdClass}>
                    <Badge variant="secondary" className="text-xs">
                      {pl.companies.length}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {pl.repeatUse ? (
                      <Badge className="bg-accent/15 text-accent border-0 font-medium text-xs">Yes</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground font-medium text-xs">
                        No
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className={tdClass}>{formatDate(pl.createdAt)}</TableCell>
                  <TableCell className={tdClass}>{pl.createdByName}</TableCell>
                  {showDeletedCols && (
                    <>
                      <TableCell className={tdClass}>{formatDate(pl.deletedAt)}</TableCell>
                      <TableCell className={tdClass}>{pl.deletedByName ?? '-'}</TableCell>
                    </>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/departments/${departmentId}/priceList/${pl.id}` as Route}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10"
                          title="Open">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      {!pl.deleted && (
                        <>
                          {canCreate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                              title="Clone"
                              onClick={() => {
                                setCloneSource(pl)
                                setDialogOpen(true)
                              }}>
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Delete"
                              onClick={() => handleSoftDelete(pl)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                      {pl.deleted && (
                        <>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary px-2"
                              onClick={() => handleUndelete(pl)}>
                              Restore
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              title="Hard delete"
                              onClick={() => handleHardDelete(pl)}>
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
        Showing {filtered.length} of {initialPriceLists.length} price lists
      </div>

      <CreateOrCloneDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cloneSource={cloneSource}
        onSaved={() => router.refresh()}
      />
    </div>
  )
}
