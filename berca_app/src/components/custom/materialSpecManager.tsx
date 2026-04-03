'use client'

import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import {Plus, Pencil, Trash2, Search, ChevronUp, ChevronDown, Check, X, Copy} from 'lucide-react'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/ui/dialog'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {
  createMaterialGroupAction,
  updateMaterialGroupAction,
  deleteMaterialGroupAction,
  createUnitAction,
  updateUnitAction,
  deleteUnitAction,
  createPerformanceAction,
  updatePerformanceAction,
  deletePerformanceAction,
} from '@/serverFunctions/materialSpecs'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MappedMaterialGroup {
  id: string
  groupA: string
  groupB: string | null
  groupC: string | null
  groupD: string | null
  createdById: string
  createdAt: string | null
  createdByName: string | null
  deletedAt: string | null
  deletedByName: string | null
  deleted: boolean
}

export interface MappedUnit {
  id: string
  unitName: string
  physicalQuantity: string
  abbreviation: string
  shortDescription: string | null
  longDescription: string | null
  createdAt: string | null
  createdByName: string | null
  deletedAt: string | null
  deletedByName: string | null
  valid: boolean
  deleted: boolean
}

export interface MappedPerformance {
  id: string
  name: string
  materialSpecId: string | null
  materialFamilyId: string | null
  shortDescription: string | null
  longDescription: string | null
  createdAt: string | null
  createdByName: string | null
  deletedAt: string | null
  deletedByName: string | null
  deleted: boolean
}

export interface MappedSpec {
  id: string
  name: string | null
}

export interface MappedFamily {
  id: string
  name: string | null
}

interface MaterialSpecManagerProps {
  initialGroups: MappedMaterialGroup[]
  initialUnits: MappedUnit[]
  initialPerformances: MappedPerformance[]
  specs: MappedSpec[]
  families: MappedFamily[]
}

