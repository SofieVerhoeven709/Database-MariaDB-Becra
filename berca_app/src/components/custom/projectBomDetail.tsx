'use client'

import {useRef, useState} from 'react'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import type {Route} from 'next'
import {ArrowLeft, Pencil, X, Save, Plus, Trash2, GitBranch, Layers, Download, Upload, Network} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {Badge} from '@/components/ui/badge'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {MappedProjectBOM, MappedProjectBOMStructure, BomMaterialOption, ProjectOptionBom} from '@/types/projectBom'
import {
  updateProjectBOMAction,
  softDeleteProjectBOMStructureAction,
  hardDeleteProjectBOMStructureAction,
  restoreProjectBOMStructureAction,
  importProjectBOMStructureRowsAction,
} from '@/serverFunctions/projectBoms'
import {ProjectBOMStructureFormDialog} from '@/components/custom/projectBomStructureFormDialog'
import {buildCsv, downloadCsv, isTruthyCsvValue, parseCsv} from '@/lib/csv'

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

const thClass = 'whitespace-nowrap text-xs'
const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

interface ProjectBOMDetailProps {
  bom: MappedProjectBOM
  materialOptions: BomMaterialOption[]
  currentUserLevel: number
  currentUserRole: string
  currentUserId: string
  departmentId: string
  allBOMs?: MappedProjectBOM[]
  project: ProjectOptionBom
}

