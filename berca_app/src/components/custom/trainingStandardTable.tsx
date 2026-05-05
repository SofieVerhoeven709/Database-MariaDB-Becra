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
import type {MappedTrainingStandard} from '@/types/training'
import type {RoleLevelOption} from '@/types/roleLevel'
import type {VisibilityRow} from '@/components/custom/visibilityForRoleTab'
import {TrainingStandardFormDialog} from '@/components/custom/trainingStandardFormDialog'
import {
  softDeleteTrainingStandardAction,
  hardDeleteTrainingStandardAction,
  undeleteTrainingStandardAction,
  createTrainingStandardAction,
  updateTrainingStandardAction,
} from '@/serverFunctions/training'
import {TableCsvActions} from '@/components/custom/tableCsvActions'
import {getCsvValue, isTruthyCsvValue, normalizeCsvLookup, type CsvRow} from '@/lib/csv'

type FilterDeleted = 'not-deleted' | 'deleted' | 'all'
type SortField = 'descriptionShort' | 'location' | 'certificateName' | 'createdAt'
type SortDir = 'asc' | 'desc'

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function csvErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Could not create training standard.'
}

interface TrainingStandardTableProps {
  initialStandards: MappedTrainingStandard[]
  currentUserRole: string
  currentUserLevel: number
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  departmentId: string
  certificateOptions: {id: string; name: string}[]
}

