'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import type {Route} from 'next'
import {Search, Plus, Pencil, Trash2, ChevronDown, ChevronUp, ExternalLink, RotateCcw} from 'lucide-react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import type {MappedPurchaseBOM} from '@/types/purchaseBom'
import {
  softDeletePurchaseBOMAction,
  hardDeletePurchaseBOMAction,
  undeletePurchaseBOMAction,
} from '@/serverFunctions/purchaseBoms'
import {PurchaseBOMFormDialog} from '@/components/custom/purchaseBomFormDialog'

type SortField =
  | 'description'
  | 'shortDescription'
  | 'project'
  | 'bomNumber'
  | 'structureCount'
  | 'startDate'
  | 'endDate'
  | 'createdAt'
  | 'createdBy'
  | 'parentBom'

type SortDir = 'asc' | 'desc'
type FilterDeleted = 'not-deleted' | 'deleted' | 'all'

function formatDate(date: string | null) {
  if (!date) return '—'
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

/** Derive a human-readable status from booleans + structures */
function BOMStatusBadges({bom}: {bom: MappedPurchaseBOM}) {
  const activeStructures = bom.structures.filter(s => !s.deleted)
  const anyNotDeliverable = activeStructures.some(s => s.notDeliverable)
  const anyNotCorrect = activeStructures.some(s => s.notCorrect)
  const fullyIssued =
    activeStructures.length > 0 &&
    activeStructures.every(
      s => s.issuedQuantity !== null && s.requiredQuantity !== null && s.issuedQuantity >= s.requiredQuantity,
    )

  const badges: React.ReactNode[] = []

  if (bom.closed)
    badges.push(
      <Badge key="closed" variant="secondary" className="text-xs">
        Closed
      </Badge>,
    )
  if (bom.materialClosed)
    badges.push(
      <Badge key="mat" variant="secondary" className="text-xs">
        Mat. Closed
      </Badge>,
    )
  else
    badges.push(
      <Badge key="needApprove" className="bg-amber-700/10 text-orange-400 border-0 text-xs">
        Needs approving
      </Badge>,
    )
  if (fullyIssued)
    badges.push(
      <Badge key="issued" className="bg-green-500/15 text-green-600 border-0 text-xs dark:text-green-400">
        Fully Issued
      </Badge>,
    )
  if (anyNotDeliverable)
    badges.push(
      <Badge key="nd" variant="secondary" className="text-xs text-red-600 bg-red-600/15">
        Not Deliverable
      </Badge>,
    )
  if (anyNotCorrect)
    badges.push(
      <Badge key="nc" variant="secondary" className="text-xs text-orange-600 bg-orange-600/15">
        Not Correct
      </Badge>,
    )

  if (badges.length === 0) return <span className="text-xs text-muted-foreground/50">—</span>
  return <div className="flex flex-wrap gap-1">{badges}</div>
}

const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

interface PurchaseBOMTableProps {
  initialBOMs: MappedPurchaseBOM[]
  currentUserRole: string
  currentUserLevel: number
  projectId?: string
  departmentId: string
}

export function PurchaseBOMTable({
  initialBOMs,
  currentUserRole,
  currentUserLevel,
  projectId,
  departmentId,
}: PurchaseBOMTableProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canEdit = currentUserLevel >= 40
  const canCreate = currentUserLevel >= 60
  const canDelete = currentUserLevel >= 80
  const canEditNumber = currentUserLevel >= 80

  const [search, setSearch] = useState('')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBOM, setEditingBOM] = useState<MappedPurchaseBOM | null>(null)

  // Build a lookup: bomId -> BOM (for parent name display)
  const bomById = Object.fromEntries(initialBOMs.map(b => [b.id, b]))

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filtered = initialBOMs
    .filter(bom => {
      if (filterDeleted === 'not-deleted' && bom.deleted) return false
      if (filterDeleted === 'deleted' && !bom.deleted) return false
      if (!search) return true
      const q = search.toLowerCase()
      const parentBom = bom.purchaseBomId ? bomById[bom.purchaseBomId] : null
      return (
        bom.description?.toLowerCase().includes(q) ||
        bom.purchaseBomNumber?.toLowerCase().includes(q) ||
        bom.projectName?.toLowerCase().includes(q) ||
        bom.projectNumber?.toLowerCase().includes(q) ||
        bom.createdByName.toLowerCase().includes(q) ||
        parentBom?.purchaseBomNumber?.toLowerCase().includes(q) ||
        parentBom?.shortDescription?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const s = (x: string, y: string) => dir * x.localeCompare(y)
      const parentA = a.purchaseBomId ? (bomById[a.purchaseBomId]?.purchaseBomNumber ?? '') : ''
      const parentB = b.purchaseBomId ? (bomById[b.purchaseBomId]?.purchaseBomNumber ?? '') : ''
      switch (sortField) {
        case 'description':
          return s(a.description ?? '', b.description ?? '')
        case 'project':
          return s(a.projectName ?? '', b.projectName ?? '')
        case 'bomNumber':
          return s(a.purchaseBomNumber ?? '', b.purchaseBomNumber ?? '')
        case 'structureCount':
          return dir * (a.structureCount - b.structureCount)
        case 'startDate':
          return s(a.startDate, b.startDate)
        case 'endDate':
          return s(a.endDate ?? '', b.endDate ?? '')
        case 'createdAt':
          return s(a.createdAt, b.createdAt)
        case 'createdBy':
          return s(a.createdByName, b.createdByName)
        case 'parentBom':
          return s(parentA, parentB)
        default:
          return 0
      }
    })

  const showDeletedCols = filterDeleted !== 'not-deleted'

  async function handleSoftDelete(bom: MappedPurchaseBOM) {
    await softDeletePurchaseBOMAction({id: bom.id})
    router.refresh()
  }
  async function handleHardDelete(bom: MappedPurchaseBOM) {
    await hardDeletePurchaseBOMAction({id: bom.id})
    router.refresh()
  }
  async function handleUndelete(bom: MappedPurchaseBOM) {
    await undeletePurchaseBOMAction({id: bom.id})
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
              placeholder="Search description, number, purchase…"
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
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <Th field="bomNumber" label="BOM Number" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th
                field="shortDescription"
                label="Short Description"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="project" label="Project" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="parentBom" label="Parent BOM" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th
                field="structureCount"
                label="Structures"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="startDate" label="Start Date" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="endDate" label="End Date" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <TableHead className="whitespace-nowrap text-xs">Status</TableHead>
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
                <TableCell colSpan={showDeletedCols ? 13 : 11} className="h-32 text-center text-muted-foreground">
                  No BOMs found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(bom => {
                const parentBom = bom.purchaseBomId ? bomById[bom.purchaseBomId] : null
                return (
                  <TableRow
                    key={bom.id}
                    className={`border-border/40 hover:bg-secondary/50 ${bom.deleted ? 'opacity-50' : ''}`}>
                    <TableCell className={`${tdClass} font-medium text-foreground`}>
                      <Link
                        href={`/departments/${departmentId}/purchaseBom/${bom.id}` as Route}
                        className="hover:text-accent hover:underline transition-colors">
                        {bom.purchaseBomNumber || '—'}
                      </Link>
                    </TableCell>
                    <TableCell className={`${tdClass} text-foreground font-medium`}>
                      {bom.shortDescription ?? bom.shortDescription ?? '—'}
                    </TableCell>
                    <TableCell className={tdClass}>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-foreground text-sm">{bom.projectName ?? '—'}</span>
                        {bom.projectNumber && (
                          <span className="text-xs text-muted-foreground">{bom.projectNumber}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={tdClass}>
                      {parentBom ? (
                        <Link
                          href={`/departments/${departmentId}/purchaseBom/${parentBom.id}` as Route}
                          className="hover:text-accent hover:underline transition-colors font-mono text-xs">
                          {parentBom.purchaseBomNumber}
                          {parentBom.shortDescription ? (
                            <span className="font-sans ml-1 text-muted-foreground">— {parentBom.shortDescription}</span>
                          ) : null}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className={tdClass}>
                      <Badge variant="secondary" className="text-xs">
                        {bom.structureCount}
                      </Badge>
                    </TableCell>
                    <TableCell className={tdClass}>{formatDate(bom.startDate)}</TableCell>
                    <TableCell className={tdClass}>{formatDate(bom.endDate)}</TableCell>
                    <TableCell>
                      <BOMStatusBadges bom={bom} />
                    </TableCell>
                    <TableCell className={tdClass}>{formatDate(bom.createdAt)}</TableCell>
                    <TableCell className={tdClass}>{bom.createdByName}</TableCell>
                    {showDeletedCols && (
                      <>
                        <TableCell className={tdClass}>{formatDate(bom.deletedAt)}</TableCell>
                        <TableCell className={tdClass}>{bom.deletedByName ?? '—'}</TableCell>
                      </>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/departments/${departmentId}/purchaseBom/${bom.id}` as Route}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10"
                            title="Open">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        {!bom.deleted && canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                            title="Edit"
                            onClick={() => {
                              setEditingBOM(bom)
                              setDialogOpen(true)
                            }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {!bom.deleted && canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Delete"
                            onClick={() => handleSoftDelete(bom)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {bom.deleted && (
                          <>
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                onClick={() => handleUndelete(bom)}>
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                title="Hard delete"
                                onClick={() => handleHardDelete(bom)}>
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

      <div className="text-xs text-muted-foreground">
        Showing {filtered.length} of {initialBOMs.length} BOMs
      </div>

      <PurchaseBOMFormDialog
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open)
          if (!open) setEditingBOM(null)
        }}
        bom={editingBOM}
        defaultProjectId={projectId}
        allBOMs={initialBOMs}
        canEditNumber={canEditNumber}
      />
    </div>
  )
}