export function ProjectBOMDetail({
  bom,
  materialOptions,
  currentUserLevel,
  currentUserRole,
  currentUserId,
  departmentId,
  project,
  allBOMs = [],
}: ProjectBOMDetailProps) {
  const router = useRouter()
  const canEdit = currentUserLevel >= 40
  const canCreate = currentUserLevel >= 60
  const canDelete = currentUserLevel >= 80
  const canEditNumber = currentUserLevel >= 80
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  const currentEmployee = project.ProjectEmployee.find(pe => pe.employeeId === currentUserId) ?? null
  let isProjectManager = false
  let isProjectSupervisor = false

  if (currentEmployee) {
    isProjectManager = currentEmployee.manager
    isProjectSupervisor = currentEmployee.supervisor
  }

  // ─── Header editing ──────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editDescription, setEditDescription] = useState(bom.description ?? '')
  const [editShortDescription, setEditShortDescription] = useState(bom.shortDescription ?? '')
  const [editProjectBomNumber, setEditProjectBomNumber] = useState(bom.projectBomNumber ?? '')
  const [editParentBomId, setEditParentBomId] = useState<string>(bom.projectBomId ?? 'none')
  const [editAdditionalInfo, setEditAdditionalInfo] = useState(bom.additionalInfo ?? '')
  const [editStartDate, setEditStartDate] = useState(bom.startDate.slice(0, 10))
  const [editEndDate, setEditEndDate] = useState(bom.endDate?.slice(0, 10) ?? '')
  const [editClosed, setEditClosed] = useState(bom.closed)
  const [editMaterialClosed, setEditMaterialClosed] = useState(bom.materialClosed)
  const [editReadyForPurchase, setEditReadyForPurchase] = useState(bom.readyForPurchase)
  const [editCanCopy, setEditCanCopy] = useState(bom.canCopy)

  const parentBomOptions = allBOMs.filter(b => b.id !== bom.id)
  const parentBom = allBOMs.find(b => b.id === bom.projectBomId) ?? null

  async function handleSave() {
    setSaving(true)
    try {
      await updateProjectBOMAction({
        id: bom.id,
        projectId: bom.projectId,
        description: editDescription.trim() || null,
        shortDescription: editShortDescription.trim(),
        projectBomId: editParentBomId !== 'none' ? editParentBomId : null,
        projectBomNumber: editProjectBomNumber.trim(),
        additionalInfo: editAdditionalInfo.trim() || null,
        startDate: new Date(editStartDate),
        endDate: editEndDate ? new Date(editEndDate) : null,
        closed: editClosed,
        materialClosed: editMaterialClosed,
        readyForPurchase: editReadyForPurchase,
        canCopy: editCanCopy,
      })
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setEditDescription(bom.description ?? '')
    setEditShortDescription(bom.shortDescription ?? '')
    setEditProjectBomNumber(bom.projectBomNumber ?? '')
    setEditParentBomId(bom.projectBomId ?? 'none')
    setEditAdditionalInfo(bom.additionalInfo ?? '')
    setEditStartDate(bom.startDate.slice(0, 10))
    setEditEndDate(bom.endDate?.slice(0, 10) ?? '')
    setEditClosed(bom.closed)
    setEditMaterialClosed(bom.materialClosed)
    setEditReadyForPurchase(bom.readyForPurchase)
    setEditCanCopy(bom.canCopy)
    setEditing(false)
  }

  // ─── Structure dialog ────────────────────────────────────────────────────────
  const [structureDialogOpen, setStructureDialogOpen] = useState(false)
  const [editingStructure, setEditingStructure] = useState<MappedProjectBOMStructure | null>(null)

  // ─── Filters ─────────────────────────────────────────────────────────────────
  type StructureFilter = 'active' | 'deleted' | 'all'
  type ChildFilter = 'active' | 'deleted' | 'all'
  const [structureFilter, setStructureFilter] = useState<StructureFilter>('active')
  const [childFilter, setChildFilter] = useState<ChildFilter>('active')
  const structureUploadInputRef = useRef<HTMLInputElement>(null)

  async function handleDeleteStructure(s: MappedProjectBOMStructure) {
    await softDeleteProjectBOMStructureAction({id: s.id})
    router.refresh()
  }
  async function handleHardDeleteStructure(s: MappedProjectBOMStructure) {
    await hardDeleteProjectBOMStructureAction({id: s.id})
    router.refresh()
  }
  async function handleRestoreStructure(s: MappedProjectBOMStructure) {
    await restoreProjectBOMStructureAction({id: s.id})
    router.refresh()
  }

  const visibleStructures = bom.structures.filter(s => {
    if (structureFilter === 'active') return !s.deleted
    if (structureFilter === 'deleted') return s.deleted
    return true
  })

  const visibleChildren = bom.children.filter(c => {
    if (childFilter === 'active') return !c.deleted
    if (childFilter === 'deleted') return c.deleted
    return true
  })

  const activeStructureCount = bom.structures.filter(s => !s.deleted).length
  const activeChildCount = bom.children.filter(c => !c.deleted).length

  function handleExportStructuresCsv() {
    const headers = [
      'Material ID',
      'Material BE Number',
      'Material Name',
      'Short Description',
      'Description',
      'Additional Info',
      'Tag',
      'Required Quantity',
      'Ready For Purchase Date',
      'Ready For Purchase',
      'Reserved Quantity',
      'Issued Quantity',
    ]
    const rows = visibleStructures.map(s => [
      s.materialId,
      s.materialBeNumber,
      s.materialName,
      s.shortDescription,
      s.description,
      s.additionalInfo,
      s.tag,
      s.requiredQuantity,
      s.readyForPurchaseDate?.slice(0, 10),
      s.readyForPurchase ? 'Yes' : 'No',
      s.execStockReservedQuantity,
      s.execIssuedQuantity,
    ])
    downloadCsv(`${bom.projectBomNumber || 'project-bom'}-structures.csv`, buildCsv(headers, rows))
  }

  async function handleImportStructuresCsv(file: File | null) {
    if (!file) return
    const rows = parseCsv(await file.text()).map(row => ({
      materialId: row['Material ID'] || row.materialId || undefined,
      materialBeNumber: row['Material BE Number'] || row.materialBeNumber || row['BE Number'] || undefined,
      shortDescription: row['Short Description'] || row.shortDescription || undefined,
      description: row.Description || row.description || undefined,
      additionalInfo: row['Additional Info'] || row.additionalInfo || undefined,
      tag: row.Tag || row.tag || undefined,
      requiredQuantity: Number.parseInt(row['Required Quantity'] || row.requiredQuantity || '0', 10) || 0,
      readyForPurchaseDate: row['Ready For Purchase Date'] || row.readyForPurchaseDate || undefined,
      readyForPurchase: isTruthyCsvValue(row['Ready For Purchase'] || row.readyForPurchase),
    }))
    await importProjectBOMStructureRowsAction({projectBOMId: bom.id, rows})
    if (structureUploadInputRef.current) structureUploadInputRef.current.value = ''
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {bom.description ?? bom.shortDescription ?? 'Project BOM'}
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              {bom.projectBomNumber}
              {bom.structureCount !== undefined && (
                <span className="font-sans ml-2 text-muted-foreground/70">
                  · {bom.structureCount} structure{bom.structureCount !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        </div>
        {(canEdit || isProjectManager || isProjectSupervisor) && (
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={handleCancel} className="gap-2 border-border">
                  <X className="h-4 w-4" /> Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2 bg-accent text-accent-foreground hover:bg-accent/80">
                  <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)} variant="outline" className="gap-2 border-border">
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-border/60 bg-card p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* BOM Number */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              BOM Number
              {!canEditNumber && editing && <span className="ml-1.5 text-muted-foreground/60">(locked)</span>}
            </Label>
            {editing && canEditNumber ? (
              <Input
                value={editProjectBomNumber}
                onChange={e => setEditProjectBomNumber(e.target.value)}
                className="bg-secondary border-border font-mono"
              />
            ) : (
              <p className="text-sm text-muted-foreground font-mono">{bom.projectBomNumber || '—'}</p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Description</Label>
            {editing ? (
              <Input
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{bom.description ?? '—'}</p>
            )}
          </div>

          {/* Short Description */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Short Description</Label>
            {editing ? (
              <Input
                value={editShortDescription}
                onChange={e => setEditShortDescription(e.target.value)}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{bom.shortDescription || '—'}</p>
            )}
          </div>

          {/* Parent BOM */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Parent BOM</Label>
            {editing ? (
              <Select value={editParentBomId} onValueChange={setEditParentBomId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="none">None</SelectItem>
                  {parentBomOptions.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.projectBomNumber}
                      {b.description ? ` — ${b.description}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : parentBom ? (
              <Link
                href={`/departments/${departmentId}/projectBom/${parentBom.id}` as Route}
                className="text-sm font-mono text-muted-foreground hover:text-accent hover:underline transition-colors w-fit">
                {parentBom.projectBomNumber}
                {parentBom.description && (
                  <span className="font-sans ml-1 text-muted-foreground/70">— {parentBom.description}</span>
                )}
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>

          {/* Project */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Project</Label>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm text-muted-foreground">{bom.projectName ?? '—'}</p>
              {bom.projectNumber && <p className="text-xs text-muted-foreground/70">{bom.projectNumber}</p>}
            </div>
          </div>

          {/* Start Date */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Start Date</Label>
            {editing ? (
              <Input
                type="date"
                value={editStartDate}
                onChange={e => setEditStartDate(e.target.value)}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{formatDate(bom.startDate)}</p>
            )}
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">End Date</Label>
            {editing ? (
              <Input
                type="date"
                value={editEndDate}
                onChange={e => setEditEndDate(e.target.value)}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{formatDate(bom.endDate)}</p>
            )}
          </div>

          {/* Additional Info */}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Additional Info</Label>
            {editing ? (
              <Input
                value={editAdditionalInfo}
                onChange={e => setEditAdditionalInfo(e.target.value)}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{bom.additionalInfo ?? '—'}</p>
            )}
          </div>

          {/* Meta */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Created By</Label>
            <p className="text-sm text-muted-foreground">{bom.createdByName}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Created At</Label>
            <p className="text-sm text-muted-foreground">{formatDate(bom.createdAt)}</p>
          </div>

          {/* Toggles */}
          <div className="sm:col-span-2 lg:col-span-3 flex flex-col gap-2">
            {(
              [
                {label: 'Closed', value: editClosed, onChange: setEditClosed, current: bom.closed},
                {
                  label: 'Material Closed',
                  value: editMaterialClosed,
                  onChange: setEditMaterialClosed,
                  current: bom.materialClosed,
                },
                {
                  label: 'Ready for Purchase',
                  value: editReadyForPurchase,
                  onChange: setEditReadyForPurchase,
                  current: bom.readyForPurchase,
                },
                {label: 'Can Copy', value: editCanCopy, onChange: setEditCanCopy, current: bom.canCopy},
              ] as {label: string; value: boolean; onChange: (v: boolean) => void; current: boolean}[]
            ).map(({label, value, onChange, current}) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2 max-w-xs">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                {editing ? (
                  <Switch checked={value} onCheckedChange={onChange} />
                ) : current ? (
                  <Badge className="bg-accent/15 text-accent border-0 font-medium text-xs">Yes</Badge>
                ) : (
                  <Badge variant="secondary" className="text-muted-foreground font-medium text-xs">
                    No
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabbed section: Structures + Child BOMs ─────────────────────────── */}
      <div className="rounded-xl border border-border/60 bg-card">
        <Tabs defaultValue="structures">
          <div className="px-4 pt-4">
            <TabsList className="bg-secondary border border-border/60">
              <TabsTrigger value="structures" className="gap-1.5 text-xs">
                <Layers className="h-3.5 w-3.5" />
                Structures
                <Badge variant="secondary" className="ml-0.5 text-xs">
                  {activeStructureCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="children" className="gap-1.5 text-xs">
                <GitBranch className="h-3.5 w-3.5" />
                Child BOMs
                <Badge variant="secondary" className="ml-0.5 text-xs">
                  {activeChildCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="visual" className="gap-1.5 text-xs">
                <Network className="h-3.5 w-3.5" />
                Visual
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Structures ─────────────────────────────────────────────────── */}
          <TabsContent value="structures" className="p-4 pt-3">
            <div className="flex flex-col gap-3 mb-3 lg:flex-row lg:items-center lg:justify-between">
              <Select value={structureFilter} onValueChange={v => setStructureFilter(v as StructureFilter)}>
                <SelectTrigger className="h-7 text-xs w-[130px] bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="active" className="text-xs">
                    Active
                  </SelectItem>
                  <SelectItem value="deleted" className="text-xs">
                    Deleted
                  </SelectItem>
                  <SelectItem value="all" className="text-xs">
                    All
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportStructuresCsv}
                  disabled={visibleStructures.length === 0}
                  className="text-xs h-7 border-border gap-1">
                  <Download className="h-3.5 w-3.5" /> Download CSV
                </Button>
                {canCreate && !bom.materialClosed && (
                  <>
                    <input
                      ref={structureUploadInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={e => void handleImportStructuresCsv(e.target.files?.[0] ?? null)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 border-border gap-1"
                      onClick={() => structureUploadInputRef.current?.click()}>
                      <Upload className="h-3.5 w-3.5" /> Upload CSV
                    </Button>
                  </>
                )}
                {(canCreate || isProjectManager || isProjectSupervisor) &&
                  (bom.materialClosed ? (
                    <div className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground/60 select-none">
                      <Plus className="h-3.5 w-3.5" /> Material Closed
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 border-border gap-1"
                      onClick={() => {
                        setEditingStructure(null)
                        setStructureDialogOpen(true)
                      }}>
                      <Plus className="h-3.5 w-3.5" /> Add Structure
                    </Button>
                  ))}
              </div>
            </div>

            {visibleStructures.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No structures found.</p>
            ) : (
              <div className="rounded-lg border border-border/60 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/60">
                      <TableHead className={thClass}>Material</TableHead>
                      <TableHead className={thClass}>Short Desc.</TableHead>
                      <TableHead className={thClass}>Tag</TableHead>
                      <TableHead className={thClass}>Req. Qty</TableHead>
                      <TableHead className={thClass}>Ready</TableHead>
                      <TableHead className={thClass}>Ready Date</TableHead>
                      {/* ── Execution columns (read-only, from BOMExecution) ── */}
                      <TableHead className={thClass}>Res. Qty</TableHead>
                      <TableHead className={thClass}>Issued Qty</TableHead>
                      <TableHead className={thClass}>Not Deliv.</TableHead>
                      <TableHead className={thClass}>Not Correct</TableHead>
                      <TableHead className={thClass}>Completed</TableHead>
                      {/* ─────────────────────────────────────────────────────── */}
                      <TableHead className={thClass}>Added By</TableHead>
                      <TableHead className={thClass}>Added At</TableHead>
                      <TableHead className="w-28">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleStructures.map(s => (
                      <TableRow
                        key={s.id}
                        className={`border-border/40 hover:bg-secondary/50 ${s.deleted ? 'opacity-50' : ''}`}>
                        <TableCell className={`${tdClass} text-foreground font-medium`}>
                          <div className="flex flex-col gap-0.5">
                            <span>{s.materialName}</span>
                            <span className="text-xs text-muted-foreground font-normal font-mono">
                              {s.materialBeNumber}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className={tdClass}>{s.shortDescription ?? '—'}</TableCell>
                        <TableCell className={tdClass}>{s.tag ?? '—'}</TableCell>
                        <TableCell className={tdClass}>{s.requiredQuantity ?? '—'}</TableCell>
                        <TableCell>
                          {s.readyForPurchase ? (
                            <Badge className="bg-accent/15 text-accent border-0 text-xs">Yes</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs text-muted-foreground/60">
                              No
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className={tdClass}>{formatDate(s.readyForPurchaseDate)}</TableCell>
                        {/* ── Execution columns ── */}
                        <TableCell className={`${tdClass} border-l border-border/40`}>
                          {s.execStockReservedQuantity ?? '—'}
                        </TableCell>
                        <TableCell className={tdClass}>{s.execIssuedQuantity ?? '—'}</TableCell>
                        <TableCell>
                          {s.execNotDeliverable ? (
                            <Badge className="text-xs text-red-600 bg-red-600/15 border-0">Yes</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs text-muted-foreground/60">
                              No
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {s.execNotCorrect ? (
                            <Badge
                              className="text-xs text-amber-600 bg-amber-600/15 border-0"
                              title={s.execNotCorrectReason ?? undefined}>
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs text-muted-foreground/60">
                              No
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className={tdClass}>{formatDate(s.execCompletedDate)}</TableCell>
                        {/* ─────────────────────── */}
                        <TableCell className={tdClass}>{s.createdByName}</TableCell>
                        <TableCell className={tdClass}>{formatDate(s.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {!s.deleted && (
                              <>
                                {canEdit && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                    onClick={() => {
                                      setEditingStructure(s)
                                      setStructureDialogOpen(true)
                                    }}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                )}
                                {canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteStructure(s)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </>
                            )}
                            {s.deleted && (
                              <>
                                {canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary px-2"
                                    onClick={() => handleRestoreStructure(s)}>
                                    Restore
                                  </Button>
                                )}
                                {isAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                    title="Hard delete"
                                    onClick={() => handleHardDeleteStructure(s)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="visual" className="p-4 pt-3">
            <div className="overflow-x-auto rounded-lg border border-border/60 bg-secondary/20 p-4">
              <div className="flex min-w-max items-start gap-4">
                <div className="rounded-lg border border-border bg-card px-4 py-3">
                  <div className="text-xs text-muted-foreground">Project BOM</div>
                  <div className="mt-1 font-mono text-sm text-foreground">{bom.projectBomNumber}</div>
                  <div className="mt-1 max-w-56 text-xs text-muted-foreground">
                    {bom.shortDescription || bom.description || '—'}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="text-xs font-medium text-muted-foreground">Structures</div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {bom.structures
                      .filter(s => !s.deleted)
                      .map(s => (
                        <div key={s.id} className="rounded-lg border border-border bg-card px-3 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-mono text-xs text-foreground">{s.materialBeNumber}</span>
                            <Badge variant="secondary" className="text-xs">
                              Qty {s.requiredQuantity ?? 0}
                            </Badge>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {s.shortDescription || s.materialName}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                {bom.children.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="text-xs font-medium text-muted-foreground">Child BOMs</div>
                    {bom.children
                      .filter(child => !child.deleted)
                      .map(child => (
                        <Link
                          key={child.id}
                          href={`/departments/${departmentId}/projectBom/${child.id}` as Route}
                          className="rounded-lg border border-border bg-card px-3 py-2 hover:bg-secondary/70 transition-colors">
                          <div className="font-mono text-xs text-foreground">{child.projectBomNumber}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{child.shortDescription || '—'}</div>
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {child.structureCount} structures
                          </Badge>
                        </Link>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Child BOMs ─────────────────────────────────────────────────── */}
          <TabsContent value="children" className="p-4 pt-3">
            <div className="flex items-center justify-between mb-3">
              <Select value={childFilter} onValueChange={v => setChildFilter(v as ChildFilter)}>
                <SelectTrigger className="h-7 text-xs w-[130px] bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="active" className="text-xs">
                    Active
                  </SelectItem>
                  <SelectItem value="deleted" className="text-xs">
                    Deleted
                  </SelectItem>
                  <SelectItem value="all" className="text-xs">
                    All
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {visibleChildren.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No child BOMs found.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {visibleChildren.map(child => (
                  <Link
                    key={child.id}
                    href={`/departments/${departmentId}/projectBom/${child.id}` as Route}
                    className={`flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-4 py-3 hover:bg-secondary/70 transition-colors group ${child.deleted ? 'opacity-50' : ''}`}>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground font-mono group-hover:text-accent transition-colors">
                        {child.projectBomNumber}
                      </span>
                      {(child.description ?? child.shortDescription) && (
                        <span className="text-xs text-muted-foreground">
                          {child.description ?? child.shortDescription}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-xs">
                        {child.structureCount} structure{child.structureCount !== 1 ? 's' : ''}
                      </Badge>
                      {child.readyForPurchase && (
                        <Badge className="bg-accent/15 text-accent border-0 text-xs">Ready</Badge>
                      )}
                      {child.materialClosed && (
                        <Badge variant="secondary" className="text-xs">
                          Mat. Closed
                        </Badge>
                      )}
                      {child.closed && (
                        <Badge variant="secondary" className="text-xs">
                          Closed
                        </Badge>
                      )}
                      {child.deleted && (
                        <Badge variant="destructive" className="text-xs">
                          Deleted
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ProjectBOMStructureFormDialog
        open={structureDialogOpen}
        onOpenChange={setStructureDialogOpen}
        structure={editingStructure}
        projectBOMId={bom.id}
        materialOptions={materialOptions}
      />
    </div>
  )
}
