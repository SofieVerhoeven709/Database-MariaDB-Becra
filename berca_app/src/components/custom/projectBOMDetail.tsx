'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import type {Route} from 'next'
import {ArrowLeft, Pencil, X, Save, Plus, Trash2, GitBranch} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import type {MappedProjectBOM, MappedProjectBOMStructure, BomMaterialOption} from '@/types/projectBOM'
import {
  updateProjectBOMAction,
  softDeleteProjectBOMStructureAction,
  hardDeleteProjectBOMStructureAction,
  restoreProjectBOMStructureAction,
} from '@/serverFunctions/projectBOM'
import {ProjectBOMStructureFormDialog} from '@/components/custom/projectBOMStructureFormDialog'

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
  departmentId: string
  /** All BOMs in scope for the parent BOM selector */
  allBOMs?: MappedProjectBOM[]
}

export function ProjectBOMDetail({
  bom,
  materialOptions,
  currentUserLevel,
  currentUserRole,
  departmentId,
  allBOMs = [],
}: ProjectBOMDetailProps) {
  const router = useRouter()
  const canEdit = currentUserLevel >= 40
  const canCreate = currentUserLevel >= 60
  const canDelete = currentUserLevel >= 80
  const canEditNumber = currentUserLevel >= 80
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

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

  // Parent BOM options: all BOMs except self
  const parentBomOptions = allBOMs.filter(b => b.id !== bom.id)
  const parentBom = allBOMs.find(b => b.id === bom.projectBomId) ?? null

  async function handleSave() {
    setSaving(true)
    try {
      await updateProjectBOMAction({
        id: bom.id,
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
    setEditing(false)
  }

  // ─── Structure dialog ────────────────────────────────────────────────────────
  const [structureDialogOpen, setStructureDialogOpen] = useState(false)
  const [editingStructure, setEditingStructure] = useState<MappedProjectBOMStructure | null>(null)

  // ─── Structure filter ────────────────────────────────────────────────────────
  type StructureFilter = 'not-deleted' | 'deleted' | 'all'
  const [structureFilter, setStructureFilter] = useState<StructureFilter>('not-deleted')

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
    if (structureFilter === 'not-deleted') return !s.deleted
    if (structureFilter === 'deleted') return s.deleted
    return true
  })

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
        {canEdit && (
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
              BOM Number{!canEditNumber && editing && <span className="ml-1.5 text-muted-foreground/60">(locked)</span>}
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
            ) : (
              <p className="text-sm text-muted-foreground font-mono">
                {parentBom ? (
                  <>
                    {parentBom.projectBomNumber}
                    {parentBom.description && (
                      <span className="font-sans ml-1 text-muted-foreground/70">— {parentBom.description}</span>
                    )}
                  </>
                ) : (
                  '—'
                )}
              </p>
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

      {/* BOM Structures */}
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-foreground">
            Structures
            <Badge variant="secondary" className="ml-2 text-xs">
              {bom.structures.filter(s => !s.deleted).length}
            </Badge>
          </h2>
          <div className="flex items-center gap-2">
            <Select value={structureFilter} onValueChange={v => setStructureFilter(v as StructureFilter)}>
              <SelectTrigger className="h-7 text-xs w-[130px] bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="not-deleted" className="text-xs">
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
            {canCreate &&
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
          <p className="text-sm text-muted-foreground text-center py-4">No structures found.</p>
        ) : (
          <div className="rounded-lg border border-border/60 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className={thClass}>Material</TableHead>
                  <TableHead className={thClass}>Short Desc.</TableHead>
                  <TableHead className={thClass}>Tag</TableHead>
                  <TableHead className={thClass}>Req. Qty</TableHead>
                  <TableHead className={thClass}>Res. Qty</TableHead>
                  <TableHead className={thClass}>Issued Qty</TableHead>
                  <TableHead className={thClass}>Ready</TableHead>
                  <TableHead className={thClass}>Not Deliv.</TableHead>
                  <TableHead className={thClass}>Ready Date</TableHead>
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
                    <TableCell className={tdClass}>{s.reservedQuantity ?? '—'}</TableCell>
                    <TableCell className={tdClass}>{s.issuedQuantity ?? '—'}</TableCell>
                    <TableCell>
                      {s.readyForPurchase ? (
                        <Badge className="bg-accent/15 text-accent border-0 text-xs">Yes</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs text-muted-foreground/60">
                          No
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.notDeliverable ? (
                        <Badge variant="secondary" className="text-xs">
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs text-muted-foreground/60">
                          No
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className={tdClass}>{formatDate(s.readyForPurchaseDate)}</TableCell>
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
      </div>

      {/* Child BOMs */}
      {bom.children.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
            Child BOMs
            <Badge variant="secondary" className="text-xs">
              {bom.children.filter(c => !c.deleted).length}
            </Badge>
          </h2>
          <div className="flex flex-col gap-2">
            {bom.children
              .filter(c => !c.deleted)
              .map(child => (
                <Link
                  key={child.id}
                  href={`/departments/${departmentId}/projectBom/${child.id}` as Route}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-4 py-3 hover:bg-secondary/70 transition-colors group">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground font-mono group-hover:text-accent transition-colors">
                      {child.projectBomNumber}
                    </span>
                    {child.description && <span className="text-xs text-muted-foreground">{child.description}</span>}
                  </div>
                  <div className="flex items-center gap-2">
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
                  </div>
                </Link>
              ))}
            {bom.children.some(c => c.deleted) && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                {bom.children.filter(c => c.deleted).length} deleted child BOM(s) not shown.
              </p>
            )}
          </div>
        </div>
      )}

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
