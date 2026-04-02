'use client'

import {useMemo, useState} from 'react'
import {Search, Plus, Pencil, Trash2, ChevronUp, ChevronDown, Eye, Copy} from 'lucide-react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Alert} from '@/components/ui/alert'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {MaterialFormDialog} from '@/components/custom/materialFormDialog'
import type {MappedMaterial} from '@/types/material'
import type {WarehousePlaceOption} from '@/types/warehousePlace'
import {createMaterialAction, updateMaterialAction, deleteMaterialAction} from '@/serverFunctions/materials'
import {useRouter} from 'next/navigation'

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

type SortField =
  | 'beNumber'
  | 'name'
  | 'shortDescription'
  | 'warehouseAbbreviation'
  | 'warehousePlace'
  | 'warehouseShelf'
  | 'warehouseColumn'
  | 'warehouseLayer'
  | 'warehouseLayerPlace'
  | 'brandName'
  | 'materialGroupLabelA'
  | 'materialGroupLabelB'
  | 'materialGroupLabelC'
  | 'materialGroupLabelD'
  | 'unitName'
  | 'parentBeNumbers'
  | 'createdByName'
  | 'createdAt'
  | 'rejected'
type SortDir = 'asc' | 'desc'
type FilterRejected = 'all' | 'active' | 'rejected'
type FilterNumberKind = 'all' | 'be' | 'ios'

function SortIcon({field, sortField, sortDir}: {field: SortField; sortField: SortField; sortDir: SortDir}) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? (
    <ChevronUp className="inline h-3.5 w-3.5 ml-1" />
  ) : (
    <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
  )
}

