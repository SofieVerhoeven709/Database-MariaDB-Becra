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
import type {WarehousePlaceOption} from '@/types/warehousePlace'

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

interface ParentPartOption {
  beNumber: string
  shortDescription: string
}

type MaterialDocumentFlags = {
  hasAtex: boolean
  hasCe: boolean
  hasRohs: boolean
  hasDs: boolean
  hasDoc: boolean
  has3dCad: boolean
  has2dCad: boolean
  hasBdoc: boolean
  hasInsp: boolean
}

type MaterialFormState = Partial<MappedMaterial> &
  MaterialDocumentFlags & {
    id: string
    isSerialTracked: boolean
    isParentPart: boolean
  }

interface MaterialFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  material: MappedMaterial | null
  mode?: 'create' | 'edit' | 'duplicate'
  materialGroups: MaterialGroup[]
  units: Unit[]
  supplierCompanies: SupplierCompanyOption[]
  warehousePlaces: WarehousePlaceOption[]
  parentPartOptions?: ParentPartOption[]
  parentPartBeNumbersInUse?: string[]
  onSave: (material: Partial<MappedMaterial> & {id: string}) => void
  saving?: boolean
  saveError?: string | null
}

const inputStyles = 'bg-secondary border-border placeholder:text-muted-foreground/60 focus-visible:ring-accent'

type NumberKind = 'BE' | 'IOS'

function detectNumberKind(value: string | null | undefined): NumberKind {
  const normalized = (value ?? '').trim()
  return normalized.startsWith('4') ? 'IOS' : 'BE'
}

function normalizeMaterialNumber(value: string | null | undefined, kind: NumberKind): string {
  const digits = (value ?? '').replace(/\D/g, '')
  if (!digits) return ''

  // Keep the last 6 digits and enforce series prefix: 1xxxxxx for BE, 4xxxxxx for IOS.
  const tail = digits.length > 6 ? digits.slice(-6) : digits.padStart(6, '0')
  return `${kind === 'IOS' ? '4' : '1'}${tail}`
}

const DOCUMENT_FLAGS: Array<{key: keyof MaterialDocumentFlags; label: string}> = [
  {key: 'hasAtex', label: 'Atex'},
  {key: 'hasCe', label: 'CE'},
  {key: 'hasRohs', label: 'ROHS'},
  {key: 'hasDs', label: 'DS'},
  {key: 'hasDoc', label: 'Doc'},
  {key: 'has3dCad', label: '3D CAD'},
  {key: 'has2dCad', label: '2D CAD'},
  {key: 'hasBdoc', label: 'BDOC'},
  {key: 'hasInsp', label: 'INSP'},
]

const DEFAULT_DOCUMENT_FLAGS: MaterialDocumentFlags = {
  hasAtex: false,
  hasCe: false,
  hasRohs: false,
  hasDs: false,
  hasDoc: false,
  has3dCad: false,
  has2dCad: false,
  hasBdoc: false,
  hasInsp: false,
}

interface PreferredSupplierPickerProps {
  selectedCompanyId: string | null
  onSelect: (companyId: string | null) => void
  availableCompanies: SupplierCompanyOption[]
  inputStyles: string
}

