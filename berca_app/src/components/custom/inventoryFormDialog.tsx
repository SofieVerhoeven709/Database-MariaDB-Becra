'use client'
import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
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

interface MaterialNumberPickerProps {
  materials: MaterialOption[]
  selectedMaterialId: string
  disabled?: boolean
  inputStyles: string
  onSelect: (materialId: string) => void
}

function MaterialNumberPicker({
  materials,
  selectedMaterialId,
  disabled = false,
  inputStyles,
  onSelect,
}: MaterialNumberPickerProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const selectedMaterial = materials.find(m => m.id === selectedMaterialId)

  const filtered = materials.filter(m => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    return (
      m.beNumber.toLowerCase().includes(q) ||
      (m.name ?? '').toLowerCase().includes(q) ||
      m.shortDescription.toLowerCase().includes(q)
    )
  })

  const displayValue = isFocused
    ? search
    : search ||
      (selectedMaterial
        ? `${selectedMaterial.beNumber} - ${selectedMaterial.name ?? selectedMaterial.shortDescription}`
        : '')

  return (
    <div className="relative">
      <Input
        className={inputStyles}
        placeholder="Type materialnumber or name..."
        value={displayValue}
        disabled={disabled}
        onChange={e => {
          setSearch(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => {
          if (disabled) return
          setIsFocused(true)
          setIsOpen(true)
        }}
        onBlur={() => {
          setIsFocused(false)
          setTimeout(() => setIsOpen(false), 150)
        }}
      />
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-56 overflow-y-auto rounded-md border border-border bg-secondary">
          {filtered.map(m => (
            <div
              key={m.id}
              className={`cursor-pointer px-2 py-1.5 text-sm hover:bg-secondary/80 ${selectedMaterialId === m.id ? 'bg-secondary/80 font-semibold' : ''}`}
              onClick={() => {
                onSelect(m.id)
                setSearch('')
                setIsOpen(false)
                setIsFocused(false)
              }}>
              {m.beNumber} - {m.name ?? m.shortDescription}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">Geen materiaal gevonden</div>
          )}
        </div>
      )}
    </div>
  )
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
  }, [open, item?.id])
  function update<K extends keyof MappedInventory>(field: K, value: MappedInventory[K]) {
    setForm(prev => ({...prev, [field]: value}))
  }
  // Autofill beNumber when material is selected (for new items)
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
            <MaterialNumberPicker
              materials={materials}
              selectedMaterialId={form.materialId ?? ''}
              onSelect={handleMaterialChange}
              disabled={isEditing}
              inputStyles={inputStyles}
            />
          </div>
          {/* Material Number (BE/IOS) + Serie Number */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="inv-beNumber" className="text-xs text-muted-foreground">
                Material Number (BE/IOS) *
              </Label>
              <Input
                id="inv-beNumber"
                className={inputStyles}
                value={form.beNumber ?? ''}
                onChange={e => update('beNumber', e.target.value)}
                placeholder="1000943 or 4001234"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="inv-serie" className="text-xs text-muted-foreground">
                Serial Number *
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
              Long Description
            </Label>
            <Textarea
              id="inv-long"
              className={`${inputStyles} resize-none`}
              rows={3}
              value={form.longDescription ?? ''}
              onChange={e => update('longDescription', e.target.value)}
              placeholder="Detailed description..."
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
              Additional Information
            </Label>
            <Textarea
              id="inv-info"
              className={`${inputStyles} resize-none`}
              rows={2}
              value={form.information ?? ''}
              onChange={e => update('information', e.target.value)}
              placeholder="Extra notes..."
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
                Expiry Date
              </Label>
              <Input
                id="inv-noValidDate"
                type="date"
                className={inputStyles}
                value={form.noValidDate ?? today}
                onChange={e => update('noValidDate', e.target.value)}
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
