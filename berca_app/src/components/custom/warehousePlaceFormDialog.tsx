'use client'
import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import type {MappedWarehousePlace} from '@/types/warehousePlace'
import {createMaterialForPlaceAction} from '@/serverFunctions/materials'

type MaterialOption = {id: string; beNumber: string; name: string | null; shortDescription: string}

interface WarehousePlaceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: MappedWarehousePlace | null
  materials: MaterialOption[]
  onSave: (item: Partial<MappedWarehousePlace> & {id: string}) => Promise<void>
}

interface MaterialNumberPickerProps {
  selectedBeNumber: string
  materials: MaterialOption[]
  inputStyles: string
  onSelect: (beNumber: string) => void
}

function MaterialNumberPicker({selectedBeNumber, materials, inputStyles, onSelect}: MaterialNumberPickerProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const selectedMaterial = materials.find(m => m.beNumber === selectedBeNumber)

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
        : selectedBeNumber)

  return (
    <div className="relative">
      <Input
        className={inputStyles}
        placeholder="Type materialnumber or name..."
        value={displayValue}
        onChange={e => {
          setSearch(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => {
          setIsFocused(true)
          setIsOpen(true)
        }}
        onBlur={() => {
          setIsFocused(false)
          setTimeout(() => setIsOpen(false), 150)
        }}
      />
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-56 overflow-y-auto rounded-md border border-border bg-secondary">
          <div
            className="cursor-pointer border-b border-border px-2 py-1.5 text-sm text-muted-foreground hover:bg-secondary/80"
            onClick={() => {
              onSelect('')
              setSearch('')
              setIsOpen(false)
              setIsFocused(false)
            }}>
            No material
          </div>
          {filtered.map(m => (
            <div
              key={m.id}
              className={`cursor-pointer px-2 py-1.5 text-sm hover:bg-secondary/80 ${selectedBeNumber === m.beNumber ? 'bg-secondary/80 font-semibold' : ''}`}
              onClick={() => {
                onSelect(m.beNumber)
                setSearch('')
                setIsOpen(false)
                setIsFocused(false)
              }}>
              {m.beNumber} - {m.name ?? m.shortDescription}
            </div>
          ))}
          {filtered.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">No material found</div>}
        </div>
      )}
    </div>
  )
}

const inputStyles = 'bg-secondary border-border placeholder:text-muted-foreground/60 focus-visible:ring-accent'

const EMPTY: Partial<MappedWarehousePlace> & {id: string} = {
  id: '',
  abbreviation: '',
  beNumber: '',
  serialTrackedId: '',
  place: '',
  shelf: '',
  column: '',
  layer: '',
  layerPlace: '',
  information: '',
  quantityInStock: 0,
}

