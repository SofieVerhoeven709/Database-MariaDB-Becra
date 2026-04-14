'use client'

import {useMemo, useState} from 'react'
import {useRouter} from 'next/navigation'
import type {Route} from 'next'
import {Search, ChevronDown, ChevronUp, Plus, Pencil, Trash2, ExternalLink, RotateCcw} from 'lucide-react'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {IncomingDeliveryFormDialog} from '@/components/custom/incomingDeliveryFormDialog'
import type {IncomingDeliveryOption, MappedIncomingDelivery} from '@/types/incomingDelivery'
import {
  createIncomingDeliveryAction,
  updateIncomingDeliveryAction,
  softDeleteIncomingDeliveryAction,
  undeleteIncomingDeliveryAction,
  hardDeleteIncomingDeliveryAction,
} from '@/serverFunctions/incomingDeliveries'
import {INCOMING_PERMISSION_LEVELS} from '@/constants'

type SortField = 'incomingDeliveryNumber' | 'deliveryDate' | 'purchaseNumber' | 'status'
type SortDir = 'asc' | 'desc'
type FilterDeleted = 'not-deleted' | 'deleted' | 'all'

interface Props {
  initialEntries: MappedIncomingDelivery[]
  purchaseOptions: IncomingDeliveryOption[]
  currentUserRole: string
  currentUserLevel: number
  departmentId: string
}

const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function SortIcon({field, sortField, sortDir}: {field: SortField; sortField: SortField; sortDir: SortDir}) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? (
    <ChevronUp className="inline h-3.5 w-3.5 ml-1" />
  ) : (
    <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
  )
}

