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
import type {MappedFollowUp} from '@/types/followUp'
import type {RoleLevelOption} from '@/types/roleLevel'

interface SelectOption {
  id: string
  name: string
}

interface FollowUpFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  followUp: MappedFollowUp | null
  onSave: (followUp: MappedFollowUp, visibilityRows: VisibilityRow[]) => Promise<void>
  isAdmin: boolean
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  statusOptions: SelectOption[]
  urgencyTypeOptions: SelectOption[]
  followUpTypeOptions: SelectOption[]
  employeeOptions: SelectOption[]
}

const emptyFollowUp = (): MappedFollowUp => ({
  id: '',
  activityDescription: null,
  additionalInfo: null,
  actionAgenda: null,
  closedAgenda: null,
  recurringCallDays: null,
  createdAt: new Date().toISOString(),
  itemClosed: false,
  salesFollowUp: false,
  nonConform: false,
  periodicControl: false,
  recurringActive: false,
  review: false,
  createdBy: '',
  createdByName: '',
  ownedBy: '',
  ownedByName: '',
  executedBy: '',
  executedByName: '',
  statusId: '',
  statusName: '',
  urgencyTypeId: '',
  urgencyTypeName: '',
  followUpTypeId: '',
  followUpTypeName: '',
  targetTypeName: null,
  followUpTargetId: null,
  followUpTargetTargetId: null,
  targetId: '',
  visibilityForRoles: [],
  deleted: false,
  deletedAt: null,
  deletedBy: null,
  deletedByName: null,
})

export function FollowUpFormDialog({
  open,
  onOpenChange,
  followUp,
  onSave,
  isAdmin,
  roleLevelOptions,
  defaultVisibleRoleNames,
  statusOptions,
  urgencyTypeOptions,
  followUpTypeOptions,
  employeeOptions,
}: FollowUpFormDialogProps) {
  const [form, setForm] = useState<MappedFollowUp>(emptyFollowUp())
  const [saving, setSaving] = useState(false)
  const [visibilityRows, setVisibilityRows] = useState<VisibilityRow[]>(() =>
    buildInitialVisibilityRows(followUp?.visibilityForRoles ?? [], roleLevelOptions, defaultVisibleRoleNames),
  )

  const isEdit = !!followUp

  useEffect(() => {
    const next = followUp ?? emptyFollowUp()
    setForm(next)
    setVisibilityRows(buildInitialVisibilityRows(next.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames))
  }, [followUp?.id, open])

  function set<K extends keyof MappedFollowUp>(key: K, value: MappedFollowUp[K]) {
    setForm(prev => ({...prev, [key]: value}))
  }

  function str(v: string): string | null {
    return v.trim() || null
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      await onSave(form, visibilityRows)
    } finally {
      setSaving(false)
    }
  }

  const isValid =
    form.statusId !== '' &&
    form.urgencyTypeId !== '' &&
    form.followUpTypeId !== '' &&
    form.ownedBy !== '' &&
    form.executedBy !== ''

  // ─── Field helpers ─────────────────────────────────────────────────────────

  const textareaField = (key: keyof MappedFollowUp, label: string, rows = 3) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Textarea
        value={(form[key] as string | null) ?? ''}
        onChange={e => set(key, str(e.target.value) as MappedFollowUp[typeof key])}
        rows={rows}
        className="bg-secondary border-border resize-none"
      />
    </div>
  )

  const dateField = (key: keyof MappedFollowUp, label: string) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="date"
        value={(form[key] as string | null) ? (form[key] as string).slice(0, 10) : ''}
        onChange={e =>
          set(key, (e.target.value ? new Date(e.target.value).toISOString() : null) as MappedFollowUp[typeof key])
        }
        className="bg-secondary border-border"
      />
    </div>
  )

  const selectField = (key: keyof MappedFollowUp, label: string, options: SelectOption[], required = false) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">
        {label}
        {required && ' *'}
      </Label>
      <Select
        value={(form[key] as string) || 'none'}
        onValueChange={v => set(key, (v === 'none' ? '' : v) as MappedFollowUp[typeof key])}>
        <SelectTrigger className="bg-secondary border-border">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {!required && <SelectItem value="none">None</SelectItem>}
          {options.map(o => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  const toggleField = (key: keyof MappedFollowUp, label: string) => (
    <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Switch checked={form[key] as boolean} onCheckedChange={v => set(key, v as MappedFollowUp[typeof key])} />
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? 'Edit Follow-up' : 'New Follow-up'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="bg-secondary border border-border/60 flex-wrap h-auto gap-1">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="assignment">Assignment</TabsTrigger>
            <TabsTrigger value="flags">Flags</TabsTrigger>
            {isAdmin && <TabsTrigger value="visibility">Visibility</TabsTrigger>}
          </TabsList>

          {/* ── Details ──────────────────────────────────────────────────── */}
          <TabsContent value="details">
            <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">
              <div className="sm:col-span-2">{textareaField('activityDescription', 'Activity Description', 3)}</div>
              <div className="sm:col-span-2">{textareaField('additionalInfo', 'Additional Info', 2)}</div>
              {dateField('actionAgenda', 'Action Agenda')}
              {dateField('closedAgenda', 'Closed Agenda')}
              {selectField('followUpTypeId', 'Follow-up Type', followUpTypeOptions, true)}
              {selectField('statusId', 'Status', statusOptions, true)}
              {selectField('urgencyTypeId', 'Urgency', urgencyTypeOptions, true)}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Recurring Call Days</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.recurringCallDays ?? ''}
                  onChange={e => set('recurringCallDays', e.target.value ? parseInt(e.target.value, 10) : null)}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
          </TabsContent>

          {/* ── Assignment ───────────────────────────────────────────────── */}
          <TabsContent value="assignment">
            <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">
              {selectField('ownedBy', 'Owned By', employeeOptions, true)}
              {selectField('executedBy', 'Executed By', employeeOptions, true)}
            </div>
          </TabsContent>

          {/* ── Flags ────────────────────────────────────────────────────── */}
          <TabsContent value="flags">
            <div className="grid grid-cols-2 gap-3 py-3 sm:grid-cols-3">
              {toggleField('itemClosed', 'Item Closed')}
              {toggleField('salesFollowUp', 'Sales Follow-up')}
              {toggleField('nonConform', 'Non-conform')}
              {toggleField('periodicControl', 'Periodic Control')}
              {toggleField('recurringActive', 'Recurring Active')}
              {toggleField('review', 'Review')}
            </div>
          </TabsContent>

          {/* ── Visibility ───────────────────────────────────────────────── */}
          {isAdmin && (
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
            disabled={saving || !isValid}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Follow-up'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
