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
import type {MappedProject} from '@/types/project'
import type {RoleLevelOption} from '@/types/roleLevel'
import {generateProjectNumber} from '@/lib/utils'

interface Option {
  id: string
  name: string
}

interface ProjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: MappedProject | null
  projects: MappedProject[]
  projectTypes: Option[]
  companies: Option[]
  onSave: (project: MappedProject, visibilityRows: VisibilityRow[]) => Promise<void>
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
}

function toInputDate(iso: string | null) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

const emptyProject = (): MappedProject => ({
  id: '',
  projectNumber: '',
  projectName: '',
  description: null,
  extraInfo: null,
  startDate: null,
  endDate: null,
  closingDate: null,
  engineeringStartDate: null,
  createdAt: new Date().toISOString(),
  isMainProject: true,
  isIntern: false,
  isOpen: true,
  isClosed: false,
  createdBy: '',
  companyId: '',
  companyName: '',
  projectTypeId: '',
  projectTypeName: '',
  parentProjectId: null,
  deleted: false,
  deletedAt: null,
  deletedBy: null,
  targetId: '',
  visibilityForRoles: [],
})

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  projects,
  projectTypes,
  companies,
  onSave,
  roleLevelOptions,
  defaultVisibleRoleNames,
}: ProjectFormDialogProps) {
  const [form, setForm] = useState<MappedProject>(emptyProject())
  const [saving, setSaving] = useState(false)
  const [visibilityRows, setVisibilityRows] = useState<VisibilityRow[]>(() =>
    buildInitialVisibilityRows(project?.visibilityForRoles ?? [], roleLevelOptions, defaultVisibleRoleNames),
  )

  useEffect(() => {
    const next = project ?? emptyProject()
    if (project) {
      setForm(project)
    } else if (open) {
      const newProject = emptyProject()
      newProject.projectNumber = generateProjectNumber()
      setForm(newProject)
    }
    setVisibilityRows(buildInitialVisibilityRows(next.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames))
  }, [project?.id, open])

  function set<K extends keyof MappedProject>(key: K, value: MappedProject[K]) {
    setForm(prev => ({...prev, [key]: value}))
  }

  function setDateField(key: keyof MappedProject, value: string) {
    set(key, value ? new Date(value).toISOString() : (null as any))
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      await onSave(form, visibilityRows)
    } finally {
      setSaving(false)
    }
  }

  const isEdit = !!project

  // Parent project options: exclude self
  const parentOptions = projects.filter(p => p.id !== form.id && !p.deleted)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="bg-secondary border border-border/60">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="visibility">Visibility</TabsTrigger>
          </TabsList>

          {/* ── Details ───────────────────────────────────────────────────── */}
          <TabsContent value="details">
            <div className="grid grid-cols-1 gap-5 py-3 sm:grid-cols-2">
              {/* Project Number */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Project Number *</Label>
                <Input value={form.projectNumber} readOnly className="bg-secondary border-border" />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Project Name *</Label>
                <Input
                  value={form.projectName}
                  onChange={e => set('projectName', e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>

              {/* Company */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Company *</Label>
                <Select value={form.companyId} onValueChange={v => set('companyId', v)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {companies.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Project Type */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Project Type *</Label>
                <Select value={form.projectTypeId} onValueChange={v => set('projectTypeId', v)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {projectTypes.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Parent Project */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Parent Project</Label>
                <Select
                  value={form.parentProjectId ?? 'none'}
                  onValueChange={v => set('parentProjectId', v === 'none' ? null : v)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="None (top-level)" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">None (top-level)</SelectItem>
                    {parentOptions.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.projectNumber} — {p.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Start Date</Label>
                <Input
                  type="date"
                  value={toInputDate(form.startDate)}
                  onChange={e => setDateField('startDate', e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>

              {/* End Date */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">End Date</Label>
                <Input
                  type="date"
                  value={toInputDate(form.endDate)}
                  onChange={e => setDateField('endDate', e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>

              {/* Engineering Start Date */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Engineering Start Date</Label>
                <Input
                  type="date"
                  value={toInputDate(form.engineeringStartDate)}
                  onChange={e => setDateField('engineeringStartDate', e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>

              {/* Closing Date */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Closing Date</Label>
                <Input
                  type="date"
                  value={toInputDate(form.closingDate)}
                  onChange={e => setDateField('closingDate', e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Textarea
                  value={form.description ?? ''}
                  onChange={e => set('description', e.target.value || null)}
                  rows={3}
                  className="bg-secondary border-border resize-none"
                />
              </div>

              {/* Extra Info */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Extra Info</Label>
                <Textarea
                  value={form.extraInfo ?? ''}
                  onChange={e => set('extraInfo', e.target.value || null)}
                  rows={3}
                  className="bg-secondary border-border resize-none"
                />
              </div>

              {/* Toggles */}
              <div className="sm:col-span-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {(
                  [
                    {key: 'isMainProject', label: 'Main Project'},
                    {key: 'isIntern', label: 'Internal'},
                    {key: 'isOpen', label: 'Open'},
                    {key: 'isClosed', label: 'Closed'},
                  ] as const
                ).map(({key, label}) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    <Switch checked={form[key]} onCheckedChange={v => set(key, v)} />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── Visibility ────────────────────────────────────────────────── */}
          <TabsContent value="visibility">
            <div className="py-3">
              <VisibilityForRoleTab
                roleLevelOptions={roleLevelOptions}
                value={visibilityRows}
                onChange={setVisibilityRows}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !form.projectNumber || !form.companyId || !form.projectTypeId}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
