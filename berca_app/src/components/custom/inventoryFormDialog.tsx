'use client'
import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import type {MappedInventory} from '@/types/inventory'
interface MaterialOption {
  id: string
  beNumber: string
  name: string | null
  shortDescription: string
}
interface InventoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: MappedInventory | null
  materials: MaterialOption[]
  onSave: (item: Partial<MappedInventory> & {id: string}) => void
}
const inputStyles = 'bg-secondary border-border placeholder:text-muted-foreground/60 focus-visible:ring-accent'
const today = new Date().toISOString().split('T')[0]
const EMPTY: Partial<MappedInventory> & {id: string} = {
  id: '',
  materialId: '',
  beNumber: '',
  place: '',
  shortDescription: '',
  longDescription: '',
  serialNumber: '',
  quantityInStock: 0,
  minQuantityInStock: 0,
  maxQuantityInStock: 0,
  information: '',
  valid: true,
  noValidDate: today,
}
export function InventoryFormDialog({open, onOpenChange, item, materials, onSave}: InventoryFormDialogProps) {
  const isEditing = item !== null
  const makeForm = (): Partial<MappedInventory> & {id: string} =>
    item ? {...item, noValidDate: item.noValidDate?.split('T')[0] ?? today} : {...EMPTY, id: crypto.randomUUID()}
  const [form, setForm] = useState(makeForm)
  useEffect(() => {
    if (open) setForm(makeForm())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id])
  function update<K extends keyof MappedInventory>(field: K, value: MappedInventory[K]) {
    setForm(prev => ({...prev, [field]: value}))
  }
  // Auto-fill beNumber when material is selected (for new items)
  function handleMaterialChange(materialId: string) {
    const mat = materials.find(m => m.id === materialId)
    setForm(prev => ({
      ...prev,
      materialId,
      beNumber: prev.beNumber || mat?.beNumber || '',
      shortDescription: prev.shortDescription || mat?.shortDescription || '',
    }))
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? 'Edit Inventory Item' : 'New Inventory Item'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? `Editing ${item.beNumber}` : 'Register a new inventory item linked to a material.'}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={e => {
            e.preventDefault()
            onSave(form)
          }}
          className="flex flex-col gap-5">
          {/* Material */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Material *</Label>
            <Select value={form.materialId ?? ''} onValueChange={handleMaterialChange} required disabled={isEditing}>
              <SelectTrigger className={inputStyles}>
                <SelectValue placeholder="Select material..." />
              </SelectTrigger>
              <SelectContent>
                {materials.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.beNumber} - {m.name ?? m.shortDescription}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* BE Number + Serie Number */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="inv-beNumber" className="text-xs text-muted-foreground">
                BE Number *
              </Label>
              <Input
                id="inv-beNumber"
                className={inputStyles}
                value={form.beNumber ?? ''}
                onChange={e => update('beNumber', e.target.value)}
                placeholder="BE-0001"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="inv-serie" className="text-xs text-muted-foreground">
                Serie Number *
              </Label>
              <Input
                id="inv-serie"
                className={inputStyles}
                value={form.serialNumber ?? ''}
                onChange={e => update('serialNumber', e.target.value)}
                placeholder="SN-0001"
                required
              />
            </div>
          </div>
          {/* Short Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="inv-short" className="text-xs text-muted-foreground">
              Short Description *
            </Label>
            <Input
              id="inv-short"
              className={inputStyles}
              value={form.shortDescription ?? ''}
              onChange={e => update('shortDescription', e.target.value)}
              placeholder="Short description"
              required
            />
          </div>
          {/* Long Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="inv-long" className="text-xs text-muted-foreground">
              Long Description *
            </Label>
            <Textarea
              id="inv-long"
              className={`${inputStyles} resize-none`}
              rows={3}
              value={form.longDescription ?? ''}
              onChange={e => update('longDescription', e.target.value)}
              placeholder="Detailed description..."
              required
            />
          </div>
          {/* Place */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="inv-place" className="text-xs text-muted-foreground">
              Storage Place *
            </Label>
            <Input
              id="inv-place"
              className={inputStyles}
              value={form.place ?? ''}
              onChange={e => update('place', e.target.value)}
              placeholder="e.g. Shelf A3"
              required
            />
          </div>
          {/* Quantities */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="inv-qty" className="text-xs text-muted-foreground">
                In Stock *
              </Label>
              <Input
                id="inv-qty"
                type="number"
                className={inputStyles}
                value={form.quantityInStock ?? 0}
                onChange={e => update('quantityInStock', Number(e.target.value))}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="inv-min" className="text-xs text-muted-foreground">
                Min Stock *
              </Label>
              <Input
                id="inv-min"
                type="number"
                className={inputStyles}
                value={form.minQuantityInStock ?? 0}
                onChange={e => update('minQuantityInStock', Number(e.target.value))}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="inv-max" className="text-xs text-muted-foreground">
                Max Stock *
              </Label>
              <Input
                id="inv-max"
                type="number"
                className={inputStyles}
                value={form.maxQuantityInStock ?? 0}
                onChange={e => update('maxQuantityInStock', Number(e.target.value))}
                required
              />
            </div>
          </div>
          {/* Information */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="inv-info" className="text-xs text-muted-foreground">
              Additional Information *
            </Label>
            <Textarea
              id="inv-info"
              className={`${inputStyles} resize-none`}
              rows={2}
              value={form.information ?? ''}
              onChange={e => update('information', e.target.value)}
              placeholder="Extra notes..."
              required
            />
          </div>
          {/* Valid + No Valid Date */}
          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Valid</Label>
              <div className="flex items-center gap-3 pt-1">
                <Switch checked={form.valid ?? true} onCheckedChange={v => update('valid', v)} />
                <span className="text-sm text-muted-foreground">{form.valid ? 'Yes' : 'No'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="inv-noValidDate" className="text-xs text-muted-foreground">
                Expiry Date *
              </Label>
              <Input
                id="inv-noValidDate"
                type="date"
                className={inputStyles}
                value={form.noValidDate ?? today}
                onChange={e => update('noValidDate', e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEditing ? 'Save changes' : 'Create item'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
