'use client'

import {useMemo, useState} from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  Copy,
  Check,
  /* ChevronLeft,
  ChevronRight, */
} from 'lucide-react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Alert} from '@/components/ui/alert'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {MaterialFormDialog} from '@/components/custom/materialFormDialog'
import {MATERIAL_DOCUMENT_FLAGS} from '@/components/custom/materialDocumentFlags'
import type {MappedMaterial} from '@/types/material'
import type {WarehousePlaceOption} from '@/types/warehousePlace'
import {
  createMaterialAction,
  updateMaterialAction,
  deleteMaterialAction,
  hardDeleteMaterialAction,
  restoreMaterialAction,
} from '@/serverFunctions/materials'
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
  | 'rejected'
  | 'partApproved'
  | 'longLeadTime'
  | 'hasAtex'
  | 'hasCe'
  | 'hasRohs'
  | 'hasDs'
  | 'has3dCad'
  | 'has2dCad'
  | 'hasBdoc'
  | 'hasInsp'
type SortDir = 'asc' | 'desc'
type FilterStatus = 'all' | 'active' | 'deleted'
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
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterRejected, setFilterRejected] = useState<FilterRejected>('all')
  const [filterNumberKind, setFilterNumberKind] = useState<FilterNumberKind>('all')
  {
    /*const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 15*/
  }
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
      /* place.place && `Place: ${place.place}`,
      place.shelf && `Shelf: ${place.shelf}`,
      place.column && `Column: ${place.column}`,
      place.layer && `Layer: ${place.layer}`,
      place.layerPlace && `Layer place: ${place.layerPlace}`, */
      place.place && `Warehouse: ${place.place}`,
      place.shelf && `X: ${place.shelf}`,
      place.column && `Y: ${place.column}`,
      place.layer && `Z: ${place.layer}`,
      place.layerPlace && `Position: ${place.layerPlace}`,
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
        return getWarehousePart(material.warehousePlace, 'abbreviation')
      case 'warehousePlace':
        return getWarehousePart(material.warehousePlace, 'place')
      case 'warehouseShelf':
        return getWarehousePart(material.warehousePlace, 'shelf')
      case 'warehouseColumn':
        return getWarehousePart(material.warehousePlace, 'column')
      case 'warehouseLayer':
        return getWarehousePart(material.warehousePlace, 'layer')
      case 'warehouseLayerPlace':
        return getWarehousePart(material.warehousePlace, 'layerPlace')
      case 'hasAtex':
      case 'hasCe':
      case 'hasRohs':
      case 'hasDs':
      case 'has3dCad':
      case 'has2dCad':
      case 'hasBdoc':
      case 'hasInsp':
        return material[field] ? '1' : '0'
      case 'partApproved':
        return material.partApproved ? '1' : '0'
      default:
        return String(material[field] ?? '')
    }
  }

  const filtered = materials
    .filter(m => {
      if (filterStatus === 'active') return !m.deleted
      if (filterStatus === 'deleted') return m.deleted
      return true
    })
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
        resolveMaterialPlace(m.warehousePlace).toLowerCase().includes(q) ||
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
  {
    /*
  // Paginatie berekeningen
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const displayedMaterials = filtered.slice(startIndex, endIndex)

  // Reset naar pagina 1 als er wordt gezocht of gefilterd
  const handleSearch = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const handleFilterStatusChange = (value: FilterStatus) => {
    setFilterStatus(value)
    setCurrentPage(1)
  }

  const handleFilterRejectedChange = (value: FilterRejected) => {
    setFilterRejected(value)
    setCurrentPage(1)
  }

  const handleFilterNumberKindChange = (value: FilterNumberKind) => {
    setFilterNumberKind(value)
    setCurrentPage(1)
  }
  */
  }

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
        'warehousePlace',
        'rejected',
        'partApproved',
        'longLeadTime',
        'leadTimeValue',
        'leadTimeUnit',
        'hasAtex',
        'hasCe',
        'hasRohs',
        'hasDs',
        'hasDoc',
        'has3dCad',
        'has2dCad',
        'hasBdoc',
        'hasInsp',
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
        'warehousePlace',
        'leadTimeValue',
        'leadTimeUnit',
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

      const result =
        dialogMode === 'edit' && editingMaterial
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
    const target = materials.find(m => m.id === id)
    if (!target) return

    const confirmText = target.deleted
      ? 'This material is already soft deleted. Permanently delete it?'
      : 'Are you sure you want to delete this material?'

    if (!confirm(confirmText)) return
    const fd = new FormData()
    fd.append('id', id)
    if (target.deleted) {
      await hardDeleteMaterialAction({success: false}, fd)
    } else {
      await deleteMaterialAction({success: false}, fd)
    }
    router.refresh()
  }

  async function handleRestore(id: string) {
    if (!confirm('Restore this material?')) return
    const fd = new FormData()
    fd.append('id', id)
    await restoreMaterialAction({success: false}, fd)
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
    {key: 'name', label: 'Material Name'},
    {key: 'shortDescription', label: 'Description'},
    {key: 'warehouseAbbreviation', label: 'Abbr'},
    /* {key: 'warehousePlace', label: 'Place'},
    {key: 'warehouseShelf', label: 'Shelf'},
    {key: 'warehouseColumn', label: 'Column'},
    {key: 'warehouseLayer', label: 'Layer'},
    {key: 'warehouseLayerPlace', label: 'Layer Place'},*/
    {key: 'warehousePlace', label: 'Warehouse'},
    {key: 'warehouseShelf', label: 'X'},
    {key: 'warehouseColumn', label: 'Y'},
    {key: 'warehouseLayer', label: 'Z'},
    {key: 'warehouseLayerPlace', label: 'Position'},
    {key: 'brandName', label: 'Brand'},
    {key: 'materialGroupLabelA', label: 'Group A'},
    {key: 'materialGroupLabelB', label: 'Group B'},
    {key: 'materialGroupLabelC', label: 'Group C'},
    {key: 'materialGroupLabelD', label: 'Group D'},
    {key: 'unitName', label: 'Unit'},
    {key: 'parentBeNumbers', label: 'Parent Parts'},
    {key: 'createdByName', label: 'Created'},
    {key: 'rejected', label: 'Status'},
    {key: 'partApproved', label: 'Approved'},
    {key: 'longLeadTime', label: 'Long Lead'},
  ]

  const renderDocumentFlag = (active: boolean) => {
    return active ? (
      <Badge variant="default" className="text-xs bg-blue-500/20 text-blue-700 dark:text-blue-400">
        Yes
      </Badge>
    ) : (
      <span className="text-xs text-muted-foreground">-</span>
    )
  }

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
            /*onChange={e => handleSearch(e.target.value)}*/
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* <Select value={filterStatus} onValueChange={v => handleFilterStatusChange(v as FilterStatus)}> */}
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as FilterStatus)}>
          <SelectTrigger className="w-36 bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Not deleted</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterNumberKind} onValueChange={v => setFilterNumberKind(v as FilterNumberKind)}>
          {/* <Select value={filterNumberKind} onValueChange={v => handleFilterNumberKindChange(v as FilterNumberKind)}>*/}
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
          {/* <Select value={filterRejected} onValueChange={v => handleFilterRejectedChange(v as FilterRejected)}>*/}
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
              {MATERIAL_DOCUMENT_FLAGS.map(flag => (
                <TableHead
                  key={flag.key}
                  className="w-24 cursor-pointer select-none text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  onClick={() => handleSort(flag.key)}>
                  {flag.label}
                  <SortIcon field={flag.key} sortField={sortField} sortDir={sortDir} />
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
                <TableCell
                  colSpan={columns.length + MATERIAL_DOCUMENT_FLAGS.length + 2}
                  className="text-center text-muted-foreground py-10">
                  No materials found
                </TableCell>
              </TableRow>
            ) : (
              /* displayedMaterials.map(m => ( */
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
                  <TableCell className="text-sm">{getWarehousePart(m.warehousePlace, 'abbreviation') || '—'}</TableCell>
                  <TableCell className="text-sm">{getWarehousePart(m.warehousePlace, 'place') || '—'}</TableCell>
                  <TableCell className="text-sm">{getWarehousePart(m.warehousePlace, 'shelf') || '—'}</TableCell>
                  <TableCell className="text-sm">{getWarehousePart(m.warehousePlace, 'column') || '—'}</TableCell>
                  <TableCell className="text-sm">{getWarehousePart(m.warehousePlace, 'layer') || '—'}</TableCell>
                  <TableCell className="text-sm">{getWarehousePart(m.warehousePlace, 'layerPlace') || '—'}</TableCell>
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
                  <TableCell>
                    {m.partApproved ? (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                        Yes
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {m.longLeadTime ? (
                      <Badge variant="secondary" className="text-xs bg-amber-500/15 text-amber-700 dark:text-amber-400">
                        Yes
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  {MATERIAL_DOCUMENT_FLAGS.map(flag => (
                    <TableCell key={flag.key} className="text-sm text-center">
                      {renderDocumentFlag(Boolean(m[flag.key]))}
                    </TableCell>
                  ))}
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
                      {m.deleted ? (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                            title="Restore"
                            onClick={() => handleRestore(m.id)}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            title="Permanently delete"
                            onClick={() => handleDelete(m.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
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
                          <span title={m.partApproved ? 'Copy row' : 'Part must be approved before copying'}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => {
                                if (!m.partApproved) {
                                  setAlert({
                                    title: 'Copy not allowed',
                                    description: 'This part must be approved before it can be copied.',
                                    type: 'warning',
                                  })
                                  return
                                }
                                setDialogMode('duplicate')
                                setEditingMaterial(m)
                                setDialogOpen(true)
                              }}>
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(m.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Info & Controls
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          Showing {displayedMaterials.length > 0 ? startIndex + 1 : 0}–{Math.min(endIndex, filtered.length)} of{' '}
          {filtered.length} material{filtered.length !== 1 ? 's' : ''} (Page {currentPage} of {totalPages || 1})
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({length: totalPages}, (_, i) => i + 1)
                .filter(page => {
                  // Show first, last, and pages around current
                  return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                })
                .map((page, idx, arr) => (
                  <div key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && <span className="px-1 text-muted-foreground">...</span>}
                    <Button
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="h-8 w-8 p-0">
                      {page}
                    </Button>
                  </div>
                ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      */}
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
