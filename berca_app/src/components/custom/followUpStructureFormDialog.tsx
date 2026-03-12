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
import type {MappedFollowUpStructure} from '@/types/followUpStructure'
import type {RoleLevelOption} from '@/types/roleLevel'

interface SelectOption {
  id: string
  name: string
}

interface FollowUpStructureFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  structure: MappedFollowUpStructure | null
  // When creating from within a follow-up detail page the followUpId is fixed
  fixedFollowUpId?: string
  onSave: (structure: MappedFollowUpStructure, visibilityRows: VisibilityRow[]) => Promise<void>
  isAdmin: boolean
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  statusOptions: SelectOption[]
  urgencyTypeOptions: SelectOption[]
  employeeOptions: SelectOption[]
  contactOptions: SelectOption[]
  followUpOptions?: SelectOption[] // optional — not needed when fixedFollowUpId is set
}

const emptyStructure = (fixedFollowUpId?: string): MappedFollowUpStructure => ({
  id: '',
  activityDescription: null,
  additionalInfo: null,
  actionAgenda: null,
  closedAgenda: null,
  recurringItem: null,
  item: null,
  contactDate: new Date().toISOString(),
  taskDescription: null,
  taskStartDate: null,
  taskCompleteDate: null,
  createdAt: new Date().toISOString(),
  recurringActive: false,
  createdBy: '',
  createdByName: '',
  ownedBy: '',
  ownedByName: '',
  executedBy: '',
  executedByName: '',
  taskFor: '',
  taskForName: '',
  statusId: '',
  statusName: '',
  urgencyTypeId: '',
  urgencyTypeName: '',
  followUpId: fixedFollowUpId ?? '',
  contactId: '',
  contactName: '',
  targetId: '',
  visibilityForRoles: [],
  deleted: false,
  deletedAt: null,
  deletedBy: null,
  deletedByName: null,
})

