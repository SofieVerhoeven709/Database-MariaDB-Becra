'use client'

import {useState} from 'react'
import {Plus, Pencil, Trash2, Search, ChevronUp, ChevronDown, Check, X} from 'lucide-react'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/ui/dialog'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {Textarea} from '@/components/ui/textarea'
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
  name: string
}

export interface MappedUnit {
  id: string
  unitName: string
  physicalQuantity: string
  abbreviation: string
  shortDescription: string | null
  longDescription: string | null
  valid: boolean
}

export interface MappedPerformance {
  id: string
  name: string
  materialSpecId: string | null
  materialFamilyId: string | null
  shortDescription: string | null
  longDescription: string | null
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

// ─── Material Group Tab ───────────────────────────────────────────────────────

const EMPTY_GROUP: MappedMaterialGroup = {id: '', name: ''}

function MaterialGroupTab({initialGroups}: {initialGroups: MappedMaterialGroup[]}) {
  const [groups, setGroups] = useState(initialGroups)
  const [search, setSearch] = useState('')
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

  async function handleSave() {
    setSaving(true)
    const fd = new FormData()
    fd.append('id', form.id)
    fd.append('groupA', form.name)
    if (editing) {
      await updateMaterialGroupAction({success: false}, fd)
      setGroups(prev => prev.map(g => (g.id === form.id ? {...form} : g)))
    } else {
      await createMaterialGroupAction({success: false}, fd)
      setGroups(prev => [...prev, {...form}])
    }
    setSaving(false)
    setDialogOpen(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this material group?')) return
    const fd = new FormData()
    fd.append('id', id)
    await deleteMaterialGroupAction({success: false}, fd)
    setGroups(prev => prev.filter(g => g.id !== id))
  }

  const filtered = groups
    .filter(g => !search || g.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const cmp = a.name.localeCompare(b.name)
      return sortDir === 'asc' ? cmp : -cmp
    })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-secondary border-border"
            placeholder="Search groups..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
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
                Name
                <SortIndicator active={true} dir={sortDir} />
              </TableHead>
              <TableHead className="w-[100px] text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground py-10">
                  No material groups found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(g => (
                <TableRow key={g.id} className="hover:bg-secondary/50 transition-colors">
                  <TableCell className="font-medium text-sm">{g.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(g)}>
                        <Pencil className="h-3.5 w-3.5" />
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
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Material Group' : 'New Material Group'}</DialogTitle>
            <DialogDescription>Give the group a name, e.g. "Engineering" or "Warehouse".</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="group-name" className="text-xs text-muted-foreground">
                Name *
              </Label>
              <Input
                id="group-name"
                className={inputStyles}
                value={form.name}
                onChange={e => setForm(prev => ({...prev, name: e.target.value}))}
                placeholder="e.g. Engineering"
                required
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.name || saving}>
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
  valid: true,
}

function UnitTab({initialUnits}: {initialUnits: MappedUnit[]}) {
  const [units, setUnits] = useState(initialUnits)
  const [search, setSearch] = useState('')
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
    setSaving(false)
    setDialogOpen(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this unit?')) return
    const fd = new FormData()
    fd.append('id', id)
    await deleteUnitAction({success: false}, fd)
    setUnits(prev => prev.filter(u => u.id !== id))
  }

  const filtered = units
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
              <TableHead className="w-[100px] text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
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
                    className="text-sm text-muted-foreground max-w-[200px] truncate"
                    title={u.shortDescription ?? undefined}>
                    {u.shortDescription ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(u)}>
                        <Pencil className="h-3.5 w-3.5" />
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
  const [performances, setPerformances] = useState(initialPerformances)
  const [search, setSearch] = useState('')
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
    setSaving(false)
    setDialogOpen(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this performance spec?')) return
    const fd = new FormData()
    fd.append('id', id)
    await deletePerformanceAction({success: false}, fd)
    setPerformances(prev => prev.filter(p => p.id !== id))
  }

  const filtered = performances
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
              <TableHead className="w-[100px] text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
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
                    className="text-sm text-muted-foreground max-w-[220px] truncate"
                    title={p.shortDescription ?? undefined}>
                    {p.shortDescription ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
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
