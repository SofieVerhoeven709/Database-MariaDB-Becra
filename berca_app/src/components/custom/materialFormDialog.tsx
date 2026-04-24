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
  onSave: (material: Partial<MappedMaterial> & {id: string; numberType?: NumberKind}) => void
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

function formatSupplierLabel(company: SupplierCompanyOption): string {
  return `${company.name} (${company.number})`
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


const EMPTY_MATERIAL: MaterialFormState = {
  id: '',
  beNumber: '',
  name: null,
  brandOrderNr: '',
  shortDescription: '',
  longDescription: null,
  supplierCompanyId: null,
  supplierCompanyName: null,
  parentBeNumbers: [],
  brandName: null,
  warehousePlace: null,
  rejected: false,
  partApproved: false,
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

  const getInitialNumberKind = (nextForm: MaterialFormState): NumberKind =>
    resolvedMode === 'duplicate' && material ? detectNumberKind(material.beNumber) : detectNumberKind(nextForm.beNumber)

  const [form, setForm] = useState<MaterialFormState>(makeForm)
  const [isParentPartEnabled, setIsParentPartEnabled] = useState(form.isParentPart ?? false)
  const [hasParentParts, setHasParentParts] = useState((form.parentBeNumbers ?? []).length > 0)
  const [parentPartSearch, setParentPartSearch] = useState('')
  const [supplierSearch, setSupplierSearch] = useState('')
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false)
  const [isSerialTracked, setIsSerialTracked] = useState(form.isSerialTracked ?? false)
  const [numberKind, setNumberKind] = useState<NumberKind>(getInitialNumberKind(form))

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
      const selectedSupplier = supplierCompanies.find(company => company.id === nextForm.supplierCompanyId)
      setSupplierSearch(selectedSupplier ? formatSupplierLabel(selectedSupplier) : '')
      setIsSupplierDropdownOpen(false)
      setIsSerialTracked(nextForm.isSerialTracked ?? false)
      setNumberKind(getInitialNumberKind(nextForm))
    }
  }, [open, material?.id, resolvedMode, supplierCompanies])

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

  function applyNumberKind(nextKind: NumberKind) {
    setNumberKind(nextKind)
    setForm(prev => {
      const current = normalizeMaterialNumber(prev.beNumber, nextKind)
      return {
        ...prev,
        beNumber: current,
      }
    })
  }

  function toggleParentBeNumber(beNumber: string) {
    setForm(prev => {
      const current = prev.parentBeNumbers ?? []
      const next = current.includes(beNumber) ? current.filter(item => item !== beNumber) : [...current, beNumber]
      return {...prev, parentBeNumbers: next}
    })
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

  const filteredSupplierCompanies = supplierCompanies.filter(company => {
    if (!supplierSearch) return true
    const q = supplierSearch.toLowerCase()
    return (
      company.name.toLowerCase().includes(q) ||
      company.number.toLowerCase().includes(q) ||
      formatSupplierLabel(company).toLowerCase().includes(q)
    )
  })

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
              numberType: numberKind,
              isParentPart: isParentPartEnabled,
            })
          }}
          className="flex flex-col gap-5">
          {/* Number Type */}
          <div className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2">
            <div className="flex flex-col">
              <Label className="text-xs text-muted-foreground">Number type</Label>
              <p className="text-xs text-muted-foreground">Switch between BE and IOS.</p>
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
                  applyNumberKind(nextKind)
                }}
                aria-label="Toggle number type (BE/IOS)"
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
            <p className="text-xs text-muted-foreground">Leave empty to auto-generate the number.</p>
            <Input
              id="beNumber"
              className={inputStyles}
              value={form.beNumber ?? ''}
              onChange={e => update('beNumber', e.target.value)}
              placeholder={numberKind === 'IOS' ? 'e.g. 4000000' : 'e.g. 1000000'}
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
            <Label htmlFor="materialName" className="text-xs text-muted-foreground">
              Material Name *
            </Label>
            <Input
              id="materialName"
              className={inputStyles}
              value={form.name ?? ''}
              onChange={e => update('name', e.target.value)}
              placeholder="Material name"
              required
            />
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

          {/* Row 5: Optional Material Group D */}
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
          </div>

          {/* Supplier Company */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Supplier Company</Label>
            <div className="relative">
              <Input
                className={inputStyles}
                placeholder="Search suppliers by name or number"
                value={supplierSearch}
                onFocus={() => setIsSupplierDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsSupplierDropdownOpen(false), 120)}
                onChange={e => {
                  const next = e.target.value
                  setSupplierSearch(next)
                  setIsSupplierDropdownOpen(true)

                  const selectedSupplier = supplierCompanies.find(company => company.id === form.supplierCompanyId)
                  if (selectedSupplier && next !== formatSupplierLabel(selectedSupplier)) {
                    update('supplierCompanyId', null)
                  }
                }}
              />

              {isSupplierDropdownOpen && filteredSupplierCompanies.length > 0 && (
                <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-border bg-card shadow-sm">
                  {filteredSupplierCompanies.map(company => (
                    <button
                      key={company.id}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-secondary"
                      onMouseDown={e => {
                        e.preventDefault()
                        update('supplierCompanyId', company.id)
                        setSupplierSearch(formatSupplierLabel(company))
                        setIsSupplierDropdownOpen(false)
                      }}>
                      {formatSupplierLabel(company)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {supplierCompanies.length === 0 ? (
              <p className="text-xs text-muted-foreground">No suppliers available. Add suppliers first.</p>
            ) : isSupplierDropdownOpen && supplierSearch.trim().length > 0 && filteredSupplierCompanies.length === 0 ? (
              <p className="text-xs text-muted-foreground">No suppliers match your search.</p>
            ) : null}
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
              <Label className="text-xs text-muted-foreground">Part Approved</Label>
              <div className="flex items-center gap-3 pt-1">
                <Switch checked={form.partApproved ?? false} onCheckedChange={v => update('partApproved', v)} />
                <span className="text-sm text-muted-foreground">{form.partApproved ? 'Yes' : 'No'}</span>
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
                  placeholder="5"
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
