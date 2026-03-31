'use client'

import {useState} from 'react'
import {Search, Plus, Pencil, ChevronDown, ChevronUp, Trash2, ExternalLink, Copy} from 'lucide-react'
import {DocumentFormDialog, CopyDocumentDialog} from '@/components/custom/documentFormDialog'
import type {VisibilityRow} from '@/components/custom/visibilityForRoleTab'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Badge} from '@/components/ui/badge'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Label} from '@/components/ui/label'
import type {
  MappedDocument,
  MappedDocumentGroup,
  MappedDocumentGroupA,
  MappedDocumentGroupB,
  MappedDocumentGroupC,
  MappedDocumentGroupD,
  MappedDocumentPlace,
  MappedDocumentStatus,
  DocumentPlaceOption,
  DocumentStatusOption,
  DocumentTargetTypeName,
} from '@/types/document'
import type {RoleLevelOption} from '@/types/roleLevel'
import {
  createDocumentAction,
  updateDocumentAction,
  softDeleteDocumentAction,
  hardDeleteDocumentAction,
  undeleteDocumentAction,
  copyDocumentAction,
  createDocumentGroupAction,
  updateDocumentGroupAction,
  deleteDocumentGroupAction,
  createDocumentGroupAAction,
  updateDocumentGroupAAction,
  softDeleteDocumentGroupAAction,
  hardDeleteDocumentGroupAAction,
  undeleteDocumentGroupAAction,
  createDocumentGroupBAction,
  updateDocumentGroupBAction,
  softDeleteDocumentGroupBAction,
  hardDeleteDocumentGroupBAction,
  undeleteDocumentGroupBAction,
  createDocumentGroupCAction,
  updateDocumentGroupCAction,
  softDeleteDocumentGroupCAction,
  hardDeleteDocumentGroupCAction,
  undeleteDocumentGroupCAction,
  createDocumentGroupDAction,
  updateDocumentGroupDAction,
  softDeleteDocumentGroupDAction,
  hardDeleteDocumentGroupDAction,
  undeleteDocumentGroupDAction,
  createDocumentPlaceAction,
  updateDocumentPlaceAction,
  softDeleteDocumentPlaceAction,
  hardDeleteDocumentPlaceAction,
  undeleteDocumentPlaceAction,
  createDocumentStatusAction,
  updateDocumentStatusAction,
  softDeleteDocumentStatusAction,
  hardDeleteDocumentStatusAction,
  undeleteDocumentStatusAction,
} from '@/serverFunctions/documents'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import type {Route} from 'next'

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField =
  | 'documentNumber'
  | 'descriptionShort'
  | 'valid'
  | 'process'
  | 'canCopy'
  | 'expiryDate'
  | 'createdAt'
  | 'documentStatusName'
  | 'documentPlaceLabel'
  | 'managedByName'
  | 'deleted'