const inputStyles = 'bg-secondary border-border placeholder:text-muted-foreground/60 focus-visible:ring-accent'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SortIndicator({active, dir}: {active: boolean; dir: 'asc' | 'desc'}) {
  if (!active) return null
  return dir === 'asc' ? (
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

// ─── Material Group Tab ───────────────────────────────────────────────────────

const EMPTY_GROUP: MappedMaterialGroup = {
  id: '',
  groupA: '',
  groupB: null,
  groupC: null,
  groupD: null,
  createdById: '',
  createdAt: null,
  createdByName: null,
  deletedAt: null,
  deletedByName: null,
  deleted: false,
}

function MaterialGroupTab({initialGroups}: {initialGroups: MappedMaterialGroup[]}) {
  const router = useRouter()
  const [groups, setGroups] = useState(initialGroups)
  useEffect(() => {
    setGroups(initialGroups)
  }, [initialGroups])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted'>('all')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MappedMaterialGroup | null>(null)
  const [form, setForm] = useState<MappedMaterialGroup>(EMPTY_GROUP)
  const [saving, setSaving] = useState(false)

  function openNew() {
    setEditing(null)
    setForm({...EMPTY_GROUP, id: crypto.randomUUID()})
    setDialogOpen(true)
  }

  function openEdit(g: MappedMaterialGroup) {
    setEditing(g)
    setForm({...g})
    setDialogOpen(true)
  }

  function openDuplicate(g: MappedMaterialGroup) {
    setEditing(null)
    setForm({...g, id: crypto.randomUUID()})
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const fd = new FormData()
    fd.append('id', form.id)
    fd.append('groupA', form.groupA)
    fd.append('groupB', form.groupB ?? '')
    fd.append('groupC', form.groupC ?? '')
    fd.append('groupD', form.groupD ?? '')
    if (editing) {
      await updateMaterialGroupAction({success: false}, fd)
      setGroups(prev => prev.map(g => (g.id === form.id ? {...form} : g)))
    } else {
      await createMaterialGroupAction({success: false}, fd)
      setGroups(prev => [...prev, {...form}])
    }
    router.refresh()
    setSaving(false)
    setDialogOpen(false)
  }

  async function handleDelete(id: string) {
    const target = groups.find(g => g.id === id)
    if (!target) return

    const confirmText = target.deleted
      ? 'This group is already soft deleted. Permanently delete it?'
      : 'Delete this material group?'

    if (!confirm(confirmText)) return

    const fd = new FormData()
    fd.append('id', id)
    await deleteMaterialGroupAction({success: false}, fd)
    const deletedAt = new Date().toISOString()
    setGroups(prev =>
      target.deleted
        ? prev.filter(g => g.id !== id)
        : prev.map(g => (g.id === id ? {...g, deleted: true, deletedAt} : g)),
    )
    router.refresh()
  }

  const filtered = groups
    .filter(g => {
      if (statusFilter === 'active') return !g.deleted
      if (statusFilter === 'deleted') return g.deleted
      return true
    })
    .filter(g => {
      if (!search) return true
      const q = search.toLowerCase()
      return [g.groupA, g.groupB, g.groupC, g.groupD].some(value => (value ?? '').toLowerCase().includes(q))
    })
    .sort((a, b) => {
      const cmp =
        a.groupA.localeCompare(b.groupA) ||
        (a.groupB ?? '').localeCompare(b.groupB ?? '') ||
        (a.groupC ?? '').localeCompare(b.groupC ?? '') ||
        (a.groupD ?? '').localeCompare(b.groupD ?? '')
      return sortDir === 'asc' ? cmp : -cmp
    })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-secondary border-border"
            placeholder="Search groups (A-D)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={value => setStatusFilter(value as 'all' | 'active' | 'deleted')}>
          <SelectTrigger className="w-40 bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Not deleted</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New group
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              <TableHead
                className="cursor-pointer select-none text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                onClick={() => setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))}>
                Group A
                <SortIndicator active={true} dir={sortDir} />
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Group B</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Group C</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Group D</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deleted</TableHead>
              <TableHead className="w-25 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  No material groups found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(g => (
                <TableRow key={g.id} className="hover:bg-secondary/50 transition-colors">
                  <TableCell className="font-medium text-sm">{g.groupA}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{g.groupB ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{g.groupC ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{g.groupD ?? '—'}</TableCell>
                  <TableCell className="text-sm">
                    <div className="flex flex-col leading-tight">
                      <span>{g.createdByName ?? g.createdById ?? '-'}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(g.createdAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex flex-col leading-tight">
                      <span>{g.deleted ? g.deletedByName ?? '-' : '—'}</span>
                      <span className="text-xs text-muted-foreground">{g.deleted ? formatDateTime(g.deletedAt) : '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(g)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDuplicate(g)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(g.id)}>
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
        {filtered.length} of {groups.length} group{groups.length !== 1 ? 's' : ''}
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Material Group' : 'New Material Group'}</DialogTitle>
            <DialogDescription>Define the material group hierarchy from A through D.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="group-a" className="text-xs text-muted-foreground">
                Group A *
              </Label>
              <Input
                id="group-a"
                className={inputStyles}
                value={form.groupA}
                onChange={e => setForm(prev => ({...prev, groupA: e.target.value}))}
                placeholder="e.g. Engineering"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="group-b" className="text-xs text-muted-foreground">
                Group B
              </Label>
              <Input
                id="group-b"
                className={inputStyles}
                value={form.groupB ?? ''}
                onChange={e => setForm(prev => ({...prev, groupB: e.target.value || null}))}
                placeholder="Optional"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="group-c" className="text-xs text-muted-foreground">
                Group C
              </Label>
              <Input
                id="group-c"
                className={inputStyles}
                value={form.groupC ?? ''}
                onChange={e => setForm(prev => ({...prev, groupC: e.target.value || null}))}
                placeholder="Optional"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="group-d" className="text-xs text-muted-foreground">
                Group D
              </Label>
              <Input
                id="group-d"
                className={inputStyles}
                value={form.groupD ?? ''}
                onChange={e => setForm(prev => ({...prev, groupD: e.target.value || null}))}
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.groupA || saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Unit Tab ─────────────────────────────────────────────────────────────────

type UnitSortField = 'unitName' | 'abbreviation' | 'physicalQuantity' | 'valid'

const EMPTY_UNIT: MappedUnit = {
  id: '',
  unitName: '',
  physicalQuantity: '',
  abbreviation: '',
  shortDescription: null,
  longDescription: null,
  createdAt: null,
  createdByName: null,
  deletedAt: null,
  deletedByName: null,
  valid: true,
  deleted: false,
}

function UnitTab({initialUnits}: {initialUnits: MappedUnit[]}) {
  const router = useRouter()
  const [units, setUnits] = useState(initialUnits)
  useEffect(() => {
    setUnits(initialUnits)
  }, [initialUnits])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted'>('all')
  const [validFilter, setValidFilter] = useState<'all' | 'valid' | 'invalid'>('all')
  const [sortField, setSortField] = useState<UnitSortField>('unitName')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MappedUnit | null>(null)
  const [form, setForm] = useState<MappedUnit>(EMPTY_UNIT)
  const [saving, setSaving] = useState(false)

  function openNew() {
    setEditing(null)
    setForm({...EMPTY_UNIT, id: crypto.randomUUID()})
    setDialogOpen(true)
  }

  function openEdit(u: MappedUnit) {
    setEditing(u)
    setForm({...u})
    setDialogOpen(true)
  }

  function openDuplicate(u: MappedUnit) {
    setEditing(null)
    setForm({...u, id: crypto.randomUUID()})
    setDialogOpen(true)
  }

  function handleSort(field: UnitSortField) {
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  async function handleSave() {
    setSaving(true)
    const fd = new FormData()
    fd.append('id', form.id)
    fd.append('unitName', form.unitName)
    fd.append('physicalQuantity', String(form.physicalQuantity))
    fd.append('abbreviation', form.abbreviation)
    if (form.shortDescription) fd.append('shortDescription', form.shortDescription)
    if (form.longDescription) fd.append('longDescription', form.longDescription)
    fd.append('valid', String(form.valid))

    if (editing) {
      await updateUnitAction({success: false}, fd)
      setUnits(prev => prev.map(u => (u.id === form.id ? {...form} : u)))
    } else {
      await createUnitAction({success: false}, fd)
      setUnits(prev => [...prev, {...form}])
    }
    router.refresh()
    setSaving(false)
    setDialogOpen(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this unit?')) return
    const fd = new FormData()
    fd.append('id', id)
    await deleteUnitAction({success: false}, fd)
    const deletedAt = new Date().toISOString()
    setUnits(prev => prev.map(u => (u.id === id ? {...u, deleted: true, deletedAt} : u)))
    router.refresh()
  }

  const filtered = units
    .filter(u => {
      if (statusFilter === 'active') return !u.deleted
      if (statusFilter === 'deleted') return u.deleted
      return true
    })
    .filter(u => {
      if (validFilter === 'valid') return u.valid
      if (validFilter === 'invalid') return !u.valid
      return true
    })
    .filter(u => {
      if (!search) return true
      const q = search.toLowerCase()
      return u.unitName.toLowerCase().includes(q) || u.abbreviation.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      let cmp: number
      if (sortField === 'physicalQuantity') cmp = a.physicalQuantity.localeCompare(b.physicalQuantity)
      else cmp = String(a[sortField]).localeCompare(String(b[sortField]))
      return sortDir === 'asc' ? cmp : -cmp
    })

  const cols: {key: UnitSortField; label: string}[] = [
    {key: 'unitName', label: 'Unit Name'},
    {key: 'abbreviation', label: 'Abbreviation'},
    {key: 'physicalQuantity', label: 'Physical Quantity'},
    {key: 'valid', label: 'Valid'},
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-secondary border-border"
            placeholder="Search units..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={value => setStatusFilter(value as 'all' | 'active' | 'deleted')}>
          <SelectTrigger className="w-40 bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Not deleted</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
        <Select value={validFilter} onValueChange={value => setValidFilter(value as 'all' | 'valid' | 'invalid')}>
          <SelectTrigger className="w-36 bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All validities</SelectItem>
            <SelectItem value="valid">Valid</SelectItem>
            <SelectItem value="invalid">Invalid</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New unit
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              {cols.map(col => (
                <TableHead
                  key={col.key}
                  className="cursor-pointer select-none text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  onClick={() => handleSort(col.key)}>
                  {col.label}
                  <SortIndicator active={sortField === col.key} dir={sortDir} />
                </TableHead>
              ))}
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Description
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deleted</TableHead>
              <TableHead className="w-25 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                  No units found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(u => (
                <TableRow key={u.id} className="hover:bg-secondary/50 transition-colors">
                  <TableCell className="font-medium text-sm">{u.unitName}</TableCell>
                  <TableCell className="font-mono text-sm">{u.abbreviation}</TableCell>
                  <TableCell className="text-sm">{u.physicalQuantity}</TableCell>
                  <TableCell>
                    {u.valid ? (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-green-500/15 text-green-700 dark:text-green-400 flex items-center gap-1 w-fit">
                        <Check className="h-3 w-3" />
                        Valid
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-red-500/15 text-red-700 dark:text-red-400 flex items-center gap-1 w-fit">
                        <X className="h-3 w-3" />
                        Invalid
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell
                    className="text-sm text-muted-foreground max-w-50 truncate"
                    title={u.shortDescription ?? undefined}>
                    {u.shortDescription ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex flex-col leading-tight">
                      <span>{u.createdByName ?? '-'}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(u.createdAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex flex-col leading-tight">
                      <span>{u.deleted ? u.deletedByName ?? '-' : '—'}</span>
                      <span className="text-xs text-muted-foreground">{u.deleted ? formatDateTime(u.deletedAt) : '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(u)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDuplicate(u)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(u.id)}>
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
        {filtered.length} of {units.length} unit{units.length !== 1 ? 's' : ''}
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Unit' : 'New Unit'}</DialogTitle>
            <DialogDescription>Define a measurement unit used by materials (e.g. kg, m, pcs).</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="unit-name" className="text-xs text-muted-foreground">
                  Unit *
                </Label>
                <Input
                  id="unit-name"
                  className={inputStyles}
                  value={form.unitName}
                  onChange={e => setForm(prev => ({...prev, unitName: e.target.value}))}
                  placeholder="e.g. Kilogram"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="unit-abbr" className="text-xs text-muted-foreground">
                  Abbreviation *
                </Label>
                <Input
                  id="unit-abbr"
                  className={inputStyles}
                  value={form.abbreviation}
                  onChange={e => setForm(prev => ({...prev, abbreviation: e.target.value}))}
                  placeholder="e.g. kg"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="unit-physicalQuantity" className="text-xs text-muted-foreground">
                Physical Quantity *
              </Label>
              <Input
                id="unit-physicalQuantity"
                type="string"
                className={inputStyles}
                value={form.physicalQuantity}
                onChange={e => setForm(prev => ({...prev, physicalQuantity: e.target.value}))}
                placeholder="e.g. 1"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="unit-short" className="text-xs text-muted-foreground">
                Short Description
              </Label>
              <Input
                id="unit-short"
                className={inputStyles}
                value={form.shortDescription ?? ''}
                onChange={e => setForm(prev => ({...prev, shortDescription: e.target.value || null}))}
                placeholder="Brief description"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="unit-long" className="text-xs text-muted-foreground">
                Long Description
              </Label>
              <Textarea
                id="unit-long"
                className={`${inputStyles} resize-none`}
                rows={3}
                value={form.longDescription ?? ''}
                onChange={e => setForm(prev => ({...prev, longDescription: e.target.value || null}))}
                placeholder="Detailed description..."
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Valid</Label>
              <div className="flex items-center gap-3">
                <Switch checked={form.valid} onCheckedChange={v => setForm(prev => ({...prev, valid: v}))} />
                <span className="text-sm text-muted-foreground">
                  {form.valid ? 'Yes – available for use' : 'No – disabled'}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.unitName || !form.abbreviation || saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create unit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Performance Tab ──────────────────────────────────────────────────────────

const EMPTY_PERFORMANCE: MappedPerformance = {
  id: '',
  name: '',
  materialSpecId: null,
  materialFamilyId: null,
  shortDescription: null,
  longDescription: null,
  createdAt: null,
  createdByName: null,
  deletedAt: null,
  deletedByName: null,
  deleted: false,
}

function PerformanceTab({
  initialPerformances,
  specs,
  families,
}: {
  initialPerformances: MappedPerformance[]
  specs: MappedSpec[]
  families: MappedFamily[]
}) {
  const router = useRouter()
  const [performances, setPerformances] = useState(initialPerformances)
  useEffect(() => {
    setPerformances(initialPerformances)
  }, [initialPerformances])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted'>('all')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MappedPerformance | null>(null)
  const [form, setForm] = useState<MappedPerformance>(EMPTY_PERFORMANCE)
  const [saving, setSaving] = useState(false)

  function openNew() {
    setEditing(null)
    setForm({...EMPTY_PERFORMANCE, id: crypto.randomUUID()})
    setDialogOpen(true)
  }

  function openEdit(p: MappedPerformance) {
    setEditing(p)
    setForm({...p})
    setDialogOpen(true)
  }

  function openDuplicate(p: MappedPerformance) {
    setEditing(null)
    setForm({...p, id: crypto.randomUUID()})
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const fd = new FormData()
    fd.append('id', form.id)
    fd.append('name', form.name)
    if (form.materialSpecId) fd.append('materialSpecId', form.materialSpecId)
    if (form.materialFamilyId) fd.append('materialFamilyId', form.materialFamilyId)
    if (form.shortDescription) fd.append('shortDescription', form.shortDescription)
    if (form.longDescription) fd.append('longDescription', form.longDescription)

    if (editing) {
      await updatePerformanceAction({success: false}, fd)
      setPerformances(prev => prev.map(p => (p.id === form.id ? {...form} : p)))
    } else {
      await createPerformanceAction({success: false}, fd)
      setPerformances(prev => [...prev, {...form}])
    }
    router.refresh()
    setSaving(false)
    setDialogOpen(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this performance spec?')) return
    const fd = new FormData()
    fd.append('id', id)
    await deletePerformanceAction({success: false}, fd)
    const deletedAt = new Date().toISOString()
    setPerformances(prev => prev.map(p => (p.id === id ? {...p, deleted: true, deletedAt} : p)))
    router.refresh()
  }

  const filtered = performances
    .filter(p => {
      if (statusFilter === 'active') return !p.deleted
      if (statusFilter === 'deleted') return p.deleted
      return true
    })
    .filter(p => {
      if (!search) return true
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) || (p.shortDescription ?? '').toLowerCase().includes(q)
    })
    .sort((a, b) => {
      const cmp = a.name.localeCompare(b.name)
      return sortDir === 'asc' ? cmp : -cmp
    })

  function specLabel(id: string | null) {
    if (!id) return '—'
    return specs.find(s => s.id === id)?.name ?? id
  }

  function familyLabel(id: string | null) {
    if (!id) return '—'
    return families.find(f => f.id === id)?.name ?? id
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-secondary border-border"
            placeholder="Search performance specs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={value => setStatusFilter(value as 'all' | 'active' | 'deleted')}>
          <SelectTrigger className="w-40 bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Not deleted</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New spec
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              <TableHead
                className="cursor-pointer select-none text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                onClick={() => setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))}>
                Name
                <SortIndicator active={true} dir={sortDir} />
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Material Spec
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Material Family
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Short Description
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deleted</TableHead>
              <TableHead className="w-25 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  No performance specs found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(p => (
                <TableRow key={p.id} className="hover:bg-secondary/50 transition-colors">
                  <TableCell className="font-medium text-sm">{p.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{specLabel(p.materialSpecId)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{familyLabel(p.materialFamilyId)}</TableCell>
                  <TableCell
                    className="text-sm text-muted-foreground max-w-55 truncate"
                    title={p.shortDescription ?? undefined}>
                    {p.shortDescription ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex flex-col leading-tight">
                      <span>{p.createdByName ?? '-'}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(p.createdAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex flex-col leading-tight">
                      <span>{p.deleted ? p.deletedByName ?? '-' : '—'}</span>
                      <span className="text-xs text-muted-foreground">{p.deleted ? formatDateTime(p.deletedAt) : '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDuplicate(p)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(p.id)}>
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
        {filtered.length} of {performances.length} spec{performances.length !== 1 ? 's' : ''}
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Performance Spec' : 'New Performance Spec'}</DialogTitle>
            <DialogDescription>
              Define a performance specification that links to a material spec and family.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="perf-name" className="text-xs text-muted-foreground">
                Name *
              </Label>
              <Input
                id="perf-name"
                className={inputStyles}
                value={form.name}
                onChange={e => setForm(prev => ({...prev, name: e.target.value}))}
                placeholder="e.g. Tensile Strength"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="perf-spec" className="text-xs text-muted-foreground">
                Material Spec
              </Label>
              <select
                id="perf-spec"
                className="flex h-9 w-full rounded-md border border-border bg-secondary px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                value={form.materialSpecId ?? ''}
                onChange={e => setForm(prev => ({...prev, materialSpecId: e.target.value || null}))}>
                <option value="">— None —</option>
                {specs.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name ?? s.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="perf-family" className="text-xs text-muted-foreground">
                Material Family
              </Label>
              <select
                id="perf-family"
                className="flex h-9 w-full rounded-md border border-border bg-secondary px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                value={form.materialFamilyId ?? ''}
                onChange={e => setForm(prev => ({...prev, materialFamilyId: e.target.value || null}))}>
                <option value="">— None —</option>
                {families.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name ?? f.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="perf-short" className="text-xs text-muted-foreground">
                Short Description
              </Label>
              <Input
                id="perf-short"
                className={inputStyles}
                value={form.shortDescription ?? ''}
                onChange={e => setForm(prev => ({...prev, shortDescription: e.target.value || null}))}
                placeholder="Brief description"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="perf-long" className="text-xs text-muted-foreground">
                Long Description
              </Label>
              <Textarea
                id="perf-long"
                className={`${inputStyles} resize-none`}
                rows={3}
                value={form.longDescription ?? ''}
                onChange={e => setForm(prev => ({...prev, longDescription: e.target.value || null}))}
                placeholder="Detailed description..."
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.name || saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create spec'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function MaterialSpecManager({
  initialGroups,
  initialUnits,
  initialPerformances,
  specs,
  families,
}: MaterialSpecManagerProps) {
  return (
    <Tabs defaultValue="groups" className="w-full">
      <TabsList className="mb-6 bg-secondary">
        <TabsTrigger value="groups" className="data-[state=active]:bg-card">
          Material Groups
        </TabsTrigger>
        <TabsTrigger value="units" className="data-[state=active]:bg-card">
          Units
        </TabsTrigger>
        <TabsTrigger value="performance" className="data-[state=active]:bg-card">
          Performance Specs
        </TabsTrigger>
      </TabsList>
      <TabsContent value="groups">
        <MaterialGroupTab initialGroups={initialGroups} />
      </TabsContent>
      <TabsContent value="units">
        <UnitTab initialUnits={initialUnits} />
      </TabsContent>
      <TabsContent value="performance">
        <PerformanceTab initialPerformances={initialPerformances} specs={specs} families={families} />
      </TabsContent>
    </Tabs>
  )
}
