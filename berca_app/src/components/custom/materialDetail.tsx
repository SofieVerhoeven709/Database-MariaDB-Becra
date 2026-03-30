'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowLeft, Pencil, X, Save} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Switch} from '@/components/ui/switch'
import {updateMaterialAction} from '@/serverFunctions/materials'

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
}

interface MappedMaterialDetail {
  id: string
  beNumber: string
  name: string | null
  brandOrderNr: string | null
  shortDescription: string
  longDescription: string | null
  preferredSupplierCompanyId: string | null
  preferredSupplierCompanyName: string | null
  preferredSupplierOrderId: string | null
  preferredSupplierShortDescription: string | null
  supplierCompanyIds: string[]
  supplierCompanyNames: string[]
  brandName: string | null
  documentationPlace: string | null
  bePartDoc: number | null
  rejected: boolean | null
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
  nonBeNumberItems: any[] // TODO: type properly
  serialTrackedStructure?: any
}

const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'
const thClass = 'whitespace-nowrap text-xs'

function formatDate(iso: string | null | undefined) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

export function MaterialDetail({
  material,
  materialGroups,
  units,
  supplierCompanies,
  nonBeNumberItems,
}: MaterialDetailProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [form, setForm] = useState({
    beNumber: material.beNumber,
    name: material.name ?? '',
    brandOrderNr: material.brandOrderNr ?? '',
    shortDescription: material.shortDescription,
    longDescription: material.longDescription ?? '',
    preferredSupplierCompanyId: material.preferredSupplierCompanyId ?? '__none__',
    preferredSupplierOrderId: material.preferredSupplierOrderId ?? '',
    preferredSupplierShortDescription: material.preferredSupplierShortDescription ?? '',
    supplierCompanyIds: material.supplierCompanyIds ?? [],
    brandName: material.brandName ?? '',
    documentationPlace: material.documentationPlace ?? '',
    bePartDoc: material.bePartDoc !== null ? material.bePartDoc : ('' as number | ''),
    rejected: material.rejected ?? false,
    isSerialTracked: material.isSerialTracked ?? false,
    isParentPart: (material.parentBeNumbers && material.parentBeNumbers.length > 0) ?? false,
    materialGroupIdA: material.materialGroupIdA ?? '',
    materialGroupIdB: material.materialGroupIdB,
    materialGroupIdC: material.materialGroupIdC,
    materialGroupIdD: material.materialGroupIdD,
    unitId: material.unitId,
  })

  function handleField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(f => ({...f, [key]: value}))
  }

  function toggleSupplier(companyId: string) {
    const next = form.supplierCompanyIds.includes(companyId)
      ? form.supplierCompanyIds.filter(id => id !== companyId)
      : [...form.supplierCompanyIds, companyId]
    handleField('supplierCompanyIds', next)

    if (form.preferredSupplierCompanyId !== '__none__' && !next.includes(form.preferredSupplierCompanyId)) {
      handleField('preferredSupplierCompanyId', '__none__')
    }
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const fd = new FormData()
      fd.append('id', material.id)
      fd.append('beNumber', form.beNumber)
      if (form.name) fd.append('name', form.name)
      fd.append('brandOrderNr', form.brandOrderNr ?? '')
      fd.append('shortDescription', form.shortDescription)
      if (form.longDescription) fd.append('longDescription', form.longDescription)
      if (form.preferredSupplierCompanyId !== '__none__') {
        fd.append('preferredSupplierCompanyId', form.preferredSupplierCompanyId)
      }
      if (form.preferredSupplierOrderId) fd.append('preferredSupplierOrderId', form.preferredSupplierOrderId)
      if (form.preferredSupplierShortDescription)
        fd.append('preferredSupplierShortDescription', form.preferredSupplierShortDescription)
      form.supplierCompanyIds.forEach(id => fd.append('supplierCompanyIds', id))
      if (form.brandName) fd.append('brandName', form.brandName)
      if (form.documentationPlace) fd.append('documentationPlace', form.documentationPlace)
      if (form.bePartDoc !== '') fd.append('bePartDoc', String(form.bePartDoc))
      fd.append('rejected', String(form.rejected))
      fd.append('isSerialTracked', String(form.isSerialTracked))
      fd.append('isParentPart', String(form.isParentPart))
      fd.append('materialGroupIdA', form.materialGroupIdA)
      fd.append('materialGroupIdB', form.materialGroupIdB ?? '')
      fd.append('materialGroupIdC', form.materialGroupIdC ?? '')
      fd.append('materialGroupIdD', form.materialGroupIdD ?? '')
      fd.append('unitId', form.unitId)

      const result = await updateMaterialAction({success: false}, fd)
      if (result && !result.success) {
        const msgs = Object.entries(result.errors ?? {}).flatMap(([field, errs]) =>
          (errs ?? []).map((e: string) => `${field}: ${e}`),
        )
        setSaveError(msgs.length ? msgs.join(' | ') : 'Could not save. Please check all required fields.')
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
          {material.rejected ? (
            <Badge variant="destructive">Rejected</Badge>
          ) : (
            <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-0">Active</Badge>
          )}
        </div>
        <div className="flex gap-2">
          {editing ? (
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
          <TabsTrigger value="nonBeNumbers">Non BE-numbers</TabsTrigger>
        </TabsList>

        {/* Details tab */}
        <TabsContent value="details" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-6 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label className="text-xs text-muted-foreground">BE Number</Label>
              {editing ? (
                <Input value={form.beNumber} onChange={e => handleField('beNumber', e.target.value)} />
              ) : (
                <p className="text-sm font-mono font-medium">{material.beNumber}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label className="text-xs text-muted-foreground">Short Description</Label>
              {editing ? (
                <Input value={form.shortDescription} onChange={e => handleField('shortDescription', e.target.value)} />
              ) : (
                <p className="text-sm">{material.shortDescription}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label className="text-xs text-muted-foreground">Long Description</Label>
              {editing ? (
                <Textarea
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
                <Input value={form.brandOrderNr ?? ''} onChange={e => handleField('brandOrderNr', e.target.value)} />
              ) : (
                <p className="text-sm">{material.brandOrderNr}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label className="text-xs text-muted-foreground">Brand Short Description</Label>
              {editing ? (
                <Input value={form.name} onChange={e => handleField('name', e.target.value)} placeholder="—" />
              ) : (
                <p className="text-sm">{material.name ?? <span className="text-muted-foreground">—</span>}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Preferred Supplier Order ID</Label>
              {editing ? (
                <Input
                  value={form.preferredSupplierOrderId}
                  onChange={e => handleField('preferredSupplierOrderId', e.target.value)}
                  placeholder="e.g. ABC-123"
                />
              ) : (
                <p className="text-sm">
                  {material.preferredSupplierOrderId ?? <span className="text-muted-foreground">—</span>}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label className="text-xs text-muted-foreground">Preferred Supplier Short Description</Label>
              {editing ? (
                <Input
                  value={form.preferredSupplierShortDescription}
                  onChange={e => handleField('preferredSupplierShortDescription', e.target.value)}
                  placeholder="Short description or notes"
                />
              ) : (
                <p className="text-sm">
                  {material.preferredSupplierShortDescription ?? <span className="text-muted-foreground">—</span>}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Preferred Supplier Company</Label>
              {editing ? (
                <Select
                  value={form.preferredSupplierCompanyId}
                  onValueChange={v => handleField('preferredSupplierCompanyId', v)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select preferred supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {form.supplierCompanyIds.map(id => {
                      const company = supplierCompanies.find(c => c.id === id)
                      if (!company) return null
                      return (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name} ({company.number})
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm">
                  {material.preferredSupplierCompanyName ?? <span className="text-muted-foreground">—</span>}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label className="text-xs text-muted-foreground">Suppliers</Label>
              {editing ? (
                <div className="rounded-md border border-border bg-secondary/40 p-3 max-h-44 overflow-y-auto space-y-2">
                  {supplierCompanies.map(company => {
                    const checked = form.supplierCompanyIds.includes(company.id)
                    return (
                      <label
                        key={company.id}
                        className="flex items-center justify-between gap-3 text-sm cursor-pointer">
                        <span>
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
              ) : material.supplierCompanyNames.length > 0 ? (
                <p className="text-sm">{material.supplierCompanyNames.join(', ')}</p>
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
              <Label className="text-xs text-muted-foreground">Documentation Place</Label>
              {editing ? (
                <Input
                  value={form.documentationPlace}
                  onChange={e => handleField('documentationPlace', e.target.value)}
                  placeholder="—"
                />
              ) : (
                <p className="text-sm">
                  {material.documentationPlace ?? <span className="text-muted-foreground">—</span>}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">BE Part Doc</Label>
              {editing ? (
                <Input
                  type="number"
                  value={form.bePartDoc === '' ? '' : String(form.bePartDoc)}
                  onChange={e => handleField('bePartDoc', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="—"
                />
              ) : (
                <p className="text-sm">{material.bePartDoc ?? <span className="text-muted-foreground">—</span>}</p>
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
                Created by <span className="font-medium text-foreground">{material.createdByName}</span>
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
                        {inv.place ?? <span className="text-muted-foreground">—</span>}
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

        {/* Non BE-numbers tab */}
        <TabsContent value="nonBeNumbers" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-6">
            {nonBeNumberItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">No non-BE-number items found for this material.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={thClass}>BE Number</TableHead>
                    <TableHead className={thClass}>Short Description</TableHead>
                    <TableHead className={thClass}>Brand</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nonBeNumberItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className={tdClass}>
                        {item.beNumber ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className={tdClass}>
                        {item.shortDescription ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className={tdClass}>
                        {item.brandName ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