export function WarehousePlaceFormDialog({open, onOpenChange, item, materials, onSave}: WarehousePlaceFormDialogProps) {
  const isEditing = item !== null
  const makeForm = (): Partial<MappedWarehousePlace> & {id: string} =>
    item ? {...item} : {...EMPTY, id: crypto.randomUUID()}
  const [form, setForm] = useState(makeForm)
  const [materialOptions, setMaterialOptions] = useState<MaterialOption[]>(materials)
  const [saving, setSaving] = useState(false)
  const [creatingMaterial, setCreatingMaterial] = useState(false)
  const [showCreateMaterial, setShowCreateMaterial] = useState(false)
  const [newMaterialBeNumber, setNewMaterialBeNumber] = useState('')
  const [newMaterialName, setNewMaterialName] = useState('')
  const [newMaterialShortDescription, setNewMaterialShortDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [materialError, setMaterialError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(makeForm())
      setMaterialOptions(materials)
      setError(null)
      setMaterialError(null)
      setShowCreateMaterial(false)
      setNewMaterialBeNumber('')
      setNewMaterialName('')
      setNewMaterialShortDescription('')
    }
  }, [open, item?.id])

  useEffect(() => {
    setMaterialOptions(materials)
  }, [materials])

  function update<K extends keyof MappedWarehousePlace>(field: K, value: MappedWarehousePlace[K]) {
    setForm(prev => ({...prev, [field]: value}))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave(form)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong, please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateMaterial() {
    setMaterialError(null)
    const beNumber = newMaterialBeNumber.trim()
    const shortDescription = newMaterialShortDescription.trim()
    const name = newMaterialName.trim()

    if (!/^(1\d{6}|4\d{6})$/.test(beNumber)) {
      setMaterialError('Use a valid BE/IOS number (1000000 or 4000000).')
      return
    }
    if (!shortDescription) {
      setMaterialError('Short description is mandatory.')
      return
    }

    setCreatingMaterial(true)
    try {
      const created = await createMaterialForPlaceAction({
        id: crypto.randomUUID(),
        beNumber,
        shortDescription,
        name: name || undefined,
      })
      const createdOption: MaterialOption = {
        id: created.id,
        beNumber: created.beNumber ?? '',
        name: created.name,
        shortDescription: created.shortDescription,
      }
      setMaterialOptions(prev => {
        if (prev.some(m => m.beNumber === createdOption.beNumber)) return prev
        return [createdOption, ...prev]
      })
      update('beNumber', createdOption.beNumber)
      setShowCreateMaterial(false)
      setNewMaterialBeNumber('')
      setNewMaterialName('')
      setNewMaterialShortDescription('')
    } catch (err) {
      setMaterialError(err instanceof Error ? err.message : "Couldn't create material, please try again.")
    } finally {
      setCreatingMaterial(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? 'Edit Warehouse Place' : 'New Warehouse Place'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Editing place: ${item.abbreviation ?? item.id}`
              : 'Register a new warehouse storage location.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Abbreviation + Material Number (BE/IOS) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="wp-abbreviation" className="text-xs text-muted-foreground">
                Abbreviation *
              </Label>
              <Input
                id="wp-abbreviation"
                className={inputStyles}
                value={form.abbreviation ?? ''}
                onChange={e => update('abbreviation', e.target.value)}
                placeholder="e.g. W140C800R70"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="wp-beNumber" className="text-xs text-muted-foreground">
                Material Number (BE/IOS)
              </Label>
              <MaterialNumberPicker
                selectedBeNumber={form.beNumber ?? ''}
                materials={materialOptions}
                inputStyles={inputStyles}
                onSelect={beNumber => update('beNumber', beNumber)}
              />
              <div className="pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateMaterial(v => !v)}>
                  {showCreateMaterial ? 'Cancel new material' : 'Create new material'}
                </Button>
              </div>
              {showCreateMaterial && (
                <div className="rounded-md border border-border bg-secondary/40 p-3 flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="new-material-be" className="text-xs text-muted-foreground">
                        BE/IOS nummer
                      </Label>
                      <Input
                        id="new-material-be"
                        className={inputStyles}
                        value={newMaterialBeNumber}
                        onChange={e => setNewMaterialBeNumber(e.target.value)}
                        placeholder="1000001 or 4000001"
                        disabled={creatingMaterial}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="new-material-name" className="text-xs text-muted-foreground">
                        Name
                      </Label>
                      <Input
                        id="new-material-name"
                        className={inputStyles}
                        value={newMaterialName}
                        onChange={e => setNewMaterialName(e.target.value)}
                        placeholder="Optional"
                        disabled={creatingMaterial}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="new-material-short" className="text-xs text-muted-foreground">
                      Short description *
                    </Label>
                    <Input
                      id="new-material-short"
                      className={inputStyles}
                      value={newMaterialShortDescription}
                      onChange={e => setNewMaterialShortDescription(e.target.value)}
                      placeholder="Short Description"
                      disabled={creatingMaterial}
                    />
                  </div>
                  {materialError && <p className="text-xs text-destructive">{materialError}</p>}
                  <div className="flex justify-end">
                    <Button type="button" size="sm" onClick={handleCreateMaterial} disabled={creatingMaterial}>
                      {creatingMaterial ? 'Creating...' : 'Creating material and selecting'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* X + Y */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="wp-x" className="text-xs text-muted-foreground">
                X
              </Label>
              <Input
                id="wp-x"
                className={inputStyles}
                value={form.place ?? ''}
                onChange={e => update('place', e.target.value)}
                placeholder="e.g. Warehouse A"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="wp-y" className="text-xs text-muted-foreground">
                Y
              </Label>
              <Input
                id="wp-y"
                className={inputStyles}
                value={form.shelf ?? ''}
                onChange={e => update('shelf', e.target.value)}
                placeholder="e.g. Shelf 1"
              />
            </div>
          </div>

          {/* Z */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="wp-z" className="text-xs text-muted-foreground">
              Z
            </Label>
            <Input
              id="wp-z"
              className={inputStyles}
              value={form.column ?? ''}
              onChange={e => update('column', e.target.value)}
              placeholder="e.g. Column B"
            />
          </div>

          {/*
          Legacy location fields kept as fallback for later use:

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="wp-place" className="text-xs text-muted-foreground">
                Place
              </Label>
              <Input
                id="wp-place"
                className={inputStyles}
                value={form.place ?? ''}
                onChange={e => update('place', e.target.value)}
                placeholder="e.g. Warehouse A"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="wp-shelf" className="text-xs text-muted-foreground">
                Shelf
              </Label>
              <Input
                id="wp-shelf"
                className={inputStyles}
                value={form.shelf ?? ''}
                onChange={e => update('shelf', e.target.value)}
                placeholder="e.g. Shelf 1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="wp-shelf" className="text-xs text-muted-foreground">
                Shelf
              </Label>
              <Input
                id="wp-shelf"
                className={inputStyles}
                value={form.shelf ?? ''}
                onChange={e => update('shelf', e.target.value)}
                placeholder="e.g. Shelf 1"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="wp-column" className="text-xs text-muted-foreground">
                Column
              </Label>
              <Input
                id="wp-column"
                className={inputStyles}
                value={form.column ?? ''}
                onChange={e => update('column', e.target.value)}
                placeholder="e.g. Column B"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="wp-layer" className="text-xs text-muted-foreground">
                Layer
              </Label>
              <Input
                id="wp-layer"
                className={inputStyles}
                value={form.layer ?? ''}
                onChange={e => update('layer', e.target.value)}
                placeholder="e.g. Layer 2"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="wp-layerPlace" className="text-xs text-muted-foreground">
                Layer Place
              </Label>
              <Input
                id="wp-layerPlace"
                className={inputStyles}
                value={form.layerPlace ?? ''}
                onChange={e => update('layerPlace', e.target.value)}
                placeholder="e.g. Position 3"
              />
            </div>
          </div>
          */}

          {/* Quantity in Stock */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="wp-quantityInStock" className="text-xs text-muted-foreground">
              Quantity in Stock
            </Label>
            <Input
              id="wp-quantityInStock"
              type="number"
              min={0}
              className={inputStyles}
              value={form.quantityInStock ?? 0}
              onChange={e => update('quantityInStock', Number(e.target.value))}
              /*required*/
            />
          </div>

          {/* Information */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="wp-information" className="text-xs text-muted-foreground">
              Information
            </Label>
            <Input
              id="wp-information"
              className={inputStyles}
              value={form.information ?? ''}
              onChange={e => update('information', e.target.value)}
              placeholder="Additional notes..."
            />
          </div>

          <DialogFooter className="pt-2 flex-col gap-2">
            {error && <p className="text-sm text-destructive w-full">{error}</p>}
            <div className="flex justify-end gap-2 w-full">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Create place'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