function formatDateTime(value: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface MaterialTableProps {
  initialMaterials: MappedMaterial[]
  materialGroups: MaterialGroup[]
  units: Unit[]
  supplierCompanies: SupplierCompanyOption[]
  parentPartOptions: ParentPartOption[]
  warehousePlaces: WarehousePlaceOption[]
  departmentId?: string
}

export function MaterialTable({
  initialMaterials,
  materialGroups,
  units,
  supplierCompanies,
  parentPartOptions,
  warehousePlaces,
  departmentId,
}: MaterialTableProps) {
  const router = useRouter() as unknown as {refresh: () => void; push: (href: string) => void}
  const materials = initialMaterials
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('beNumber')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [filterRejected, setFilterRejected] = useState<FilterRejected>('all')
  const [filterNumberKind, setFilterNumberKind] = useState<FilterNumberKind>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<MappedMaterial | null>(null)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'duplicate'>('create')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [alert, setAlert] = useState<{
    title: string
    description: string
    type?: 'info' | 'success' | 'warning' | 'error'
  } | null>(null)

  const parentPartBeNumbersInUse = useMemo(() => [...new Set(materials.flatMap(m => m.parentBeNumbers))], [materials])

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  function getNumberKind(beNumber: string): FilterNumberKind {
    const normalized = (beNumber ?? '').trim()
    return normalized.startsWith('4') ? 'ios' : 'be'
  }

  const warehousePlaceById = useMemo(() => new Map(warehousePlaces.map(place => [place.id, place])), [warehousePlaces])

  function formatWarehouseCoordinates(place: WarehousePlaceOption): string {
    const parts = [
      place.abbreviation && `Abbr: ${place.abbreviation}`,
      place.place && `Place: ${place.place}`,
      place.shelf && `Shelf: ${place.shelf}`,
      place.column && `Column: ${place.column}`,
      place.layer && `Layer: ${place.layer}`,
      place.layerPlace && `Layer place: ${place.layerPlace}`,
    ].filter(Boolean)

    return parts.length > 0 ? parts.join(' | ') : place.label
  }

  function resolveMaterialPlace(value: string | null): string {
    if (!value) return ''
    const place = warehousePlaceById.get(value)
    if (!place) return value
    return formatWarehouseCoordinates(place)
  }

  function getWarehousePart(value: string | null, part: keyof WarehousePlaceOption): string {
    if (!value) return ''
    const place = warehousePlaceById.get(value)
    if (!place) return ''
    const partValue = place[part]
    return typeof partValue === 'string' ? partValue : ''
  }

  function getSortValue(material: MappedMaterial, field: SortField): string {
    switch (field) {
      case 'warehouseAbbreviation':
        return getWarehousePart(material.documentationPlace, 'abbreviation')
      case 'warehousePlace':
        return getWarehousePart(material.documentationPlace, 'place')
      case 'warehouseShelf':
        return getWarehousePart(material.documentationPlace, 'shelf')
      case 'warehouseColumn':
        return getWarehousePart(material.documentationPlace, 'column')
      case 'warehouseLayer':
        return getWarehousePart(material.documentationPlace, 'layer')
      case 'warehouseLayerPlace':
        return getWarehousePart(material.documentationPlace, 'layerPlace')
      default:
        return String(material[field] ?? '')
    }
  }

  const filtered = materials
    .filter(m => {
      if (filterNumberKind === 'all') return true
      return getNumberKind(m.beNumber) === filterNumberKind
    })
    .filter(m => {
      if (filterRejected === 'active') return !m.rejected
      if (filterRejected === 'rejected') return m.rejected
      return true
    })
    .filter(m => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        m.beNumber.toLowerCase().includes(q) ||
        (m.name ?? '').toLowerCase().includes(q) ||
        m.shortDescription.toLowerCase().includes(q) ||
        resolveMaterialPlace(m.documentationPlace).toLowerCase().includes(q) ||
        (m.brandName ?? '').toLowerCase().includes(q) ||
        m.materialGroupLabel.toLowerCase().includes(q) ||
        m.materialGroupLabelA.toLowerCase().includes(q) ||
        m.materialGroupLabelB.toLowerCase().includes(q) ||
        m.materialGroupLabelC.toLowerCase().includes(q) ||
        m.materialGroupLabelD.toLowerCase().includes(q) ||
        m.unitName.toLowerCase().includes(q) ||
        m.parentBeNumbers.some(parent => parent.toLowerCase().includes(q)) ||
        (m.preferredSupplierCompanyName ?? '').toLowerCase().includes(q) ||
        m.supplierCompanyNames.some(name => name.toLowerCase().includes(q))
      )
    })
      .sort((a, b) => {
      const aVal = getSortValue(a, sortField)
      const bVal = getSortValue(b, sortField)
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })

  async function handleSave(form: Partial<MappedMaterial> & {id: string}) {
    setSaving(true)
    setSaveError(null)
    try {
      // Only send fields that belong to the schema — exclude display-only fields
      const schemaFields = new Set([
        'id',
        'beNumber',
        'name',
        'brandOrderNr',
        'shortDescription',
        'longDescription',
        'preferredSupplierCompanyId',
        'preferredSupplierOrderId',
        'preferredSupplierShortDescription',
        'supplierCompanyIds',
        'parentBeNumbers',
        'brandName',
        'documentationPlace',
        'bePartDoc',
        'rejected',
        'materialGroupIdA',
        'materialGroupIdB',
        'materialGroupIdC',
        'materialGroupIdD',
        'unitId',
        'isSerialTracked',
        'isParentPart',
      ])

      const nullableSchemaFields = new Set([
        'name',
        'brandOrderNr',
        'longDescription',
        'preferredSupplierCompanyId',
        'preferredSupplierOrderId',
        'preferredSupplierShortDescription',
        'brandName',
        'documentationPlace',
        'bePartDoc',
        'materialGroupIdB',
        'materialGroupIdC',
        'materialGroupIdD',
      ])

      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (!schemaFields.has(k)) return
        if (Array.isArray(v)) {
          v.forEach(item => {
            if (item) fd.append(k, String(item))
          })
          return
        }
        if (v === undefined) return
        if (v === null || v === '') {
          if (nullableSchemaFields.has(k)) fd.append(k, '')
          return
        }
        fd.append(k, String(v))
      })

      const result = dialogMode === 'edit' && editingMaterial
        ? await updateMaterialAction({success: false}, fd)
        : await createMaterialAction({success: false}, fd)

      if (result && !result.success) {
        console.error('Material save failed:', result.errors)
        const msgs = Object.entries(result.errors ?? {}).flatMap(([field, errs]) =>
          (errs ?? []).map(e => `${field}: ${e}`),
        )
        setSaveError(msgs.length ? msgs.join(' | ') : 'Could not save the material. Please check all required fields.')
        return
      }

      setDialogOpen(false)
      setEditingMaterial(null)
      router.refresh()
    } catch (_e) {
      setSaveError('An unexpected error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this material?')) return
    const fd = new FormData()
    fd.append('id', id)
    await deleteMaterialAction({success: false}, fd)
    router.refresh()
  }

  async function handleViewSerialTracked(
    serialTrackedId: string | null,
    beNumber: string,
    departmentId?: string,
    router?: any,
  ) {
    if (!departmentId || !router) return

    if (serialTrackedId) {
      router.push(`/departments/${departmentId}/serialTracked/${serialTrackedId}`)
      return
    }

    if (!beNumber) return
    try {
      const res = await fetch(`/api/serialTracked/byBeNumber/${encodeURIComponent(beNumber)}`)
      const data = await res.json()
      if (data.found && data.id) {
        router.push(`/departments/${departmentId}/serialTracked/${data.id}`)
      } else {
        setAlert({title: 'Not found', description: 'No serial tracked item for this BE Number.', type: 'warning'})
      }
    } catch (_e) {
      setAlert({title: 'Error', description: 'Failed to check serial tracked item.', type: 'error'})
    }
  }

  const columns: {key: SortField; label: string}[] = [
    {key: 'beNumber', label: 'Number'},
    {key: 'name', label: 'Name'},
    {key: 'shortDescription', label: 'Description'},
    {key: 'warehouseAbbreviation', label: 'Abbr'},
    {key: 'warehousePlace', label: 'Place'},
    {key: 'warehouseShelf', label: 'Shelf'},
    {key: 'warehouseColumn', label: 'Column'},
    {key: 'warehouseLayer', label: 'Layer'},
    {key: 'warehouseLayerPlace', label: 'Layer Place'},
    {key: 'brandName', label: 'Brand'},
    {key: 'materialGroupLabelA', label: 'Group A'},
    {key: 'materialGroupLabelB', label: 'Group B'},
    {key: 'materialGroupLabelC', label: 'Group C'},
    {key: 'materialGroupLabelD', label: 'Group D'},
    {key: 'unitName', label: 'Unit'},
    {key: 'parentBeNumbers', label: 'Parent Parts'},
    {key: 'createdByName', label: 'Created'},
    {key: 'rejected', label: 'Status'},
  ]

  return (
    <div className="flex flex-col gap-4">
      {alert && (
        <Alert title={alert.title} description={alert.description} type={alert.type} onClose={() => setAlert(null)} />
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-secondary border-border"
            placeholder="Searching for materials..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <Select value={filterNumberKind} onValueChange={v => setFilterNumberKind(v as FilterNumberKind)}>
          <SelectTrigger className="w-36 bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All numbers</SelectItem>
            <SelectItem value="be">BE</SelectItem>
            <SelectItem value="ios">IOS</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterRejected} onValueChange={v => setFilterRejected(v as FilterRejected)}>
          <SelectTrigger className="w-36 bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={() => {
            setDialogMode('create')
            setEditingMaterial(null)
            setDialogOpen(true)
          }}
          className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New material
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              {columns.map(col => (
                <TableHead
                  key={col.key}
                  className="cursor-pointer select-none text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  onClick={() => handleSort(col.key)}>
                  {col.label}
                  <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />
                </TableHead>
              ))}
              <TableHead className="w-25 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Serial Tracked
              </TableHead>
              <TableHead className="w-25 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="text-center text-muted-foreground py-10">
                  No materials found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(m => (
                <TableRow
                  key={m.id}
                  className="hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/departments/${departmentId}/material/${m.id}`)}>
                  <TableCell className="font-mono text-sm font-medium">{m.beNumber}</TableCell>
                  <TableCell className="text-sm">
                    {m.name ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm max-w-55 truncate" title={m.shortDescription}>
                    {m.shortDescription}
                  </TableCell>
                  <TableCell className="text-sm">{getWarehousePart(m.documentationPlace, 'abbreviation') || '—'}</TableCell>
                  <TableCell className="text-sm">{getWarehousePart(m.documentationPlace, 'place') || '—'}</TableCell>
                  <TableCell className="text-sm">{getWarehousePart(m.documentationPlace, 'shelf') || '—'}</TableCell>
                  <TableCell className="text-sm">{getWarehousePart(m.documentationPlace, 'column') || '—'}</TableCell>
                  <TableCell className="text-sm">{getWarehousePart(m.documentationPlace, 'layer') || '—'}</TableCell>
                  <TableCell className="text-sm">{getWarehousePart(m.documentationPlace, 'layerPlace') || '—'}</TableCell>
                  <TableCell className="text-sm">
                    {m.brandName ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm">{m.materialGroupLabelA || '—'}</TableCell>
                  <TableCell className="text-sm">{m.materialGroupLabelB || '—'}</TableCell>
                  <TableCell className="text-sm">{m.materialGroupLabelC || '—'}</TableCell>
                  <TableCell className="text-sm">{m.materialGroupLabelD || '—'}</TableCell>
                  <TableCell className="text-sm">
                    {m.unitName}
                    <span className="text-muted-foreground text-xs ml-1">({m.unitAbbreviation})</span>
                  </TableCell>
                  <TableCell className="text-sm max-w-55">
                    {m.parentBeNumbers.length > 0 ? (
                      <span title={m.parentBeNumbers.join(', ')}>
                        {m.parentBeNumbers.slice(0, 2).join(', ')}
                        {m.parentBeNumbers.length > 2 ? ` +${m.parentBeNumbers.length - 2}` : ''}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex flex-col leading-tight">
                      <span>{m.createdByName || '-'}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(m.createdAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {m.rejected ? (
                      <Badge variant="destructive" className="text-xs">
                        Rejected
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs bg-green-500/15 text-green-700 dark:text-green-400">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  {/* Serial Tracked Button Column */}
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      disabled={!m.isSerialTracked}
                      onClick={e => {
                        e.stopPropagation()
                        handleViewSerialTracked(m.serialTrackedId, m.beNumber, departmentId, router)
                      }}
                      title={m.isSerialTracked ? 'Open Serial Tracked' : 'Material is not serial tracked'}>
                      Serial Tracked
                    </Button>
                  </TableCell>
                  {/* Actions Column */}
                  <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => router.push(`/departments/${departmentId}/material/${m.id}`)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                          setDialogMode('edit')
                          setEditingMaterial(m)
                          setDialogOpen(true)
                        }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                          setDialogMode('duplicate')
                          setEditingMaterial(m)
                          setDialogOpen(true)
                        }}
                        title="Copy row">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(m.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {materials.length} material{materials.length !== 1 ? 's' : ''}
      </p>

      <MaterialFormDialog
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open)
          if (!open) {
            setEditingMaterial(null)
            setDialogMode('create')
            setSaveError(null)
          }
        }}
        material={editingMaterial}
        mode={dialogMode}
        materialGroups={materialGroups}
        units={units}
        supplierCompanies={supplierCompanies}
        parentPartOptions={parentPartOptions}
        parentPartBeNumbersInUse={parentPartBeNumbersInUse}
        warehousePlaces={warehousePlaces}
        onSave={handleSave}
        saving={saving}
        saveError={saveError}
      />
    </div>
  )
}
