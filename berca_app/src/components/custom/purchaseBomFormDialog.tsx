'use client'

import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import type {MappedPurchaseBOM, ProjectOption} from '@/types/purchaseBom'
import type {MappedWorkOrder} from '@/types/workOrder'
import {
  updatePurchaseBOMAction,
  searchPurchasesAction,
  hasOpenWorkOrderForProjectAction,
  getOpenWorkOrdersForProjectAction,
} from '@/serverFunctions/purchaseBoms'
import {generateBomNumber} from '@/lib/utils'

const OPEN_WORK_ORDER_ERROR =
  'No open work order with material closed = false was found for this project. Please ask a manager to open a new work order and retry approval.'

interface PurchaseBOMFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pass to edit an existing BOM; null/undefined = create mode */
  bom?: MappedPurchaseBOM | null
  /** When scoped to a purchase page, skip the purchase search */
  defaultProjectId?: string
  /** All BOMs in scope — used for the parent BOM selector */
  allBOMs?: MappedPurchaseBOM[]
  canEditNumber: boolean
  onSaved?: () => void
}

export function PurchaseBOMFormDialog({
  open,
  onOpenChange,
  bom,
  defaultProjectId,
  allBOMs = [],
  canEditNumber,
  onSaved,
}: PurchaseBOMFormDialogProps) {
  const router = useRouter()
  const isEdit = !!bom
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ─── Form fields ─────────────────────────────────────────────────────────────
  const [description, setDescription] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [purchaseBomId, setPurchaseBomId] = useState('')
  const [purchaseBomNumber, setPurchaseBomNumber] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState('')
  const [closed, setClosed] = useState(false)
  const [materialClosed, setMaterialClosed] = useState(false)
  const [purchased, setPurchased] = useState(false)
  const [approvedForQuote, setApprovedForQuote] = useState(false)

  // ─── Purchase search (create mode only) ───────────────────────────────────────
  const [purchaseQuery, setPurchaseQuery] = useState('')
  const [projectResults, setProjectResults] = useState<ProjectOption[]>([])
  const [purchaseSearching, setPurchaseSearching] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ProjectOption | null>(null)

  // ─── Parent BOM selector ──────────────────────────────────────────────────────
  const [parentBomId, setParentBomId] = useState<string>('none')

  // ─── Work order selection ─────────────────────────────────────────────────────
  const [workOrders, setWorkOrders] = useState<MappedWorkOrder[]>([])
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string>('')

  // Populate form when dialog opens or bom changes
  useEffect(() => {
    if (!open) return
    if (bom) {
      setDescription(bom.description ?? '')
      setShortDescription(bom.shortDescription ?? '')
      setPurchaseBomId(bom.purchaseBomId ?? '')
      setPurchaseBomNumber(bom.purchaseBomNumber ?? '')
      setAdditionalInfo(bom.additionalInfo ?? '')
      setStartDate(bom.startDate.slice(0, 10))
      setEndDate(bom.endDate?.slice(0, 10) ?? '')
      setClosed(bom.closed)
      setMaterialClosed(bom.materialClosed)
      setPurchased(bom.purchased ?? false)
      setApprovedForQuote(bom.approvedForQuote ?? false)
      setParentBomId(bom.purchaseBomId ?? 'none')
    } else {
      setDescription('')
      setShortDescription('')
      setPurchaseBomId('')
      setPurchaseBomNumber(generateBomNumber())
      setAdditionalInfo('')
      setStartDate(new Date().toISOString().slice(0, 10))
      setEndDate('')
      setClosed(false)
      setMaterialClosed(false)
      setPurchased(false)
      setApprovedForQuote(false)
      setParentBomId('none')
      setPurchaseQuery('')
      setProjectResults([])
      setSelectedProject(null)
    }
    setErrors({})
  }, [bom?.id, open])

  // Purchase search effect (create mode)
  useEffect(() => {
    if (!open || isEdit) return
    setPurchaseSearching(true)
    searchPurchasesAction(purchaseQuery)
      .then(setProjectResults)
      .finally(() => setPurchaseSearching(false))
  }, [purchaseQuery, open, isEdit])

  // Fetch open work orders when approving for quote (edit mode only)
  useEffect(() => {
    if (!open || !isEdit || !bom?.projectId || !approvedForQuote) {
      setWorkOrders([])
      setSelectedWorkOrderId('')
      return
    }
    getOpenWorkOrdersForProjectAction(bom.projectId).then(orders => {
      setWorkOrders(orders)
      if (orders.length === 1) setSelectedWorkOrderId(orders[0].id)
    })
  }, [open, isEdit, bom?.projectId, approvedForQuote])

  // Parent BOM options: exclude self
  const parentBomOptions = allBOMs.filter(b => !bom || b.id !== bom.id)

  async function handleSubmit() {
    const e: Record<string, string> = {}
    if (!isEdit && !selectedProject && !defaultProjectId) e.project = 'Please select a project.'
    if (!startDate) e.startDate = 'Start date is required.'
    if (Object.keys(e).length > 0) {
      setErrors(e)
      return
    }

    setSaving(true)
    try {
      if (isEdit && !bom.approvedForQuote && approvedForQuote) {
        const hasOpenWorkOrder = await hasOpenWorkOrderForProjectAction(bom.projectId)
        if (!hasOpenWorkOrder) {
          window.alert(OPEN_WORK_ORDER_ERROR)
          return
        }
      }

      const payload = {
        description: description.trim() || null,
        shortDescription: shortDescription.trim(),
        purchaseBomId: parentBomId !== 'none' ? parentBomId : null,
        purchaseBomNumber: purchaseBomNumber.trim(),
        additionalInfo: additionalInfo.trim() || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        closed,
        materialClosed: purchased ? true : materialClosed,
        purchased,
        approvedForQuote,
        workOrderId: approvedForQuote ? selectedWorkOrderId : undefined,
      }

      if (isEdit) {
        await updatePurchaseBOMAction({id: bom.id, ...payload})
      }
      onSaved?.()
      onOpenChange(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const numberEditable = !isEdit || canEditNumber

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? 'Edit Purchase BOM' : 'New Purchase BOM'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Purchase search — create mode only, not when scoped to a purchase */}
          {!isEdit && !defaultProjectId && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Purchase *</Label>
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
                    value={purchaseQuery}
                    onChange={e => {
                      setPurchaseQuery(e.target.value)
                      setErrors(prev => ({...prev, purchase: ''}))
                    }}
                    placeholder="Search by name or number…"
                    className={`bg-secondary border-border ${errors.purchase ? 'border-destructive' : ''}`}
                    autoFocus
                  />
                  {errors.purchase && <p className="text-xs text-destructive">{errors.purchase}</p>}
                  <div className="flex flex-col gap-1 max-h-40 overflow-y-auto rounded-lg border border-border bg-secondary/30">
                    {purchaseSearching ? (
                      <p className="text-xs text-muted-foreground px-3 py-3 text-center">Searching…</p>
                    ) : projectResults.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-3 py-3 text-center">No purchases found.</p>
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
            {/* BOM Number */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">
                BOM Number *{!numberEditable && <span className="ml-1.5 text-muted-foreground/60">(locked)</span>}
              </Label>
              {numberEditable ? (
                <div className="flex gap-2">
                  <Input
                    value={purchaseBomNumber}
                    onChange={e => setPurchaseBomNumber(e.target.value)}
                    className="bg-secondary border-border flex-1"
                  />
                  {!isEdit && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 px-3 border-border text-xs shrink-0"
                      onClick={() => setPurchaseBomNumber(generateBomNumber())}>
                      Regenerate
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex h-10 items-center rounded-md border border-border bg-secondary/40 px-3 text-sm text-muted-foreground cursor-not-allowed select-none">
                  {purchaseBomNumber}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="BOM description…"
                className="bg-secondary border-border"
                autoFocus={!isEdit && !!defaultProjectId}
              />
            </div>

            {/* Short Description */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Short Description</Label>
              <Input
                value={shortDescription}
                onChange={e => setShortDescription(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            {/* Parent BOM */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Parent BOM</Label>
              <Select value={parentBomId} onValueChange={setParentBomId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="none">None</SelectItem>
                  {parentBomOptions.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.purchaseBomNumber}
                      {b.shortDescription ? ` — ${b.shortDescription}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
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

            {/* End Date */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            {/* Additional Info */}
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

          {/* Toggles */}
          <div className="flex flex-col gap-2">
            {/* Closed */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
              <Label className="text-xs text-muted-foreground">Closed</Label>
              <Switch checked={closed} onCheckedChange={setClosed} />
            </div>

            {/* Material Closed — locked when purchased is on */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
              <div className="flex flex-col gap-0.5">
                <Label className="text-xs text-muted-foreground">
                  Material Closed
                  {purchased && <span className="ml-1.5 text-muted-foreground/50">(set by Purchased)</span>}
                </Label>
              </div>
              <Switch
                checked={purchased ? true : materialClosed}
                onCheckedChange={v => !purchased && setMaterialClosed(v)}
                disabled={purchased}
              />
            </div>

            {/* Purchased — edit mode only */}
            {isEdit && (
              <div className="flex flex-col gap-1 rounded-lg border border-border bg-secondary px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <Label className="text-xs text-muted-foreground">Purchased</Label>
                    <p className="text-xs text-muted-foreground/55">
                      Marks all active structures as purchased and sets Material Closed on the Project BOM
                    </p>
                  </div>
                  <Switch
                    checked={purchased}
                    onCheckedChange={v => {
                      setPurchased(v)
                      if (v) setMaterialClosed(true)
                    }}
                  />
                </div>
              </div>
            )}

            {/* Approved for Quote — edit mode only */}
            {isEdit && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                  <Label className="text-xs text-muted-foreground">Approved for Quote</Label>
                  <Switch checked={approvedForQuote} onCheckedChange={setApprovedForQuote} />
                </div>
                {/* Work Order selection — only when approving for quote and >1 open work order */}
                {approvedForQuote && workOrders.length > 1 && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Work Order</Label>
                    <Select value={selectedWorkOrderId} onValueChange={setSelectedWorkOrderId}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select work order" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {workOrders.map(wo => (
                          <SelectItem key={wo.id} value={wo.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{wo.workOrderNumber ?? wo.id}</span>
                              {wo.description && (
                                <span className="text-xs text-muted-foreground truncate max-w-75">
                                  {wo.description}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
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
            {saving ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? 'Save Changes' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
