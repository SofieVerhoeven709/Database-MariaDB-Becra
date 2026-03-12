'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowLeft, Pencil, X, Save, ExternalLink} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {VisibilityForRoleTab, buildInitialVisibilityRows} from '@/components/custom/visibilityForRoleTab'
import type {VisibilityRow} from '@/components/custom/visibilityForRoleTab'
import {updateFollowUpStructureAction} from '@/serverFunctions/followUpStructures'
import type {FollowUpStructureDetailData} from '@/types/followUpStructure'
import type {RoleLevelOption} from '@/types/roleLevel'
import Link from 'next/link'
import type {Route} from 'next'

interface SelectOption {
  id: string
  name: string
}

interface FollowUpStructureDetailProps {
  structure: FollowUpStructureDetailData
  currentUserRole: string
  currentUserLevel: number
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  statusOptions: SelectOption[]
  urgencyTypeOptions: SelectOption[]
  employeeOptions: SelectOption[]
  contactOptions: SelectOption[]
  department: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function YesNoBadge({value}: {value: boolean}) {
  return value ? (
    <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
  ) : (
    <Badge variant="secondary" className="text-muted-foreground font-medium">
      No
    </Badge>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FollowUpStructureDetail({
  structure,
  currentUserRole,
  currentUserLevel,
  roleLevelOptions,
  defaultVisibleRoleNames,
  statusOptions,
  urgencyTypeOptions,
  employeeOptions,
  contactOptions,
  department,
}: FollowUpStructureDetailProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canEdit = currentUserLevel >= 20

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // ─── Edit form ─────────────────────────────────────────────────────────────
  const buildForm = () => ({
    activityDescription: structure.activityDescription ?? '',
    additionalInfo: structure.additionalInfo ?? '',
    actionAgenda: structure.actionAgenda ? structure.actionAgenda.slice(0, 10) : '',
    closedAgenda: structure.closedAgenda ? structure.closedAgenda.slice(0, 10) : '',
    recurringItem: structure.recurringItem ?? '',
    item: structure.item ?? '',
    contactDate: structure.contactDate.slice(0, 10),
    taskDescription: structure.taskDescription ?? '',
    taskStartDate: structure.taskStartDate ? structure.taskStartDate.slice(0, 10) : '',
    taskCompleteDate: structure.taskCompleteDate ? structure.taskCompleteDate.slice(0, 10) : '',
    recurringActive: structure.recurringActive,
    ownedBy: structure.ownedBy,
    executedBy: structure.executedBy,
    taskFor: structure.taskFor,
    statusId: structure.statusId,
    urgencyTypeId: structure.urgencyTypeId,
    contactId: structure.contactId,
  })

  const [form, setForm] = useState(buildForm)
  const s = <K extends keyof ReturnType<typeof buildForm>>(key: K, v: ReturnType<typeof buildForm>[K]) =>
    setForm(f => ({...f, [key]: v}))

  // ─── Visibility ────────────────────────────────────────────────────────────
  const [visibilityRows, setVisibilityRows] = useState<VisibilityRow[]>(() =>
    buildInitialVisibilityRows(structure.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames),
  )

  function handleCancel() {
    setForm(buildForm())
    setVisibilityRows(
      buildInitialVisibilityRows(structure.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames),
    )
    setEditing(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateFollowUpStructureAction({
        id: structure.id,
        activityDescription: form.activityDescription || null,
        additionalInfo: form.additionalInfo || null,
        actionAgenda: form.actionAgenda ? new Date(form.actionAgenda) : null,
        closedAgenda: form.closedAgenda ? new Date(form.closedAgenda) : null,
        recurringItem: form.recurringItem || null,
        item: form.item || null,
        contactDate: new Date(form.contactDate),
        taskDescription: form.taskDescription || null,
        taskStartDate: form.taskStartDate ? new Date(form.taskStartDate) : null,
        taskCompleteDate: form.taskCompleteDate ? new Date(form.taskCompleteDate) : null,
        recurringActive: form.recurringActive,
        ownedBy: form.ownedBy,
        executedBy: form.executedBy,
        taskFor: form.taskFor,
        statusId: form.statusId,
        urgencyTypeId: form.urgencyTypeId,
        followUpId: structure.followUpId,
        contactId: form.contactId,
        visibilityForRoles: visibilityRows,
      })
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  // ─── Reusable field renderers ──────────────────────────────────────────────

  const textRow = (label: string, val: string | null, formKey: keyof ReturnType<typeof buildForm>) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing ? (
        <Input
          value={(form[formKey] as string) ?? ''}
          onChange={e => s(formKey, e.target.value as ReturnType<typeof buildForm>[typeof formKey])}
          className="bg-secondary border-border"
        />
      ) : (
        <p className="text-sm text-muted-foreground">{val || '-'}</p>
      )}
    </div>
  )

  const textareaRow = (label: string, val: string | null, formKey: keyof ReturnType<typeof buildForm>, rows = 3) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing ? (
        <Textarea
          value={(form[formKey] as string) ?? ''}
          onChange={e => s(formKey, e.target.value as ReturnType<typeof buildForm>[typeof formKey])}
          rows={rows}
          className="bg-secondary border-border resize-none"
        />
      ) : (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{val || '-'}</p>
      )}
    </div>
  )

  const dateRow = (
    label: string,
    val: string | null,
    formKey: keyof ReturnType<typeof buildForm>,
    required = false,
  ) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">
        {label}
        {required && ' *'}
      </Label>
      {editing ? (
        <Input
          type="date"
          value={(form[formKey] as string) ?? ''}
          onChange={e => s(formKey, e.target.value as ReturnType<typeof buildForm>[typeof formKey])}
          className="bg-secondary border-border"
        />
      ) : (
        <p className="text-sm text-muted-foreground">{formatDate(val)}</p>
      )}
    </div>
  )

