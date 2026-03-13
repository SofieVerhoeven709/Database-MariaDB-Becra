'use client'
import {useState} from 'react'
import {Search, Plus, Pencil, Trash2, ChevronUp, ChevronDown, RotateCcw} from 'lucide-react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {QuoteBecraFormDialog} from '@/components/custom/quoteBecraFormDialog'
import type {MappedQuoteBecra} from '@/types/quoteBecra'
import {
  createQuoteBecraAction,
  updateQuoteBecraAction,
  softDeleteQuoteBecraAction,
  hardDeleteQuoteBecraAction,
  undeleteQuoteBecraAction,
} from '@/serverFunctions/quoteBecra'

type SortField = 'description' | 'date' | 'validDate' | 'createdByName'
type SortDir = 'asc' | 'desc'
type FilterDeleted = 'not-deleted' | 'deleted' | 'valid' | 'not valid' | 'all'

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

interface QuoteBecraTableProps {
  initialQuotes: MappedQuoteBecra[]
  currentUserRole: string
  currentUserLevel: number
  currentUserId: string
  currentUserName: string
}

export function QuoteBecraTable({
  initialQuotes,
  currentUserRole,
  currentUserLevel,
  currentUserId,
  currentUserName,
}: QuoteBecraTableProps) {
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  const [quotes, setQuotes] = useState(initialQuotes)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MappedQuoteBecra | null>(null)

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filtered = quotes
    .filter(q => {
      if (filterDeleted === 'not-deleted' && q.deleted) return false
      if (filterDeleted === 'deleted' && !q.deleted) return false
      if (filterDeleted === 'valid' && (!q.validDate || q.deleted)) return false
      if (filterDeleted === 'not valid' && (q.validDate || q.deleted)) return false
      if (!search) return true
      const s = search.toLowerCase()
      return (q.description ?? '').toLowerCase().includes(s) || (q.createdByName ?? '').toLowerCase().includes(s)
    })
    .sort((a, b) => {
      const aVal = String(a[sortField] ?? '')
      const bVal = String(b[sortField] ?? '')
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })

  async function handleSave(form: Partial<MappedQuoteBecra> & {id: string}) {
    if (editingItem) {
      await updateQuoteBecraAction({
        id: form.id,
        description: form.description ?? null,
        validDate: form.validDate ?? false,
        date: form.date ? new Date(form.date) : null,
      })
      // Update the matching quote in local state immediately
      setQuotes(prev =>
        prev.map(q =>
          q.id === form.id
            ? {
                ...q,
                description: form.description ?? null,
                validDate: form.validDate ?? false,
                date: form.date ?? null,
              }
            : q,
        ),
      )
    } else {
      await createQuoteBecraAction({
        description: form.description ?? null,
        validDate: form.validDate ?? false,
        date: form.date ? new Date(form.date) : null,
      })
      // Add the new quote to local state immediately
      const newQuote: MappedQuoteBecra = {
        id: form.id,
        description: form.description ?? null,
        validDate: form.validDate ?? false,
        date: form.date ?? null,
        createdBy: currentUserId,
        createdByName: currentUserName,
        deleted: false,
        deletedAt: null,
        deletedBy: null,
        deletedByName: null,
      }
      setQuotes(prev => [newQuote, ...prev])
    }
  }

  async function handleSoftDelete(id: string) {
    await softDeleteQuoteBecraAction({id})
    setQuotes(prev => prev.map(q => (q.id === id ? {...q, deleted: true, deletedAt: new Date().toISOString()} : q)))
  }

  async function handleHardDelete(id: string) {
    if (!confirm('Permanently delete this quote? This cannot be undone.')) return
    await hardDeleteQuoteBecraAction({id})
    setQuotes(prev => prev.filter(q => q.id !== id))
  }

  async function handleUndelete(id: string) {
    await undeleteQuoteBecraAction({id})
    setQuotes(prev => prev.map(q => (q.id === id ? {...q, deleted: false, deletedAt: null, deletedBy: null} : q)))
  }

  function openCreate() {
    setEditingItem(null)
    setDialogOpen(true)
  }

  function openEdit(item: MappedQuoteBecra) {
    setEditingItem(item)
    setDialogOpen(true)
  }

  const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
  const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-secondary border-border"
            placeholder="Search quotes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
          {isAdmin && (
            <Select value={filterDeleted} onValueChange={v => setFilterDeleted(v as FilterDeleted)}>
              <SelectTrigger className="w-36 bg-secondary border-border text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not-deleted">Active</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="not valid">Not Valid</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button onClick={openCreate} size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-1" /> New Quote
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className={thClass} onClick={() => handleSort('description')}>
                Description <SortIcon field="description" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => handleSort('date')}>
                Date <SortIcon field="date" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => handleSort('validDate')}>
                Valid <SortIcon field="validDate" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => handleSort('createdByName')}>
                Created By <SortIcon field="createdByName" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              {isAdmin && <TableHead className="text-xs">Status</TableHead>}
              <TableHead className="text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-10 text-muted-foreground text-sm">
                  No quotes found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(q => (
                <TableRow key={q.id} className={q.deleted ? 'opacity-50' : ''}>
                  <TableCell className="text-sm max-w-xs truncate">
                    {q.description ? (
                      <span title={q.description}>
                        {q.description.length > 60 ? q.description.slice(0, 60) + '…' : q.description}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">No description</span>
                    )}
                  </TableCell>
                  <TableCell className={tdClass}>{formatDate(q.date)}</TableCell>
                  <TableCell>
                    {q.validDate ? (
                      <Badge className="bg-accent/15 text-accent border-0 font-medium text-xs">Yes</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground font-medium text-xs">
                        No
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className={tdClass}>{q.createdByName}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      {q.deleted ? (
                        <Badge variant="destructive" className="text-xs">
                          Deleted
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {!q.deleted ? (
                        <>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(q)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleSoftDelete(q.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleUndelete(q.id)}>
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                          {isAdmin && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleHardDelete(q.id)}>
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

      <p className="text-xs text-muted-foreground">{filtered.length} record(s) shown</p>

      <QuoteBecraFormDialog open={dialogOpen} onOpenChange={setDialogOpen} item={editingItem} onSave={handleSave} />
    </div>
  )
}
