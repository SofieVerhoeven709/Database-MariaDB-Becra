'use client'

import {useState} from 'react'
import {Search, Plus, Pencil, Trash2, ChevronUp, ChevronDown, Eye} from 'lucide-react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {MaterialFormDialog} from '@/components/custom/materialFormDialog'
import type {MappedMaterial} from '@/types/material'
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
  | 'createdByName'
  | 'rejected'
type SortDir = 'asc' | 'desc'
type FilterRejected = 'all' | 'active' | 'rejected'

function SortIcon({field, sortField, sortDir}: {field: SortField; sortField: SortField; sortDir: SortDir}) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? (
    <ChevronUp className="inline h-3.5 w-3.5 ml-1" />
  ) : (
    <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
  )
}

interface MaterialTableProps {
  initialMaterials: MappedMaterial[]
  materialGroups: MaterialGroup[]
  units: Unit[]
  supplierCompanies: SupplierCompanyOption[]
  departmentId?: string
}

export function MaterialTable({
  initialMaterials,
  materialGroups,
  units,
  supplierCompanies,
  departmentId,
}: MaterialTableProps) {
  const router = useRouter() as unknown as {refresh: () => void; push: (href: string) => void}
  const [materials] = useState(initialMaterials)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('beNumber')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [filterRejected, setFilterRejected] = useState<FilterRejected>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<MappedMaterial | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

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
        (m.preferredSupplierName ?? '').toLowerCase().includes(q) ||
        m.supplierCompanyNames.some(name => name.toLowerCase().includes(q))
      )
    })
    .sort((a, b) => {
      const aVal = String(a[sortField] ?? '')
      const bVal = String(b[sortField] ?? '')
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
        'supplierCompanyIds',
        'brandName',
        'documentationPlace',
        'bePartDoc',
        'rejected',
        'materialGroupIdA',
        'materialGroupIdB',
        'materialGroupIdC',
        'materialGroupIdD',
        'unitId',
      ])

      const nullableSchemaFields = new Set([
        'name',
        'longDescription',
        'preferredSupplierCompanyId',
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

      const result = editingMaterial
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
    {key: 'rejected', label: 'Status'},
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
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
              <TableHead className="w-[100px] text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground py-10">
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
                  <TableCell className="text-sm max-w-[220px] truncate" title={m.shortDescription}>
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
        onSave={handleSave}
        saving={saving}
        saveError={saveError}
      />
    </div>
  )
}
