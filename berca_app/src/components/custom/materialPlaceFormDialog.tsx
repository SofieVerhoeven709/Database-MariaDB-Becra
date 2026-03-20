'use client'
import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import type {MappedMaterialPlace} from '@/types/materialPlace'

interface MaterialPlaceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: MappedMaterialPlace | null
  onSave: (item: Partial<MappedMaterialPlace> & {id: string}) => Promise<void>
}

const inputStyles = 'bg-secondary border-border placeholder:text-muted-foreground/60 focus-visible:ring-accent'

const EMPTY: Partial<MappedMaterialPlace> & {id: string} = {
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

export function MaterialPlaceFormDialog({open, onOpenChange, item, onSave}: MaterialPlaceFormDialogProps) {
  const isEditing = item !== null
  const makeForm = (): Partial<MappedMaterialPlace> & {id: string} =>
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

  function update<K extends keyof MappedMaterialPlace>(field: K, value: MappedMaterialPlace[K]) {
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
          <DialogTitle className="text-foreground">{isEditing ? 'Edit Material Place' : 'New Material Place'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Editing place: ${item.abbreviation ?? item.id}` : 'Register a new material storage location.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="mp-abbreviation" className="text-xs text-muted-foreground">
                Abbreviation *
              </Label>
              <Input
                id="mp-abbreviation"
                className={inputStyles}
                value={form.abbreviation ?? ''}
                onChange={e => update('abbreviation', e.target.value)}
                placeholder="e.g. M140C800R70"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="mp-beNumber" className="text-xs text-muted-foreground">
                BE Number
              </Label>
              <Input
                id="mp-beNumber"
                className={inputStyles}
                value={form.beNumber ?? ''}
                onChange={e => update('beNumber', e.target.value)}
                placeholder="e.g. 1000943"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="mp-place" className="text-xs text-muted-foreground">
                Place
              </Label>
              <Input
                id="mp-place"
                className={inputStyles}
                value={form.place ?? ''}
                onChange={e => update('place', e.target.value)}
                placeholder="e.g. Warehouse A"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="mp-shelf" className="text-xs text-muted-foreground">
                Shelf
              </Label>
              <Input
                id="mp-shelf"
                className={inputStyles}
                value={form.shelf ?? ''}
                onChange={e => update('shelf', e.target.value)}
                placeholder="e.g. Shelf 1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="mp-column" className="text-xs text-muted-foreground">
                Column
              </Label>
              <Input
                id="mp-column"
                className={inputStyles}
                value={form.column ?? ''}
                onChange={e => update('column', e.target.value)}
                placeholder="e.g. Column B"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="mp-layer" className="text-xs text-muted-foreground">
                Layer
              </Label>
              <Input
                id="mp-layer"
                className={inputStyles}
                value={form.layer ?? ''}
                onChange={e => update('layer', e.target.value)}
                placeholder="e.g. Layer 2"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="mp-layerPlace" className="text-xs text-muted-foreground">
              Layer Place
            </Label>
            <Input
              id="mp-layerPlace"
              className={inputStyles}
              value={form.layerPlace ?? ''}
              onChange={e => update('layerPlace', e.target.value)}
              placeholder="e.g. Position 3"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="mp-quantityInStock" className="text-xs text-muted-foreground">
              Quantity in Stock *
            </Label>
            <Input
              id="mp-quantityInStock"
              type="number"
              min={0}
              className={inputStyles}
              value={form.quantityInStock ?? 0}
              onChange={e => update('quantityInStock', Number(e.target.value))}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="mp-information" className="text-xs text-muted-foreground">
              Information
            </Label>
            <Input
              id="mp-information"
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
                {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Create material place'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

