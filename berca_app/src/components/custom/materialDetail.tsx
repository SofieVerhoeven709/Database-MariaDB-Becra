'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowLeft, Check, Pencil, X, Save} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Switch} from '@/components/ui/switch'
import {MATERIAL_DOCUMENT_FLAGS} from '@/components/custom/materialDocumentFlags'
import {updateMaterialAction, restoreMaterialAction} from '@/serverFunctions/materials'
import type {WarehousePlaceOption} from '@/types/warehousePlace'

interface InventoryItem {
  id: string
  beNumber: string
  place: string | null
  quantityInStock: number
  minQuantityInStock: number
  maxQuantityInStock: number
  serialNumber: string | null
  information: string | null
  valid: boolean
  noValidDate: string
  inventoryStructures: InventoryStructureItem[]
}

interface InventoryStructureItem {
  id: string
  inventoryPlaceId: string
  place: string | null
  warehousePlaceId: string | null
  information: string | null
  coordinate: boolean
  inventoryId: string
  forInventory: boolean
  forProject: boolean
  active: boolean
  materialActive: boolean
  valid: boolean
  createdAt: string
  createdBy: string
}

interface MappedMaterialDetail {
  id: string
  beNumber: string
  name: string | null
  brandOrderNr: string | null
  shortDescription: string
  longDescription: string | null
  supplierCompanyId: string | null
  supplierCompanyName: string | null
  brandName: string | null
  warehousePlace: string | null
  rejected: boolean | null
  partApproved: boolean
  longLeadTime: boolean
  leadTimeValue: number | null
  leadTimeUnit: 'days' | 'weeks' | 'months' | null
  hasAtex: boolean
  hasCe: boolean
  hasRohs: boolean
  hasDs: boolean
  hasDoc: boolean
  has3dCad: boolean
  has2dCad: boolean
  hasBdoc: boolean
  hasInsp: boolean
  materialGroupIdA: string | null
  materialGroupIdB: string | null
  materialGroupIdC: string | null
  materialGroupIdD: string | null
  materialGroupLabelA: string
  materialGroupLabelB: string
  materialGroupLabelC: string
  materialGroupLabelD: string
  materialGroupLabel: string
  unitId: string
  unitName: string
  unitAbbreviation: string
  createdBy: string
  createdByName: string
  createdAt: string | null
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  inventoryItems: InventoryItem[]
  parentBeNumbers: string[]
  isParentPart: boolean
  isSerialTracked: boolean
}

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

interface MaterialDetailProps {
  material: MappedMaterialDetail
  materialGroups: MaterialGroup[]
  units: Unit[]
  supplierCompanies: SupplierCompanyOption[]
  warehousePlaces?: WarehousePlaceOption[]
}

const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'
const thClass = 'whitespace-nowrap text-xs'
const inputStyles = 'bg-secondary border-border placeholder:text-muted-foreground/60 focus-visible:ring-accent'

function formatDate(iso: string | null | undefined) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function formatWarehousePlace(place: WarehousePlaceOption) {
  return [place.abbreviation, place.place, place.shelf, place.column, place.layer, place.layerPlace]
    .filter(Boolean)
    .join(' - ')
}

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

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function sanitizeFileName(value: string) {
  const normalized = (value || '').trim().replace(/[^a-zA-Z0-9-_]+/g, '-')
  return normalized.replace(/^-+|-+$/g, '') || 'material'
}

function formatMaterialActionErrors(errors: Record<string, string[] | undefined> | undefined): string {
  const fieldLabels: Record<string, string> = {
    beNumber: 'Material number',
    shortDescription: 'Short description',
    materialGroupIdA: 'Material group',
    unitId: 'Unit',
    warehousePlace: 'Warehouse place',
  }

  const messages = Object.entries(errors ?? {}).flatMap(([field, errs]) => {
    if (!errs?.length) return []
    if (field === 'global') return errs
    return errs.map(error => `${fieldLabels[field] ?? field}: ${error}`)
  })

  return messages.join(' | ')
}

