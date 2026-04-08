'use client'

import {useMemo, useState} from 'react'
import Link from 'next/link'
import type {Route} from 'next'
import {useRouter} from 'next/navigation'
import {Search, ChevronDown, ChevronUp, Pencil, Check, X, Plus} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import type {MappedMaterialDemand, MaterialDemandMaterialOption} from '@/types/materialDemand'
import {createMaterialDemandAction, updateMaterialDemandAction} from '@/serverFunctions/materialDemands'

type SortField = 'material' | 'totalRequiredQty' | 'reservedQty' | 'sourceCount' | 'quoteLineCount' | 'createdAt'
type SortDir = 'asc' | 'desc'

interface MaterialDemandTableProps {
  initialEntries: MappedMaterialDemand[]
  materials: MaterialDemandMaterialOption[]
  currentUserRole: string
  currentUserLevel: number
  departmentId: string
}

const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function SortIcon({field, sortField, sortDir}: {field: SortField; sortField: SortField; sortDir: SortDir}) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? <ChevronUp className="inline h-3.5 w-3.5 ml-1" /> : <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
}

function materialLabel(m: MaterialDemandMaterialOption) {
  return [m.beNumber, m.shortDescription ?? m.name].filter(Boolean).join(' — ') || m.id
}

export function MaterialDemandTable({
  initialEntries,
  materials,
  currentUserRole,
  currentUserLevel,
  departmentId,
}: MaterialDemandTableProps) {
  const router = useRouter()
  const canCreate = currentUserLevel >= 60
  const canEdit = currentUserLevel >= 40

  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('material')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [creating, setCreating] = useState(false)
  const [newMaterialId, setNewMaterialId] = useState<string>('')
  const [newTotalRequiredQty, setNewTotalRequiredQty] = useState<string>('0')
  const [newReservedQty, setNewReservedQty] = useState<string>('0')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTotalRequiredQty, setEditTotalRequiredQty] = useState<string>('0')
  const [editReservedQty, setEditReservedQty] = useState<string>('0')

  const usedMaterialIds = useMemo(() => new Set(initialEntries.map(e => e.materialId)), [initialEntries])
  const availableMaterials = useMemo(
    () => materials.filter(m => !usedMaterialIds.has(m.id)).sort((a, b) => materialLabel(a).localeCompare(materialLabel(b))),
    [materials, usedMaterialIds],
  )

  const filtered = initialEntries
    .filter(entry => {
      if (!search) return true
      const q = search.toLowerCase()
      return (entry.materialBeNumber ?? '').toLowerCase().includes(q) || (entry.materialName ?? '').toLowerCase().includes(q)
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const cmpStr = (x: string | null | undefined, y: string | null | undefined) => dir * (x ?? '').localeCompare(y ?? '')
      switch (sortField) {
        case 'material':
          return cmpStr(a.materialBeNumber ?? a.materialName, b.materialBeNumber ?? b.materialName)
        case 'totalRequiredQty':
          return dir * (a.totalRequiredQty - b.totalRequiredQty)
        case 'reservedQty':
          return dir * (a.reservedQty - b.reservedQty)
        case 'sourceCount':
          return dir * (a.sourceCount - b.sourceCount)
        case 'quoteLineCount':
          return dir * (a.quoteLineCount - b.quoteLineCount)
        case 'createdAt':
          return cmpStr(a.createdAt, b.createdAt)
        default:
          return 0
      }
    })

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  function startEdit(entry: MappedMaterialDemand) {
    setEditingId(entry.id)
    setEditTotalRequiredQty(String(entry.totalRequiredQty))
    setEditReservedQty(String(entry.reservedQty))
  }

  function cancelEdit() {
    setEditingId(null)
    setEditTotalRequiredQty('0')
    setEditReservedQty('0')
  }

  async function handleUpdate(id: string) {
    const totalRequiredQty = Number.parseInt(editTotalRequiredQty, 10)
    const reservedQty = Number.parseInt(editReservedQty, 10)
    await updateMaterialDemandAction({
      id,
      totalRequiredQty: Number.isNaN(totalRequiredQty) ? 0 : totalRequiredQty,
      reservedQty: Number.isNaN(reservedQty) ? 0 : reservedQty,
    })
    cancelEdit()
    router.refresh()
  }

  async function handleCreate() {
    if (!newMaterialId) return
    const totalRequiredQty = Number.parseInt(newTotalRequiredQty, 10)
    const reservedQty = Number.parseInt(newReservedQty, 10)

    await createMaterialDemandAction({
      materialId: newMaterialId,
      totalRequiredQty: Number.isNaN(totalRequiredQty) ? 0 : totalRequiredQty,
      reservedQty: Number.isNaN(reservedQty) ? 0 : reservedQty,
    })

    setNewMaterialId('')
    setNewTotalRequiredQty('0')
    setNewReservedQty('0')
    setCreating(false)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by material number (BE/ISO) or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-secondary border-border placeholder:text-muted-foreground/60"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{filtered.length} / {initialEntries.length}</span>
          {canCreate && (
            <Button onClick={() => setCreating(v => !v)} className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
              <Plus className="h-4 w-4" />
              New Demand
            </Button>
          )}
        </div>
      </div>

      {creating && canCreate && (
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <Select value={newMaterialId || '__none__'} onValueChange={v => setNewMaterialId(v === '__none__' ? '' : v)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="__none__">— Select material —</SelectItem>
                  {availableMaterials.map(material => (
                    <SelectItem key={material.id} value={material.id}>
                      {materialLabel(material)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              type="number"
              min={0}
              value={newTotalRequiredQty}
              onChange={e => setNewTotalRequiredQty(e.target.value)}
              className="bg-secondary border-border"
              placeholder="Total required"
            />
            <Input
              type="number"
              min={0}
              value={newReservedQty}
              onChange={e => setNewReservedQty(e.target.value)}
              className="bg-secondary border-border"
              placeholder="Reserved"
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newMaterialId}>Create demand row</Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className={thClass} onClick={() => toggleSort('material')}>
                Material <SortIcon field="material" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('totalRequiredQty')}>
                Required Qty <SortIcon field="totalRequiredQty" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('reservedQty')}>
                Reserved Qty <SortIcon field="reservedQty" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('sourceCount')}>
                Sources <SortIcon field="sourceCount" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('quoteLineCount')}>
                Quote Lines <SortIcon field="quoteLineCount" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('createdAt')}>
                Created At <SortIcon field="createdAt" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className="w-24"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                  No material demand rows found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(entry => {
                const isEditing = editingId === entry.id
                const materialHref = `/departments/${departmentId}/material/${entry.materialId}` as Route
                return (
                  <TableRow key={entry.id} className="border-border/40 hover:bg-secondary/50">
                    <TableCell className={tdClass}>
                      <Link href={materialHref} className="hover:text-accent hover:underline transition-colors">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-foreground font-medium">{entry.materialBeNumber ?? '—'}</span>
                          <span className="text-xs text-muted-foreground">{entry.materialShortDescription ?? entry.materialName ?? entry.materialId}</span>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className={tdClass}>
                      {isEditing ? (
                        <Input
                          type="number"
                          min={0}
                          value={editTotalRequiredQty}
                          onChange={e => setEditTotalRequiredQty(e.target.value)}
                          className="h-8 bg-secondary border-border"
                        />
                      ) : (
                        <Badge variant="secondary" className="text-xs">{entry.totalRequiredQty}</Badge>
                      )}
                    </TableCell>
                    <TableCell className={tdClass}>
                      {isEditing ? (
                        <Input
                          type="number"
                          min={0}
                          value={editReservedQty}
                          onChange={e => setEditReservedQty(e.target.value)}
                          className="h-8 bg-secondary border-border"
                        />
                      ) : (
                        <Badge variant="outline" className="text-xs border-border">{entry.reservedQty}</Badge>
                      )}
                    </TableCell>
                    <TableCell className={tdClass}>{entry.sourceCount}</TableCell>
                    <TableCell className={tdClass}>{entry.quoteLineCount}</TableCell>
                    <TableCell className={tdClass}>{formatDate(entry.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10" onClick={() => handleUpdate(entry.id)}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:bg-secondary" onClick={cancelEdit}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          canEdit && (
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => startEdit(entry)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Demand rows are unique per material. Auto-create/remove on material lifecycle can be added next.
      </p>
    </div>
  )
}

