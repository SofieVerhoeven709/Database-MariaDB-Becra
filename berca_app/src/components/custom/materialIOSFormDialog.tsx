'use client'

import React, {useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'

export interface IOSMaterial {
  id: string
  IOSNumber: string
  name: string
  lotNumber: string
  shortDescription: string
  brandName: string
}

interface MaterialIOSFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  material: IOSMaterial | null
  onSave: (material: IOSMaterial) => void
  saving?: boolean
  saveError?: string | null
}

const EMPTY_IOS_MATERIAL: IOSMaterial = {
  id: '',
  IOSNumber: '',
  name: '',
  lotNumber: '',
  shortDescription: '',
  brandName: '',
}

export function MaterialIOSFormDialog({
  open,
  onOpenChange,
  material,
  onSave,
  saving = false,
  saveError = null,
}: MaterialIOSFormDialogProps) {
  const isEditing = material !== null
  const [form, setForm] = useState<IOSMaterial>(
    material ? {...material} : {...EMPTY_IOS_MATERIAL, id: crypto.randomUUID()},
  )

  // Sync form state when dialog opens or switches between materials
  React.useEffect(() => {
    if (open) {
      setForm(material ? {...material} : {...EMPTY_IOS_MATERIAL, id: crypto.randomUUID()})
    }
  }, [open, material])

  function update<K extends keyof IOSMaterial>(field: K, value: IOSMaterial[K]) {
    setForm(prev => ({...prev, [field]: value}))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? 'Edit IOS Material' : 'New IOS Number Material'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Editing ${material?.IOSNumber}`
              : 'Fill in the details to register a new IOS Number material.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={e => {
            e.preventDefault()
            onSave(form)
          }}
          className="flex flex-col gap-5">
          {/* IOS Number */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="IOSNumber" className="text-xs text-muted-foreground">
              IOS Number *
            </Label>
            <Input
              id="IOSNumber"
              value={form.IOSNumber}
              onChange={e => update('IOSNumber', e.target.value)}
              required
              placeholder="Enter IOS Number"
            />
          </div>

          {/* Material Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className="text-xs text-muted-foreground">
              Name *
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              required
              placeholder="Enter name"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="lotNumber" className="text-xs text-muted-foreground">
              Lot Number
            </Label>
            <Input
              id="lotNumber"
              value={form.lotNumber}
              onChange={e => update('lotNumber', e.target.value)}
              placeholder="Enter lot number"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="shortDescription" className="text-xs text-muted-foreground">
              Description
            </Label>
            <Textarea
              id="shortDescription"
              value={form.shortDescription}
              onChange={e => update('shortDescription', e.target.value)}
              placeholder="Enter description"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="brandName" className="text-xs text-muted-foreground">
              Brand Name
            </Label>
            <Input
              id="brandName"
              value={form.brandName}
              onChange={e => update('brandName', e.target.value)}
              placeholder="Enter brand name"
            />
          </div>
          {saveError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {saveError}
            </div>
          )}
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create IOS Material'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
