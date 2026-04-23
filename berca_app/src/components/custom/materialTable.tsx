'use client'

import {useMemo, useState} from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Copy,
  RotateCcw,
  Download,
} from 'lucide-react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Alert} from '@/components/ui/alert'
import {StickyTableScroll} from '@/components/ui/stickyTableScroll'
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
  | 'brandName'
  | 'supplierCompanyName'
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
  | 'warehouseAbbreviation'
  | 'warehousePlace'
  | 'warehouseShelf'
  | 'warehouseColumn'
  | 'warehouseLayer'
  | 'warehouseLayerPlace'
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
type FilterMaterialGroup = 'all' | string
type FilterDocs = 'all' | (typeof MATERIAL_DOCUMENT_FLAGS)[number]['key']

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

function escapeCsvValue(value: string) {
  const normalized = value ?? ''
  if (/[",\n\r]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`
  }
  return normalized
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

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('active')
  const [filterRejected, setFilterRejected] = useState<FilterRejected>('active')
  const [filterNumberKind, setFilterNumberKind] = useState<FilterNumberKind>('be')

  const [filterMaterialGroupA, setFilterMaterialGroupA] = useState<FilterMaterialGroup>('all')
  const [filterMaterialGroupB, setFilterMaterialGroupB] = useState<FilterMaterialGroup>('all')
  const [filterMaterialGroupC, setFilterMaterialGroupC] = useState<FilterMaterialGroup>('all')
  const [filterMaterialGroupD, setFilterMaterialGroupD] = useState<FilterMaterialGroup>('all')

  const [filterDocs, setFilterDocs] = useState<FilterDocs>('all')

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

  const documentFilterOptions = useMemo(
    () =>
      MATERIAL_DOCUMENT_FLAGS.map(flag => ({
        value: flag.key,
        label: flag.label,
      })),
    [],
  )

  const warehousePlaceById = useMemo(() => new Map(warehousePlaces.map(place => [place.id, place])), [warehousePlaces])

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

  function formatWarehouseCoordinates(place: WarehousePlaceOption): string {
    const parts = [
      place.abbreviation && `Abbr: ${place.abbreviation}`,
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

  function handleGroupAChange(value: string) {
    setFilterMaterialGroupA(value)
    setFilterMaterialGroupB('all')
    setFilterMaterialGroupC('all')
    setFilterMaterialGroupD('all')
  }

  function handleGroupBChange(value: string) {
    setFilterMaterialGroupB(value)
    setFilterMaterialGroupC('all')
    setFilterMaterialGroupD('all')
  }

  function handleGroupCChange(value: string) {
    setFilterMaterialGroupC(value)
    setFilterMaterialGroupD('all')
  }

  const groupAOptions = useMemo(() => {
    return [...new Set(materialGroups.map(g => g.groupA).filter(Boolean))].map(value => ({
      value,
      label: value,
    }))
  }, [materialGroups])

  const groupBOptions = useMemo(() => {
    return [
      ...new Set(
        materialGroups
          .filter(g => filterMaterialGroupA === 'all' || g.groupA === filterMaterialGroupA)
          .map(g => g.groupB)
          .filter(Boolean),
      ),
    ].map(value => ({
      value: value as string,
      label: value as string,
    }))
  }, [materialGroups, filterMaterialGroupA])

  const groupCOptions = useMemo(() => {
    return [
      ...new Set(
        materialGroups
          .filter(g => filterMaterialGroupA === 'all' || g.groupA === filterMaterialGroupA)
          .filter(g => filterMaterialGroupB === 'all' || g.groupB === filterMaterialGroupB)
          .map(g => g.groupC)
          .filter(Boolean),
      ),
    ].map(value => ({
      value: value as string,
      label: value as string,
    }))
  }, [materialGroups, filterMaterialGroupA, filterMaterialGroupB])

  const groupDOptions = useMemo(() => {
    return [
      ...new Set(
        materialGroups
          .filter(g => filterMaterialGroupA === 'all' || g.groupA === filterMaterialGroupA)
          .filter(g => filterMaterialGroupB === 'all' || g.groupB === filterMaterialGroupB)
          .filter(g => filterMaterialGroupC === 'all' || g.groupC === filterMaterialGroupC)
          .map(g => g.groupD)
          .filter(Boolean),
      ),
    ].map(value => ({
      value: value as string,
      label: value as string,
    }))
  }, [materialGroups, filterMaterialGroupA, filterMaterialGroupB, filterMaterialGroupC])

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
      if (filterDocs === 'all') return true
      return Boolean(m[filterDocs])
    })
    .filter(m => {
      if (filterMaterialGroupA === 'all') return true
      return m.materialGroupLabelA === filterMaterialGroupA
    })
    .filter(m => {
      if (filterMaterialGroupB === 'all') return true
      return m.materialGroupLabelB === filterMaterialGroupB
    })
    .filter(m => {
      if (filterMaterialGroupC === 'all') return true
      return m.materialGroupLabelC === filterMaterialGroupC
    })
    .filter(m => {
      if (filterMaterialGroupD === 'all') return true
      return m.materialGroupLabelD === filterMaterialGroupD
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
        (m.supplierCompanyName ?? '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const aVal = getSortValue(a, sortField)
      const bVal = getSortValue(b, sortField)
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })

  function handleExportCsv() {
    if (filtered.length === 0) return

    const headers = [
      'Number',
      'Material Name',
      'Description',
      'Brand',
      'Supplier',
      'Group A',
      'Group B',
      'Group C',
      'Group D',
      'Unit',
      'Parent Parts',
      'Status',
      'Approved',
      'Long Lead',
      'Serial Tracked',
      ...MATERIAL_DOCUMENT_FLAGS.map(flag => flag.label),
      'Abbr',
      'Warehouse',
      'Shelf',
    ]

    const lines = filtered.map(material => {
      const base = [
        material.beNumber,
        material.name ?? '',
        material.shortDescription,
        material.brandName ?? '',
        material.supplierCompanyName ?? '',
        material.materialGroupLabelA || '',
        material.materialGroupLabelB || '',
        material.materialGroupLabelC || '',
        material.materialGroupLabelD || '',
        `${material.unitName} (${material.unitAbbreviation})`,
        material.parentBeNumbers.join(' | '),
        material.rejected ? 'Rejected' : 'Active',
        material.partApproved ? 'Yes' : 'No',
        material.longLeadTime ? 'Yes' : 'No',
        material.isSerialTracked ? 'Yes' : 'No',
      ]

      const documentFlags = MATERIAL_DOCUMENT_FLAGS.map(flag => (material[flag.key] ? 'Yes' : 'No'))

      const warehouseValues = [
        getWarehousePart(material.warehousePlace, 'abbreviation') || '',
        getWarehousePart(material.warehousePlace, 'place') || '',
        getWarehousePart(material.warehousePlace, 'shelf') || '',
      ]

      return [...base, ...documentFlags, ...warehouseValues].map(value => escapeCsvValue(String(value))).join(',')
    })

    const csv = [headers.map(escapeCsvValue).join(','), ...lines].join('\n')
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    anchor.href = url
    anchor.download = `materials-${date}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  async function handleSave(form: Partial<MappedMaterial> & {id: string}) {
    setSaving(true)
    setSaveError(null)
    try {
      const schemaFields = new Set([
        'id',
        'beNumber',
        'name',
        'brandOrderNr',
        'shortDescription',
        'longDescription',
        'supplierCompanyId',
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
        'brandName',
        'supplierCompanyId',
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
    {key: 'brandName', label: 'Brand'},
    {key: 'supplierCompanyName', label: 'Supplier'},
    {key: 'materialGroupLabelA', label: 'Group A'},
    {key: 'materialGroupLabelB', label: 'Group B'},
    {key: 'materialGroupLabelC', label: 'Group C'},
    {key: 'materialGroupLabelD', label: 'Group D'},
    {key: 'unitName', label: 'Unit'},
    {key: 'parentBeNumbers', label: 'Parent Parts'},
    {key: 'rejected', label: 'Status'},
    {key: 'partApproved', label: 'Approved'},
    {key: 'longLeadTime', label: 'Long Lead'},
  ]

  return (
    <div className="flex flex-col gap-4">
      {alert && (
        <Alert title={alert.title} description={alert.description} type={alert.type} onClose={() => setAlert(null)} />
      )}

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

        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as FilterStatus)}>
          <SelectTrigger className="w-30 bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Not deleted</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterNumberKind} onValueChange={v => setFilterNumberKind(v as FilterNumberKind)}>
          <SelectTrigger className="w-30 bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All numbers</SelectItem>
            <SelectItem value="be">BE</SelectItem>
            <SelectItem value="ios">IOS</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterRejected} onValueChange={v => setFilterRejected(v as FilterRejected)}>
          <SelectTrigger className="w-30 bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterDocs} onValueChange={v => setFilterDocs(v as FilterDocs)}>
          <SelectTrigger className="w-36 bg-secondary border-border">
            <SelectValue placeholder="Document type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All documents</SelectItem>
            {documentFilterOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterMaterialGroupA} onValueChange={handleGroupAChange}>
          <SelectTrigger className="w-30 bg-secondary border-border">
            <SelectValue placeholder="Choose group A" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All groups</SelectItem>
            {groupAOptions.map(group => (
              <SelectItem key={group.value} value={group.value}>
                {group.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filterMaterialGroupA !== 'all' && (
          <Select value={filterMaterialGroupB} onValueChange={handleGroupBChange}>
            <SelectTrigger className="w-30 bg-secondary border-border">
              <SelectValue placeholder="Choose group B" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All groups</SelectItem>
              {groupBOptions.map(group => (
                <SelectItem key={group.value} value={group.value}>
                  {group.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {filterMaterialGroupA !== 'all' && filterMaterialGroupB !== 'all' && (
          <Select value={filterMaterialGroupC} onValueChange={handleGroupCChange}>
            <SelectTrigger className="w-30 bg-secondary border-border">
              <SelectValue placeholder="Choose group C" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All groups</SelectItem>
              {groupCOptions.map(group => (
                <SelectItem key={group.value} value={group.value}>
                  {group.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {filterMaterialGroupA !== 'all' && filterMaterialGroupB !== 'all' && filterMaterialGroupC !== 'all' && (
          <Select value={filterMaterialGroupD} onValueChange={setFilterMaterialGroupD}>
            <SelectTrigger className="w-30 bg-secondary border-border">
              <SelectValue placeholder="Choose group D" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All groups</SelectItem>
              {groupDOptions.map(group => (
                <SelectItem key={group.value} value={group.value}>
                  {group.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button
          variant="outline"
          onClick={handleExportCsv}
          disabled={filtered.length === 0}
          className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download CSV
        </Button>

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

      <StickyTableScroll>
        <Table className="w-full min-w-max">
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

              <TableHead
                className="cursor-pointer select-none text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                onClick={() => handleSort('warehouseAbbreviation')}>
                Abbr
                <SortIcon field="warehouseAbbreviation" sortField={sortField} sortDir={sortDir} />
              </TableHead>

              <TableHead
                className="cursor-pointer select-none text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                onClick={() => handleSort('warehousePlace')}>
                Warehouse
                <SortIcon field="warehousePlace" sortField={sortField} sortDir={sortDir} />
              </TableHead>

              <TableHead
                className="cursor-pointer select-none text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                onClick={() => handleSort('warehouseShelf')}>
                Shelf
                <SortIcon field="warehouseShelf" sortField={sortField} sortDir={sortDir} />
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 5} className="text-center text-muted-foreground py-10">
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

                  <TableCell className="text-sm">
                    {m.brandName ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>

                  <TableCell className="text-sm">
                    {m.supplierCompanyName ?? <span className="text-muted-foreground">—</span>}
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

                  {/*   <TableCell className="text-sm">
                    <div className="flex flex-col leading-tight">
                      <span>{m.createdByName || '-'}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(m.createdAt)}</span>
                    </div>
                  </TableCell>*/}

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

                  <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => router.push(`/departments/${departmentId}/material/${m.id}`)}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>

                      {m.deleted ? (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                            title="Restore"
                            onClick={() => handleRestore(m.id)}>
                            <RotateCcw className="h-3.5 w-3.5" />
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

                          {m.partApproved ? (
                            <span title="Copy row">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => {
                                  setDialogMode('duplicate')
                                  setEditingMaterial(m)
                                  setDialogOpen(true)
                                }}>
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </span>
                          ) : (
                            <span className="inline-block h-7 w-7 invisible pointer-events-none" aria-hidden="true" />
                          )}

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

                  <TableCell className="text-sm">{getWarehousePart(m.warehousePlace, 'abbreviation') || '—'}</TableCell>
                  <TableCell className="text-sm">{getWarehousePart(m.warehousePlace, 'place') || '—'}</TableCell>
                  <TableCell className="text-sm">{getWarehousePart(m.warehousePlace, 'shelf') || '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </StickyTableScroll>

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
