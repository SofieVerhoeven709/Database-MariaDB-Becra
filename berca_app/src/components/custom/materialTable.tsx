'use client'

import {useMemo, useState} from 'react'
import {Search, Plus, Pencil, Trash2, ChevronUp, ChevronDown, Eye, Copy} from 'lucide-react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {MaterialFormDialog} from '@/components/custom/materialFormDialog'
import type {MappedMaterial} from '@/types/material'
import {
  createMaterialAction,
  updateMaterialAction,
  deleteMaterialAction,
  cloneMaterialAction,
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

interface WarehousePlaceOption {
  id: string
  label: string
  beNumber: string | null
}

type SortField =
  | 'beNumber'
  | 'name'
  | 'shortDescription'
  | 'brandName'
  | 'materialGroupLabelA'
  | 'materialGroupLabelB'
  | 'materialGroupLabelC'
  | 'materialGroupLabelD'
  | 'unitName'
  | 'warehousePlaceLabel'
  | 'parentBeNumbers'
  | 'createdByName'
  | 'createdAt'
  | 'rejected'
type SortDir = 'asc' | 'desc'
type FilterRejected = 'all' | 'active' | 'rejected'
type FilterPlace = 'all' | 'withPlace' | 'withoutPlace'
type FilterDeleted = 'all' | 'notDeleted' | 'deleted'

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
  const [filterPlace, setFilterPlace] = useState<FilterPlace>('all')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('notDeleted')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<MappedMaterial | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const parentPartBeNumbersInUse = useMemo(() => [...new Set(materials.flatMap(m => m.parentBeNumbers))], [materials])

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filtered = materials
    .filter(m => {
      if (filterRejected === 'active') return !m.rejected
      if (filterRejected === 'rejected') return m.rejected
      return true
    })
    .filter(m => {
      if (filterPlace === 'withPlace') return Boolean(m.warehousePlaceLabel)
      if (filterPlace === 'withoutPlace') return !m.warehousePlaceLabel
      return true
    })
    .filter(m => {
      if (filterDeleted === 'notDeleted') return !m.deleted
      if (filterDeleted === 'deleted') return m.deleted
      return true
    })
    .filter(m => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        m.beNumber.toLowerCase().includes(q) ||
        (m.name ?? '').toLowerCase().includes(q) ||
        m.shortDescription.toLowerCase().includes(q) ||
        (m.brandName ?? '').toLowerCase().includes(q) ||
        m.materialGroupLabel.toLowerCase().includes(q) ||
        m.materialGroupLabelA.toLowerCase().includes(q) ||
        m.materialGroupLabelB.toLowerCase().includes(q) ||
        m.materialGroupLabelC.toLowerCase().includes(q) ||
        m.materialGroupLabelD.toLowerCase().includes(q) ||
        m.unitName.toLowerCase().includes(q) ||
        (m.warehousePlaceLabel ?? '').toLowerCase().includes(q) ||
        m.parentBeNumbers.some(parent => parent.toLowerCase().includes(q)) ||
        (m.preferredSupplierCompanyName ?? '').toLowerCase().includes(q) ||
        m.supplierCompanyNames.some(name => name.toLowerCase().includes(q))
      )
    })
    .sort((a, b) => {
      const aVal = String(a[sortField] ?? '')
      const bVal = String(b[sortField] ?? '')
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })

  // Filter for materials without BE numbers
  const nonBeMaterials = materials.filter(m => !m.beNumber || m.beNumber.trim().length === 0)
  // Debug: log which materials are being included in the Non BE Numbers table
  if (nonBeMaterials.length > 0) {
    // eslint-disable-next-line no-console
    console.log(
      '[DEBUG] Non BE Materials:',
      nonBeMaterials.map(m => ({id: m.id, beNumber: m.beNumber, name: m.name})),
    )
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
        /*'preferredSupplierShortDescription',*/
        'supplierCompanyIds',
        'parentBeNumbers',
        'brandName',
        /* 'documentationPlace',
        'bePartDoc',*/
        'rejected',
        'materialGroupIdA',
        'materialGroupIdB',
        'materialGroupIdC',
        'materialGroupIdD',
        'warehousePlaceId',
        'unitId',
      ])

      const nullableSchemaFields = new Set([
        'name',
        'brandOrderNr',
        'longDescription',
        'preferredSupplierCompanyId',
        'preferredSupplierOrderId',
        /*'preferredSupplierShortDescription',*/
        'brandName',
        /* 'documentationPlace',
        'bePartDoc',*/
        'materialGroupIdB',
        'materialGroupIdC',
        'materialGroupIdD',
        'warehousePlaceId',
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

      const result = editingMaterial
        ? await updateMaterialAction({success: false}, fd)
        : await createMaterialAction({success: false}, fd)

      if (result && !result.success) {
        // Fallback: if errors is empty or not an object, show a generic error
        const hasErrors = result.errors && typeof result.errors === 'object' && Object.keys(result.errors).length > 0
        if (!hasErrors) {
          console.error('Material save failed: Unknown error')
          setSaveError('Could not save the material. Please check all required fields.')
          return
        }
        console.error('Material save failed:', result.errors)
        // Support both field errors and global errors
        let msgs: string[] = []
        if (result.errors) {
          // If errors is an object with a single 'errors' key, treat as global error
          if (Object.keys(result.errors).length === 1 && Array.isArray(result.errors.errors)) {
            msgs = result.errors.errors
          } else {
            msgs = Object.entries(result.errors ?? {}).flatMap(([field, errs]) =>
              (errs ?? []).map(e => `${field}: ${e}`),
            )
          }
        }
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

  async function handleClone(material: MappedMaterial) {
    setSaving(true)
    setSaveError(null)
    try {
      const fd = new FormData()
      fd.append('id', material.id)
      const result = await cloneMaterialAction({success: false}, fd)
      if (result && result.success) {
        setDialogOpen(false)
        setEditingMaterial(null)
        router.refresh()
      } else {
        setSaveError('Could not clone the material. Please try again.')
      }
    } catch (_e) {
      setSaveError('An unexpected error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const columns: {key: SortField; label: string}[] = [
    {key: 'beNumber', label: 'BE Number'},
    {key: 'name', label: 'Name'},
    {key: 'shortDescription', label: 'Description'},
    {key: 'brandName', label: 'Brand'},
    {key: 'materialGroupLabelA', label: 'Group A'},
    {key: 'materialGroupLabelB', label: 'Group B'},
    {key: 'materialGroupLabelC', label: 'Group C'},
    {key: 'materialGroupLabelD', label: 'Group D'},
    {key: 'unitName', label: 'Unit'},
    {key: 'warehousePlaceLabel', label: 'Warehouse Place'},
    {key: 'parentBeNumbers', label: 'Parent Parts'},
    {key: 'createdByName', label: 'Created'},
    {key: 'rejected', label: 'Status'},
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-secondary border-border"
            placeholder="Searching for materials..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

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

        <Select value={filterPlace} onValueChange={v => setFilterPlace(v as FilterPlace)}>
          <SelectTrigger className="w-44 bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All places</SelectItem>
            <SelectItem value="withPlace">With place</SelectItem>
            <SelectItem value="withoutPlace">Without place</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterDeleted} onValueChange={v => setFilterDeleted(v as FilterDeleted)}>
          <SelectTrigger className="w-44 bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All items</SelectItem>
            <SelectItem value="notDeleted">Not deleted</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={() => {
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
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center w-20">
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
                  <TableCell className="text-sm">
                    {m.warehousePlaceLabel ?? <span className="text-muted-foreground">—</span>}
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
                  {/* Serial Tracked column */}
                  <TableCell className="text-center">
                    {m.isSerialTracked && m.serialTrackedId ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs bg-blue-100 text-blue-800 border-blue-300 px-2 py-1 h-auto min-h-0"
                        onClick={e => {
                          e.stopPropagation()
                          router.push(`/departments/${departmentId}/serialTracked/${m.serialTrackedId}`)
                        }}>
                        Serial
                      </Button>
                    ) : m.isSerialTracked ? (
                      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                        Serial
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
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
                          setEditingMaterial(m)
                          setDialogOpen(true)
                        }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(m.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                        title="Clone"
                        onClick={() => handleClone(m)}>
                        <Copy className="h-3.5 w-3.5" />
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
            setSaveError(null)
          }
        }}
        material={editingMaterial}
        materialGroups={materialGroups}
        units={units}
        supplierCompanies={supplierCompanies}
        parentPartOptions={parentPartOptions}
        warehousePlaces={warehousePlaces}
        parentPartBeNumbersInUse={parentPartBeNumbersInUse}
        onSave={handleSave}
        saving={saving}
        saveError={saveError}
      />
    </div>
  )
}
