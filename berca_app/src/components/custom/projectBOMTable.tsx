'use client'

import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import type {Route} from 'next'
import {Search, Plus, Trash2, ChevronDown, ChevronUp, ExternalLink} from 'lucide-react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Switch} from '@/components/ui/switch'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import type {MappedProjectBOM, ProjectOption} from '@/types/projectBOM'
import {
  createProjectBOMAction,
  softDeleteProjectBOMAction,
  hardDeleteProjectBOMAction,
  undeleteProjectBOMAction,
  searchProjectsAction,
} from '@/serverFunctions/projectBOM'

type SortField = 'description' | 'project' | 'structureCount' | 'startDate' | 'createdAt' | 'createdBy'
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

// ─── Create dialog ─────────────────────────────────────────────────────────────
interface CreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultProjectId?: string
  onSaved: () => void
}

function CreateProjectBOMDialog({open, onOpenChange, defaultProjectId, onSaved}: CreateDialogProps) {
  const [description, setDescription] = useState('')
  const [parentPart, setParentPart] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState('')
  const [closed, setClosed] = useState(false)
  const [materialClosed, setMaterialClosed] = useState(false)
  const [readyForPurchase, setReadyForPurchase] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Project search
  const [projectQuery, setProjectQuery] = useState('')
  const [projectResults, setProjectResults] = useState<ProjectOption[]>([])
  const [projectSearching, setProjectSearching] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ProjectOption | null>(null)

  function resetForm() {
    setDescription('')
    setParentPart('')
    setAdditionalInfo('')
    setStartDate(new Date().toISOString().slice(0, 10))
    setEndDate('')
    setClosed(false)
    setMaterialClosed(false)
    setReadyForPurchase(false)
    setErrors({})
    setProjectQuery('')
    setProjectResults([])
    setSelectedProject(null)
  }

  const handleOpenChange = (v: boolean) => {
    if (v) resetForm()
    onOpenChange(v)
  }

  // Search projects whenever query changes (only when dialog is open)
  useEffect(() => {
    if (!open) return
    setProjectSearching(true)
    searchProjectsAction(projectQuery)
      .then(setProjectResults)
      .finally(() => setProjectSearching(false))
  }, [projectQuery, open])

  async function handleSubmit() {
    const e: Record<string, string> = {}
    if (!selectedProject && !defaultProjectId) e.project = 'Please select a project.'
    if (!startDate) e.startDate = 'Start date is required.'
    if (Object.keys(e).length > 0) {
      setErrors(e)
      return
    }
    setSaving(true)
    try {
      await createProjectBOMAction({
        projectId: selectedProject?.id ?? defaultProjectId!,
        description: description.trim() || null,
        parentPart: parentPart.trim() || null,
        additionalInfo: additionalInfo.trim() || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        closed,
        materialClosed,
        readyForPurchase,
      })
      onSaved()
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">New Project BOM</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          {/* Project search — hidden if projectId is fixed by route */}
          {!defaultProjectId && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Project *</Label>
              {selectedProject ? (
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm text-foreground font-medium">
                      {selectedProject.projectName ?? selectedProject.id}
                    </span>
                    {selectedProject.projectNumber && (
                      <span className="text-xs text-muted-foreground">{selectedProject.projectNumber}</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
                    onClick={() => setSelectedProject(null)}>
                    Change
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    value={projectQuery}
                    onChange={e => {
                      setProjectQuery(e.target.value)
                      setErrors(prev => ({...prev, project: ''}))
                    }}
                    placeholder="Search by name or number…"
                    className={`bg-secondary border-border ${errors.project ? 'border-destructive' : ''}`}
                    autoFocus
                  />
                  {errors.project && <p className="text-xs text-destructive">{errors.project}</p>}
                  <div className="flex flex-col gap-1 max-h-40 overflow-y-auto rounded-lg border border-border bg-secondary/30">
                    {projectSearching ? (
                      <p className="text-xs text-muted-foreground px-3 py-3 text-center">Searching…</p>
                    ) : projectResults.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-3 py-3 text-center">No projects found.</p>
                    ) : (
                      projectResults.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedProject(p)}
                          className="flex flex-col gap-0.5 px-3 py-2 text-left hover:bg-secondary/80 transition-colors border-b border-border/40 last:border-0">
                          <span className="text-sm text-foreground font-medium">{p.projectName ?? p.id}</span>
                          {p.projectNumber && <span className="text-xs text-muted-foreground">{p.projectNumber}</span>}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="BOM description…"
                className="bg-secondary border-border"
                autoFocus={!!defaultProjectId}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Parent Part</Label>
              <Input
                value={parentPart}
                onChange={e => setParentPart(e.target.value)}
                placeholder="Parent part…"
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Start Date *</Label>
              <Input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value)
                  setErrors(prev => ({...prev, startDate: ''}))
                }}
                className={`bg-secondary border-border ${errors.startDate ? 'border-destructive' : ''}`}
              />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Additional Info</Label>
              <Input
                value={additionalInfo}
                onChange={e => setAdditionalInfo(e.target.value)}
                placeholder="Additional info…"
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {(
              [
                {label: 'Closed', value: closed, onChange: setClosed},
                {label: 'Material Closed', value: materialClosed, onChange: setMaterialClosed},
                {label: 'Ready for Purchase', value: readyForPurchase, onChange: setReadyForPurchase},
              ] as {label: string; value: boolean; onChange: (v: boolean) => void}[]
            ).map(({label, value, onChange}) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Switch checked={value} onCheckedChange={onChange} />
              </div>
            ))}
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
            {saving ? 'Creating…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Table ─────────────────────────────────────────────────────────────────────
interface ProjectBOMTableProps {
  initialBOMs: MappedProjectBOM[]
  currentUserRole: string
  currentUserLevel: number
  /** Pass when the table is scoped to a specific project (e.g. from a project detail page) */
  projectId?: string
  departmentId: string
}

const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

export function ProjectBOMTable({
  initialBOMs,
  currentUserRole,
  currentUserLevel,
  projectId,
  departmentId,
}: ProjectBOMTableProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canCreate = currentUserLevel >= 60
  const canDelete = currentUserLevel >= 80

  const [search, setSearch] = useState('')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [dialogOpen, setDialogOpen] = useState(false)

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
      return (
        bom.description?.toLowerCase().includes(q) ||
        bom.parentPart?.toLowerCase().includes(q) ||
        bom.projectName?.toLowerCase().includes(q) ||
        bom.projectNumber?.toLowerCase().includes(q) ||
        bom.createdByName.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const s = (x: string, y: string) => dir * x.localeCompare(y)
      switch (sortField) {
        case 'description':
          return s(a.description ?? '', b.description ?? '')
        case 'project':
          return s(a.projectName ?? '', b.projectName ?? '')
        case 'structureCount':
          return dir * (a.structureCount - b.structureCount)
        case 'startDate':
          return s(a.startDate, b.startDate)
        case 'createdAt':
          return s(a.createdAt, b.createdAt)
        case 'createdBy':
          return s(a.createdByName, b.createdByName)
        default:
          return 0
      }
    })

  const showDeletedCols = filterDeleted !== 'not-deleted'

  async function handleSoftDelete(bom: MappedProjectBOM) {
    await softDeleteProjectBOMAction({id: bom.id})
    router.refresh()
  }
  async function handleHardDelete(bom: MappedProjectBOM) {
    await hardDeleteProjectBOMAction({id: bom.id})
    router.refresh()
  }
  async function handleUndelete(bom: MappedProjectBOM) {
    await undeleteProjectBOMAction({id: bom.id})
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
              placeholder="Search description, project…"
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
            onClick={() => setDialogOpen(true)}
            className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
            <Plus className="h-4 w-4" /> New BOM
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <Th field="description" label="Description" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="project" label="Project" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <TableHead className="whitespace-nowrap text-xs">Parent Part</TableHead>
              <Th
                field="structureCount"
                label="Structures"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="startDate" label="Start Date" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <TableHead className="whitespace-nowrap text-xs">End Date</TableHead>
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
                <TableCell colSpan={showDeletedCols ? 12 : 10} className="h-32 text-center text-muted-foreground">
                  No BOMs found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(bom => (
                <TableRow
                  key={bom.id}
                  className={`border-border/40 hover:bg-secondary/50 ${bom.deleted ? 'opacity-50' : ''}`}>
                  <TableCell className={`${tdClass} text-foreground font-medium`}>
                    <Link
                      href={`/departments/${departmentId}/projectBom/${bom.id}` as Route}
                      className="hover:text-accent hover:underline transition-colors">
                      {bom.description ?? '—'}
                    </Link>
                  </TableCell>
                  <TableCell className={tdClass}>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-foreground text-sm">{bom.projectName ?? '—'}</span>
                      {bom.projectNumber && <span className="text-xs text-muted-foreground">{bom.projectNumber}</span>}
                    </div>
                  </TableCell>
                  <TableCell className={tdClass}>{bom.parentPart ?? '—'}</TableCell>
                  <TableCell className={tdClass}>
                    <Badge variant="secondary" className="text-xs">
                      {bom.structureCount}
                    </Badge>
                  </TableCell>
                  <TableCell className={tdClass}>{formatDate(bom.startDate)}</TableCell>
                  <TableCell className={tdClass}>{formatDate(bom.endDate)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {bom.closed && (
                        <Badge variant="secondary" className="text-xs">
                          Closed
                        </Badge>
                      )}
                      {bom.materialClosed && (
                        <Badge variant="secondary" className="text-xs">
                          Mat. Closed
                        </Badge>
                      )}
                      {bom.readyForPurchase && (
                        <Badge className="bg-accent/15 text-accent border-0 text-xs">Ready</Badge>
                      )}
                      {!bom.closed && !bom.materialClosed && !bom.readyForPurchase && (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </div>
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
                      <Link href={`/departments/${departmentId}/projectBom/${bom.id}` as Route}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10"
                          title="Open">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
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
                              size="sm"
                              className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary px-2"
                              onClick={() => handleUndelete(bom)}>
                              Restore
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-muted-foreground">
        Showing {filtered.length} of {initialBOMs.length} BOMs
      </div>

      <CreateProjectBOMDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultProjectId={projectId}
        onSaved={() => router.refresh()}
      />
    </div>
  )
}