  const selectRow = (
    label: string,
    val: string,
    formKey: keyof ReturnType<typeof buildForm>,
    options: SelectOption[],
  ) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing ? (
        <Select
          value={(form[formKey] as string) || 'none'}
          onValueChange={v => s(formKey, v as ReturnType<typeof buildForm>[typeof formKey])}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {options.map(o => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="text-sm text-muted-foreground">{val || '-'}</p>
      )}
    </div>
  )

  const toggleRow = (label: string, val: boolean, formKey: keyof ReturnType<typeof buildForm>) => (
    <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing ? (
        <Switch
          checked={form[formKey] as boolean}
          onCheckedChange={v => s(formKey, v as ReturnType<typeof buildForm>[typeof formKey])}
        />
      ) : (
        <YesNoBadge value={val} />
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {structure.item ?? formatDate(structure.contactDate)}
            </h1>
            <p className="text-sm text-muted-foreground">
              {[structure.statusName, structure.urgencyTypeName, structure.contactName].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Link back to parent follow-up */}
          <Link href={`/departments/${department}/followUp/${structure.followUpId}` as Route}>
            <Button variant="outline" size="sm" className="gap-2 border-border text-xs">
              <ExternalLink className="h-3.5 w-3.5" />
              Parent Follow-up
            </Button>
          </Link>
          {editing ? (
            <>
              <Button variant="outline" onClick={handleCancel} className="gap-2 border-border">
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2 bg-accent text-accent-foreground hover:bg-accent/80">
                <Save className="h-4 w-4" />
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </>
          ) : (
            canEdit && (
              <Button onClick={() => setEditing(true)} variant="outline" className="gap-2 border-border">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            )
          )}
        </div>
      </div>

      {/* ── Parent follow-up banner ─────────────────────────────────────────── */}
      <div className="rounded-lg border border-border/60 bg-secondary/40 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Parent Follow-up</p>
          <p className="text-sm text-foreground font-medium">
            {structure.followUp.activityDescription
              ? structure.followUp.activityDescription.slice(0, 80) +
                (structure.followUp.activityDescription.length > 80 ? '…' : '')
              : 'Follow-up'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {[structure.followUp.followUpTypeName, structure.followUp.statusName].filter(Boolean).join(' · ')}
          </p>
        </div>
        <Link href={`/departments/${department}/followUp/${structure.followUpId}` as Route}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* ── Info card ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/60 bg-card p-6 flex flex-col gap-6">
        {/* Contact */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Contact</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selectRow('Contact', structure.contactName, 'contactId', contactOptions)}
            {dateRow('Contact Date', structure.contactDate, 'contactDate', true)}
            {textRow('Item', structure.item, 'item')}
            {textRow('Recurring Item', structure.recurringItem, 'recurringItem')}
          </div>
        </div>

        {/* Activity */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Activity</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              {textareaRow('Activity Description', structure.activityDescription, 'activityDescription')}
            </div>
            <div className="sm:col-span-2">
              {textareaRow('Additional Info', structure.additionalInfo, 'additionalInfo', 2)}
            </div>
            {dateRow('Action Agenda', structure.actionAgenda, 'actionAgenda')}
            {dateRow('Closed Agenda', structure.closedAgenda, 'closedAgenda')}
          </div>
        </div>

        {/* Task */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Task</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              {textareaRow('Task Description', structure.taskDescription, 'taskDescription')}
            </div>
            {dateRow('Task Start Date', structure.taskStartDate, 'taskStartDate')}
            {dateRow('Task Complete Date', structure.taskCompleteDate, 'taskCompleteDate')}
          </div>
        </div>

        {/* Classification */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Classification</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selectRow('Status', structure.statusName, 'statusId', statusOptions)}
            {selectRow('Urgency', structure.urgencyTypeName, 'urgencyTypeId', urgencyTypeOptions)}
          </div>
        </div>

        {/* Assignment */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Assignment</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selectRow('Owned By', structure.ownedByName, 'ownedBy', employeeOptions)}
            {selectRow('Executed By', structure.executedByName, 'executedBy', employeeOptions)}
            {selectRow('Task Assigned To', structure.taskForName, 'taskFor', employeeOptions)}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Created By</Label>
              <p className="text-sm text-muted-foreground">{structure.createdByName}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Created At</Label>
              <p className="text-sm text-muted-foreground">{formatDate(structure.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Flags */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Flags</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {toggleRow('Recurring Active', structure.recurringActive, 'recurringActive')}
          </div>
        </div>
      </div>

      {/* ── Visibility tab ──────────────────────────────────────────────────── */}
      {isAdmin && (
        <Tabs defaultValue="visibility">
          <TabsList className="bg-secondary border border-border/60">
            <TabsTrigger value="visibility">Visibility</TabsTrigger>
          </TabsList>
          <TabsContent value="visibility" className="mt-3">
            {editing ? (
              <VisibilityForRoleTab
                roleLevelOptions={roleLevelOptions}
                value={visibilityRows}
                onChange={setVisibilityRows}
              />
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">Click Edit to change visibility settings.</p>
                <div className="flex flex-wrap gap-3">
                  {roleLevelOptions.map(rl => {
                    const visible = visibilityRows.find(r => r.roleLevelId === rl.id)?.visible ?? false
                    return (
                      <div
                        key={rl.id}
                        className="flex flex-col items-start gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 w-60">
                        <div>
                          <p className="text-sm text-foreground">{rl.roleName}</p>
                          <p className="text-xs text-muted-foreground">
                            {rl.subRoleName} — level {rl.subRoleLevel}
                          </p>
                        </div>
                        <YesNoBadge value={visible} />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