export function FollowUpStructureFormDialog({
  open,
  onOpenChange,
  structure,
  fixedFollowUpId,
  onSave,
  isAdmin,
  roleLevelOptions,
  defaultVisibleRoleNames,
  statusOptions,
  urgencyTypeOptions,
  employeeOptions,
  contactOptions,
  followUpOptions,
}: FollowUpStructureFormDialogProps) {
  const [form, setForm] = useState<MappedFollowUpStructure>(emptyStructure(fixedFollowUpId))
  const [saving, setSaving] = useState(false)
  const [visibilityRows, setVisibilityRows] = useState<VisibilityRow[]>(() =>
    buildInitialVisibilityRows(structure?.visibilityForRoles ?? [], roleLevelOptions, defaultVisibleRoleNames),
  )

  const isEdit = !!structure

  useEffect(() => {
    const next = structure ?? emptyStructure(fixedFollowUpId)
    setForm(next)
    setVisibilityRows(buildInitialVisibilityRows(next.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames))
  }, [structure?.id, open])

  function set<K extends keyof MappedFollowUpStructure>(key: K, value: MappedFollowUpStructure[K]) {
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
    form.ownedBy !== '' &&
    form.executedBy !== '' &&
    form.taskFor !== '' &&
    form.contactId !== '' &&
    form.followUpId !== '' &&
    form.contactDate !== ''

  // ─── Field helpers ─────────────────────────────────────────────────────────

  const textField = (key: keyof MappedFollowUpStructure, label: string, opts?: {placeholder?: string}) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        value={(form[key] as string | null) ?? ''}
        onChange={e => set(key, str(e.target.value) as MappedFollowUpStructure[typeof key])}
        placeholder={opts?.placeholder}
        className="bg-secondary border-border"
      />
    </div>
  )

  const textareaField = (key: keyof MappedFollowUpStructure, label: string, rows = 3) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Textarea
        value={(form[key] as string | null) ?? ''}
        onChange={e => set(key, str(e.target.value) as MappedFollowUpStructure[typeof key])}
        rows={rows}
        className="bg-secondary border-border resize-none"
      />
    </div>
  )

  const dateField = (key: keyof MappedFollowUpStructure, label: string, required = false) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">
        {label}
        {required && ' *'}
      </Label>
      <Input
        type="date"
        value={(form[key] as string | null) ? (form[key] as string).slice(0, 10) : ''}
        onChange={e =>
          set(
            key,
            (e.target.value ? new Date(e.target.value).toISOString() : null) as MappedFollowUpStructure[typeof key],
          )
        }
        className="bg-secondary border-border"
      />
    </div>
  )

  const selectField = (
    key: keyof MappedFollowUpStructure,
    label: string,
    options: SelectOption[],
    required = false,
  ) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">
        {label}
        {required && ' *'}
      </Label>
      <Select
        value={(form[key] as string) || 'none'}
        onValueChange={v => set(key, (v === 'none' ? '' : v) as MappedFollowUpStructure[typeof key])}>
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

  const toggleField = (key: keyof MappedFollowUpStructure, label: string) => (
    <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Switch
        checked={form[key] as boolean}
        onCheckedChange={v => set(key, v as MappedFollowUpStructure[typeof key])}
      />
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEdit ? 'Edit Follow-up Entry' : 'New Follow-up Entry'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="bg-secondary border border-border/60 flex-wrap h-auto gap-1">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="task">Task</TabsTrigger>
            <TabsTrigger value="assignment">Assignment</TabsTrigger>
            <TabsTrigger value="flags">Flags</TabsTrigger>
            {isAdmin && <TabsTrigger value="visibility">Visibility</TabsTrigger>}
          </TabsList>

          {/* ── Details ──────────────────────────────────────────────────── */}
          <TabsContent value="details">
            <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">
              {/* Follow-up parent — fixed or selectable */}
              {fixedFollowUpId ? (
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">Follow-up</Label>
                  <div className="flex h-10 items-center rounded-md border border-border bg-secondary/40 px-3 text-sm text-muted-foreground select-none">
                    Linked to parent follow-up
                  </div>
                </div>
              ) : (
                <div className="sm:col-span-2">
                  {selectField('followUpId', 'Follow-up *', followUpOptions ?? [], true)}
                </div>
              )}

              {selectField('contactId', 'Contact (who was contacted)', contactOptions, true)}
              {dateField('contactDate', 'Contact Date', true)}
              {textField('item', 'Item', {placeholder: 'Short subject…'})}
              {textField('recurringItem', 'Recurring Item')}
              {dateField('actionAgenda', 'Action Agenda')}
              {dateField('closedAgenda', 'Closed Agenda')}
              {selectField('statusId', 'Status', statusOptions, true)}
              {selectField('urgencyTypeId', 'Urgency', urgencyTypeOptions, true)}
              <div className="sm:col-span-2">{textareaField('activityDescription', 'Activity Description', 3)}</div>
              <div className="sm:col-span-2">{textareaField('additionalInfo', 'Additional Info', 2)}</div>
            </div>
          </TabsContent>

          {/* ── Task ─────────────────────────────────────────────────────── */}
          <TabsContent value="task">
            <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">
              <div className="sm:col-span-2">{textareaField('taskDescription', 'Task Description', 3)}</div>
              {dateField('taskStartDate', 'Task Start Date')}
              {dateField('taskCompleteDate', 'Task Complete Date')}
            </div>
          </TabsContent>

          {/* ── Assignment ───────────────────────────────────────────────── */}
          <TabsContent value="assignment">
            <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">
              {selectField('ownedBy', 'Owned By', employeeOptions, true)}
              {selectField('executedBy', 'Executed By', employeeOptions, true)}
              {selectField('taskFor', 'Task Assigned To', employeeOptions, true)}
            </div>
          </TabsContent>

          {/* ── Flags ────────────────────────────────────────────────────── */}
          <TabsContent value="flags">
            <div className="grid grid-cols-2 gap-3 py-3">{toggleField('recurringActive', 'Recurring Active')}</div>
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
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