export function MaterialDetail({
  material,
  materialGroups,
  units,
  supplierCompanies,
  warehousePlaces = [],
}: MaterialDetailProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [numberKind, setNumberKind] = useState<NumberKind>(detectNumberKind(material.beNumber))
  const [saving, setSaving] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [form, setForm] = useState({
    beNumber: material.beNumber,
    name: material.name ?? '',
    brandOrderNr: material.brandOrderNr ?? '',
    shortDescription: material.shortDescription,
    longDescription: material.longDescription ?? '',
    supplierCompanyId: material.supplierCompanyId ?? '',
    brandName: material.brandName ?? '',
    warehousePlace: material.warehousePlace ?? '',
    rejected: material.rejected ?? false,
    partApproved: material.partApproved ?? false,
    longLeadTime: material.longLeadTime ?? false,
    leadTimeValue: material.leadTimeValue ?? null,
    leadTimeUnit: (material.leadTimeUnit ?? null) as MappedMaterialDetail['leadTimeUnit'],
    isSerialTracked: material.isSerialTracked ?? false,
    isParentPart: (material.parentBeNumbers && material.parentBeNumbers.length > 0) ?? false,
    hasAtex: material.hasAtex ?? false,
    hasCe: material.hasCe ?? false,
    hasRohs: material.hasRohs ?? false,
    hasDs: material.hasDs ?? false,
    hasDoc: material.hasDoc ?? false,
    has3dCad: material.has3dCad ?? false,
    has2dCad: material.has2dCad ?? false,
    hasBdoc: material.hasBdoc ?? false,
    hasInsp: material.hasInsp ?? false,
    materialGroupIdA: material.materialGroupIdA ?? '',
    materialGroupIdB: material.materialGroupIdB,
    materialGroupIdC: material.materialGroupIdC,
    materialGroupIdD: material.materialGroupIdD,
    unitId: material.unitId,
  })

  function handleField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(f => ({...f, [key]: value}))
  }

  function applyNumberKind(nextKind: NumberKind) {
    setNumberKind(nextKind)
    setForm(prev => {
      return {
        ...prev,
        beNumber: '',
      }
    })
  }

  const warehousePlaceById = new Map(warehousePlaces.map(place => [place.id, place]))
  const selectedSupplierCompany = supplierCompanies.find(company => company.id === form.supplierCompanyId) ?? null

  const resolvedWarehousePlace = form.warehousePlace ? (warehousePlaceById.get(form.warehousePlace) ?? null) : null


  function formatInventoryStructureLocation(structure: InventoryStructureItem) {
    const warehousePlace = structure.warehousePlaceId
      ? (warehousePlaceById.get(structure.warehousePlaceId) ?? null)
      : null
    const warehouseLabel = warehousePlace
      ? formatWarehousePlace(warehousePlace)
      : structure.place || structure.warehousePlaceId || structure.inventoryPlaceId
    const statusParts = [structure.coordinate ? 'coordinate' : 'no coordinate', structure.valid ? 'valid' : 'invalid']

    return [
      warehouseLabel ?? '-',
      `inventoryPlaceId: ${structure.inventoryPlaceId}`,
      `inventoryId: ${structure.inventoryId}`,
      ...statusParts,
    ]
      .filter(Boolean)
      .join(' | ')
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const fd = new FormData()
      const rawBeNumber = (form.beNumber ?? '').trim()
      const existingBeNumber = (material.beNumber ?? '').trim()
      const beNumber =
        numberKind === 'IOS' || (detectNumberKind(material.beNumber) === 'IOS' && numberKind === 'BE')
          ? ''
          : rawBeNumber === existingBeNumber
            ? material.beNumber
            : normalizeMaterialNumber(rawBeNumber, numberKind)

      fd.append('id', material.id)
      fd.append('numberType', numberKind)
      fd.append('beNumber', beNumber)
      if (form.name) fd.append('name', form.name)
      fd.append('brandOrderNr', form.brandOrderNr ?? '')
      fd.append('shortDescription', form.shortDescription)
      if (form.longDescription) fd.append('longDescription', form.longDescription)
      if (form.supplierCompanyId) {
        fd.append('supplierCompanyId', form.supplierCompanyId)
      } else {
        fd.append('supplierCompanyId', '')
      }
      if (form.brandName) fd.append('brandName', form.brandName)
      if (form.warehousePlace) fd.append('warehousePlace', form.warehousePlace)
      fd.append('rejected', String(form.rejected))
      fd.append('partApproved', String(form.partApproved))
      fd.append('longLeadTime', String(form.longLeadTime))
      if (form.longLeadTime) {
        if (form.leadTimeValue !== null) fd.append('leadTimeValue', String(form.leadTimeValue))
        if (form.leadTimeUnit) fd.append('leadTimeUnit', form.leadTimeUnit)
      }
      fd.append('isSerialTracked', String(form.isSerialTracked))
      fd.append('isParentPart', String(form.isParentPart))
      fd.append('hasAtex', String(form.hasAtex))
      fd.append('hasCe', String(form.hasCe))
      fd.append('hasRohs', String(form.hasRohs))
      fd.append('hasDs', String(form.hasDs))
      fd.append('hasDoc', String(form.hasDoc))
      fd.append('has3dCad', String(form.has3dCad))
      fd.append('has2dCad', String(form.has2dCad))
      fd.append('hasBdoc', String(form.hasBdoc))
      fd.append('hasInsp', String(form.hasInsp))
      fd.append('materialGroupIdA', form.materialGroupIdA)
      fd.append('materialGroupIdB', form.materialGroupIdB ?? '')
      fd.append('materialGroupIdC', form.materialGroupIdC ?? '')
      fd.append('materialGroupIdD', form.materialGroupIdD ?? '')
      fd.append('unitId', form.unitId)

      const result = await updateMaterialAction({success: false}, fd)
      if (result && !result.success) {
        setSaveError(
          formatMaterialActionErrors(result.errors) ||
            'Could not save the material. Please check the highlighted fields and try again.',
        )
        return
      }

      setEditing(false)
      router.refresh()
    } catch {
      setSaveError('An unexpected error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRestore() {
    if (!confirm('Restore this material?')) return
    setRestoring(true)
    try {
      const fd = new FormData()
      fd.append('id', material.id)
      await restoreMaterialAction({success: false}, fd)
      router.refresh()
    } finally {
      setRestoring(false)
    }
  }

  // Label functions for each level
  const selectedGroupA = materialGroups.find(g => g.id === form.materialGroupIdA) ?? null
  const selectedGroupB = materialGroups.find(g => g.id === form.materialGroupIdB) ?? null
  const selectedGroupC = materialGroups.find(g => g.id === form.materialGroupIdC) ?? null
  const selectedGroupD = materialGroups.find(g => g.id === form.materialGroupIdD) ?? null

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
    handleField('materialGroupIdA', nextId)
    handleField('materialGroupIdB', null)
    handleField('materialGroupIdC', null)
    handleField('materialGroupIdD', null)
  }

  function handleGroupBChange(nextId: string | null) {
    handleField('materialGroupIdB', nextId)
    handleField('materialGroupIdC', null)
    handleField('materialGroupIdD', null)
  }

  function handleGroupCChange(nextId: string | null) {
    handleField('materialGroupIdC', nextId)
    handleField('materialGroupIdD', null)
  }

  const totalStock = material.inventoryItems.reduce((s, i) => s + i.quantityInStock, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold leading-tight">{material.name ?? material.beNumber}</h1>
            <p className="text-sm text-muted-foreground font-mono">{material.beNumber}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {material.deleted ? (
              <Badge variant="destructive">Deleted</Badge>
            ) : material.rejected ? (
              <Badge variant="destructive">Rejected</Badge>
            ) : (
              <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-0">Active</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {material.deleted ? (
            <Button size="sm" onClick={handleRestore} disabled={restoring} className="bg-green-600 hover:bg-green-700">
              <Check className="h-3.5 w-3.5 mr-1" />
              {restoring ? 'Restoring…' : 'Restore'}
            </Button>
          ) : editing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditing(false)
                  setSaveError(null)
                }}
                disabled={saving}>
                <X className="h-3.5 w-3.5 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-3.5 w-3.5 mr-1" />
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {material.deleted && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          This material is soft deleted. You can restore it using the button above.
          <div className="mt-1 text-xs text-muted-foreground">
            Deleted at: {formatDate(material.deletedAt)} · Deleted by: {material.deletedBy ?? '-'}
          </div>
        </div>
      )}

      {saveError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {saveError}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="inventory">
            Inventory
            <Badge variant="secondary" className="ml-2 text-xs">
              {totalStock}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Details tab */}
        <TabsContent value="details" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-6 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label className="text-xs text-muted-foreground">{numberKind} Number</Label>
              {editing ? (
                <div className="space-y-2">
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
                        aria-label="Number type IOS"
                      />
                      <span
                        className={`text-xs ${numberKind === 'IOS' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        IOS
                      </span>
                    </div>
                  </div>
                  <Input
                    value={form.beNumber}
                    onChange={e => handleField('beNumber', e.target.value)}
                    placeholder={numberKind === 'IOS' ? 'Automatically generated' : 'e.g. 1002000'}
                    disabled={numberKind === 'IOS' || (detectNumberKind(material.beNumber) === 'IOS' && numberKind === 'BE')}
                  />
                </div>
              ) : (
                <p className="text-sm font-mono font-medium">{material.beNumber}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label className="text-xs text-muted-foreground">Short Description</Label>
              {editing ? (
                <Input
                  className={inputStyles}
                  value={form.shortDescription}
                  onChange={e => handleField('shortDescription', e.target.value)}
                />
              ) : (
                <p className="text-sm">{material.shortDescription}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label className="text-xs text-muted-foreground">Long Description</Label>
              {editing ? (
                <Textarea
                  className={`${inputStyles} resize-none`}
                  value={form.longDescription}
                  onChange={e => handleField('longDescription', e.target.value)}
                  rows={3}
                  placeholder="—"
                />
              ) : (
                <p className="text-sm whitespace-pre-wrap">
                  {material.longDescription ?? <span className="text-muted-foreground">—</span>}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Brand Name</Label>
              {editing ? (
                <Input
                  className={inputStyles}
                  value={form.brandName}
                  onChange={e => handleField('brandName', e.target.value)}
                  placeholder="—"
                />
              ) : (
                <p className="text-sm">{material.brandName ?? <span className="text-muted-foreground">—</span>}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Brand Order No.</Label>
              {editing ? (
                <Input
                  className={inputStyles}
                  value={form.brandOrderNr ?? ''}
                  onChange={e => handleField('brandOrderNr', e.target.value)}
                />
              ) : (
                <p className="text-sm">{material.brandOrderNr}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label className="text-xs text-muted-foreground">Brand Short Description</Label>
              {editing ? (
                <Input
                  className={inputStyles}
                  value={form.name}
                  onChange={e => handleField('name', e.target.value)}
                  placeholder="—"
                />
              ) : (
                <p className="text-sm">{material.name ?? <span className="text-muted-foreground">—</span>}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label className="text-xs text-muted-foreground">Supplier</Label>
              {editing ? (
                <div className="space-y-2">
                  <Select
                    value={form.supplierCompanyId || undefined}
                    onValueChange={v => handleField('supplierCompanyId', v)}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {supplierCompanies.map(company => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name} ({company.number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="rounded-md border border-border bg-secondary/20 overflow-hidden">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="w-28 text-xs text-muted-foreground">Name</TableCell>
                          <TableCell className="text-sm">{selectedSupplierCompany?.name ?? '-'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="w-28 text-xs text-muted-foreground">Number</TableCell>
                          <TableCell className="text-sm">{selectedSupplierCompany?.number ?? '-'}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : material.supplierCompanyName ? (
                <p className="text-sm">{material.supplierCompanyName}</p>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Material Group A</Label>
              {editing ? (
                <Select value={form.materialGroupIdA} onValueChange={handleGroupAChange}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupAOptions.map(g => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm">
                  {material.materialGroupLabelA || <span className="text-muted-foreground">—</span>}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Material Group B</Label>
              {editing ? (
                <Select
                  value={form.materialGroupIdB ?? '__none__'}
                  onValueChange={v => handleGroupBChange(v === '__none__' ? null : v)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select group" />
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
              ) : (
                <p className="text-sm">
                  {material.materialGroupLabelB || <span className="text-muted-foreground">—</span>}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Material Group C</Label>
              {editing ? (
                <Select
                  value={form.materialGroupIdC ?? '__none__'}
                  onValueChange={v => handleGroupCChange(v === '__none__' ? null : v)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select group" />
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
              ) : (
                <p className="text-sm">
                  {material.materialGroupLabelC || <span className="text-muted-foreground">—</span>}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Material Group D</Label>
              {editing ? (
                <Select
                  value={form.materialGroupIdD ?? '__none__'}
                  onValueChange={v => handleField('materialGroupIdD', v === '__none__' ? null : v)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select group" />
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
              ) : (
                <p className="text-sm">
                  {material.materialGroupLabelD || <span className="text-muted-foreground">—</span>}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Unit</Label>
              {editing ? (
                <Select value={form.unitId} onValueChange={v => handleField('unitId', v)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.unitName} ({u.abbreviation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm">
                  {material.unitName}
                  <span className="text-muted-foreground text-xs ml-1">({material.unitAbbreviation})</span>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              {/*<Label className="text-xs text-muted-foreground">Warehouse Place</Label>*/}
              <Label className="text-xs text-muted-foreground">Warehouse Coordinates</Label>
              {editing ? (
                <div className="space-y-2">
                  <Select
                    value={form.warehousePlace || '__none__'}
                    onValueChange={value => handleField('warehousePlace', value === '__none__' ? '' : value)}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select warehouse place" />
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
                  {resolvedWarehousePlace && (
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>Abbr: {resolvedWarehousePlace.abbreviation ?? '-'}</p>
                      {/*<p>Place: {resolvedWarehousePlace.place ?? '-'}</p>
                      <p>Shelf: {resolvedWarehousePlace.shelf ?? '-'}</p>
                      <p>Column: {resolvedWarehousePlace.column ?? '-'}</p>
                      <p>Layer: {resolvedWarehousePlace.layer ?? '-'}</p>
                      <p>Layer place: {resolvedWarehousePlace.layerPlace ?? '-'}</p>*/}
                      <p>Warehouse: {resolvedWarehousePlace.place ?? '-'}</p>
                      <p>X: {resolvedWarehousePlace.shelf ?? '-'}</p>
                      <p>Y: {resolvedWarehousePlace.column ?? '-'}</p>
                      <p>Z: {resolvedWarehousePlace.layer ?? '-'}</p>
                      <p>Position: {resolvedWarehousePlace.layerPlace ?? '-'}</p>
                    </div>
                  )}
                </div>
              ) : resolvedWarehousePlace ? (
                <div className="text-sm space-y-0.5">
                  <p>Abbr: {resolvedWarehousePlace.abbreviation ?? '-'}</p>
                  {/*<p>Place: {resolvedWarehousePlace.place ?? '-'}</p>
                  <p>Shelf: {resolvedWarehousePlace.shelf ?? '-'}</p>
                  <p>Column: {resolvedWarehousePlace.column ?? '-'}</p>
                  <p>Layer: {resolvedWarehousePlace.layer ?? '-'}</p>
                  <p>Layer place: {resolvedWarehousePlace.layerPlace ?? '-'}</p>*/}
                  <p>Warehouse: {resolvedWarehousePlace.place ?? '-'}</p>
                  <p>X: {resolvedWarehousePlace.shelf ?? '-'}</p>
                  <p>Y: {resolvedWarehousePlace.column ?? '-'}</p>
                  <p>Z: {resolvedWarehousePlace.layer ?? '-'}</p>
                  <p>Position: {resolvedWarehousePlace.layerPlace ?? '-'}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Rejected</Label>
              {editing ? (
                <div className="flex items-center gap-2 h-9">
                  <Switch checked={form.rejected} onCheckedChange={v => handleField('rejected', v)} />
                  <span className="text-sm text-muted-foreground">{form.rejected ? 'Yes' : 'No'}</span>
                </div>
              ) : (
                <p className="text-sm">{material.rejected ? 'Yes' : 'No'}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Serial Tracked</Label>
              {editing ? (
                <div className="flex items-center gap-2 h-9">
                  <Switch checked={form.isSerialTracked} onCheckedChange={v => handleField('isSerialTracked', v)} />
                  <span className="text-sm text-muted-foreground">{form.isSerialTracked ? 'Yes' : 'No'}</span>
                </div>
              ) : (
                <p className="text-sm">{material.isSerialTracked ? 'Yes' : 'No'}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Part Approved</Label>
              {editing ? (
                <div className="flex items-center gap-2 h-9">
                  <Switch checked={form.partApproved} onCheckedChange={v => handleField('partApproved', v)} />
                  <span className="text-sm text-muted-foreground">{form.partApproved ? 'Yes' : 'No'}</span>
                </div>
              ) : (
                <p className="text-sm">{material.partApproved ? 'Yes' : 'No'}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2 rounded-md border border-border bg-secondary/20 p-3">
              <Label className="text-xs text-muted-foreground">Long Lead Time</Label>
              {editing ? (
                <div className="flex items-center gap-2 h-9">
                  <Switch
                    checked={form.longLeadTime}
                    onCheckedChange={v => {
                      handleField('longLeadTime', v)
                      if (!v) {
                        handleField('leadTimeValue', null)
                        handleField('leadTimeUnit', null)
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">{form.longLeadTime ? 'Yes' : 'No'}</span>
                </div>
              ) : (
                <p className="text-sm">{material.longLeadTime ? 'Yes' : 'No'}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label className="text-xs text-muted-foreground">Lead Time Period</Label>
              {editing ? (
                form.longLeadTime ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      value={form.leadTimeValue ?? ''}
                      onChange={e => handleField('leadTimeValue', e.target.value ? Number(e.target.value) : null)}
                      className="w-28"
                      placeholder="Value"
                    />
                    <Select
                      value={form.leadTimeUnit ?? '__none__'}
                      onValueChange={v =>
                        handleField(
                          'leadTimeUnit',
                          (v === '__none__' ? null : v) as unknown as (typeof form)['leadTimeUnit'],
                        )
                      }>
                      <SelectTrigger className="bg-secondary border-border w-32">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {/*<SelectItem value="days">Days</SelectItem>*/}
                        <SelectItem value="weeks">Weeks</SelectItem>
                        <SelectItem value="months">Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Enable Long Lead Time first.</p>
                )
              ) : material.longLeadTime && material.leadTimeValue && material.leadTimeUnit ? (
                <p className="text-sm">
                  {material.leadTimeValue} {material.leadTimeUnit}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>

            {/* Document Flags Section */}
            <div className="md:col-span-2 rounded-lg border border-border bg-secondary/20 p-4">
              <div className="mb-3">
                <Label className="text-xs text-muted-foreground">Document links</Label>
                <p className="text-xs text-muted-foreground/80 mt-1">
                  Mark which document types are available for this material.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {MATERIAL_DOCUMENT_FLAGS.map(flag => (
                  <div
                    key={flag.key}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/40 px-3 py-2">
                    <Label className="text-sm text-foreground">{flag.label}</Label>
                    {editing ? (
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={(form as any)[flag.key]}
                          onCheckedChange={v => handleField(flag.key as any, v)}
                        />
                        <span className="text-sm text-muted-foreground">{(form as any)[flag.key] ? 'Yes' : 'No'}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {(material as any)[flag.key] ? 'Yes' : 'No'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Is Parent Part</Label>
              {editing ? (
                <div className="flex items-center gap-2 h-9">
                  <Switch checked={form.isParentPart} onCheckedChange={v => handleField('isParentPart', v)} />
                  <span className="text-sm text-muted-foreground">{form.isParentPart ? 'Yes' : 'No'}</span>
                </div>
              ) : (
                <p className="text-sm">
                  {material.parentBeNumbers && material.parentBeNumbers.length > 0 ? 'Yes' : 'No'}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Created by <span className="font-medium text-foreground">{material.createdByName || '-'}</span>
                {' on '}
                <span className="font-medium text-foreground">{formatDate(material.createdAt)}</span>
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Inventory tab */}
        <TabsContent value="inventory" className="mt-4">
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead className={thClass}>BE Number</TableHead>
                  <TableHead className={thClass}>Location</TableHead>
                  <TableHead className={thClass}>In Stock</TableHead>
                  <TableHead className={thClass}>Min</TableHead>
                  <TableHead className={thClass}>Max</TableHead>
                  <TableHead className={thClass}>Serial No.</TableHead>
                  <TableHead className={thClass}>Valid Until</TableHead>
                  <TableHead className={thClass}>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {material.inventoryItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                      No inventory records found for this material
                    </TableCell>
                  </TableRow>
                ) : (
                  material.inventoryItems.map(inv => (
                    <TableRow key={inv.id} className="hover:bg-secondary/50">
                      <TableCell className={`${tdClass} font-mono`}>{inv.beNumber}</TableCell>
                      <TableCell className={tdClass}>
                        <div className="space-y-1">
                          <p>{inv.place ?? <span className="text-muted-foreground">—</span>}</p>
                          {inv.inventoryStructures.length > 0 && (
                            <div className="space-y-1 text-xs text-muted-foreground">
                              {inv.inventoryStructures.map(structure => (
                                <div
                                  key={structure.id}
                                  className="rounded-md border border-border bg-secondary/30 px-2 py-1">
                                  <p className="font-mono">{formatInventoryStructureLocation(structure)}</p>
                                  {structure.information && (
                                    <p className="whitespace-pre-wrap">{structure.information}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-semibold">{inv.quantityInStock}</TableCell>
                      <TableCell className={tdClass}>{inv.minQuantityInStock}</TableCell>
                      <TableCell className={tdClass}>{inv.maxQuantityInStock}</TableCell>
                      <TableCell className={tdClass}>
                        {inv.serialNumber ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className={tdClass}>{formatDate(inv.noValidDate)}</TableCell>
                      <TableCell>
                        {inv.valid ? (
                          <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-0 text-xs">
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            Invalid
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {material.inventoryItems.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Total stock: <span className="font-semibold text-foreground">{totalStock}</span>{' '}
              {material.unitAbbreviation} across {material.inventoryItems.length} location
              {material.inventoryItems.length !== 1 ? 's' : ''}
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
