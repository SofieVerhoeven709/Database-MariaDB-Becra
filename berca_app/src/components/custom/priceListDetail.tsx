'use client'

import {useState, useEffect, useRef} from 'react'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import type {Route} from 'next'
import {ArrowLeft, Pencil, X, Save, Plus, Trash2, ExternalLink} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {Badge} from '@/components/ui/badge'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import type {MappedPriceList, MappedPriceListItem, UnassignedProjectOption} from '@/types/priceList'
import {
  updatePriceListAction,
  createPriceListItemAction,
  updatePriceListItemAction,
  softDeletePriceListItemAction,
  hardDeletePriceListItemAction,
  restorePriceListItemAction,
  assignProjectToPriceListAction,
  unassignProjectFromPriceListAction,
} from '@/serverFunctions/priceLists'

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function formatPrice(value: number, isCostMargin: boolean) {
  if (isCostMargin) return `${value}%`
  return `€${value.toFixed(2)}`
}

const thClass = 'whitespace-nowrap text-xs'
const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

// ─── Item form dialog ──────────────────────────────────────────────────────────
interface ItemDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  priceListId: string
  item: MappedPriceListItem | null // null = create
  isCostMargin?: boolean
  onSaved: () => void
}

function ItemDialog({open, onOpenChange, priceListId, item, isCostMargin = false, onSaved}: ItemDialogProps) {
  const [description, setDescription] = useState('')
  const [unit, setUnit] = useState('')
  const [price, setPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form whenever the dialog opens, keyed off the current item/mode
  const prevOpenRef = useRef(false)
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      const isMargin = item?.isCostMargin ?? isCostMargin
      setDescription(isMargin ? 'Cost Margin' : (item?.description ?? ''))
      setUnit(isMargin ? '%' : (item?.unit ?? ''))
      setPrice(item ? String(item.price) : '0')
      setErrors({})
    }
    prevOpenRef.current = open
  }, [open, item, isCostMargin])

  function validate() {
    const e: Record<string, string> = {}
    if (!description.trim()) e.description = 'Required'
    if (!unit.trim()) e.unit = 'Required'
    const p = parseFloat(price)
    if (isNaN(p) || p < 0) e.price = 'Must be a non-negative number'
    return e
  }

  async function handleSubmit() {
    const e = validate()
    if (Object.keys(e).length > 0) {
      setErrors(e)
      return
    }
    setSaving(true)
    try {
      if (item) {
        await updatePriceListItemAction({
          id: item.id,
          description: description.trim(),
          unit: unit.trim(),
          price: parseFloat(price),
        })
      } else {
        await createPriceListItemAction({
          priceListId,
          description: description.trim(),
          unit: unit.trim(),
          price: parseFloat(price),
          isCostMargin,
        })
      }
      onSaved()
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const isEditingCostMargin = item?.isCostMargin ?? isCostMargin
  const title = item ? (isEditingCostMargin ? 'Edit Cost Margin' : 'Edit Item') : 'Add Item'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Description *</Label>
            <Input
              value={description}
              onChange={e => {
                setDescription(e.target.value)
                setErrors(prev => ({...prev, description: ''}))
              }}
              disabled={isEditingCostMargin}
              className={`bg-secondary border-border ${errors.description ? 'border-destructive' : ''} ${isEditingCostMargin ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Unit *</Label>
            <Input
              value={unit}
              onChange={e => {
                setUnit(e.target.value)
                setErrors(prev => ({...prev, unit: ''}))
              }}
              disabled={isEditingCostMargin}
              className={`bg-secondary border-border ${errors.unit ? 'border-destructive' : ''} ${isEditingCostMargin ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
            {errors.unit && <p className="text-xs text-destructive">{errors.unit}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">{isEditingCostMargin ? 'Margin %' : 'Price (€)'} *</Label>
            <Input
              type="number"
              min="0"
              step={isEditingCostMargin ? '0.1' : '0.01'}
              value={price}
              onChange={e => {
                setPrice(e.target.value)
                setErrors(prev => ({...prev, price: ''}))
              }}
              className={`bg-secondary border-border ${errors.price ? 'border-destructive' : ''}`}
            />
            {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
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
            {saving ? 'Saving…' : item ? 'Save' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
interface PriceListDetailProps {
  priceList: MappedPriceList
  unassignedProjects: UnassignedProjectOption[]
  currentUserLevel: number
  currentUserRole: string
  departmentId: string
}

export function PriceListDetail({
  priceList,
  unassignedProjects,
  currentUserLevel,
  currentUserRole,
  departmentId,
}: PriceListDetailProps) {
  const router = useRouter()
  const canEdit = currentUserLevel >= 40
  const canCreate = currentUserLevel >= 60
  const canDelete = currentUserLevel >= 80
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canManageCostMargin = currentUserLevel >= 80

  // Header editing
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(priceList.name)
  const [repeatUse, setRepeatUse] = useState(priceList.repeatUse)
  const [nameError, setNameError] = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) {
      setNameError('Name is required.')
      return
    }
    setSaving(true)
    try {
      await updatePriceListAction({id: priceList.id, name: name.trim(), repeatUse})
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setName(priceList.name)
    setRepeatUse(priceList.repeatUse)
    setNameError(null)
    setEditing(false)
  }

  // Item dialog
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MappedPriceListItem | null>(null)

  function openAddItem() {
    setEditingItem(null)
    setItemDialogOpen(true)
  }

  function openEditItem(item: MappedPriceListItem) {
    setEditingItem(item)
    setItemDialogOpen(true)
  }

  async function handleDeleteItem(item: MappedPriceListItem) {
    await softDeletePriceListItemAction({id: item.id})
    router.refresh()
  }

  async function handleHardDeleteItem(item: MappedPriceListItem) {
    await hardDeletePriceListItemAction({id: item.id})
    router.refresh()
  }

  async function handleRestoreItem(item: MappedPriceListItem) {
    await restorePriceListItemAction({id: item.id})
    router.refresh()
  }

  // Item filter
  type ItemFilter = 'not-deleted' | 'deleted' | 'all'
  const [itemFilter, setItemFilter] = useState<ItemFilter>('not-deleted')

  // Project assignment
  const [assigningProject, setAssigningProject] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState('none')
  const [assigningSaving, setAssigningSaving] = useState(false)

  async function handleAssignProject() {
    if (selectedProjectId === 'none') return
    setAssigningSaving(true)
    try {
      await assignProjectToPriceListAction({priceListId: priceList.id, projectId: selectedProjectId})
      setSelectedProjectId('none')
      setAssigningProject(false)
      router.refresh()
    } finally {
      setAssigningSaving(false)
    }
  }

  async function handleUnassignProject(projectId: string) {
    await unassignProjectFromPriceListAction({projectId})
    router.refresh()
  }

  // Separate items: cost margin first, then regular
  const costMarginItem = priceList.items.find(i => i.isCostMargin && !i.deleted)
  const regularItems = priceList.items.filter(i => !i.isCostMargin)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
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
            <h1 className="text-lg font-semibold text-foreground">{priceList.name}</h1>
            <p className="text-sm text-muted-foreground">
              {priceList.items.length} item{priceList.items.length !== 1 ? 's' : ''} · {priceList.projects.length}{' '}
              project{priceList.projects.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={handleCancel} className="gap-2 border-border">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2 bg-accent text-accent-foreground hover:bg-accent/80">
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)} variant="outline" className="gap-2 border-border">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-border/60 bg-card p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Name</Label>
            {editing ? (
              <div className="flex flex-col gap-1">
                <Input
                  value={name}
                  onChange={e => {
                    setName(e.target.value)
                    setNameError(null)
                  }}
                  className={`bg-secondary border-border ${nameError ? 'border-destructive' : ''}`}
                />
                {nameError && <p className="text-xs text-destructive">{nameError}</p>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{priceList.name}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Created By</Label>
            <p className="text-sm text-muted-foreground">{priceList.createdByName}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Created At</Label>
            <p className="text-sm text-muted-foreground">{formatDate(priceList.createdAt)}</p>
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2 max-w-xs">
              <Label className="text-xs text-muted-foreground">Repeat Use</Label>
              {editing ? (
                <Switch checked={repeatUse} onCheckedChange={setRepeatUse} />
              ) : priceList.repeatUse ? (
                <Badge className="bg-accent/15 text-accent border-0 font-medium text-xs">Yes</Badge>
              ) : (
                <Badge variant="secondary" className="text-muted-foreground font-medium text-xs">
                  No
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cost Margin */}
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-foreground">Cost Margin</h2>
            <Badge variant="outline" className="border-border text-xs text-muted-foreground">
              % applied to prices
            </Badge>
          </div>
          {canManageCostMargin && costMarginItem && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 border-border gap-1"
              onClick={() => openEditItem(costMarginItem)}>
              <Pencil className="h-3 w-3" /> Edit
            </Button>
          )}
        </div>
        {costMarginItem ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 px-4 py-3 w-fit">
            <span className="text-2xl font-semibold text-foreground">{costMarginItem.price}%</span>
            <span className="text-xs text-muted-foreground">cost margin applied on top of item prices</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No cost margin set.</p>
        )}
      </div>

      {/* Items */}
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-foreground">
            Items
            <Badge variant="secondary" className="ml-2 text-xs">
              {regularItems.filter(i => !i.deleted).length}
            </Badge>
          </h2>
          <div className="flex items-center gap-2">
            <Select value={itemFilter} onValueChange={v => setItemFilter(v as 'not-deleted' | 'deleted' | 'all')}>
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
              <Button size="sm" variant="outline" className="text-xs h-7 border-border gap-1" onClick={openAddItem}>
                <Plus className="h-3.5 w-3.5" /> Add Item
              </Button>
            )}
          </div>
        </div>

        {(() => {
          const visibleItems = regularItems.filter(i => {
            if (itemFilter === 'not-deleted') return !i.deleted
            if (itemFilter === 'deleted') return i.deleted
            return true
          })
          return visibleItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No items found.</p>
          ) : (
            <div className="rounded-lg border border-border/60 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/60">
                    <TableHead className={thClass}>Description</TableHead>
                    <TableHead className={thClass}>Unit</TableHead>
                    <TableHead className={thClass}>Price</TableHead>
                    <TableHead className={thClass}>Added By</TableHead>
                    <TableHead className={thClass}>Added At</TableHead>
                    <TableHead className="w-24">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleItems.map(item => (
                    <TableRow
                      key={item.id}
                      className={`border-border/40 hover:bg-secondary/50 ${item.deleted ? 'opacity-50' : ''}`}>
                      <TableCell className={`${tdClass} text-foreground font-medium`}>{item.description}</TableCell>
                      <TableCell className={tdClass}>{item.unit}</TableCell>
                      <TableCell className={`${tdClass} font-mono`}>
                        {formatPrice(item.price, item.isCostMargin)}
                      </TableCell>
                      <TableCell className={tdClass}>{item.createdByName}</TableCell>
                      <TableCell className={tdClass}>{formatDate(item.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {!item.deleted && (
                            <>
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                  onClick={() => openEditItem(item)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteItem(item)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </>
                          )}
                          {item.deleted && (
                            <>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary px-2"
                                  onClick={() => handleRestoreItem(item)}>
                                  Restore
                                </Button>
                              )}
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                  title="Hard delete"
                                  onClick={() => handleHardDeleteItem(item)}>
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
          )
        })()}
      </div>

      {/* Linked Projects */}
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-foreground">
            Linked Projects
            <Badge variant="secondary" className="ml-2 text-xs">
              {priceList.projects.length}
            </Badge>
          </h2>
          {canEdit && !assigningProject && unassignedProjects.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 border-border gap-1"
              onClick={() => setAssigningProject(true)}>
              <Plus className="h-3.5 w-3.5" /> Assign Project
            </Button>
          )}
        </div>

        {assigningProject && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg border border-border bg-secondary/30">
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="h-8 text-xs bg-background border-border flex-1">
                <SelectValue placeholder="Select project…" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="none" disabled>
                  Select project…
                </SelectItem>
                {unassignedProjects.map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.projectNumber} — {p.projectName}
                    <span className="ml-1 text-muted-foreground">({p.companyName})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="h-8 text-xs bg-accent text-accent-foreground hover:bg-accent/80"
              onClick={handleAssignProject}
              disabled={selectedProjectId === 'none' || assigningSaving}>
              {assigningSaving ? 'Saving…' : 'Assign'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-border"
              onClick={() => {
                setAssigningProject(false)
                setSelectedProjectId('none')
              }}>
              Cancel
            </Button>
          </div>
        )}

        {unassignedProjects.length === 0 && !assigningProject && priceList.projects.length === 0 && (
          <p className="text-xs text-muted-foreground mb-3">
            No open projects without a price list available to assign.
          </p>
        )}

        {priceList.projects.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No projects linked.</p>
        ) : (
          <div className="rounded-lg border border-border/60 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className={thClass}>Project #</TableHead>
                  <TableHead className={thClass}>Name</TableHead>
                  <TableHead className={thClass}>Company</TableHead>
                  <TableHead className="w-20">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceList.projects.map(p => (
                  <TableRow key={p.id} className="border-border/40 hover:bg-secondary/50">
                    <TableCell className={`${tdClass} text-foreground font-medium`}>{p.projectNumber}</TableCell>
                    <TableCell className={tdClass}>{p.projectName}</TableCell>
                    <TableCell className={tdClass}>{p.companyName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/departments/${departmentId}/project/${p.id}` as Route}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-accent/10"
                            title="Open project">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Unassign"
                            onClick={() => handleUnassignProject(p.id)}>
                            <X className="h-3 w-3" />
                          </Button>
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

      {/* Item dialog */}
      <ItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        priceListId={priceList.id}
        item={editingItem}
        onSaved={() => router.refresh()}
      />
    </div>
  )
}
