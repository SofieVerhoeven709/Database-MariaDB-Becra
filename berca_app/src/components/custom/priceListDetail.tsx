'use client'

import {useState, useEffect, useRef} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowLeft, Pencil, X, Save, Plus, Trash2, AlertTriangle} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {Badge} from '@/components/ui/badge'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import type {MappedPriceList, MappedPriceListItem, CompanySearchResult} from '@/types/priceList'
import {
  updatePriceListAction,
  createPriceListItemAction,
  updatePriceListItemAction,
  softDeletePriceListItemAction,
  hardDeletePriceListItemAction,
  restorePriceListItemAction,
  linkPriceListItemTargetAction,
  searchLinkableTargetsAction,
  assignCompanyToPriceListAction,
  unassignCompanyFromPriceListAction,
  searchCompaniesAction,
  createPriceListItemAndReturnIdAction,
} from '@/serverFunctions/priceLists'
import type {LinkableTargetType, LinkableTargetResult} from '@/types/priceList'

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

// ─── Item dialog ───────────────────────────────────────────────────────────────
interface ItemDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  priceListId: string
  item: MappedPriceListItem | null
  isCostMargin?: boolean
  onSaved: () => void
  onCreated?: (newItemId: string) => void
}

function ItemDialog({
  open,
  onOpenChange,
  priceListId,
  item,
  isCostMargin = false,
  onSaved,
  onCreated,
}: ItemDialogProps) {
  const [description, setDescription] = useState('')
  const [unit, setUnit] = useState('')
  const [price, setPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const prevOpenRef = useRef(false)
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      // Cost margin rows are locked to a fixed description/unit.
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
        onSaved()
        onOpenChange(false)
      } else {
        const newId = await createPriceListItemAndReturnIdAction({
          priceListId,
          description: description.trim(),
          unit: unit.trim(),
          price: parseFloat(price),
          isCostMargin,
        })
        onOpenChange(false)
        onSaved()
        if (newId && onCreated) onCreated(newId.id)
      }
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
              list="price-list-unit-options"
              value={unit}
              onChange={e => {
                setUnit(e.target.value)
                setErrors(prev => ({...prev, unit: ''}))
              }}
              disabled={isEditingCostMargin}
              className={`bg-secondary border-border ${errors.unit ? 'border-destructive' : ''} ${isEditingCostMargin ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
            <datalist id="price-list-unit-options">
              <option value="H" />
              <option value="STAY_OVER" />
            </datalist>
            {!isEditingCostMargin && (
              <p className="text-[11px] text-muted-foreground">
                Use `STAY_OVER` to bill time-registry stay-over markers.
              </p>
            )}
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

// ─── Link dialog ───────────────────────────────────────────────────────────────
const TARGET_TYPE_LABELS: Record<LinkableTargetType, string> = {
  HourType: 'Hour Type',
  Material: 'Material',
  Training: 'Training',
}

interface LinkDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  priceListItemId: string
  onSaved: () => void
}

function LinkDialog({open, onOpenChange, priceListItemId, onSaved}: LinkDialogProps) {
  const [selectedType, setSelectedType] = useState<LinkableTargetType | ''>('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LinkableTargetResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedResult, setSelectedResult] = useState<LinkableTargetResult | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      setSelectedType('')
      setQuery('')
      setResults([])
      setSelectedResult(null)
    }
  }, [open])

  useEffect(() => {
    if (!selectedType) {
      setResults([])
      setSelectedResult(null)
      return
    }
    setSelectedResult(null)
    setSearching(true)
    searchLinkableTargetsAction(selectedType, query)
      .then(setResults)
      .finally(() => setSearching(false))
  }, [selectedType, query])

  async function handleLink() {
    if (!selectedResult) return
    setSaving(true)
    try {
      await linkPriceListItemTargetAction({priceListItemId, targetId: selectedResult.targetId})
      onSaved()
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Link to Target</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Type *</Label>
            <Select value={selectedType} onValueChange={v => setSelectedType(v as LinkableTargetType)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select type…" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {(Object.keys(TARGET_TYPE_LABELS) as LinkableTargetType[]).map(t => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {TARGET_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedType && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Search</Label>
                <Input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={`Search ${TARGET_TYPE_LABELS[selectedType]}…`}
                  className="bg-secondary border-border"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1 max-h-52 overflow-y-auto rounded-lg border border-border bg-secondary/30">
                {searching ? (
                  <p className="text-xs text-muted-foreground px-3 py-4 text-center">Searching…</p>
                ) : results.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-3 py-4 text-center">No results found.</p>
                ) : (
                  results.map(r => (
                    <button
                      key={r.targetId}
                      type="button"
                      onClick={() => setSelectedResult(r)}
                      className={`flex flex-col gap-0.5 px-3 py-2 text-left hover:bg-secondary/80 transition-colors border-b border-border/40 last:border-0 ${selectedResult?.targetId === r.targetId ? 'bg-accent/10' : ''}`}>
                      <span className="text-sm text-foreground font-medium">{r.displayLabel}</span>
                      {r.subLabel && <span className="text-xs text-muted-foreground">{r.subLabel}</span>}
                    </button>
                  ))
                )}
              </div>
              {selectedResult && (
                <p className="text-xs text-muted-foreground">
                  Selected: <span className="text-foreground font-medium">{selectedResult.displayLabel}</span>
                  {selectedResult.subLabel && (
                    <span className="ml-1 text-muted-foreground">({selectedResult.subLabel})</span>
                  )}
                </p>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={!selectedResult || saving}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Linking…' : 'Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Assign company dialog ─────────────────────────────────────────────────────
interface AssignCompanyDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  priceListId: string
  alreadyAssignedIds: string[]
  onSaved: () => void
}

function AssignCompanyDialog({open, onOpenChange, priceListId, alreadyAssignedIds, onSaved}: AssignCompanyDialogProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CompanySearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<CompanySearchResult | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      setSelectedCompany(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    setSearching(true)
    searchCompaniesAction(query, alreadyAssignedIds)
      .then(setResults)
      .finally(() => setSearching(false))
  }, [query, open, alreadyAssignedIds])

  async function handleAssign() {
    if (!selectedCompany) return
    setSaving(true)
    try {
      await assignCompanyToPriceListAction({priceListId, companyId: selectedCompany.id})
      onSaved()
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Assign Company</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Search</Label>
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or number…"
              className="bg-secondary border-border"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1 max-h-52 overflow-y-auto rounded-lg border border-border bg-secondary/30">
            {searching ? (
              <p className="text-xs text-muted-foreground px-3 py-4 text-center">Searching…</p>
            ) : results.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-4 text-center">No companies found.</p>
            ) : (
              results.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCompany(c)}
                  className={`flex flex-col gap-0.5 px-3 py-2 text-left hover:bg-secondary/80 transition-colors border-b border-border/40 last:border-0 ${selectedCompany?.id === c.id ? 'bg-accent/10' : ''}`}>
                  <span className="text-sm text-foreground font-medium">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.number}</span>
                </button>
              ))
            )}
          </div>
          {selectedCompany && (
            <p className="text-xs text-muted-foreground">
              Selected: <span className="text-foreground font-medium">{selectedCompany.name}</span>
              <span className="ml-1 text-muted-foreground">({selectedCompany.number})</span>
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedCompany || saving}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Assigning…' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
interface PriceListDetailProps {
  priceList: MappedPriceList
  currentUserLevel: number
  currentUserRole: string
  departmentId: string
}

export function PriceListDetail({priceList, currentUserLevel, currentUserRole, departmentId}: PriceListDetailProps) {
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

  // Link dialog
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkingItemId, setLinkingItemId] = useState<string | null>(null)

  function openLinkDialog(item: MappedPriceListItem) {
    setLinkingItemId(item.id)
    setLinkDialogOpen(true)
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

  // Assign company dialog
  const [assignCompanyOpen, setAssignCompanyOpen] = useState(false)
  const alreadyAssignedIds = priceList.companies.map(c => c.companyId)

  async function handleUnassignCompany(priceListCompanyId: string) {
    await unassignCompanyFromPriceListAction({priceListCompanyId})
    router.refresh()
  }

  const costMarginItem = priceList.items.find(i => i.isCostMargin && !i.deleted)
  const regularItems = priceList.items.filter(i => !i.isCostMargin)
  const belowCostItems = regularItems.filter(i => !i.deleted && i.belowSupplierCost)

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
              {priceList.items.length} item{priceList.items.length !== 1 ? 's' : ''} · {priceList.companies.length}{' '}
              compan{priceList.companies.length !== 1 ? 'ies' : 'y'}
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
              onClick={() => {
                setEditingItem(costMarginItem)
                setItemDialogOpen(true)
              }}>
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
          {belowCostItems.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              {belowCostItems.length} below supplier cost
            </span>
          )}
          <div className="flex items-center gap-2">
            <Select value={itemFilter} onValueChange={v => setItemFilter(v as ItemFilter)}>
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
                  setEditingItem(null)
                  setItemDialogOpen(true)
                }}>
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
                    <TableHead className={thClass}>Linked To</TableHead>
                    <TableHead className={thClass}>Added By</TableHead>
                    <TableHead className={thClass}>Added At</TableHead>
                    <TableHead className="w-28">
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
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1">
                            {formatPrice(item.price, item.isCostMargin)}
                            {item.belowSupplierCost && (
                              <span
                                title={`Lowest supplier price: €${item.supplierUnitPrice?.toFixed(2)} — list price is below cost`}
                                className="cursor-help">
                                <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                              </span>
                            )}
                          </span>
                          {item.supplierUnitPrice != null && !item.isCostMargin && (
                            <span className="text-[10px] text-muted-foreground font-normal">
                              Supplier: €{item.supplierUnitPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={tdClass}>
                        {item.linkedTarget ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-foreground text-xs font-medium">
                              {item.linkedTarget.displayLabel}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {TARGET_TYPE_LABELS[item.linkedTarget.targetType]}
                            </span>
                          </div>
                        ) : !item.deleted && canEdit ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary"
                            onClick={() => openLinkDialog(item)}>
                            <Plus className="h-3 w-3" /> Link
                          </Button>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">—</span>
                        )}
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
                                  onClick={() => {
                                    setEditingItem(item)
                                    setItemDialogOpen(true)
                                  }}>
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

      {/* Linked Companies */}
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-foreground">
            Linked Companies
            <Badge variant="secondary" className="ml-2 text-xs">
              {priceList.companies.length}
            </Badge>
          </h2>
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 border-border gap-1"
              onClick={() => setAssignCompanyOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Assign Company
            </Button>
          )}
        </div>
        {priceList.companies.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No companies linked.</p>
        ) : (
          <div className="rounded-lg border border-border/60 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className={thClass}>Number</TableHead>
                  <TableHead className={thClass}>Name</TableHead>
                  <TableHead className="w-16">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceList.companies.map(c => (
                  <TableRow key={c.id} className="border-border/40 hover:bg-secondary/50">
                    <TableCell className={`${tdClass} text-foreground font-medium`}>{c.companyNumber}</TableCell>
                    <TableCell className={tdClass}>{c.companyName}</TableCell>
                    <TableCell>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Unassign"
                          onClick={() => handleUnassignCompany(c.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      )}
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
        onCreated={newItemId => {
          setLinkingItemId(newItemId)
          setLinkDialogOpen(true)
        }}
      />

      {/* Link dialog */}
      {linkingItemId && (
        <LinkDialog
          open={linkDialogOpen}
          onOpenChange={setLinkDialogOpen}
          priceListItemId={linkingItemId}
          onSaved={() => router.refresh()}
        />
      )}

      {/* Assign company dialog */}
      <AssignCompanyDialog
        open={assignCompanyOpen}
        onOpenChange={setAssignCompanyOpen}
        priceListId={priceList.id}
        alreadyAssignedIds={alreadyAssignedIds}
        onSaved={() => router.refresh()}
      />
    </div>
  )
}