type SortDir = 'asc' | 'desc'
type FilterDeleted = 'not-deleted' | 'deleted' | 'all'
interface SelectOption {
  id: string
  name: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function YesNoBadge({value}: {value: boolean}) {
  return value ? (
    <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
  ) : (
    <Badge variant="secondary" className="text-muted-foreground font-medium">
      No
    </Badge>
  )
}

const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

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
    <TableHead className={thClass} onClick={() => onSort(field)}>
      {label} <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </TableHead>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DocumentTableProps {
  initialDocuments: MappedDocument[]
  initialDocumentGroups: MappedDocumentGroup[]
  initialGroupAs: MappedDocumentGroupA[]
  initialGroupBs: MappedDocumentGroupB[]
  initialGroupCs: MappedDocumentGroupC[]
  initialGroupDs: MappedDocumentGroupD[]
  initialPlaces: MappedDocumentPlace[]
  initialStatuses: MappedDocumentStatus[]
  currentUserRole: string
  currentUserLevel: number
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  departmentId: string
  employeeOptions: SelectOption[]
  targetOptions: Record<DocumentTargetTypeName, SelectOption[]>
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DocumentTable({
  initialDocuments,
  initialDocumentGroups,
  initialGroupAs,
  initialGroupBs,
  initialGroupCs,
  initialGroupDs,
  initialPlaces,
  initialStatuses,
  currentUserRole,
  currentUserLevel,
  roleLevelOptions,
  defaultVisibleRoleNames,
  departmentId,
  employeeOptions,
  targetOptions,
}: DocumentTableProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canEdit = currentUserLevel >= 40
  const canCreate = currentUserLevel >= 60
  const canDelete = currentUserLevel >= 80
  const canManageVisibility = currentUserLevel >= 80

  const [search, setSearch] = useState('')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<MappedDocument | null>(null)
  const [copyDialogDoc, setCopyDialogDoc] = useState<MappedDocument | null>(null)

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  // ─── Derived options ───────────────────────────────────────────────────────

  const groupAOptions = initialGroupAs.filter(g => !g.deleted).map(g => ({id: g.id, name: g.name}))
  const groupBOptions = initialGroupBs.filter(g => !g.deleted).map(g => ({id: g.id, name: g.name}))
  const groupCOptions = initialGroupCs.filter(g => !g.deleted).map(g => ({id: g.id, name: g.name}))
  const groupDOptions = initialGroupDs.filter(g => !g.deleted).map(g => ({id: g.id, name: g.name}))

  const placeOptions: DocumentPlaceOption[] = initialPlaces
    .filter(p => !p.deleted)
    .map(p => ({
      id: p.id,
      headFolder: p.headFolder,
      subFolder: p.subFolder,
      label: p.label,
    }))

  const statusOptions: DocumentStatusOption[] = initialStatuses
    .filter(s => !s.deleted)
    .map(s => ({
      id: s.id,
      name: s.name,
    }))

  const documentOptions: SelectOption[] = initialDocuments
    .filter(d => !d.deleted)
    .map(d => ({
      id: d.id,
      name: `${d.documentNumber} — ${d.descriptionShort}`,
    }))

  // ─── Filter + sort ─────────────────────────────────────────────────────────

  const filtered = initialDocuments
    .filter(d => {
      if (filterDeleted === 'not-deleted' && d.deleted) return false
      if (filterDeleted === 'deleted' && !d.deleted) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        d.documentNumber.toLowerCase().includes(q) ||
        d.descriptionShort.toLowerCase().includes(q) ||
        (d.description?.toLowerCase().includes(q) ?? false) ||
        (d.documentGroup?.label.toLowerCase().includes(q) ?? false) ||
        d.documentPlaceLabel.toLowerCase().includes(q) ||
        (d.managedByName?.toLowerCase().includes(q) ?? false) ||
        (d.documentStatusName?.toLowerCase().includes(q) ?? false)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const s = (x: string | null, y: string | null) => dir * (x ?? '').localeCompare(y ?? '')
      const n = (x: boolean, y: boolean) => dir * (Number(x) - Number(y))
      switch (sortField) {
        case 'documentNumber':
          return s(a.documentNumber, b.documentNumber)
        case 'descriptionShort':
          return s(a.descriptionShort, b.descriptionShort)
        case 'valid':
          return n(a.valid, b.valid)
        case 'process':
          return n(a.process, b.process)
        case 'canCopy':
          return n(a.canCopy, b.canCopy)
        case 'expiryDate':
          return s(a.expiryDate, b.expiryDate)
        case 'createdAt':
          return s(a.createdAt, b.createdAt)
        case 'documentStatusName':
          return s(a.documentStatusName, b.documentStatusName)
        case 'documentPlaceLabel':
          return s(a.documentPlaceLabel, b.documentPlaceLabel)
        case 'managedByName':
          return s(a.managedByName, b.managedByName)
        case 'deleted':
          return n(a.deleted, b.deleted)
        default:
          return 0
      }
    })

  // ─── Save handler ──────────────────────────────────────────────────────────

  async function handleSave(
    doc: MappedDocument,
    visibilityRows: VisibilityRow[],
    documentTargetId?: string,
    documentTargetTypeName?: DocumentTargetTypeName,
  ) {
    const core = {
      documentNumber: doc.documentNumber,
      description: doc.description,
      descriptionShort: doc.descriptionShort,
      expiryDate: doc.expiryDate ? new Date(doc.expiryDate) : null,
      revisionNumber: doc.revisionNumber,
      revisionDetail: doc.revisionDetail,
      valid: doc.valid,
      process: doc.process,
      canCopy: doc.canCopy,
      additionalInfo: doc.additionalInfo,
      referenceDocId: doc.referenceDocId,
      revisedById: doc.revisedById,
      managedById: doc.managedById,
      documentGroupId: doc.documentGroupId,
      documentPlaceId: doc.documentPlaceId,
      documentStatusId: doc.documentStatusId,
    }

    if (editingDocument) {
      await updateDocumentAction({id: doc.id, ...core, visibilityForRoles: visibilityRows})
    } else {
      await createDocumentAction({
        ...core,
        visibilityForRoles: visibilityRows,
        documentTargetId,
        documentTargetTypeName,
      })
    }
    setDialogOpen(false)
    router.refresh()
  }

  const showDeletedCols = filterDeleted !== 'not-deleted'

  return (
    <Tabs defaultValue="documents">
      <TabsList className="bg-secondary border border-border/60 flex-wrap h-auto gap-1 mb-6">
        <TabsTrigger value="documents">Documents</TabsTrigger>
        {canCreate && <TabsTrigger value="groups">Groups</TabsTrigger>}
        {canCreate && <TabsTrigger value="groupA">Group A</TabsTrigger>}
        {canCreate && <TabsTrigger value="groupB">Group B</TabsTrigger>}
        {canCreate && <TabsTrigger value="groupC">Group C</TabsTrigger>}
        {canCreate && <TabsTrigger value="groupD">Group D</TabsTrigger>}
        {canCreate && <TabsTrigger value="places">Places</TabsTrigger>}
        {canCreate && <TabsTrigger value="statuses">Statuses</TabsTrigger>}
      </TabsList>

      {/* ══ DOCUMENTS ════════════════════════════════════════════════════════ */}
      <TabsContent value="documents">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1 flex-wrap">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search number, description, group…"
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
                  setEditingDocument(null)
                  setDialogOpen(true)
                }}
                className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
                <Plus className="h-4 w-4" /> New Document
              </Button>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <Th
                    field="documentNumber"
                    label="Doc #"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <Th
                    field="descriptionShort"
                    label="Description"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <TableHead className="whitespace-nowrap text-xs">Group</TableHead>
                  <Th
                    field="documentPlaceLabel"
                    label="Place"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <Th
                    field="documentStatusName"
                    label="Status"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <Th field="valid" label="Valid" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <Th field="process" label="Process" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <Th field="canCopy" label="Can Copy" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <Th field="expiryDate" label="Expires" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <Th
                    field="managedByName"
                    label="Managed By"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <Th field="createdAt" label="Created" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  {showDeletedCols && (
                    <>
                      <Th field="deleted" label="Deleted" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
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
                    <TableCell colSpan={showDeletedCols ? 15 : 12} className="h-32 text-center text-muted-foreground">
                      No documents found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(d => (
                    <TableRow
                      key={d.id}
                      className={`border-border/40 hover:bg-secondary/50 ${d.deleted ? 'opacity-50' : ''}`}>
                      <TableCell className="text-sm text-foreground font-medium whitespace-nowrap">
                        {d.documentNumber}
                      </TableCell>
                      <TableCell className="text-sm text-foreground max-w-xs">
                        <p className="truncate max-w-[200px]" title={d.descriptionShort}>
                          {d.descriptionShort}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap max-w-[160px]">
                        <p className="truncate" title={d.documentGroup?.label ?? ''}>
                          {d.documentGroup?.label ?? '-'}
                        </p>
                      </TableCell>
                      <TableCell className={tdClass}>{d.documentPlaceLabel}</TableCell>
                      <TableCell className={tdClass}>{d.documentStatusName ?? '-'}</TableCell>
                      <TableCell>
                        <YesNoBadge value={d.valid} />
                      </TableCell>
                      <TableCell>
                        <YesNoBadge value={d.process} />
                      </TableCell>
                      <TableCell>
                        <YesNoBadge value={d.canCopy} />
                      </TableCell>
                      <TableCell className={tdClass}>{formatDate(d.expiryDate)}</TableCell>
                      <TableCell className={tdClass}>{d.managedByName ?? '-'}</TableCell>
                      <TableCell className={tdClass}>{formatDate(d.createdAt)}</TableCell>
                      {showDeletedCols && (
                        <>
                          <TableCell>
                            {d.deleted ? (
                              <Badge variant="destructive">Yes</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">No</span>
                            )}
                          </TableCell>
                          <TableCell className={tdClass}>{formatDate(d.deletedAt)}</TableCell>
                          <TableCell className={tdClass}>{d.deletedByName ?? '-'}</TableCell>
                        </>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link href={`/departments/${departmentId}/document/${d.id}` as Route}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          {!d.deleted && d.canCopy && canCreate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10"
                              onClick={() => setCopyDialogDoc(d)}>
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {!d.deleted && canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                              onClick={() => {
                                setEditingDocument(d)
                                setDialogOpen(true)
                              }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {!d.deleted && canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={async () => {
                                await softDeleteDocumentAction({id: d.id})
                                router.refresh()
                              }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {d.deleted && canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
                              onClick={async () => {
                                await undeleteDocumentAction({id: d.id})
                                router.refresh()
                              }}>
                              Restore
                            </Button>
                          )}
                          {d.deleted && isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={async () => {
                                await hardDeleteDocumentAction({id: d.id})
                                router.refresh()
                              }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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
            Showing {filtered.length} of {initialDocuments.length} documents
          </div>
        </div>
      </TabsContent>

      {/* ══ GROUPS JUNCTION ══════════════════════════════════════════════════ */}
      {canCreate && (
        <TabsContent value="groups">
          <DocumentGroupJunctionTab
            items={initialDocumentGroups}
            groupAOptions={groupAOptions}
            groupBOptions={groupBOptions}
            groupCOptions={groupCOptions}
            groupDOptions={groupDOptions}
            isAdmin={isAdmin}
            canEdit={canEdit}
            canCreate={canCreate}
            canDelete={canDelete}
            onCreate={async data => {
              await createDocumentGroupAction(data)
              router.refresh()
            }}
            onUpdate={async data => {
              await updateDocumentGroupAction(data)
              router.refresh()
            }}
            onDelete={async id => {
              await deleteDocumentGroupAction({id})
              router.refresh()
            }}
          />
        </TabsContent>
      )}

      {/* ══ GROUP A ══════════════════════════════════════════════════════════ */}
      {canCreate && (
        <TabsContent value="groupA">
          <SimpleGroupTab
            title="Group A"
            items={initialGroupAs}
            isAdmin={isAdmin}
            canEdit={canEdit}
            canCreate={canCreate}
            canDelete={canDelete}
            onCreate={async name => {
              await createDocumentGroupAAction({name})
              router.refresh()
            }}
            onUpdate={async (id, name) => {
              await updateDocumentGroupAAction({id, name})
              router.refresh()
            }}
            onSoftDelete={async id => {
              await softDeleteDocumentGroupAAction({id})
              router.refresh()
            }}
            onHardDelete={async id => {
              await hardDeleteDocumentGroupAAction({id})
              router.refresh()
            }}
            onRestore={async id => {
              await undeleteDocumentGroupAAction({id})
              router.refresh()
            }}
          />
        </TabsContent>
      )}

      {/* ══ GROUP B ══════════════════════════════════════════════════════════ */}
      {canCreate && (
        <TabsContent value="groupB">
          <SimpleGroupTab
            title="Group B"
            items={initialGroupBs}
            isAdmin={isAdmin}
            canEdit={canEdit}
            canCreate={canCreate}
            canDelete={canDelete}
            onCreate={async name => {
              await createDocumentGroupBAction({name})
              router.refresh()
            }}
            onUpdate={async (id, name) => {
              await updateDocumentGroupBAction({id, name})
              router.refresh()
            }}
            onSoftDelete={async id => {
              await softDeleteDocumentGroupBAction({id})
              router.refresh()
            }}
            onHardDelete={async id => {
              await hardDeleteDocumentGroupBAction({id})
              router.refresh()
            }}
            onRestore={async id => {
              await undeleteDocumentGroupBAction({id})
              router.refresh()
            }}
          />
        </TabsContent>
      )}

      {/* ══ GROUP C ══════════════════════════════════════════════════════════ */}
      {canCreate && (
        <TabsContent value="groupC">
          <SimpleGroupTab
            title="Group C"
            items={initialGroupCs}
            isAdmin={isAdmin}
            canEdit={canEdit}
            canCreate={canCreate}
            canDelete={canDelete}
            onCreate={async name => {
              await createDocumentGroupCAction({name})
              router.refresh()
            }}
            onUpdate={async (id, name) => {
              await updateDocumentGroupCAction({id, name})
              router.refresh()
            }}
            onSoftDelete={async id => {
              await softDeleteDocumentGroupCAction({id})
              router.refresh()
            }}
            onHardDelete={async id => {
              await hardDeleteDocumentGroupCAction({id})
              router.refresh()
            }}
            onRestore={async id => {
              await undeleteDocumentGroupCAction({id})
              router.refresh()
            }}
          />
        </TabsContent>
      )}

      {/* ══ GROUP D ══════════════════════════════════════════════════════════ */}
      {canCreate && (
        <TabsContent value="groupD">
          <SimpleGroupTab
            title="Group D"
            items={initialGroupDs}
            isAdmin={isAdmin}
            canEdit={canEdit}
            canCreate={canCreate}
            canDelete={canDelete}
            onCreate={async name => {
              await createDocumentGroupDAction({name})
              router.refresh()
            }}
            onUpdate={async (id, name) => {
              await updateDocumentGroupDAction({id, name})
              router.refresh()
            }}
            onSoftDelete={async id => {
              await softDeleteDocumentGroupDAction({id})
              router.refresh()
            }}
            onHardDelete={async id => {
              await hardDeleteDocumentGroupDAction({id})
              router.refresh()
            }}
            onRestore={async id => {
              await undeleteDocumentGroupDAction({id})
              router.refresh()
            }}
          />
        </TabsContent>
      )}

      {/* ══ PLACES ═══════════════════════════════════════════════════════════ */}
      {canCreate && (
        <TabsContent value="places">
          <PlaceTab
            items={initialPlaces}
            isAdmin={isAdmin}
            canEdit={canEdit}
            canCreate={canCreate}
            canDelete={canDelete}
            onCreate={async (h, s) => {
              await createDocumentPlaceAction({headFolder: h, subFolder: s})
              router.refresh()
            }}
            onUpdate={async (id, h, s) => {
              await updateDocumentPlaceAction({id, headFolder: h, subFolder: s})
              router.refresh()
            }}
            onSoftDelete={async id => {
              await softDeleteDocumentPlaceAction({id})
              router.refresh()
            }}
            onHardDelete={async id => {
              await hardDeleteDocumentPlaceAction({id})
              router.refresh()
            }}
            onRestore={async id => {
              await undeleteDocumentPlaceAction({id})
              router.refresh()
            }}
          />
        </TabsContent>
      )}

      {/* ══ STATUSES ═════════════════════════════════════════════════════════ */}
      {canCreate && (
        <TabsContent value="statuses">
          <SimpleGroupTab
            title="Status"
            items={initialStatuses}
            isAdmin={isAdmin}
            canEdit={canEdit}
            canCreate={canCreate}
            canDelete={canDelete}
            onCreate={async name => {
              await createDocumentStatusAction({name})
              router.refresh()
            }}
            onUpdate={async (id, name) => {
              await updateDocumentStatusAction({id, name})
              router.refresh()
            }}
            onSoftDelete={async id => {
              await softDeleteDocumentStatusAction({id})
              router.refresh()
            }}
            onHardDelete={async id => {
              await hardDeleteDocumentStatusAction({id})
              router.refresh()
            }}
            onRestore={async id => {
              await undeleteDocumentStatusAction({id})
              router.refresh()
            }}
          />
        </TabsContent>
      )}

      {/* ─── Dialogs ──────────────────────────────────────────────────────── */}
      <DocumentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        document={editingDocument}
        onSave={handleSave}
        isAdmin={isAdmin}
        roleLevelOptions={roleLevelOptions}
        defaultVisibleRoleNames={defaultVisibleRoleNames}
        employeeOptions={employeeOptions}
        groupAOptions={groupAOptions}
        groupBOptions={groupBOptions}
        groupCOptions={groupCOptions}
        groupDOptions={groupDOptions}
        documentGroups={initialDocumentGroups}
        placeOptions={placeOptions}
        statusOptions={statusOptions}
        documentOptions={documentOptions}
        targetOptions={targetOptions}
        canManageVisibility={canManageVisibility}
      />

      {copyDialogDoc && (
        <CopyDocumentDialog
          open={!!copyDialogDoc}
          onOpenChange={open => {
            if (!open) setCopyDialogDoc(null)
          }}
          sourceDocument={copyDialogDoc}
          onCopy={async (documentNumber, descriptionShort) => {
            await copyDocumentAction({sourceId: copyDialogDoc.id, documentNumber, descriptionShort})
            setCopyDialogDoc(null)
            router.refresh()
          }}
        />
      )}
    </Tabs>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// DocumentGroupJunctionTab — manages A+B+C+D combos
// ════════════════════════════════════════════════════════════════════════════

interface GroupOpt {
  id: string
  name: string | null
}

interface DocumentGroupJunctionTabProps {
  items: MappedDocumentGroup[]
  groupAOptions: GroupOpt[]
  groupBOptions: GroupOpt[]
  groupCOptions: GroupOpt[]
  groupDOptions: GroupOpt[]
  isAdmin: boolean
  canEdit: boolean
  canCreate: boolean
  canDelete: boolean
  onCreate: (data: {
    groupAId?: string | null
    groupBId?: string | null
    groupCId?: string | null
    groupDId?: string | null
  }) => Promise<void>
  onUpdate: (data: {
    id: string
    groupAId?: string | null
    groupBId?: string | null
    groupCId?: string | null
    groupDId?: string | null
  }) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function DocumentGroupJunctionTab({
  items,
  groupAOptions,
  groupBOptions,
  groupCOptions,
  groupDOptions,
  isAdmin,
  canEdit,
  canCreate,
  canDelete,
  onCreate,
  onUpdate,
  onDelete,
}: DocumentGroupJunctionTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [aId, setAId] = useState('')
  const [bId, setBId] = useState('')
  const [cId, setCId] = useState('')
  const [dId, setDId] = useState('')
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setEditingId(null)
    setAId('')
    setBId('')
    setCId('')
    setDId('')
    setDialogOpen(true)
  }
  function openEdit(item: MappedDocumentGroup) {
    setEditingId(item.id)
    setAId(item.groupAId ?? '')
    setBId(item.groupBId ?? '')
    setCId(item.groupCId ?? '')
    setDId(item.groupDId ?? '')
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        groupAId: aId || null,
        groupBId: bId || null,
        groupCId: cId || null,
        groupDId: dId || null,
      }
      if (editingId) await onUpdate({id: editingId, ...payload})
      else await onCreate(payload)
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const isValid = !!aId // must have at least A

  const groupSelect = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    options: GroupOpt[],
    disabled = false,
  ) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value || 'none'} disabled={disabled} onValueChange={v => onChange(v === 'none' ? '' : v)}>
        <SelectTrigger className="bg-secondary border-border">
          <SelectValue placeholder={disabled ? 'Select previous first' : 'None'} />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          <SelectItem value="none">None</SelectItem>
          {options.map(o => (
            <SelectItem key={o.id} value={o.id}>
              {o.name ?? o.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Define group combinations (A › B › C › D) that can be assigned to documents.
        </p>
        {canCreate && (
          <Button onClick={openCreate} className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
            <Plus className="h-4 w-4" /> New Group Combo
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className="text-xs">A</TableHead>
              <TableHead className="text-xs">B</TableHead>
              <TableHead className="text-xs">C</TableHead>
              <TableHead className="text-xs">D</TableHead>
              <TableHead className="w-24">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                  No group combinations defined.
                </TableCell>
              </TableRow>
            ) : (
              items.map(item => (
                <TableRow key={item.id} className="border-border/40 hover:bg-secondary/50">
                  <TableCell className="text-sm text-foreground font-medium">
                    {item.groupAName ?? <span className="text-muted-foreground italic">—</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.groupBName ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.groupCName ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.groupDName ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          onClick={() => openEdit(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => onDelete(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingId ? 'Edit Group Combo' : 'New Group Combo'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <p className="text-xs text-muted-foreground">Group A is required. B, C, D are optional and cascade.</p>
            {groupSelect(
              'Group A *',
              aId,
              v => {
                setAId(v)
                setBId('')
                setCId('')
                setDId('')
              },
              groupAOptions,
            )}
            {groupSelect(
              'Group B',
              bId,
              v => {
                setBId(v)
                setCId('')
                setDId('')
              },
              groupBOptions,
              !aId,
            )}
            {groupSelect(
              'Group C',
              cId,
              v => {
                setCId(v)
                setDId('')
              },
              groupCOptions,
              !bId,
            )}
            {groupSelect('Group D', dId, setDId, groupDOptions, !cId)}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !isValid}
              className="bg-accent text-accent-foreground hover:bg-accent/80">
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SimpleGroupTab — reused for A, B, C, D, and Status
// ════════════════════════════════════════════════════════════════════════════

interface SimpleItem {
  id: string
  name: string | null
  createdByName: string
  createdAt: string
  deleted: boolean
  deletedAt: string | null
  deletedByName: string | null
}

function SimpleGroupTab({
  title,
  items,
  isAdmin,
  canEdit,
  canCreate,
  canDelete,
  onCreate,
  onUpdate,
  onSoftDelete,
  onHardDelete,
  onRestore,
}: {
  title: string
  items: SimpleItem[]
  isAdmin: boolean
  canEdit: boolean
  canCreate: boolean
  canDelete: boolean
  onCreate: (name: string | null) => Promise<void>
  onUpdate: (id: string, name: string | null) => Promise<void>
  onSoftDelete: (id: string) => Promise<void>
  onHardDelete: (id: string) => Promise<void>
  onRestore: (id: string) => Promise<void>
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SimpleItem | null>(null)
  const [formName, setFormName] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')

  function openCreate() {
    setEditingItem(null)
    setFormName('')
    setDialogOpen(true)
  }
  function openEdit(item: SimpleItem) {
    setEditingItem(item)
    setFormName(item.name ?? '')
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editingItem) await onUpdate(editingItem.id, formName.trim() || null)
      else await onCreate(formName.trim() || null)
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const visible = items.filter(i =>
    filterDeleted === 'all' ? true : filterDeleted === 'deleted' ? i.deleted : !i.deleted,
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
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
        {canCreate && (
          <Button onClick={openCreate} className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
            <Plus className="h-4 w-4" /> New {title}
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Created By</TableHead>
              <TableHead className="text-xs">Created At</TableHead>
              {filterDeleted !== 'not-deleted' && (
                <>
                  <TableHead className="text-xs">Deleted At</TableHead>
                  <TableHead className="text-xs">Deleted By</TableHead>
                </>
              )}
              <TableHead className="w-24">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                  No {title.toLowerCase()} entries found.
                </TableCell>
              </TableRow>
            ) : (
              visible.map(item => (
                <TableRow
                  key={item.id}
                  className={`border-border/40 hover:bg-secondary/50 ${item.deleted ? 'opacity-50' : ''}`}>
                  <TableCell className="text-sm text-foreground font-medium">
                    {item.name ?? <span className="italic text-muted-foreground">Unnamed</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {item.createdByName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(item.createdAt)}
                  </TableCell>
                  {filterDeleted !== 'not-deleted' && (
                    <>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(item.deletedAt)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {item.deletedByName ?? '-'}
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {!item.deleted && canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          onClick={() => openEdit(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {!item.deleted && canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onSoftDelete(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {item.deleted && canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          onClick={() => onRestore(item.id)}>
                          Restore
                        </Button>
                      )}
                      {item.deleted && isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => onHardDelete(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingItem ? `Edit ${title}` : `New ${title}`}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Name</Label>
              <Input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Enter name…"
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-accent text-accent-foreground hover:bg-accent/80">
              {saving ? 'Saving…' : editingItem ? 'Save Changes' : `Create ${title}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PlaceTab
// ════════════════════════════════════════════════════════════════════════════

function PlaceTab({
  items,
  isAdmin,
  canEdit,
  canCreate,
  canDelete,
  onCreate,
  onUpdate,
  onSoftDelete,
  onHardDelete,
  onRestore,
}: {
  items: MappedDocumentPlace[]
  isAdmin: boolean
  canEdit: boolean
  canCreate: boolean
  canDelete: boolean
  onCreate: (h: string, s: string | null) => Promise<void>
  onUpdate: (id: string, h: string, s: string | null) => Promise<void>
  onSoftDelete: (id: string) => Promise<void>
  onHardDelete: (id: string) => Promise<void>
  onRestore: (id: string) => Promise<void>
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MappedDocumentPlace | null>(null)
  const [formHead, setFormHead] = useState('')
  const [formSub, setFormSub] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')

  function openCreate() {
    setEditingItem(null)
    setFormHead('')
    setFormSub('')
    setDialogOpen(true)
  }
  function openEdit(item: MappedDocumentPlace) {
    setEditingItem(item)
    setFormHead(item.headFolder)
    setFormSub(item.subFolder ?? '')
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editingItem) await onUpdate(editingItem.id, formHead.trim(), formSub.trim() || null)
      else await onCreate(formHead.trim(), formSub.trim() || null)
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const visible = items.filter(i =>
    filterDeleted === 'all' ? true : filterDeleted === 'deleted' ? i.deleted : !i.deleted,
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
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
        {canCreate && (
          <Button onClick={openCreate} className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
            <Plus className="h-4 w-4" /> New Place
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className="text-xs">Head Folder</TableHead>
              <TableHead className="text-xs">Sub Folder</TableHead>
              <TableHead className="text-xs">Created By</TableHead>
              <TableHead className="text-xs">Created At</TableHead>
              {filterDeleted !== 'not-deleted' && (
                <>
                  <TableHead className="text-xs">Deleted At</TableHead>
                  <TableHead className="text-xs">Deleted By</TableHead>
                </>
              )}
              <TableHead className="w-24">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                  No places found.
                </TableCell>
              </TableRow>
            ) : (
              visible.map(item => (
                <TableRow
                  key={item.id}
                  className={`border-border/40 hover:bg-secondary/50 ${item.deleted ? 'opacity-50' : ''}`}>
                  <TableCell className="text-sm text-foreground font-medium whitespace-nowrap">
                    {item.headFolder}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {item.subFolder ?? <span className="italic">—</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {item.createdByName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(item.createdAt)}
                  </TableCell>
                  {filterDeleted !== 'not-deleted' && (
                    <>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(item.deletedAt)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {item.deletedByName ?? '-'}
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {!item.deleted && canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          onClick={() => openEdit(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {!item.deleted && canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onSoftDelete(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {item.deleted && canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          onClick={() => onRestore(item.id)}>
                          Restore
                        </Button>
                      )}
                      {item.deleted && isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => onHardDelete(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingItem ? 'Edit Place' : 'New Place'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Head Folder *</Label>
              <Input
                value={formHead}
                onChange={e => setFormHead(e.target.value)}
                placeholder="e.g. Quality"
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Sub Folder</Label>
              <Input
                value={formSub}
                onChange={e => setFormSub(e.target.value)}
                placeholder="e.g. Procedures (optional)"
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formHead.trim()}
              className="bg-accent text-accent-foreground hover:bg-accent/80">
              {saving ? 'Saving…' : editingItem ? 'Save Changes' : 'Create Place'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
