'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowLeft, Pencil, X, Save, Plus, Trash2} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {Badge} from '@/components/ui/badge'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
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
}

export function ProjectBOMDetail({
  bom,
  materialOptions,
  currentUserLevel,
  currentUserRole,
  departmentId,
}: ProjectBOMDetailProps) {
  const router = useRouter()
  const canEdit = currentUserLevel >= 40
  const canCreate = currentUserLevel >= 60
  const canDelete = currentUserLevel >= 80
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  // ─── Header editing ──────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editDescription, setEditDescription] = useState(bom.description ?? '')
  const [editParentPart, setEditParentPart] = useState(bom.parentPart ?? '')
  const [editAdditionalInfo, setEditAdditionalInfo] = useState(bom.additionalInfo ?? '')
  const [editStartDate, setEditStartDate] = useState(bom.startDate.slice(0, 10))
  const [editEndDate, setEditEndDate] = useState(bom.endDate?.slice(0, 10) ?? '')
  const [editClosed, setEditClosed] = useState(bom.closed)
  const [editMaterialClosed, setEditMaterialClosed] = useState(bom.materialClosed)
  const [editReadyForPurchase, setEditReadyForPurchase] = useState(bom.readyForPurchase)

  async function handleSave() {
    setSaving(true)
    try {
      await updateProjectBOMAction({
        id: bom.id,
        description: editDescription.trim() || null,
        parentPart: editParentPart.trim() || null,
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
    setEditParentPart(bom.parentPart ?? '')
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
            <h1 className="text-lg font-semibold text-foreground">{bom.description ?? 'Project BOM'}</h1>
            <p className="text-sm text-muted-foreground">
              {bom.structureCount} structure{bom.structureCount !== 1 ? 's' : ''}
              {bom.parentPart ? ` · ${bom.parentPart}` : ''}
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

          {/* Parent Part */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Parent Part</Label>
            {editing ? (
              <Input
                value={editParentPart}
                onChange={e => setEditParentPart(e.target.value)}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{bom.parentPart ?? '—'}</p>
            )}
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
            {canCreate && (
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
            )}
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
                        <span className="text-xs text-muted-foreground font-normal">{s.materialBeNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell className={tdClass}>{s.shortDescription ?? '—'}</TableCell>
                    <TableCell className={tdClass}>{s.tag ?? '—'}</TableCell>
                    <TableCell className={tdClass}>{s.requiredQuantity ?? '—'}</TableCell>
                    <TableCell className={tdClass}>{s.reservedQuantity ?? '—'}</TableCell>
                    <TableCell className={tdClass}>{s.issuedQuantity ?? '—'}</TableCell>
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
