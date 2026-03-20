'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {VisibilityForRoleTab, buildInitialVisibilityRows} from '@/components/custom/visibilityForRoleTab'
import type {VisibilityRow} from '@/components/custom/visibilityForRoleTab'
import type {MappedTraining} from '@/types/training'
import type {RoleLevelOption} from '@/types/roleLevel'
import {generateTrainingNumber} from '@/lib/utils'

interface TrainingFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  training: MappedTraining | null
  onSave: (training: MappedTraining, visibilityRows: VisibilityRow[]) => Promise<void>
  isAdmin: boolean
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  standardOptions: {id: string; name: string}[]
  workOrderOptions: {id: string; name: string}[]
  /** Whether the current user can manage visibility (level >= 80) */
  canManageVisibility: boolean
}

const emptyTraining = (): MappedTraining => ({
  id: '',
  trainingNumber: generateTrainingNumber(),
  trainingDate: new Date().toISOString(),
  closed: false,
  createdAt: new Date().toISOString(),
  createdByName: '',
  workOrderId: '',
  workOrderNumber: null,
  trainingStandardId: '',
  trainingStandardDescriptionShort: null,
  targetId: '',
  deleted: false,
  deletedAt: null,
  deletedByName: null,
  visibilityForRoles: [],
})

export function TrainingFormDialog({
  open,
  onOpenChange,
  training,
  onSave,
  isAdmin,
  roleLevelOptions,
  defaultVisibleRoleNames,
  standardOptions,
  workOrderOptions,
  canManageVisibility,
}: TrainingFormDialogProps) {
  const [form, setForm] = useState<MappedTraining>(emptyTraining())
  const [saving, setSaving] = useState(false)
  const [visibilityRows, setVisibilityRows] = useState<VisibilityRow[]>(() =>
    buildInitialVisibilityRows(training?.visibilityForRoles ?? [], roleLevelOptions, defaultVisibleRoleNames),
  )

  useEffect(() => {
    const next = training ?? emptyTraining()
    setForm(next)
    setVisibilityRows(buildInitialVisibilityRows(next.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames))
  }, [training?.id, open])

  const isEdit = !!training

  async function handleSubmit() {
    setSaving(true)
    try {
      await onSave(form, visibilityRows)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? 'Edit Training' : 'New Training'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="bg-secondary border border-border/60">
            <TabsTrigger value="details">Details</TabsTrigger>
            {canManageVisibility && <TabsTrigger value="visibility">Visibility</TabsTrigger>}
          </TabsList>

          <TabsContent value="details">
            <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">
              {/* Training Number — auto-generated on create, locked on edit */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">
                  Training Number
                  {isEdit ? (
                    <span className="ml-1.5 text-muted-foreground/60">(locked)</span>
                  ) : (
                    <span className="ml-1.5 text-muted-foreground/60">(auto-generated)</span>
                  )}
                </Label>
                {isEdit ? (
                  <div className="flex h-10 items-center rounded-md border border-border bg-secondary/40 px-3 text-sm text-muted-foreground cursor-not-allowed select-none">
                    {form.trainingNumber ?? '-'}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={form.trainingNumber ?? ''}
                      readOnly
                      className="bg-secondary/40 border-border text-muted-foreground flex-1 cursor-default"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 px-3 border-border text-xs shrink-0"
                      onClick={() => setForm(f => ({...f, trainingNumber: generateTrainingNumber()}))}>
                      Regenerate
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Training Date *</Label>
                <Input
                  type="date"
                  value={form.trainingDate.slice(0, 10)}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      trainingDate: e.target.value ? new Date(e.target.value).toISOString() : f.trainingDate,
                    }))
                  }
                  className="bg-secondary border-border"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Standard *</Label>
                <Select
                  value={form.trainingStandardId || 'none'}
                  onValueChange={v => setForm(f => ({...f, trainingStandardId: v === 'none' ? '' : v}))}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">None</SelectItem>
                    {standardOptions.map(o => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Work Order *</Label>
                <Select
                  value={form.workOrderId || 'none'}
                  onValueChange={v => setForm(f => ({...f, workOrderId: v === 'none' ? '' : v}))}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">None</SelectItem>
                    {workOrderOptions.map(o => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Closed</Label>
                <Switch checked={form.closed} onCheckedChange={v => setForm(f => ({...f, closed: v}))} />
              </div>
            </div>
          </TabsContent>

          {canManageVisibility && (
            <TabsContent value="visibility">
              <div className="py-3">
                <VisibilityForRoleTab
                  roleLevelOptions={roleLevelOptions}
                  value={visibilityRows}
                  onChange={setVisibilityRows}
                />
              </div>
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !form.trainingStandardId || !form.workOrderId}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Training'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
