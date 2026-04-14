'use client'

import {useState} from 'react'
import {Search, Plus, Pencil, ChevronDown, ChevronUp, Trash2, ExternalLink, RotateCcw} from 'lucide-react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import type {Route} from 'next'
import type {MappedTraining} from '@/types/training'
import type {RoleLevelOption} from '@/types/roleLevel'
import type {VisibilityRow} from '@/components/custom/visibilityForRoleTab'
import {TrainingFormDialog} from '@/components/custom/trainingFormDialog'
import {
  softDeleteTrainingAction,
  hardDeleteTrainingAction,
  undeleteTrainingAction,
  createTrainingAction,
  updateTrainingAction,
} from '@/serverFunctions/training'

type FilterDeleted = 'not-deleted' | 'deleted' | 'all'
type SortField =
  | 'trainingNumber'
  | 'trainingDate'
  | 'trainingStandardDescriptionShort'
  | 'workOrderNumber'
  | 'createdAt'
type SortDir = 'asc' | 'desc'

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

interface TrainingTableProps {
  initialTrainings: MappedTraining[]
  currentUserRole: string
  currentUserLevel: number
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  departmentId: string
  standardOptions: {id: string; name: string}[]
  workOrderOptions: {id: string; name: string}[]
}

export function TrainingTable({
  initialTrainings,
  currentUserRole,
  currentUserLevel,
  roleLevelOptions,
  defaultVisibleRoleNames,
  departmentId,
  standardOptions,
  workOrderOptions,
}: TrainingTableProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  // Level thresholds:
  //   >= 40  can edit training fields
  //   >= 60  can create new trainings
  //   >= 80  can delete + manage visibility
  const canEdit = currentUserLevel >= 40
  const canCreate = currentUserLevel >= 60
  const canDelete = currentUserLevel >= 80
  const canManageVisibility = currentUserLevel >= 80

  const [search, setSearch] = useState('')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [sortField, setSortField] = useState<SortField>('trainingDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MappedTraining | null>(null)

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

  const filtered = initialTrainings
    .filter(t => {
      if (filterDeleted === 'not-deleted' && t.deleted) return false
      if (filterDeleted === 'deleted' && !t.deleted) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        (t.trainingNumber?.toLowerCase().includes(q) ?? false) ||
        (t.trainingStandardDescriptionShort?.toLowerCase().includes(q) ?? false) ||
        (t.workOrderNumber?.toLowerCase().includes(q) ?? false)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const s = (x: string | null, y: string | null) => dir * (x ?? '').localeCompare(y ?? '')
      if (sortField === 'trainingNumber') return s(a.trainingNumber, b.trainingNumber)
      if (sortField === 'trainingDate') return s(a.trainingDate, b.trainingDate)
      if (sortField === 'trainingStandardDescriptionShort')
        return s(a.trainingStandardDescriptionShort, b.trainingStandardDescriptionShort)
      if (sortField === 'workOrderNumber') return s(a.workOrderNumber, b.workOrderNumber)
      return s(a.createdAt, b.createdAt)
    })

  async function handleSave(t: MappedTraining, visibilityRows: VisibilityRow[]) {
    const core = {
      trainingNumber: t.trainingNumber,
      trainingDate: new Date(t.trainingDate),
      closed: t.closed,
      workOrderId: t.workOrderId,
      trainingStandardId: t.trainingStandardId,
      visibilityForRoles: visibilityRows,
    }
    if (editing) {
      await updateTrainingAction({id: t.id, ...core})
    } else {
      await createTrainingAction(core)
    }
    setDialogOpen(false)
    router.refresh()
  }

  const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
  const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'
  const showDeletedCols = filterDeleted !== 'not-deleted'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trainings…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border"
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
              setEditing(null)
              setDialogOpen(true)
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
            <Plus className="h-4 w-4" /> New Training
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className={thClass} onClick={() => toggleSort('trainingNumber')}>
                Training # <SortIcon field="trainingNumber" />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('trainingDate')}>
                Date <SortIcon field="trainingDate" />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('trainingStandardDescriptionShort')}>
                Standard <SortIcon field="trainingStandardDescriptionShort" />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('workOrderNumber')}>
                Work Order <SortIcon field="workOrderNumber" />
              </TableHead>
              <TableHead className="text-xs whitespace-nowrap">Closed</TableHead>
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
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showDeletedCols ? 11 : 8} className="h-32 text-center text-muted-foreground">
                  No trainings found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(t => (
                <TableRow
                  key={t.id}
                  className={`border-border/40 hover:bg-secondary/50 ${t.deleted ? 'opacity-50' : ''}`}>
                  <TableCell className={`${tdClass} text-foreground font-medium`}>
                    <Link
                      href={`/departments/${departmentId}/course/${t.id}` as Route}
                      className="hover:text-accent hover:underline transition-colors">
                      {t.trainingNumber ?? '-'}
                    </Link>
                  </TableCell>
                  <TableCell className={tdClass}>{formatDate(t.trainingDate)}</TableCell>
                  <TableCell className={tdClass}>{t.trainingStandardDescriptionShort ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{t.workOrderNumber ?? '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={t.closed ? 'secondary' : 'default'}
                      className={!t.closed ? 'bg-accent/15 text-accent border-0 text-xs' : 'text-xs'}>
                      {t.closed ? 'Closed' : 'Open'}
                    </Badge>
                  </TableCell>
                  <TableCell className={tdClass}>{formatDate(t.createdAt)}</TableCell>
                  <TableCell className={tdClass}>{t.createdByName}</TableCell>
                  {showDeletedCols && (
                    <>
                      <TableCell>
                        {t.deleted ? (
                          <Badge variant="destructive">Yes</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No</span>
                        )}
                      </TableCell>
                      <TableCell className={tdClass}>{formatDate(t.deletedAt)}</TableCell>
                      <TableCell className={tdClass}>{t.deletedByName ?? '-'}</TableCell>
                    </>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/departments/${departmentId}/course/${t.id}` as Route}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      {!t.deleted && canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          onClick={() => {
                            setEditing(t)
                            setDialogOpen(true)
                          }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {!t.deleted && canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={async () => {
                            await softDeleteTrainingAction({id: t.id})
                            router.refresh()
                          }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {t.deleted && (
                        <>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:bg-secondary hover:text-foreground"
                              onClick={async () => {
                                await undeleteTrainingAction({id: t.id})
                                router.refresh()
                              }}>
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span className="sr-only">Restore {t.trainingNumber ?? t.id}</span>
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={async () => {
                                await hardDeleteTrainingAction({id: t.id})
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
      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {initialTrainings.length} trainings
      </p>

      <TrainingFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        training={editing}
        onSave={handleSave}
        isAdmin={isAdmin}
        roleLevelOptions={roleLevelOptions}
        defaultVisibleRoleNames={defaultVisibleRoleNames}
        standardOptions={standardOptions}
        workOrderOptions={workOrderOptions}
        canManageVisibility={canManageVisibility}
      />
    </div>
  )
}
