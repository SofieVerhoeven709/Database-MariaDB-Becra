'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import type {MappedMaterial} from '@/types/material'

interface MaterialGroup {
  id: string
  groupA: string
  groupB: string | null
  groupC: string | null
  groupD: string | null
}

interface Unit {
  id: string
  unitName: string
  abbreviation: string
}

interface SupplierCompanyOption {
  id: string
  name: string
  number: string
}

interface MaterialFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  material: MappedMaterial | null
  materialGroups: MaterialGroup[]
  units: Unit[]
  supplierCompanies: SupplierCompanyOption[]
  onSave: (material: Partial<MappedMaterial> & {id: string}) => void
  saving?: boolean
  saveError?: string | null
}

const inputStyles = 'bg-secondary border-border placeholder:text-muted-foreground/60 focus-visible:ring-accent'

function groupLabel(group: MaterialGroup) {
  return [group.groupA, group.groupB, group.groupC, group.groupD].filter(Boolean).join(' / ')
}

const EMPTY_MATERIAL: Partial<MappedMaterial> & {id: string} = {
  id: '',
  beNumber: '',
  name: null,
  brandOrderNr: '',
  shortDescription: '',
  longDescription: null,
  preferredSupplierCompanyId: null,
  preferredSupplierName: null,
  supplierCompanyIds: [],
  supplierCompanyNames: [],
  brandName: null,
  documentationPlace: null,
  bePartDoc: null,
  rejected: false,
  materialGroupIdA: '',
  materialGroupIdB: null,
  materialGroupIdC: null,
  materialGroupIdD: null,
  unitId: '',
}

