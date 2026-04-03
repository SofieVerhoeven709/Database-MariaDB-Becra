'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Badge} from '@/components/ui/badge'
import {updatePurchaseBOMStructureAction} from '@/serverFunctions/purchaseBoms'
import type {MappedPurchaseBOMStructure, BomMaterialOption} from '@/types/purchaseBom'
import {useRouter} from 'next/navigation'

interface PurchaseBOMStructureFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null = dialog closed / no structure selected */
  structure: MappedPurchaseBOMStructure | null
  purchaseBOMId: string
  /** kept in props for API compatibility but not used — material is read-only */
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

export function PurchaseBOMStructureFormDialog({open, onOpenChange, structure}: PurchaseBOMStructureFormDialogProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  // ── Only the execution fields are editable ───────────────────────────────────
  const [reservedQuantity, setReservedQuantity] = useState('')
  const [issuedQuantity, setIssuedQuantity] = useState('')

  useEffect(() => {
    if (structure) {
      setReservedQuantity(structure.reservedQuantity?.toString() ?? '')
      setIssuedQuantity(structure.issuedQuantity?.toString() ?? '')
    } else {
      setReservedQuantity('')
      setIssuedQuantity('')
    }
  }, [structure?.id, open])

  async function handleSubmit() {
    if (!structure) return
    setSaving(true)
    try {
      await updatePurchaseBOMStructureAction({
        id: structure.id,
        reservedQuantity: reservedQuantity !== '' ? parseInt(reservedQuantity) : null,
        issuedQuantity: issuedQuantity !== '' ? parseInt(issuedQuantity) : null,
      })
      onOpenChange(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Update Execution Quantities</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-3">
          {/* ── Read-only structural information ─────────────────────────────── */}
          <div className="rounded-lg border border-border/40 bg-secondary/20 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
              Structure Info (read-only — managed from Project BOM)
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
              <ReadOnlyField label="Short Description" value={structure?.shortDescription} />
              <ReadOnlyField label="Tag" value={structure?.tag} />
              <ReadOnlyField label="Required Qty" value={structure?.requiredQuantity?.toString()} />
              <ReadOnlyField
                label="Ready for Purchase Date"
                value={formatDate(structure?.readyForPurchaseDate ?? null)}
              />
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Not Deliverable</Label>
                <div className="flex h-9 items-center px-1">
                  {structure?.notDeliverable ? (
                    <Badge className="text-xs text-red-600 bg-red-600/15 border-0">Yes</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs text-muted-foreground/60">
                      No
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Editable execution fields ─────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Execution Quantities
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
            {saving ? 'Saving…' : 'Save Quantities'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
