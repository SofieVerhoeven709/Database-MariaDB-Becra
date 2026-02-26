'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Pencil, Plus, Trash2} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {
  createWorkOrderStructureAction,
  updateWorkOrderStructureAction,
  softDeleteWorkOrderStructureAction,
  hardDeleteWorkOrderStructureAction,
  undeleteWorkOrderStructureAction,
} from '@/serverFunctions/workOrderStructures'
import type {MaterialOption, PermissionProps, StructureRow} from '@/types/workOrder'
import {formatDate, tdClass, thClass} from '@/extra/workOrderHelpers'

// ─── Local types ──────────────────────────────────────────────────────────────
interface WorkOrderStructuresProps {
  structures: StructureRow[]
  workOrderId: string
  materials: MaterialOption[]
  permissions: PermissionProps
}

type StructureForm = {
  clientNumber: string
  tag: string
  quantity: string
  shortDescription: string
  longDescription: string
  additionalInfo: string
  materialId: string
}

const emptyForm = (): StructureForm => ({
  clientNumber: '',
  tag: '',
  quantity: '',
  shortDescription: '',
  longDescription: '',
  additionalInfo: '',
  materialId: '',
})

// ─── Component ────────────────────────────────────────────────────────────────
export function WorkOrderStructures({structures, workOrderId, materials, permissions}: WorkOrderStructuresProps) {
  const router = useRouter()
  const {canAdd, canDelete, isAdmin} = permissions

  const [showInline, setShowInline] = useState(false)
  const [inlineForm, setInlineForm] = useState(emptyForm())

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dialogForm, setDialogForm] = useState(emptyForm())

  const [showDeleted, setShowDeleted] = useState(false)

  function buildPayload(f: StructureForm) {
    return {
      clientNumber: f.clientNumber || null,
      tag: f.tag || null,
      quantity: f.quantity ? parseInt(f.quantity) : null,
      shortDescription: f.shortDescription || null,
      longDescription: f.longDescription || null,
      additionalInfo: f.additionalInfo || null,
      materialId: f.materialId,
      workOrderId,
    }
  }

  function openEdit(s: StructureRow) {
    setEditingId(s.id)
    setDialogForm({
      clientNumber: s.clientNumber ?? '',
      tag: s.tag ?? '',
      quantity: s.quantity?.toString() ?? '',
      shortDescription: s.shortDescription ?? '',
      longDescription: s.longDescription ?? '',
      additionalInfo: s.additionalInfo ?? '',
      materialId: s.Material.id,
    })
    setDialogOpen(true)
  }

  async function handleInlineSave() {
    await createWorkOrderStructureAction(buildPayload(inlineForm))
    setInlineForm(emptyForm())
    setShowInline(false)
    router.refresh()
  }

  async function handleDialogSave() {
    const payload = buildPayload(dialogForm)
    if (editingId) {
      await updateWorkOrderStructureAction({...payload, id: editingId})
    } else {
      await createWorkOrderStructureAction(payload)
    }
    setDialogForm(emptyForm())
    setEditingId(null)
    setDialogOpen(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    await softDeleteWorkOrderStructureAction({id})
    router.refresh()
  }

  async function handleUndelete(id: string) {
    await undeleteWorkOrderStructureAction({id})
    router.refresh()
  }

  async function handleHardDelete(id: string) {
    await hardDeleteWorkOrderStructureAction({id})
    router.refresh()
  }

  const filtered = structures.filter(s => (showDeleted ? true : !s.deleted))

  return (
    <>
      {/* Action bar */}
      <div className="flex items-center gap-2 mb-3">
        {canAdd && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-border text-xs h-7"
              onClick={() => {
                setShowInline(v => !v)
                setInlineForm(emptyForm())
              }}>
              <Plus className="h-3 w-3" />
              {showInline ? 'Cancel inline' : 'Add inline'}
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/80 text-xs h-7"
              onClick={() => {
                setEditingId(null)
                setDialogForm(emptyForm())
                setDialogOpen(true)
              }}>
              <Plus className="h-3 w-3" />
              Add via dialog
            </Button>
          </>
        )}
        {canDelete && (
          <Button
            size="sm"
            variant={showDeleted ? 'secondary' : 'outline'}
            className="gap-1.5 border-border text-xs h-7 ml-auto"
            onClick={() => setShowDeleted(v => !v)}>
            {showDeleted ? 'Hide deleted' : 'Show deleted'}
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className={thClass}>Client #</TableHead>
              <TableHead className={thClass}>Tag</TableHead>
              <TableHead className={thClass}>Description</TableHead>
              <TableHead className={thClass}>Qty</TableHead>
              <TableHead className={thClass}>Material</TableHead>
              <TableHead className={thClass}>Created By</TableHead>
              <TableHead className={thClass}>Created At</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Inline add row */}
            {showInline && (
              <TableRow className="bg-secondary/30 border-border/40">
                <TableCell>
                  <Input
                    placeholder="Client #"
                    value={inlineForm.clientNumber}
                    onChange={e => setInlineForm(f => ({...f, clientNumber: e.target.value}))}
                    className="h-7 text-xs bg-secondary border-border"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Tag"
                    value={inlineForm.tag}
                    onChange={e => setInlineForm(f => ({...f, tag: e.target.value}))}
                    className="h-7 text-xs bg-secondary border-border"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Description"
                    value={inlineForm.shortDescription}
                    onChange={e => setInlineForm(f => ({...f, shortDescription: e.target.value}))}
                    className="h-7 text-xs bg-secondary border-border"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={inlineForm.quantity}
                    onChange={e => setInlineForm(f => ({...f, quantity: e.target.value}))}
                    className="h-7 text-xs bg-secondary border-border w-20"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={inlineForm.materialId}
                    onValueChange={v => setInlineForm(f => ({...f, materialId: v}))}>
                    <SelectTrigger className="h-7 text-xs bg-secondary border-border">
                      <SelectValue placeholder="Material" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {materials.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell colSpan={2}>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-accent text-accent-foreground hover:bg-accent/80"
                      onClick={handleInlineSave}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-border"
                      onClick={() => setShowInline(false)}>
                      Cancel
                    </Button>
                  </div>
                </TableCell>
                <TableCell />
              </TableRow>
            )}

            {filtered.length === 0 && !showInline ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No structures found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(s => (
                <TableRow
                  key={s.id}
                  className={`border-border/40 hover:bg-secondary/50 ${s.deleted ? 'opacity-50' : ''}`}>
                  <TableCell className={`${tdClass} text-foreground font-medium`}>
                    <div className="flex items-center gap-1.5">
                      {s.deleted && (
                        <Badge variant="destructive" className="text-xs font-normal h-4 px-1">
                          deleted
                        </Badge>
                      )}
                      {s.clientNumber ?? '-'}
                    </div>
                  </TableCell>
                  <TableCell className={tdClass}>{s.tag ?? '-'}</TableCell>
                  <TableCell className={tdClass}>
                    <span className="max-w-[180px] truncate inline-block">{s.shortDescription ?? '-'}</span>
                  </TableCell>
                  <TableCell className={tdClass}>{s.quantity ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{s.Material.name}</TableCell>
                  <TableCell className={tdClass}>
                    {s.Employee.firstName} {s.Employee.lastName}
                  </TableCell>
                  <TableCell className={tdClass}>{formatDate(s.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {s.deleted ? (
                        <>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary px-2"
                              onClick={() => handleUndelete(s.id)}>
                              Restore
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() => handleHardDelete(s.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                            onClick={() => openEdit(s)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(s.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
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

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={open => {
          if (!open) {
            setEditingId(null)
            setDialogForm(emptyForm())
          }
          setDialogOpen(open)
        }}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingId ? 'Edit Structure' : 'Add Structure'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Client Number</Label>
                <Input
                  value={dialogForm.clientNumber}
                  onChange={e => setDialogForm(f => ({...f, clientNumber: e.target.value}))}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Tag</Label>
                <Input
                  value={dialogForm.tag}
                  onChange={e => setDialogForm(f => ({...f, tag: e.target.value}))}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Quantity</Label>
                <Input
                  type="number"
                  value={dialogForm.quantity}
                  onChange={e => setDialogForm(f => ({...f, quantity: e.target.value}))}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Short Description</Label>
                <Input
                  value={dialogForm.shortDescription}
                  onChange={e => setDialogForm(f => ({...f, shortDescription: e.target.value}))}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Material</Label>
              <Select value={dialogForm.materialId} onValueChange={v => setDialogForm(f => ({...f, materialId: v}))}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {materials.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Long Description</Label>
              <Textarea
                value={dialogForm.longDescription}
                rows={2}
                onChange={e => setDialogForm(f => ({...f, longDescription: e.target.value}))}
                className="bg-secondary border-border resize-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Additional Info</Label>
              <Textarea
                value={dialogForm.additionalInfo}
                rows={2}
                onChange={e => setDialogForm(f => ({...f, additionalInfo: e.target.value}))}
                className="bg-secondary border-border resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border">
              Cancel
            </Button>
            <Button onClick={handleDialogSave} className="bg-accent text-accent-foreground hover:bg-accent/80">
              {editingId ? 'Save Changes' : 'Add Structure'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
