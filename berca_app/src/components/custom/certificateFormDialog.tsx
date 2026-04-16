'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {VisibilityForRoleTab, buildInitialVisibilityRows} from '@/components/custom/visibilityForRoleTab'
import type {VisibilityRow} from '@/components/custom/visibilityForRoleTab'
import type {MappedCertificate} from '@/types/training'
import type {RoleLevelOption} from '@/types/roleLevel'

interface SelectOption {
  id: string
  name: string
}

interface CertificateFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  certificate: MappedCertificate | null
  onSave: (certificate: MappedCertificate, visibilityRows: VisibilityRow[]) => Promise<void>
  isAdmin: boolean
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  certificateTypeOptions: SelectOption[]
  /** Whether the current user can manage visibility (level >= 80) */
  canManageVisibility: boolean
}

const emptyCertificate = (): MappedCertificate => ({
  id: '',
  description: null,
  descriptionShort: null,
  createdAt: new Date().toISOString(),
  createdByName: '',
  certificateTypeId: '',
  certificateTypeName: '',
  targetId: '',
  deleted: false,
  deletedAt: null,
  deletedByName: null,
  visibilityForRoles: [],
})

export function CertificateFormDialog({
  open,
  onOpenChange,
  certificate,
  onSave,
  isAdmin,
  roleLevelOptions,
  defaultVisibleRoleNames,
  certificateTypeOptions,
  canManageVisibility,
}: CertificateFormDialogProps) {
  const [form, setForm] = useState<MappedCertificate>(emptyCertificate())
  const [saving, setSaving] = useState(false)
  const [visibilityRows, setVisibilityRows] = useState<VisibilityRow[]>(() =>
    // Seed visibility rows based on the current certificate (or defaults for new).
    buildInitialVisibilityRows(certificate?.visibilityForRoles ?? [], roleLevelOptions, defaultVisibleRoleNames),
  )

  useEffect(() => {
    const next = certificate ?? emptyCertificate()
    setForm(next)
    // Keep visibility state in sync when switching between certificates.
    setVisibilityRows(buildInitialVisibilityRows(next.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames))
  }, [certificate?.id, open])

  const isEdit = !!certificate

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
          <DialogTitle className="text-foreground">{isEdit ? 'Edit Certificate' : 'New Certificate'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="bg-secondary border border-border/60">
            <TabsTrigger value="details">Details</TabsTrigger>
            {canManageVisibility && <TabsTrigger value="visibility">Visibility</TabsTrigger>}
          </TabsList>

          <TabsContent value="details">
            <div className="grid grid-cols-1 gap-4 py-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Short Name *</Label>
                <Input
                  value={form.descriptionShort ?? ''}
                  onChange={e => setForm(f => ({...f, descriptionShort: e.target.value || null}))}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Textarea
                  value={form.description ?? ''}
                  onChange={e => setForm(f => ({...f, description: e.target.value || null}))}
                  rows={3}
                  className="bg-secondary border-border resize-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Certificate Type *</Label>
                <Select
                  value={form.certificateTypeId || 'none'}
                  onValueChange={v => setForm(f => ({...f, certificateTypeId: v === 'none' ? '' : v}))}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select type…" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">None</SelectItem>
                    {certificateTypeOptions.map(o => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            disabled={saving || !form.descriptionShort || !form.certificateTypeId}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Certificate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
