'use client'
import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import type {MappedWarehousePlace} from '@/types/warehousePlace'

interface WarehousePlaceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: MappedWarehousePlace | null
  onSave: (item: Partial<MappedWarehousePlace> & {id: string}) => Promise<void>
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

export function WarehousePlaceFormDialog({open, onOpenChange, item, onSave}: WarehousePlaceFormDialogProps) {
  const isEditing = item !== null
  const makeForm = (): Partial<MappedWarehousePlace> & {id: string} =>
    item ? {...item} : {...EMPTY, id: crypto.randomUUID()}
  const [form, setForm] = useState(makeForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(makeForm())
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id])

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
          {/* Abbreviation + BE Number */}
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
                BE Number
              </Label>
              <Input
                id="wp-beNumber"
                className={inputStyles}
                value={form.beNumber ?? ''}
                onChange={e => update('beNumber', e.target.value)}
                placeholder="e.g. 1000943"
              />
            </div>
          </div>

          {/* Place + Shelf */}
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

          {/* Shelf + Column */}
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

          {/* Layer + Layer Place */}
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

          {/* Quantity in Stock */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="wp-quantityInStock" className="text-xs text-muted-foreground">
              Quantity in Stock *
            </Label>
            <Input
              id="wp-quantityInStock"
              type="number"
              min={0}
              className={inputStyles}
              value={form.quantityInStock ?? 0}
              onChange={e => update('quantityInStock', Number(e.target.value))}
              required
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
