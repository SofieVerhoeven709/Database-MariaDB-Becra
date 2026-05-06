'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {createProjectBOMStructureAction, updateProjectBOMStructureAction} from '@/serverFunctions/projectBoms'
import type {MappedProjectBOMStructure, BomMaterialOption} from '@/types/projectBom'
import {useRouter} from 'next/navigation'

interface ProjectBOMStructureFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  structure: MappedProjectBOMStructure | null
  projectBOMId: string
  materialOptions: BomMaterialOption[]
}

function emptyForm() {
  return {
    materialId: '',
    shortDescription: '',
    description: '',
    additionalInfo: '',
    tag: '',
    requiredQuantity: '',
    reservedQuantity: '',
    issuedQuantity: '',
    readyForPurchaseDate: '',
    readyForPurchase: false,
    notDeliverable: false,
  }
}

export function ProjectBOMStructureFormDialog({
  open,
  onOpenChange,
  structure,
  projectBOMId,
  materialOptions,
}: ProjectBOMStructureFormDialogProps) {
  const router = useRouter()
  const isEdit = !!structure
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [materialSearch, setMaterialSearch] = useState('')

  useEffect(() => {
    if (structure) {
      setForm({
        materialId: structure.materialId,
        shortDescription: structure.shortDescription ?? '',
        description: structure.description ?? '',
        additionalInfo: structure.additionalInfo ?? '',
        tag: structure.tag ?? '',
        requiredQuantity: structure.requiredQuantity?.toString() ?? '',
        reservedQuantity: structure.execStockReservedQuantity?.toString() ?? '',
        issuedQuantity: structure.execIssuedQuantity?.toString() ?? '',
        readyForPurchaseDate: structure.readyForPurchaseDate
          ? new Date(structure.readyForPurchaseDate).toISOString().slice(0, 10)
          : '',
        readyForPurchase: structure.readyForPurchase,
        notDeliverable: structure.execNotDeliverable,
      })
    } else if (open) {
      setForm(emptyForm())
    }
  }, [structure?.id, open])

  const filteredInventories = materialOptions.filter(i => {
    if (!materialSearch) return true
    const q = materialSearch.toLowerCase()
    // Search inventory by BE number or description.
    return (i.beNumber ?? '').toLowerCase().includes(q) || (i.shortDescription ?? '').toLowerCase().includes(q)
  })

  const selectedMaterial = materialOptions.find(i => i.id === form.materialId)

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({...prev, [key]: value}))
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      const payload = {
        materialId: form.materialId,
        shortDescription: form.shortDescription.trim() || null,
        description: form.description.trim() || null,
        additionalInfo: form.additionalInfo.trim() || null,
        tag: form.tag.trim() || null,
        requiredQuantity: parseInt(form.requiredQuantity),
        readyForPurchaseDate: form.readyForPurchaseDate ? new Date(form.readyForPurchaseDate) : null,
        readyForPurchase: form.readyForPurchase,
      }
      if (isEdit) {
        await updateProjectBOMStructureAction({...payload, id: structure.id})
      } else {
        await createProjectBOMStructureAction({...payload, projectBOMId})
      }
      onOpenChange(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const canSubmit = !!form.materialId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? 'Edit BOM Structure' : 'Add BOM Structure'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-5 py-3 sm:grid-cols-2">
          {/* Material — full width */}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Material *</Label>
            <Input
              value={materialSearch}
              onChange={e => setMaterialSearch(e.target.value)}
              placeholder="Search by number or name..."
              className="bg-secondary border-border"
            />
            <Select
              value={form.materialId || '__none__'}
              onValueChange={v => {
                const materialId = v === '__none__' ? '' : v
                const material = materialOptions.find(i => i.id === materialId)
                setForm(prev => ({
                  ...prev,
                  materialId,
                  shortDescription:
                    !isEdit || !prev.shortDescription
                      ? (material?.shortDescription ?? material?.name ?? prev.shortDescription)
                      : prev.shortDescription,
                }))
              }}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select inventory item" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="__none__">— Select item —</SelectItem>
                {filteredInventories.length === 0 ? (
                  <SelectItem value="__no_results__" disabled>
                    No matching materials found
                  </SelectItem>
                ) : (
                  filteredInventories.map(i => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.beNumber ?? i.id}
                      {` — ${i.shortDescription}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Short Description</Label>
            <Input
              value={form.shortDescription}
              onChange={e => set('shortDescription', e.target.value)}
              placeholder={selectedMaterial?.shortDescription ?? selectedMaterial?.name ?? undefined}
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Tag</Label>
            <Input value={form.tag} onChange={e => set('tag', e.target.value)} className="bg-secondary border-border" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Required Qty</Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={form.requiredQuantity}
              onChange={e => set('requiredQuantity', e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Ready for Purchase Date</Label>
            <Input
              type="date"
              value={form.readyForPurchaseDate}
              onChange={e => set('readyForPurchaseDate', e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={2}
              className="bg-secondary border-border resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Additional Info</Label>
            <Textarea
              value={form.additionalInfo}
              onChange={e => set('additionalInfo', e.target.value)}
              rows={2}
              className="bg-secondary border-border resize-none"
            />
          </div>

          {/* Toggles */}
          <div className="sm:col-span-2 flex flex-col gap-2">
            {(
              [{key: 'readyForPurchase', label: 'Ready for Purchase'}] as {key: 'readyForPurchase'; label: string}[]
            ).map(({key, label}) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Switch checked={form[key]} onCheckedChange={v => set(key, v)} />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !canSubmit}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Structure'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