export function IncomingDeliveryTable({
  initialEntries,
  purchaseOptions,
  currentUserRole,
  currentUserLevel,
  departmentId,
}: Props) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= INCOMING_PERMISSION_LEVELS.hardDelete
  const canEdit = isAdmin || currentUserLevel >= INCOMING_PERMISSION_LEVELS.edit
  const canCreate = isAdmin || currentUserLevel >= INCOMING_PERMISSION_LEVELS.create
  const canDelete = isAdmin || currentUserLevel >= INCOMING_PERMISSION_LEVELS.delete

  const statusOptions = useMemo(() => {
    const statuses = new Set<string>()
    initialEntries.forEach(e => {
      if (e.status) statuses.add(e.status)
    })
    return Array.from(statuses).sort()
  }, [initialEntries])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [sortField, setSortField] = useState<SortField>('deliveryDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MappedIncomingDelivery | null>(null)

  const filtered = initialEntries
    .filter(entry => {
      if (filterDeleted === 'not-deleted' && entry.deleted) return false
      if (filterDeleted === 'deleted' && !entry.deleted) return false
      if (statusFilter !== 'all' && entry.status !== statusFilter) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        entry.incomingDeliveryNumber.toLowerCase().includes(q) ||
        (entry.purchaseNumber ?? '').toLowerCase().includes(q) ||
        (entry.description ?? '').toLowerCase().includes(q) ||
        (entry.status ?? '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const cmpStr = (x: string | null | undefined, y: string | null | undefined) => dir * (x ?? '').localeCompare(y ?? '')

      switch (sortField) {
        case 'incomingDeliveryNumber':
          return cmpStr(a.incomingDeliveryNumber, b.incomingDeliveryNumber)
        case 'deliveryDate':
          return cmpStr(a.deliveryDate, b.deliveryDate)
        case 'purchaseNumber':
          return cmpStr(a.purchaseNumber, b.purchaseNumber)
        case 'status':
          return cmpStr(a.status, b.status)
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

  async function handleSave(entry: MappedIncomingDelivery) {
    if (editing && !canEdit) return
    if (!editing && !canCreate) return

    if (editing) {
      await updateIncomingDeliveryAction({
        id: entry.id,
        incomingDeliveryNumber: entry.incomingDeliveryNumber,
        purchaseId: entry.purchaseId,
        additionalInfo: entry.additionalInfo,
        description: entry.description,
        status: entry.status,
        deliveryDate: entry.deliveryDate,
        receivedAt: entry.receivedAt,
      })
    } else {
      await createIncomingDeliveryAction({
        incomingDeliveryNumber: entry.incomingDeliveryNumber,
        purchaseId: entry.purchaseId,
        additionalInfo: entry.additionalInfo,
        description: entry.description,
        status: entry.status,
        deliveryDate: entry.deliveryDate,
        receivedAt: entry.receivedAt,
      })
    }

    setEditing(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!canDelete) return
    await softDeleteIncomingDeliveryAction({id})
    router.refresh()
  }

  async function handleUndelete(id: string) {
    if (!canDelete) return
    await undeleteIncomingDeliveryAction({id})
    router.refresh()
  }

  async function handleHardDelete(id: string) {
    if (!isAdmin) return
    await hardDeleteIncomingDeliveryAction({id})
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search delivery, purchase or status..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 bg-secondary border-border">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All statuses</SelectItem>
              {statusOptions.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterDeleted} onValueChange={value => setFilterDeleted(value as FilterDeleted)}>
            <SelectTrigger className="w-44 bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="not-deleted">Not Deleted</SelectItem>
              <SelectItem value="deleted">Deleted Only</SelectItem>
              <SelectItem value="all">Show All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {filtered.length} / {initialEntries.length}
          </span>
          {canCreate && (
            <Button
              onClick={() => {
                setEditing(null)
                setDialogOpen(true)
              }}
              className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
              <Plus className="h-4 w-4" /> New Incoming Delivery
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className={thClass} onClick={() => toggleSort('incomingDeliveryNumber')}>
                Delivery # <SortIcon field="incomingDeliveryNumber" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('deliveryDate')}>
                Delivery Date <SortIcon field="deliveryDate" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('purchaseNumber')}>
                Purchase <SortIcon field="purchaseNumber" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className="text-xs whitespace-nowrap">Line Coverage</TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('status')}>
                Status <SortIcon field="status" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className="text-xs whitespace-nowrap">Created</TableHead>
              <TableHead className="text-xs whitespace-nowrap">Received At</TableHead>
              <TableHead className="text-xs whitespace-nowrap">Deleted</TableHead>
              {filterDeleted !== 'not-deleted' && <TableHead className="text-xs whitespace-nowrap">Deleted At</TableHead>}
              <TableHead className="w-24">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={filterDeleted !== 'not-deleted' ? 10 : 9} className="h-24 text-center text-muted-foreground">
                  No incoming deliveries found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(entry => {
                const detailHref = `/departments/${departmentId}/incomingDeliveries/${entry.id}` as Route
                return (
                  <TableRow key={entry.id} className={`border-border/40 hover:bg-secondary/50 cursor-pointer ${entry.deleted ? 'opacity-60' : ''}`} onClick={() => router.push(detailHref)}>
                    <TableCell className={`${tdClass} text-foreground font-medium`}>{entry.incomingDeliveryNumber}</TableCell>
                    <TableCell className={tdClass}>{formatDate(entry.deliveryDate)}</TableCell>
                    <TableCell className={tdClass}>{entry.purchaseNumber ?? 'Manual'}</TableCell>
                    <TableCell className={tdClass}>
                      <div className="flex items-center gap-2">
                        <Badge variant={entry.isFullyDelivered ? 'default' : 'outline'} className="text-[11px]">
                          {entry.isFullyDelivered ? 'FULL' : 'PARTIAL'}
                        </Badge>
                        <span>{entry.acceptedQtyTotal}/{entry.orderedQtyTotal}</span>
                      </div>
                    </TableCell>
                    <TableCell className={tdClass}>{entry.status}</TableCell>
                    <TableCell className={tdClass}>{formatDate(entry.createdAt)}</TableCell>
                    <TableCell className={tdClass}>{formatDate(entry.receivedAt)}</TableCell>
                    <TableCell>
                      {entry.deleted ? <Badge variant="destructive">Yes</Badge> : <Badge variant="outline">No</Badge>}
                    </TableCell>
                    {filterDeleted !== 'not-deleted' && <TableCell className={tdClass}>{formatDate(entry.deletedAt)}</TableCell>}
                    <TableCell>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          onClick={() => router.push(detailHref)}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        {canEdit && !entry.deleted && (
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
                        )}
                        {canDelete && !entry.deleted && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(entry.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {entry.deleted && (
                          <>
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                onClick={() => handleUndelete(entry.id)}>
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                onClick={() => handleHardDelete(entry.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <IncomingDeliveryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={editing}
        purchaseOptions={purchaseOptions}
        onSave={handleSave}
      />
    </div>
  )
}

