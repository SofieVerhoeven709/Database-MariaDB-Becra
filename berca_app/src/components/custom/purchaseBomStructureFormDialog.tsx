'use client'

import {useState, useEffect} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {updatePurchaseBOMStructureAction, getOpenWorkOrdersForProjectAction} from '@/serverFunctions/purchaseBoms'
import type {MappedPurchaseBOMStructure, BomMaterialOption} from '@/types/purchaseBom'
import {useRouter} from 'next/navigation'
import {Switch} from '@/components/ui/switch'
import {AlertCircle} from 'lucide-react'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import type {MappedWorkOrder} from '@/types/workOrder'

interface PurchaseBOMStructureFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  structure: MappedPurchaseBOMStructure | null
  purchaseBOMId: string
  projectId: string
  materialOptions: BomMaterialOption[]
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function ReadOnlyField({label, value}: {label: string; value: React.ReactNode}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex h-9 items-center rounded-md border border-border/50 bg-secondary/40 px-3 text-sm text-muted-foreground select-none cursor-default">
        {value ?? '—'}
      </div>
    </div>
  )
}

export function PurchaseBOMStructureFormDialog({
  open,
  onOpenChange,
  structure,
  projectId,
}: PurchaseBOMStructureFormDialogProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [reservedQuantity, setReservedQuantity] = useState('')
  const [issuedQuantity, setIssuedQuantity] = useState('')
  const [notDeliverable, setNotDeliverable] = useState(false)
  const [purchased, setPurchased] = useState(false)
  const [approvedForQuote, setApprovedForQuote] = useState(false)
  const [workOrders, setWorkOrders] = useState<MappedWorkOrder[]>([])
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string>('')

  // Populate form fields when dialog opens
  useEffect(() => {
    if (structure) {
      setReservedQuantity(structure.reservedQuantity?.toString() ?? '')
      setIssuedQuantity(structure.issuedQuantity?.toString() ?? '')
      setNotDeliverable(structure.notDeliverable ?? false)
      setPurchased(structure.purchased ?? false)
      setApprovedForQuote(structure.approvedForQuote ?? false)
    } else {
      setReservedQuantity('')
      setIssuedQuantity('')
      setNotDeliverable(false)
      setPurchased(false)
      setApprovedForQuote(false)
      setWorkOrders([])
      setSelectedWorkOrderId('')
    }
  }, [structure?.id, open])

  // Fetch open work orders whenever the dialog opens — not gated on approvedForQuote
  // so they're ready immediately when the toggle is turned on
  useEffect(() => {
    if (!open || !projectId) {
      setWorkOrders([])
      setSelectedWorkOrderId('')
      return
    }
    getOpenWorkOrdersForProjectAction(projectId).then(orders => {
      setWorkOrders(orders)
      if (orders.length === 1) setSelectedWorkOrderId(orders[0].id)
    })
  }, [open, projectId])

  async function handleSubmit() {
    if (!structure) return
    setSaving(true)
    try {
      await updatePurchaseBOMStructureAction({
        id: structure.id,
        projectBOMStructureId: structure.projectBOMStructureId,
        stockReservedQuantity: reservedQuantity !== '' ? parseInt(reservedQuantity) : null,
        issuedQuantity: issuedQuantity !== '' ? parseInt(issuedQuantity) : null,
        notDeliverable,
        purchased,
        approvedForQuote,
        workOrderId: approvedForQuote ? selectedWorkOrderId : undefined,
      })
      onOpenChange(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Approve &amp; Execute Structure</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-3">
          {/* ── Material & Structural Information ─────────────────────────────── */}
          <div className="rounded-lg border border-border/40 bg-secondary/20 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
              Material Information
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <ReadOnlyField
                  label="Material"
                  value={
                    structure ? (
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground/70">{structure.materialBeNumber}</span>
                        <span>{structure.materialName}</span>
                      </span>
                    ) : null
                  }
                />
              </div>
              <ReadOnlyField label="Description" value={structure?.description} />
              <ReadOnlyField label="Short Description" value={structure?.shortDescription} />
              <ReadOnlyField label="Tag" value={structure?.tag} />
              <ReadOnlyField label="Additional Info" value={structure?.additionalInfo} />
            </div>
          </div>

          {/* ── Read-only structural information ─────────────────────────────── */}
          <div className="rounded-lg border border-border/40 bg-secondary/20 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
              Specification (read-only — managed from Project BOM)
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ReadOnlyField label="Required Qty" value={structure?.requiredQuantity?.toString()} />
              <ReadOnlyField
                label="Ready for Purchase Date"
                value={formatDate(structure?.readyForPurchaseDate ?? null)}
              />
              <ReadOnlyField label="Created By" value={structure?.createdByName} />
              <ReadOnlyField label="Created At" value={formatDate(structure?.createdAt ?? null)} />
            </div>
          </div>

          {/* ── Editable execution fields ─────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Execution &amp; Approval
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Reserved Qty</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={reservedQuantity}
                  onChange={e => setReservedQuantity(e.target.value)}
                  className="bg-secondary border-border"
                  placeholder="0"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Issued Qty</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={issuedQuantity}
                  onChange={e => setIssuedQuantity(e.target.value)}
                  className="bg-secondary border-border"
                  placeholder="0"
                />
              </div>
            </div>

            {/* ── Status toggles ──────────────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
              {/* Approved for Quote — editable */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                <div className="flex flex-col gap-0.5">
                  <Label className="text-xs text-muted-foreground">Approved for Quote</Label>
                  <p className="text-xs text-muted-foreground/60">
                    Approve this structure for quotation and procurement
                  </p>
                </div>
                <Switch checked={approvedForQuote} onCheckedChange={setApprovedForQuote} />
              </div>

              {/* Work Order selection — shown when approving for quote */}
              {approvedForQuote && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Work Order</Label>
                  {workOrders.length === 0 ? (
                    <p className="text-xs text-destructive/80 px-1">
                      No open work orders found for this project. Ask a manager to open one before approving.
                    </p>
                  ) : (
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
                  )}
                </div>
              )}

              {/* Not Deliverable — editable */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                <div className="flex flex-col gap-0.5">
                  <Label className="text-xs text-muted-foreground">Not Deliverable</Label>
                  <p className="text-xs text-muted-foreground/60">
                    Mark if this material cannot be delivered for this project
                  </p>
                </div>
                <Switch checked={notDeliverable} onCheckedChange={setNotDeliverable} />
              </div>

              {/* Purchased — editable */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                <div className="flex flex-col gap-0.5">
                  <Label className="text-xs text-muted-foreground">Purchased</Label>
                  <p className="text-xs text-muted-foreground/60">
                    Mark when the material has been purchased and received
                  </p>
                </div>
                <Switch checked={purchased} onCheckedChange={setPurchased} />
              </div>

              {/* Not Correct — read-only status */}
              <div
                className={`flex flex-col gap-1.5 rounded-lg border px-3 py-2 transition-colors ${
                  structure?.notCorrect ? 'border-destructive/50 bg-destructive/10' : 'border-border bg-secondary'
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {structure?.notCorrect && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                    <Label className="text-xs text-muted-foreground">Not Correct / Issue</Label>
                  </div>
                  <Switch checked={structure?.notCorrect ?? false} disabled />
                </div>
                {structure?.notCorrect && structure?.notCorrectReason && (
                  <p className="text-xs text-destructive/80 pl-0.5">{structure.notCorrectReason}</p>
                )}
                {structure?.notCorrect && !structure?.notCorrectReason && (
                  <p className="text-xs text-muted-foreground/60 italic pl-0.5">No reason provided</p>
                )}
              </div>

              {/* Completed Date — read-only */}
              {structure?.completedDate && (
                <ReadOnlyField label="Completed Date" value={formatDate(structure.completedDate)} />
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !structure}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