export function TrainingStandardTable({
  initialStandards,
  currentUserRole,
  currentUserLevel,
  roleLevelOptions,
  defaultVisibleRoleNames,
  departmentId,
  certificateOptions,
}: TrainingStandardTableProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  // Level thresholds:
  //   >= 40  can edit standard fields
  //   >= 60  can create new standards
  //   >= 80  can delete + manage visibility
  const canEdit = currentUserLevel >= 40
  const canCreate = currentUserLevel >= 60
  const canDelete = currentUserLevel >= 80
  const canManageVisibility = currentUserLevel >= 80

  const [search, setSearch] = useState('')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [sortField, setSortField] = useState<SortField>('descriptionShort')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MappedTrainingStandard | null>(null)

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

  // Apply search, filter, and sort for the standards list.
  const filtered = initialStandards
    .filter(s => {
      if (filterDeleted === 'not-deleted' && s.deleted) return false
      if (filterDeleted === 'deleted' && !s.deleted) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        (s.descriptionShort?.toLowerCase().includes(q) ?? false) ||
        (s.description?.toLowerCase().includes(q) ?? false) ||
        (s.location?.toLowerCase().includes(q) ?? false) ||
        (s.certificateName?.toLowerCase().includes(q) ?? false)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const s = (x: string | null, y: string | null) => dir * (x ?? '').localeCompare(y ?? '')
      if (sortField === 'descriptionShort') return s(a.descriptionShort, b.descriptionShort)
      if (sortField === 'location') return s(a.location, b.location)
      if (sortField === 'certificateName') return s(a.certificateName, b.certificateName)
      return s(a.createdAt, b.createdAt)
    })

  async function handleSave(std: MappedTrainingStandard, visibilityRows: VisibilityRow[]) {
    const core = {
      description: std.description,
      descriptionShort: std.descriptionShort,
      location: std.location,
      certificate: std.certificate,
      repeat: std.repeat,
      certificateId: std.certificateId,
      visibilityForRoles: visibilityRows,
    }
    // Create or update based on the active edit state.
    if (editing) {
      await updateTrainingStandardAction({id: std.id, ...core})
    } else {
      await createTrainingStandardAction(core)
    }
    setDialogOpen(false)
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
      const descriptionShort = getCsvValue(row, ['Name', 'Description Short', 'descriptionShort'])
      const certificateValue = getCsvValue(row, ['Certificate', 'certificateName', 'certificateId'])
      const certificate = certificateOptions.find(
        option =>
          option.id === certificateValue || normalizeCsvLookup(option.name) === normalizeCsvLookup(certificateValue),
      )

      if (!descriptionShort) {
        errors.push(`Row ${rowNumber}: Name is required.`)
        continue
      }

      if (!certificate) {
        errors.push(`Row ${rowNumber}: Certificate could not be matched.`)
        continue
      }

      try {
        await createTrainingStandardAction({
          descriptionShort,
          description: getCsvValue(row, ['Description', 'description']) || null,
          location: getCsvValue(row, ['Location', 'location']) || null,
          certificate: isTruthyCsvValue(getCsvValue(row, ['Has Cert', 'Certificate Required', 'certificate'])),
          repeat: isTruthyCsvValue(getCsvValue(row, ['Repeat', 'repeat'])),
          certificateId: certificate.id,
          visibilityForRoles: [],
        })
        created += 1
      } catch (error) {
        errors.push(`Row ${rowNumber}: ${csvErrorMessage(error)}`)
      }
    }

    if (created > 0) router.refresh()

    window.alert(
      errors.length > 0
        ? `Created ${created} training standard(s). ${errors.slice(0, 5).join(' ')}${
            errors.length > 5 ? ` +${errors.length - 5} more error(s).` : ''
          }`
        : `Created ${created} training standard(s).`,
    )
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
              placeholder="Search standards…"
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
        <TableCsvActions filename="training-standard-table.csv" onUpload={canCreate ? handleUploadCsv : undefined} />

        {canCreate && (
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
            <Plus className="h-4 w-4" /> New Standard
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className={thClass} onClick={() => toggleSort('descriptionShort')}>
                Name <SortIcon field="descriptionShort" />
              </TableHead>
              <TableHead className="text-xs whitespace-nowrap">Description</TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('location')}>
                Location <SortIcon field="location" />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('certificateName')}>
                Certificate <SortIcon field="certificateName" />
              </TableHead>
              <TableHead className="text-xs whitespace-nowrap">Repeat</TableHead>
              <TableHead className="text-xs whitespace-nowrap">Has Cert</TableHead>
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
                <TableCell colSpan={showDeletedCols ? 12 : 9} className="h-32 text-center text-muted-foreground">
                  No standards found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(s => (
                <TableRow
                  key={s.id}
                  className={`border-border/40 hover:bg-secondary/50 ${s.deleted ? 'opacity-50' : ''}`}>
                  <TableCell className={`${tdClass} text-foreground font-medium`}>
                    <Link
                      href={`/departments/${departmentId}/courseStandard/${s.id}` as Route}
                      className="hover:text-accent hover:underline transition-colors">
                      {s.descriptionShort ?? '-'}
                    </Link>
                  </TableCell>
                  <TableCell className={`${tdClass} max-w-xs`}>
                    <p className="truncate max-w-[200px]" title={s.description ?? ''}>
                      {s.description ?? '-'}
                    </p>
                  </TableCell>
                  <TableCell className={tdClass}>{s.location ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{s.certificateName ?? '-'}</TableCell>
                  <TableCell>
                    <Badge variant={s.repeat ? 'default' : 'secondary'} className="text-xs">
                      {s.repeat ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.certificate ? 'default' : 'secondary'} className="text-xs">
                      {s.certificate ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell className={tdClass}>{formatDate(s.createdAt)}</TableCell>
                  <TableCell className={tdClass}>{s.createdByName}</TableCell>
                  {showDeletedCols && (
                    <>
                      <TableCell>
                        {s.deleted ? (
                          <Badge variant="destructive">Yes</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No</span>
                        )}
                      </TableCell>
                      <TableCell className={tdClass}>{formatDate(s.deletedAt)}</TableCell>
                      <TableCell className={tdClass}>{s.deletedByName ?? '-'}</TableCell>
                    </>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/departments/${departmentId}/courseStandard/${s.id}` as Route}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      {!s.deleted && canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          onClick={() => {
                            setEditing(s)
                            setDialogOpen(true)
                          }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {!s.deleted && canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={async () => {
                            await softDeleteTrainingStandardAction({id: s.id})
                            router.refresh()
                          }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {s.deleted && (
                        <>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:bg-secondary hover:text-foreground"
                              onClick={async () => {
                                await undeleteTrainingStandardAction({id: s.id})
                                router.refresh()
                              }}>
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span className="sr-only">Restore {s.description}</span>
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={async () => {
                                await hardDeleteTrainingStandardAction({id: s.id})
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
        Showing {filtered.length} of {initialStandards.length} standards
      </p>

      <TrainingStandardFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        standard={editing}
        onSave={handleSave}
        isAdmin={isAdmin}
        roleLevelOptions={roleLevelOptions}
        defaultVisibleRoleNames={defaultVisibleRoleNames}
        certificateOptions={certificateOptions}
        canManageVisibility={canManageVisibility}
      />
    </div>
  )
}
