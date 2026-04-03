'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import type {Route} from 'next'
import {ArrowLeft, Pencil, X, Save, Trash2, GitBranch, Layers} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {Badge} from '@/components/ui/badge'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import type {MappedPurchaseBOM, MappedPurchaseBOMStructure, BomMaterialOption} from '@/types/purchaseBom'
import {
  updatePurchaseBOMAction,
  softDeletePurchaseBOMStructureAction,
  hardDeletePurchaseBOMStructureAction,
  restorePurchaseBOMStructureAction,
} from '@/serverFunctions/purchaseBoms'
import {PurchaseBOMStructureFormDialog} from '@/components/custom/purchaseBomStructureFormDialog'

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

const thClass = 'whitespace-nowrap text-xs'
const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

interface PurchaseBOMDetailProps {
  bom: MappedPurchaseBOM
  materialOptions: BomMaterialOption[]
  currentUserLevel: number
  currentUserRole: string
  departmentId: string
  allBOMs?: MappedPurchaseBOM[]
}

export function PurchaseBOMDetail({
  bom,
  materialOptions,
  currentUserLevel,
  currentUserRole,
  departmentId,
  allBOMs = [],
}: PurchaseBOMDetailProps) {
  const router = useRouter()
  const canEdit = currentUserLevel >= 40
  const canDelete = currentUserLevel >= 80
  const canEditNumber = currentUserLevel >= 80
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  // ─── Header editing (BOM metadata — purchase side CAN edit these) ────────────
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editDescription, setEditDescription] = useState(bom.description ?? '')
  const [editShortDescription, setEditShortDescription] = useState(bom.shortDescription ?? '')
  const [editPurchaseBomNumber, setEditPurchaseBomNumber] = useState(bom.purchaseBomNumber ?? '')
  const [editParentBomId, setEditParentBomId] = useState<string>(bom.purchaseBomId ?? 'none')
  const [editAdditionalInfo, setEditAdditionalInfo] = useState(bom.additionalInfo ?? '')
  const [editStartDate, setEditStartDate] = useState(bom.startDate.slice(0, 10))
  const [editEndDate, setEditEndDate] = useState(bom.endDate?.slice(0, 10) ?? '')
  const [editClosed, setEditClosed] = useState(bom.closed)
  const [editMaterialClosed, setEditMaterialClosed] = useState(bom.materialClosed)

  const parentBomOptions = allBOMs.filter(b => b.id !== bom.id)
  const parentBom = allBOMs.find(b => b.id === bom.purchaseBomId) ?? null

  async function handleSave() {
    setSaving(true)
    try {
      await updatePurchaseBOMAction({
        id: bom.id,
        description: editDescription.trim() || null,
        shortDescription: editShortDescription.trim(),
        purchaseBomId: editParentBomId !== 'none' ? editParentBomId : null,
        purchaseBomNumber: editPurchaseBomNumber.trim(),
        additionalInfo: editAdditionalInfo.trim() || null,
        startDate: new Date(editStartDate),
        endDate: editEndDate ? new Date(editEndDate) : null,
        closed: editClosed,
        materialClosed: editMaterialClosed,
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
    setEditPurchaseBomNumber(bom.purchaseBomNumber ?? '')
    setEditParentBomId(bom.purchaseBomId ?? 'none')
    setEditAdditionalInfo(bom.additionalInfo ?? '')
    setEditStartDate(bom.startDate.slice(0, 10))
    setEditEndDate(bom.endDate?.slice(0, 10) ?? '')
    setEditClosed(bom.closed)
    setEditMaterialClosed(bom.materialClosed)
    setEditing(false)
  }

  // ─── Structure execution edit dialog ─────────────────────────────────────────
  // NOTE: the dialog only shows execution fields (reservedQty, issuedQty).
  // All structural fields (material, description, qty, etc.) are read-only.
  const [structureDialogOpen, setStructureDialogOpen] = useState(false)
  const [editingStructure, setEditingStructure] = useState<MappedPurchaseBOMStructure | null>(null)

  // ─── Filters ─────────────────────────────────────────────────────────────────
  type StructureFilter = 'active' | 'deleted' | 'all'
  type ChildFilter = 'active' | 'deleted' | 'all'
  const [structureFilter, setStructureFilter] = useState<StructureFilter>('active')
  const [childFilter, setChildFilter] = useState<ChildFilter>('active')

  async function handleDeleteStructure(s: MappedPurchaseBOMStructure) {
    await softDeletePurchaseBOMStructureAction({id: s.id})
    router.refresh()
  }
  async function handleHardDeleteStructure(s: MappedPurchaseBOMStructure) {
    await hardDeletePurchaseBOMStructureAction({id: s.id})
    router.refresh()
  }
  async function handleRestoreStructure(s: MappedPurchaseBOMStructure) {
    await restorePurchaseBOMStructureAction({id: s.id})
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
              {bom.description ?? bom.shortDescription ?? 'Purchase BOM'}
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              {bom.purchaseBomNumber}
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
              BOM Number
              {!canEditNumber && editing && <span className="ml-1.5 text-muted-foreground/60">(locked)</span>}
            </Label>
            {editing && canEditNumber ? (
              <Input
                value={editPurchaseBomNumber}
                onChange={e => setEditPurchaseBomNumber(e.target.value)}
                className="bg-secondary border-border font-mono"
              />
            ) : (
              <p className="text-sm text-muted-foreground font-mono">{bom.purchaseBomNumber || '—'}</p>
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
                      {b.purchaseBomNumber}
                      {b.description ? ` — ${b.description}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : parentBom ? (
              <Link
                href={`/departments/${departmentId}/purchaseBom/${parentBom.id}` as Route}
                className="text-sm font-mono text-muted-foreground hover:text-accent hover:underline transition-colors w-fit">
                {parentBom.purchaseBomNumber}
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
            </TabsList>
          </div>

          {/* ── Structures ─────────────────────────────────────────────────── */}
          <TabsContent value="structures" className="p-4 pt-3">
            {/* info banner: structures are auto-synced from project side */}
            <div className="mb-3 rounded-lg border border-border/40 bg-secondary/30 px-3 py-2 text-xs text-muted-foreground/70">
              Structures are automatically synced from the Project BOM when marked as Ready for Purchase. Only execution
              quantities can be edited here.
            </div>

            <div className="flex items-center justify-between mb-3">
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
              {/* No "Add Structure" button — structures come from project side only */}
            </div>

            {visibleStructures.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No structures found. Structures appear here when marked Ready for Purchase on the Project BOM.
              </p>
            ) : (
              <div className="rounded-lg border border-border/60 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/60">
                      {/* Read-only structural columns */}
                      <TableHead className={thClass}>Material</TableHead>
                      <TableHead className={thClass}>Short Desc.</TableHead>
                      <TableHead className={thClass}>Tag</TableHead>
                      <TableHead className={thClass}>Req. Qty</TableHead>
                      <TableHead className={thClass}>Ready</TableHead>
                      <TableHead className={thClass}>Not Deliv.</TableHead>
                      <TableHead className={thClass}>Ready Date</TableHead>
                      {/* Editable execution columns */}
                      <TableHead className={`${thClass} border-l border-border/40`}>Res. Qty</TableHead>
                      <TableHead className={thClass}>Issued Qty</TableHead>
                      {/* Meta */}
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
                        {/* Read-only structural cells */}
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
                          {s.notDeliverable ? (
                            <Badge className="text-xs text-red-600 bg-red-600/15 border-0">Yes</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs text-muted-foreground/60">
                              No
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className={tdClass}>{formatDate(s.readyForPurchaseDate)}</TableCell>
                        {/* Editable execution cells */}
                        <TableCell className={`${tdClass} border-l border-border/40`}>
                          {s.reservedQuantity ?? '—'}
                        </TableCell>
                        <TableCell className={tdClass}>{s.issuedQuantity ?? '—'}</TableCell>
                        {/* Meta */}
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
                                    title="Edit execution quantities"
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
                    href={`/departments/${departmentId}/purchaseBom/${child.id}` as Route}
                    className={`flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-4 py-3 hover:bg-secondary/70 transition-colors group ${child.deleted ? 'opacity-50' : ''}`}>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground font-mono group-hover:text-accent transition-colors">
                        {child.purchaseBomNumber}
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

      {/* Execution-only edit dialog */}
      <PurchaseBOMStructureFormDialog
        open={structureDialogOpen}
        onOpenChange={setStructureDialogOpen}
        structure={editingStructure}
        purchaseBOMId={bom.id}
        materialOptions={materialOptions}
      />
    </div>
  )
}