function PreferredSupplierPicker({
  selectedCompanyId,
  onSelect,
  availableCompanies,
  inputStyles,
}: PreferredSupplierPickerProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const filtered = availableCompanies.filter(
    c => c.name.toLowerCase().includes(search.toLowerCase()) || c.number.toLowerCase().includes(search.toLowerCase()),
  )

  const selectedCompany = availableCompanies.find(c => c.id === selectedCompanyId)

  // Show search text if user is typing, otherwise show selected company
  const displayValue = isFocused
    ? search
    : search || (selectedCompany ? `${selectedCompany.name} (${selectedCompany.number})` : '')

  const handleClear = () => {
    onSelect(null)
    setSearch('')
    setIsOpen(false)
  }

  const handleSelect = (companyId: string) => {
    onSelect(companyId)
    setSearch('')
    setIsOpen(false)
    setIsFocused(false)
  }

  return (
    <div className="relative">
      <Input
        className={inputStyles}
        placeholder="Type to search suppliers..."
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
          // Close dropdown after a brief delay to allow click handlers to fire
          setTimeout(() => setIsOpen(false), 150)
        }}
      />
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-secondary border border-border rounded-md max-h-48 overflow-y-auto z-50">
          {selectedCompanyId && (
            <div
              className="px-2 py-1.5 text-sm text-muted-foreground hover:bg-secondary/80 cursor-pointer border-b border-border"
              onClick={() => handleClear()}>
              Clear Selection
            </div>
          )}
          {filtered.map(company => (
            <div
              key={company.id}
              className={`px-2 py-1.5 text-sm cursor-pointer hover:bg-secondary/80 ${
                selectedCompanyId === company.id ? 'bg-secondary/80 font-semibold' : ''
              }`}
              onClick={() => handleSelect(company.id)}>
              {company.name} ({company.number})
            </div>
          ))}
          {filtered.length === 0 && search && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">No suppliers match your search</div>
          )}
          {availableCompanies.length === 0 && !search && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              No suppliers available. Add suppliers first.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const EMPTY_MATERIAL: MaterialFormState = {
  id: '',
  beNumber: '',
  name: null,
  brandOrderNr: '',
  shortDescription: '',
  longDescription: null,
  preferredSupplierCompanyId: null,
  preferredSupplierCompanyName: null,
  preferredSupplierOrderId: null,
  preferredSupplierShortDescription: null,
  supplierCompanyIds: [],
  supplierCompanyNames: [],
  parentBeNumbers: [],
  brandName: null,
  warehousePlace: null,
  rejected: false,
  longLeadTime: false,
  leadTimeValue: null,
  leadTimeUnit: null,
  ...DEFAULT_DOCUMENT_FLAGS,
  materialGroupIdA: '',
  materialGroupIdB: null,
  materialGroupIdC: null,
  materialGroupIdD: null,
  unitId: '',
  isSerialTracked: false,
  isParentPart: false,
}

export function MaterialFormDialog({
  open,
  onOpenChange,
  material,
  mode,
  materialGroups,
  units,
  supplierCompanies,
  warehousePlaces,
  parentPartOptions: _parentPartOptions,
  parentPartBeNumbersInUse = [],
  onSave,
  saving = false,
  saveError = null,
}: MaterialFormDialogProps) {
  const resolvedMode: 'create' | 'edit' | 'duplicate' = mode ?? (material ? 'edit' : 'create')
  const isEditing = resolvedMode === 'edit' && material !== null
  const parentPartLinkCount = parentPartBeNumbersInUse.length

  const makeForm = (): MaterialFormState =>
    material
      ? resolvedMode === 'duplicate'
        ? {...DEFAULT_DOCUMENT_FLAGS, ...material, id: crypto.randomUUID(), beNumber: ''}
        : {...DEFAULT_DOCUMENT_FLAGS, ...material}
      : {...EMPTY_MATERIAL, id: crypto.randomUUID()}

  const [form, setForm] = useState<MaterialFormState>(makeForm)
  const [isParentPartEnabled, setIsParentPartEnabled] = useState(form.isParentPart ?? false)
  const [hasParentParts, setHasParentParts] = useState((form.parentBeNumbers ?? []).length > 0)
  const [parentPartSearch, setParentPartSearch] = useState('')
  const [isSerialTracked, setIsSerialTracked] = useState(form.isSerialTracked ?? false)
  const [numberKind, setNumberKind] = useState<NumberKind>(detectNumberKind(form.beNumber))

  // Sync form state when the dialogue opens or switches between materials.
  // The lint rule warns against sync setState in effects, but this is intentional:
  // we only update when `open` transitions to true or the edited material changes.

  useEffect(() => {
    if (open) {
      const nextForm = makeForm()
      setForm(nextForm)
      setIsParentPartEnabled(nextForm.isParentPart ?? false)
      setHasParentParts((nextForm.parentBeNumbers ?? []).length > 0)
      setParentPartSearch('')
      setIsSerialTracked(nextForm.isSerialTracked ?? false)
      setNumberKind(detectNumberKind(nextForm.beNumber))
    }
  }, [open, material?.id, resolvedMode])

  function update<K extends keyof MappedMaterial>(field: K, value: MappedMaterial[K]) {
    setForm(prev => ({...prev, [field]: value}))
    if (field === 'isSerialTracked') {
      setIsSerialTracked(!!value)
    }
    if (field === 'isParentPart') {
      setIsParentPartEnabled(!!value)
    }
  }

  function updateFlag<K extends keyof MaterialDocumentFlags>(field: K, value: boolean) {
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

  function toggleParentBeNumber(beNumber: string) {
    const current = form.parentBeNumbers ?? []
    const next = current.includes(beNumber) ? current.filter(item => item !== beNumber) : [...current, beNumber]
    update('parentBeNumbers', next)
  }

  function setParentPartsEnabled(enabled: boolean) {
    setHasParentParts(enabled)
    if (!enabled) {
      update('parentBeNumbers', [])
      setParentPartSearch('')
    }
  }

  const filteredParentPartOptions = (_parentPartOptions ?? [])
    .filter(option => option.beNumber !== form.beNumber)
    .filter(option => {
      if (!parentPartSearch) return true
      const q = parentPartSearch.toLowerCase()
      return option.beNumber.toLowerCase().includes(q) || option.shortDescription.toLowerCase().includes(q)
    })

  const selectedSupplierCompanies = supplierCompanies.filter(company =>
    (form.supplierCompanyIds ?? []).includes(company.id),
  )

  const selectedGroupA = materialGroups.find(g => g.id === form.materialGroupIdA) ?? null
  const selectedGroupB = materialGroups.find(g => g.id === form.materialGroupIdB) ?? null
  const selectedGroupC = materialGroups.find(g => g.id === form.materialGroupIdC) ?? null

  const buildUniqueGroupOptions = (
    predicate: (group: MaterialGroup) => boolean,
    labelOf: (group: MaterialGroup) => string | null,
  ) => {
    const byLabel = new Map<string, {id: string; label: string}>()
    for (const group of materialGroups) {
      if (!predicate(group)) continue
      const label = labelOf(group)
      if (!label || byLabel.has(label)) continue
      byLabel.set(label, {id: group.id, label})
    }
    return Array.from(byLabel.values())
  }

  const ensureSelectedOption = (
    options: Array<{id: string; label: string}>,
    selectedId: string | null | undefined,
    selectedLabel: string | null | undefined,
  ) => {
    if (!selectedId || !selectedLabel || options.some(option => option.id === selectedId)) {
      return options
    }
    return [{id: selectedId, label: selectedLabel}, ...options]
  }

  const groupAOptions = ensureSelectedOption(
    buildUniqueGroupOptions(
      () => true,
      group => group.groupA,
    ),
    form.materialGroupIdA,
    selectedGroupA?.groupA,
  )

  const groupBOptions = ensureSelectedOption(
    buildUniqueGroupOptions(
      group => Boolean(group.groupB) && (!selectedGroupA || group.groupA === selectedGroupA.groupA),
      group => group.groupB,
    ),
    form.materialGroupIdB,
    selectedGroupB?.groupB,
  )

  const groupCOptions = ensureSelectedOption(
    buildUniqueGroupOptions(
      group => {
        if (!group.groupC) return false
        if (!selectedGroupA) return true
        if (!selectedGroupB?.groupB) return group.groupA === selectedGroupA.groupA
        return group.groupA === selectedGroupA.groupA && group.groupB === selectedGroupB.groupB
      },
      group => group.groupC,
    ),
    form.materialGroupIdC,
    selectedGroupC?.groupC,
  )

  const selectedGroupD = materialGroups.find(g => g.id === form.materialGroupIdD) ?? null

  const groupDOptions = ensureSelectedOption(
    buildUniqueGroupOptions(
      group => {
        if (!group.groupD) return false
        if (!selectedGroupA) return true
        if (!selectedGroupB?.groupB) return group.groupA === selectedGroupA.groupA
        if (!selectedGroupC?.groupC)
          return group.groupA === selectedGroupA.groupA && group.groupB === selectedGroupB.groupB
        return (
          group.groupA === selectedGroupA.groupA &&
          group.groupB === selectedGroupB.groupB &&
          group.groupC === selectedGroupC.groupC
        )
      },
      group => group.groupD,
    ),
    form.materialGroupIdD,
    selectedGroupD?.groupD,
  )

  function handleGroupAChange(nextId: string) {
    update('materialGroupIdA', nextId)
    update('materialGroupIdB', null)
    update('materialGroupIdC', null)
    update('materialGroupIdD', null)
  }

  function handleGroupBChange(nextId: string | null) {
    update('materialGroupIdB', nextId)
    update('materialGroupIdC', null)
    update('materialGroupIdD', null)
  }

  function handleGroupCChange(nextId: string | null) {
    update('materialGroupIdC', nextId)
    update('materialGroupIdD', null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? 'Edit Material' : resolvedMode === 'duplicate' ? 'Copy Material' : 'New Material'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Editing ${material.beNumber} – ${material.shortDescription}`
              : resolvedMode === 'duplicate'
                ? 'Copied fields loaded. Choose a new number and save as a new material.'
                : 'Fill in the details to register a new material.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={e => {
            e.preventDefault()
            onSave({
              ...form,
              beNumber: normalizeMaterialNumber(form.beNumber, numberKind),
              isParentPart: isParentPartEnabled,
            })
          }}
          className="flex flex-col gap-5">
          {/* Number Type */}
          <div className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2">
            <div className="flex flex-col">
              <Label className="text-xs text-muted-foreground">Nummer type</Label>
              <p className="text-xs text-muted-foreground">Schakel tussen BE en IOS.</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs ${numberKind === 'BE' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                BE
              </span>
              <Switch
                checked={numberKind === 'IOS'}
                onCheckedChange={checked => {
                  const nextKind: NumberKind = checked ? 'IOS' : 'BE'
                  setNumberKind(nextKind)
                  const current = normalizeMaterialNumber(form.beNumber, nextKind)
                  update('beNumber', current || (nextKind === 'IOS' ? '4000000' : '1000000'))
                }}
                aria-label="Nummer type IOS"
              />
              <span
                className={`text-xs ${numberKind === 'IOS' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                IOS
              </span>
            </div>
          </div>

          {/* Be Number */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="beNumber" className="text-xs text-muted-foreground">
              {numberKind} Number
            </Label>
            <p className="text-xs text-muted-foreground">Leave empty for automatically generating of the number</p>
            <Input
              id="beNumber"
              className={inputStyles}
              value={form.beNumber ?? ''}
              onChange={e => update('beNumber', e.target.value)}
              placeholder={numberKind === 'IOS' ? 'bijv. 4000000' : 'bijv. 1000000'}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2">
            <div className="flex flex-col">
              <Label className="text-xs text-muted-foreground">Is parent part</Label>
              <p className="text-xs text-muted-foreground">Toggle to mark this material as a parent part.</p>
            </div>
            <Switch
              checked={isParentPartEnabled}
              onCheckedChange={v => {
                setIsParentPartEnabled(v)
                update('isParentPart', v)
              }}
              aria-label="Is parent part"
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2">
            <div className="flex flex-col">
              <Label className="text-xs text-muted-foreground">Serial Tracked</Label>
              <p className="text-xs text-muted-foreground">Toggle to mark this material as serial tracked.</p>
            </div>
            <Switch
              checked={isSerialTracked}
              onCheckedChange={v => {
                setIsSerialTracked(v)
                update('isSerialTracked', v)
              }}
              aria-label="Serial Tracked"
            />
          </div>
          {/* Material Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="MaterialName" className="text-xs text-muted-foreground">
              Material Name *
            </Label>
            <Input
              id="MaterialName"
              className={inputStyles}
              value={form.name ?? ''}
              onChange={e => update('name', e.target.value)}
              placeholder="Material Name"
              required
            />
          </div>
          {/* Short Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="shortDescription" className="text-xs text-muted-foreground">
              Short Description
            </Label>
            <Input
              id="shortDescription"
              className={inputStyles}
              value={form.shortDescription ?? ''}
              onChange={e => update('shortDescription', e.target.value)}
              placeholder="Short description"
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
          {/* Brand Name + Brand Order No. */}
          <div className="grid grid-cols-2 gap-4">
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="brandOrderNr" className="text-xs text-muted-foreground">
                Brand Order No.
              </Label>
              <Input
                id="brandOrderNr"
                className={inputStyles}
                value={form.brandOrderNr ?? ''}
                onChange={e => update('brandOrderNr', e.target.value || null)}
              />
            </div>
          </div>
          {/* Row 3: MaterialGroup A + Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Material Group A *</Label>
              <Select value={form.materialGroupIdA ?? ''} onValueChange={handleGroupAChange} required>
                <SelectTrigger className={inputStyles}>
                  <SelectValue placeholder="Select group..." />
                </SelectTrigger>
                <SelectContent>
                  {groupAOptions.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.label}
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
                onValueChange={v => handleGroupBChange(v === '__none__' ? null : v)}>
                <SelectTrigger className={inputStyles}>
                  <SelectValue placeholder="Select group..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {groupBOptions.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Material Group C</Label>
              <Select
                value={form.materialGroupIdC ?? '__none__'}
                onValueChange={v => handleGroupCChange(v === '__none__' ? null : v)}>
                <SelectTrigger className={inputStyles}>
                  <SelectValue placeholder="Select group..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {groupCOptions.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 5: Optional Material Group D + Preferred Supplier Order ID */}
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
                  {groupDOptions.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="preferredSupplierOrderId" className="text-xs text-muted-foreground">
                Preferred Supplier Order ID
              </Label>
              <Input
                id="preferredSupplierOrderId"
                className={inputStyles}
                value={typeof form.preferredSupplierOrderId === 'string' ? form.preferredSupplierOrderId : ''}
                onChange={e => update('preferredSupplierOrderId', e.target.value || null)}
                placeholder="e.g. ABC-123"
              />
            </div>
          </div>
          {/* Preferred Supplier Short Description */}
          {/* <div className="flex flex-col gap-2">
            <Label htmlFor="preferredSupplierShortDescription" className="text-xs text-muted-foreground">
              Preferred Supplier Short Description
            </Label>
            <Input
              id="preferredSupplierShortDescription"
              className={inputStyles}
              value={
                typeof form.preferredSupplierShortDescription === 'string' ? form.preferredSupplierShortDescription : ''
              }
              onChange={e => update('preferredSupplierShortDescription', e.target.value || null)}
              placeholder="Short description or notes about the preferred supplier"
            />
          </div>
 */}
          {/* Preferred Supplier Company - Searchable */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Preferred Supplier Company</Label>
            <PreferredSupplierPicker
              selectedCompanyId={form.preferredSupplierCompanyId ?? null}
              onSelect={companyId => update('preferredSupplierCompanyId', companyId)}
              availableCompanies={selectedSupplierCompanies}
              inputStyles={inputStyles}
            />
            {selectedSupplierCompanies.length === 0 ? (
              <p className="text-xs text-muted-foreground">Select at least one supplier first.</p>
            ) : form.preferredSupplierCompanyId ? (
              <p className="text-xs text-muted-foreground">Preferred supplier is selected from your supplier list.</p>
            ) : null}
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
              Select one or more suppliers. Preferred supplier must be selected from this list.
            </p>
          </div>

          {/*Row 6: WarehousePlace */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Warehouse Place</Label>
            <Select
              value={form.warehousePlace ?? '__none__'}
              onValueChange={value => update('warehousePlace', value === '__none__' ? null : value)}>
              <SelectTrigger className={inputStyles}>
                <SelectValue placeholder="Select warehouse place..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {warehousePlaces.map(place => (
                  <SelectItem key={place.id} value={place.id}>
                    {place.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parent Parts Button */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Uses parent parts</Label>
              <Button
                type="button"
                size="sm"
                variant={hasParentParts ? 'default' : 'outline'}
                onClick={() => setParentPartsEnabled(!hasParentParts)}>
                {hasParentParts ? 'Has parent parts' : 'No parent parts'}
              </Button>
            </div>

            {parentPartLinkCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {parentPartLinkCount} parent part link{parentPartLinkCount === 1 ? '' : 's'} are available in the
                current list.
              </p>
            )}

            {hasParentParts && (
              <>
                <Input
                  className={inputStyles}
                  placeholder="Search by BE number or short description"
                  value={parentPartSearch}
                  onChange={e => setParentPartSearch(e.target.value)}
                />
                <div className="rounded-md border border-border bg-secondary/40 p-3 max-h-44 overflow-y-auto space-y-2">
                  {filteredParentPartOptions.map(option => {
                    const checked = (form.parentBeNumbers ?? []).includes(option.beNumber)
                    return (
                      <label
                        key={option.beNumber}
                        className="flex items-center justify-between gap-3 text-sm cursor-pointer">
                        <span className="truncate">
                          <span className="font-mono">{option.beNumber}</span>{' '}
                          <span className="text-muted-foreground">- {option.shortDescription}</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleParentBeNumber(option.beNumber)}
                          className="h-4 w-4"
                        />
                      </label>
                    )
                  })}
                  {filteredParentPartOptions.length === 0 && (
                    <p className="text-xs text-muted-foreground">No parent parts found.</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">A material can have multiple parent parts.</p>
              </>
            )}
          </div>

          {/* Row 5: BE Part Doc + Rejected */}

          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="flex flex-col gap-2">
              {/*
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
              */}
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Rejected</Label>
              <div className="flex items-center gap-3 pt-1">
                <Switch checked={form.rejected ?? false} onCheckedChange={v => update('rejected', v)} />
                <span className="text-sm text-muted-foreground">{form.rejected ? 'Yes' : 'No'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Long Lead Time</Label>
              <div className="flex items-center gap-3 pt-1">
                <Switch
                  checked={form.longLeadTime ?? false}
                  onCheckedChange={v => {
                    update('longLeadTime', v)
                    if (!v) {
                      update('leadTimeValue', null)
                      update('leadTimeUnit', null)
                    }
                  }}
                />
                <span className="text-sm text-muted-foreground">{form.longLeadTime ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/20 p-4">
            <div className="mb-3">
              <Label className="text-xs text-muted-foreground">Document links</Label>
              <p className="text-xs text-muted-foreground/80 mt-1">
                Mark which document types are available for this material.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {DOCUMENT_FLAGS.map(flag => (
                <div
                  key={flag.key}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/40 px-3 py-2">
                  <Label htmlFor={flag.key} className="text-sm text-foreground cursor-pointer">
                    {flag.label}
                  </Label>
                  <div className="flex items-center gap-3">
                    <Switch
                      id={flag.key}
                      checked={Boolean(form[flag.key])}
                      onCheckedChange={v => updateFlag(flag.key, v)}
                    />
                    <span className="text-sm text-muted-foreground">{form[flag.key] ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {form.longLeadTime ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="leadTimeValue" className="text-xs text-muted-foreground">
                  Lead Time Value
                </Label>
                <Input
                  id="leadTimeValue"
                  type="number"
                  min={1}
                  className={inputStyles}
                  value={form.leadTimeValue ?? ''}
                  onChange={e => update('leadTimeValue', e.target.value ? Number(e.target.value) : null)}
                  placeholder="bijv. 5"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">Lead Time Unit</Label>
                <Select
                  value={form.leadTimeUnit ?? '__none__'}
                  onValueChange={value =>
                    update('leadTimeUnit', value === '__none__' ? null : (value as 'days' | 'weeks' | 'months'))
                  }>
                  <SelectTrigger className={inputStyles}>
                    <SelectValue placeholder="Select unit..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
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