export function MaterialFormDialog({
  open,
  onOpenChange,
  material,
  materialGroups,
  units,
  supplierCompanies,
  onSave,
  saving = false,
  saveError = null,
}: MaterialFormDialogProps) {
  const isEditing = material !== null

  const makeForm = (): Partial<MappedMaterial> & {id: string} =>
    material ? {...material} : {...EMPTY_MATERIAL, id: crypto.randomUUID()}

  const [form, setForm] = useState<Partial<MappedMaterial> & {id: string}>(makeForm)

  // Sync form state when the dialogue opens or switches between materials.
  // The lint rule warns against sync setState in effects, but this is intentional:
  // we only update when `open` transitions to true or the edited material changes.

  useEffect(() => {
    if (open) setForm(makeForm())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, material?.id])

  function update<K extends keyof MappedMaterial>(field: K, value: MappedMaterial[K]) {
    setForm(prev => ({...prev, [field]: value}))
  }

  function toggleSupplier(companyId: string) {
    const current = form.supplierCompanyIds ?? []
    const next = current.includes(companyId) ? current.filter(id => id !== companyId) : [...current, companyId]
    update('supplierCompanyIds', next)

    if (form.preferredSupplierCompanyId && !next.includes(form.preferredSupplierCompanyId)) {
      update('preferredSupplierCompanyId', null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEditing ? 'Edit Material' : 'New Material'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Editing ${material.beNumber} – ${material.shortDescription}`
              : 'Fill in the details to register a new material.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={e => {
            e.preventDefault()
            onSave(form)
          }}
          className="flex flex-col gap-5">
          {/* Row 1: BE Number + Brand Order Nr */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="beNumber" className="text-xs text-muted-foreground">
                BE Number
              </Label>
              <p className="text-xs text-muted-foreground">Leeg laten voor automatische generatie</p>
              <Input
                id="beNumber"
                className={inputStyles}
                value={form.beNumber ?? ''}
                onChange={e => update('beNumber', e.target.value)}
                placeholder="Leeg laten = automatisch genereren"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="brandOrderNr" className="text-xs text-muted-foreground">
                Brand Order Nr *
              </Label>
              <Input
                id="brandOrderNr"
                className={inputStyles}
                value={form.brandOrderNr ?? ''}
                onChange={e => update('brandOrderNr', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Row 2: Material Name + Brand Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="text-xs text-muted-foreground">
                Name
              </Label>
              <Input
                id="name"
                className={inputStyles}
                value={form.name ?? ''}
                onChange={e => update('name', e.target.value || null)}
                placeholder="Material name"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="brandName" className="text-xs text-muted-foreground">
                Brand Name
              </Label>
              <Input
                id="brandName"
                className={inputStyles}
                value={form.brandName ?? ''}
                onChange={e => update('brandName', e.target.value || null)}
                placeholder="Brand name"
              />
            </div>
          </div>

          {/* Short Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="shortDescription" className="text-xs text-muted-foreground">
              Short Description *
            </Label>
            <Input
              id="shortDescription"
              className={inputStyles}
              value={form.shortDescription ?? ''}
              onChange={e => update('shortDescription', e.target.value)}
              placeholder="Short description"
              required
            />
          </div>

          {/* Long Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="longDescription" className="text-xs text-muted-foreground">
              Long Description
            </Label>
            <Textarea
              id="longDescription"
              className={`${inputStyles} resize-none`}
              rows={3}
              value={form.longDescription ?? ''}
              onChange={e => update('longDescription', e.target.value || null)}
              placeholder="Detailed description..."
            />
          </div>

          {/* Row 3: MaterialGroup A + Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Material Group A *</Label>
              <Select value={form.materialGroupIdA ?? ''} onValueChange={v => update('materialGroupIdA', v)} required>
                <SelectTrigger className={inputStyles}>
                  <SelectValue placeholder="Select group..." />
                </SelectTrigger>
                <SelectContent>
                  {materialGroups.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {groupLabel(g)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Unit *</Label>
              <Select value={form.unitId ?? ''} onValueChange={v => update('unitId', v)} required>
                <SelectTrigger className={inputStyles}>
                  <SelectValue placeholder="Select unit..." />
                </SelectTrigger>
                <SelectContent>
                  {units.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.unitName} ({u.abbreviation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 4: Optional Material Group B/C */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Material Group B</Label>
              <Select
                value={form.materialGroupIdB ?? '__none__'}
                onValueChange={v => update('materialGroupIdB', v === '__none__' ? null : v)}>
                <SelectTrigger className={inputStyles}>
                  <SelectValue placeholder="Select group..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {materialGroups.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {groupLabel(g)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Material Group C</Label>
              <Select
                value={form.materialGroupIdC ?? '__none__'}
                onValueChange={v => update('materialGroupIdC', v === '__none__' ? null : v)}>
                <SelectTrigger className={inputStyles}>
                  <SelectValue placeholder="Select group..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {materialGroups.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {groupLabel(g)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 5: Optional Material Group D + Preferred Supplier */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Material Group D</Label>
              <Select
                value={form.materialGroupIdD ?? '__none__'}
                onValueChange={v => update('materialGroupIdD', v === '__none__' ? null : v)}>
                <SelectTrigger className={inputStyles}>
                  <SelectValue placeholder="Select group..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {materialGroups.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {groupLabel(g)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="preferredSupplierCompanyId" className="text-xs text-muted-foreground">
                Preferred Supplier
              </Label>
              <Select
                value={form.preferredSupplierCompanyId ?? '__none__'}
                onValueChange={v => update('preferredSupplierCompanyId', v === '__none__' ? null : v)}>
                <SelectTrigger className={inputStyles}>
                  <SelectValue placeholder="Select preferred supplier..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {(form.supplierCompanyIds ?? []).map(companyId => {
                    const company = supplierCompanies.find(c => c.id === companyId)
                    if (!company) return null
                    return (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name} ({company.number})
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 6: Documentation Place */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2" />
            <div className="flex flex-col gap-2">
              <Label htmlFor="documentationPlace" className="text-xs text-muted-foreground">
                Documentation Place
              </Label>
              <Input
                id="documentationPlace"
                className={inputStyles}
                value={form.documentationPlace ?? ''}
                onChange={e => update('documentationPlace', e.target.value || null)}
                placeholder="e.g. SharePoint / Cabinet A"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Suppliers</Label>
            <div className="rounded-md border border-border bg-secondary/40 p-3 max-h-44 overflow-y-auto space-y-2">
              {supplierCompanies.map(company => {
                const checked = (form.supplierCompanyIds ?? []).includes(company.id)
                return (
                  <label key={company.id} className="flex items-center justify-between gap-3 text-sm cursor-pointer">
                    <span className="truncate">
                      {company.name} <span className="text-muted-foreground">({company.number})</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSupplier(company.id)}
                      className="h-4 w-4"
                    />
                  </label>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Select one or more suppliers. Preferred supplier is chosen from this selection.
            </p>
          </div>

          {/* Row 5: BE Part Doc + Rejected */}
          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="flex flex-col gap-2">
              <Label htmlFor="bePartDoc" className="text-xs text-muted-foreground">
                BE Part Doc
              </Label>
              <Input
                id="bePartDoc"
                type="number"
                className={inputStyles}
                value={form.bePartDoc ?? ''}
                onChange={e => update('bePartDoc', e.target.value ? Number(e.target.value) : null)}
                placeholder="Doc reference"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Rejected</Label>
              <div className="flex items-center gap-3 pt-1">
                <Switch checked={form.rejected ?? false} onCheckedChange={v => update('rejected', v)} />
                <span className="text-sm text-muted-foreground">{form.rejected ? 'Yes' : 'No'}</span>
              </div>
            </div>
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
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create material'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
