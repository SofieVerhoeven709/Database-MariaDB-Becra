'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowLeft, Pencil, X, Save} from 'lucide-react'
import Link from 'next/link'
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
  brandOrderNr: number
  shortDescription: string
  longDescription: string | null
  preferredSupplier: string | null
  brandName: string | null
  documentationPlace: string | null
  bePartDoc: number | null
  rejected: boolean | null
  materialGroupId: string
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

interface MaterialDetailProps {
  material: MappedMaterialDetail
  materialGroups: MaterialGroup[]
  units: Unit[]
}

const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'
const thClass = 'whitespace-nowrap text-xs'

function formatDate(iso: string | null | undefined) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

export function MaterialDetail({material, materialGroups, units}: MaterialDetailProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [form, setForm] = useState({
    beNumber: material.beNumber,
    name: material.name ?? '',
    brandOrderNr: material.brandOrderNr,
    shortDescription: material.shortDescription,
    longDescription: material.longDescription ?? '',
    preferredSupplier: material.preferredSupplier ?? '',
    brandName: material.brandName ?? '',
    documentationPlace: material.documentationPlace ?? '',
    bePartDoc: material.bePartDoc !== null ? material.bePartDoc : ('' as number | ''),
    rejected: material.rejected ?? false,
    materialGroupId: material.materialGroupId,
    unitId: material.unitId,
  })

  function handleField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(f => ({...f, [key]: value}))
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const fd = new FormData()
      fd.append('id', material.id)
      fd.append('beNumber', form.beNumber)
      if (form.name) fd.append('name', form.name)
      fd.append('brandOrderNr', String(form.brandOrderNr))
      fd.append('shortDescription', form.shortDescription)
      if (form.longDescription) fd.append('longDescription', form.longDescription)
      if (form.preferredSupplier) fd.append('preferredSupplier', form.preferredSupplier)
      if (form.brandName) fd.append('brandName', form.brandName)
      if (form.documentationPlace) fd.append('documentationPlace', form.documentationPlace)
      if (form.bePartDoc !== '') fd.append('bePartDoc', String(form.bePartDoc))
      fd.append('rejected', String(form.rejected))
      fd.append('materialGroupId', form.materialGroupId)
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

  const groupLabel = (g: MaterialGroup) => [g.groupA, g.groupB, g.groupC, g.groupD].filter(Boolean).join(' / ')
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
        </TabsList>

        {/* Details tab */}
        <TabsContent value="details" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-6 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">BE Number</Label>
              {editing ? (
                <Input value={form.beNumber} onChange={e => handleField('beNumber', e.target.value)} />
              ) : (
                <p className="text-sm font-mono font-medium">{material.beNumber}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Name</Label>
              {editing ? (
                <Input value={form.name} onChange={e => handleField('name', e.target.value)} placeholder="—" />
              ) : (
                <p className="text-sm">{material.name ?? <span className="text-muted-foreground">—</span>}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Short Description</Label>
              {editing ? (
                <Input value={form.shortDescription} onChange={e => handleField('shortDescription', e.target.value)} />
              ) : (
                <p className="text-sm">{material.shortDescription}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Long Description</Label>
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
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Brand</Label>
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
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Preferred Supplier</Label>
              {editing ? (
                <Input
                  value={form.preferredSupplier}
                  onChange={e => handleField('preferredSupplier', e.target.value)}
                  placeholder="—"
                />
              ) : (
                <p className="text-sm">
                  {material.preferredSupplier ?? <span className="text-muted-foreground">—</span>}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Material Group</Label>
              {editing ? (
                <Select value={form.materialGroupId} onValueChange={v => handleField('materialGroupId', v)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {materialGroups.map(g => (
                      <SelectItem key={g.id} value={g.id}>
                        {groupLabel(g)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm">{material.materialGroupLabel}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Unit</Label>
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
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Documentation Place</Label>
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
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">BE Part Doc</Label>
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
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Brand Order Nr</Label>
              {editing ? (
                <Input
                  type="number"
                  value={String(form.brandOrderNr)}
                  onChange={e => handleField('brandOrderNr', Number(e.target.value))}
                />
              ) : (
                <p className="text-sm">{material.brandOrderNr}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Rejected</Label>
              {editing ? (
                <div className="flex items-center gap-2 h-9">
                  <Switch checked={form.rejected} onCheckedChange={v => handleField('rejected', v)} />
                  <span className="text-sm text-muted-foreground">{form.rejected ? 'Yes' : 'No'}</span>
                </div>
              ) : (
                <p className="text-sm">{material.rejected ? 'Yes' : 'No'}</p>
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
                  <TableHead className={thClass}>Serie Nr</TableHead>
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
      </Tabs>
    </div>
  )
}
