'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {VisibilityForRoleTab, buildInitialVisibilityRows} from '@/components/custom/visibilityForRoleTab'
import type {VisibilityRow} from '@/components/custom/visibilityForRoleTab'
import type {MappedTrainingStandard} from '@/types/training'
import type {RoleLevelOption} from '@/types/roleLevel'

interface TrainingStandardFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  standard: MappedTrainingStandard | null
  onSave: (standard: MappedTrainingStandard, visibilityRows: VisibilityRow[]) => Promise<void>
  isAdmin: boolean
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  certificateOptions: {id: string; name: string}[]
  /** Whether the current user can manage visibility (level >= 80) */
  canManageVisibility: boolean
}

const emptyStandard = (): MappedTrainingStandard => ({
  id: '',
  description: null,
  descriptionShort: null,
  location: null,
  certificate: true,
  repeat: false,
  createdAt: new Date().toISOString(),
  createdByName: '',
  certificateId: '',
  certificateName: null,
  targetId: '',
  deleted: false,
  deletedAt: null,
  deletedByName: null,
  visibilityForRoles: [],
})

export function TrainingStandardFormDialog({
  open,
  onOpenChange,
  standard,
  onSave,
  isAdmin,
  roleLevelOptions,
  defaultVisibleRoleNames,
  certificateOptions,
  canManageVisibility,
}: TrainingStandardFormDialogProps) {
  const [form, setForm] = useState<MappedTrainingStandard>(emptyStandard())
  const [saving, setSaving] = useState(false)
  const [visibilityRows, setVisibilityRows] = useState<VisibilityRow[]>(() =>
    // Seed visibility rows based on the current standard (or defaults for new).
    buildInitialVisibilityRows(standard?.visibilityForRoles ?? [], roleLevelOptions, defaultVisibleRoleNames),
  )

  useEffect(() => {
    const next = standard ?? emptyStandard()
    setForm(next)
    // Keep visibility state in sync when switching between standards.
    setVisibilityRows(buildInitialVisibilityRows(next.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames))
  }, [standard?.id, open])

  const isEdit = !!standard

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
          <DialogTitle className="text-foreground">{isEdit ? 'Edit Standard' : 'New Training Standard'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="bg-secondary border border-border/60">
            <TabsTrigger value="details">Details</TabsTrigger>
            {canManageVisibility && <TabsTrigger value="visibility">Visibility</TabsTrigger>}
          </TabsList>

          <TabsContent value="details">
            <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Short Name *</Label>
                <Input
                  value={form.descriptionShort ?? ''}
                  onChange={e => setForm(f => ({...f, descriptionShort: e.target.value || null}))}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Textarea
                  value={form.description ?? ''}
                  onChange={e => setForm(f => ({...f, description: e.target.value || null}))}
                  rows={3}
                  className="bg-secondary border-border resize-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Location</Label>
                <Input
                  value={form.location ?? ''}
                  onChange={e => setForm(f => ({...f, location: e.target.value || null}))}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Certificate *</Label>
                <Select
                  value={form.certificateId || 'none'}
                  onValueChange={v => setForm(f => ({...f, certificateId: v === 'none' ? '' : v}))}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">None</SelectItem>
                    {certificateOptions.map(o => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                <Label className="text-xs text-muted-foreground">Has Certificate</Label>
                <Switch checked={form.certificate} onCheckedChange={v => setForm(f => ({...f, certificate: v}))} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                <Label className="text-xs text-muted-foreground">Repeat</Label>
                <Switch checked={form.repeat} onCheckedChange={v => setForm(f => ({...f, repeat: v}))} />
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
            disabled={saving || !form.descriptionShort || !form.certificateId}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Standard'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
