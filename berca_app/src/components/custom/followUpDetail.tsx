'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowLeft, Pencil, X, Save, Plus, Check, Trash2, ExternalLink} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {VisibilityForRoleTab, buildInitialVisibilityRows} from '@/components/custom/visibilityForRoleTab'
import type {VisibilityRow} from '@/components/custom/visibilityForRoleTab'
import {FollowUpStructureFormDialog} from '@/components/custom/followUpStructureFormDialog'
import {updateFollowUpAction} from '@/serverFunctions/followUps'
import {
  createFollowUpStructureAction,
  updateFollowUpStructureAction,
  softDeleteFollowUpStructureAction,
  hardDeleteFollowUpStructureAction,
  undeleteFollowUpStructureAction,
} from '@/serverFunctions/followUpStructures'
import type {FollowUpDetailData, MappedFollowUpStructureSummary} from '@/types/followUp'
import type {MappedFollowUpStructure} from '@/types/followUpStructure'
import type {RoleLevelOption} from '@/types/roleLevel'
import Link from 'next/link'
import type {Route} from 'next'

interface SelectOption {
  id: string
  name: string
}

interface FollowUpDetailProps {
  followUp: FollowUpDetailData
  currentUserRole: string
  currentUserLevel: number
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  statusOptions: SelectOption[]
  urgencyTypeOptions: SelectOption[]
  followUpTypeOptions: SelectOption[]
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

const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'
const thClass = 'whitespace-nowrap text-xs'

// ─── Component ────────────────────────────────────────────────────────────────

export function FollowUpDetail({
  followUp,
  currentUserRole,
  currentUserLevel,
  roleLevelOptions,
  defaultVisibleRoleNames,
  statusOptions,
  urgencyTypeOptions,
  followUpTypeOptions,
  employeeOptions,
  contactOptions,
  department,
}: FollowUpDetailProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canEdit = currentUserLevel >= 20

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // ─── Structure dialog ──────────────────────────────────────────────────────
  const [structureDialogOpen, setStructureDialogOpen] = useState(false)
  const [editingStructure, setEditingStructure] = useState<MappedFollowUpStructure | null>(null)

  // ─── Edit form ─────────────────────────────────────────────────────────────
  const buildForm = () => ({
    activityDescription: followUp.activityDescription ?? '',
    additionalInfo: followUp.additionalInfo ?? '',
    actionAgenda: followUp.actionAgenda ? followUp.actionAgenda.slice(0, 10) : '',
    closedAgenda: followUp.closedAgenda ? followUp.closedAgenda.slice(0, 10) : '',
    recurringCallDays: followUp.recurringCallDays ?? '',
    itemClosed: followUp.itemClosed,
    salesFollowUp: followUp.salesFollowUp,
    nonConform: followUp.nonConform,
    periodicControl: followUp.periodicControl,
    recurringActive: followUp.recurringActive,
    review: followUp.review,
    ownedBy: followUp.ownedBy,
    executedBy: followUp.executedBy,
    statusId: followUp.statusId,
    urgencyTypeId: followUp.urgencyTypeId,
    followUpTypeId: followUp.followUpTypeId,
  })

  const [form, setForm] = useState(buildForm)
  const s = <K extends keyof ReturnType<typeof buildForm>>(key: K, v: ReturnType<typeof buildForm>[K]) =>
    setForm(f => ({...f, [key]: v}))

  // ─── Visibility ────────────────────────────────────────────────────────────
  const [visibilityRows, setVisibilityRows] = useState<VisibilityRow[]>(() =>
    buildInitialVisibilityRows(followUp.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames),
  )

  function handleCancel() {
    setForm(buildForm())
    setVisibilityRows(
      buildInitialVisibilityRows(followUp.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames),
    )
    setEditing(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateFollowUpAction({
        id: followUp.id,
        activityDescription: form.activityDescription || null,
        additionalInfo: form.additionalInfo || null,
        actionAgenda: form.actionAgenda ? new Date(form.actionAgenda) : null,
        closedAgenda: form.closedAgenda ? new Date(form.closedAgenda) : null,
        recurringCallDays: form.recurringCallDays ? Number(form.recurringCallDays) : null,
        itemClosed: form.itemClosed,
        salesFollowUp: form.salesFollowUp,
        nonConform: form.nonConform,
        periodicControl: form.periodicControl,
        recurringActive: form.recurringActive,
        review: form.review,
        ownedBy: form.ownedBy,
        executedBy: form.executedBy,
        statusId: form.statusId,
        urgencyTypeId: form.urgencyTypeId,
        followUpTypeId: form.followUpTypeId,
        visibilityForRoles: visibilityRows,
      })
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  // ─── Structure save ────────────────────────────────────────────────────────
  async function handleStructureSave(st: MappedFollowUpStructure, visRows: VisibilityRow[]) {
    const core = {
      activityDescription: st.activityDescription,
      additionalInfo: st.additionalInfo,
      actionAgenda: st.actionAgenda ? new Date(st.actionAgenda) : null,
      closedAgenda: st.closedAgenda ? new Date(st.closedAgenda) : null,
      recurringItem: st.recurringItem,
      item: st.item,
      contactDate: new Date(st.contactDate),
      taskDescription: st.taskDescription,
      taskStartDate: st.taskStartDate ? new Date(st.taskStartDate) : null,
      taskCompleteDate: st.taskCompleteDate ? new Date(st.taskCompleteDate) : null,
      recurringActive: st.recurringActive,
      ownedBy: st.ownedBy,
      executedBy: st.executedBy,
      taskFor: st.taskFor,
      statusId: st.statusId,
      urgencyTypeId: st.urgencyTypeId,
      followUpId: followUp.id,
      contactId: st.contactId,
    }

    if (editingStructure) {
      await updateFollowUpStructureAction({id: st.id, ...core, visibilityForRoles: visRows})
    } else {
      await createFollowUpStructureAction({...core, visibilityForRoles: visRows})
    }
    setStructureDialogOpen(false)
    router.refresh()
  }

  // ─── Reusable field renderers ──────────────────────────────────────────────

  const textareaRow = (label: string, val: string | null, formKey: keyof ReturnType<typeof buildForm>) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing ? (
        <Textarea
          value={(form[formKey] as string) ?? ''}
          onChange={e => s(formKey, e.target.value as ReturnType<typeof buildForm>[typeof formKey])}
          rows={3}
          className="bg-secondary border-border resize-none"
        />
      ) : (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{val || '-'}</p>
      )}
    </div>
  )

  const dateRow = (label: string, val: string | null, formKey: keyof ReturnType<typeof buildForm>) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
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

  // ─── Derived ───────────────────────────────────────────────────────────────
  const activeStructures = followUp.structures.filter(st => !st.deleted)
  const deletedStructures = followUp.structures.filter(st => st.deleted)

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
              {followUp.activityDescription
                ? followUp.activityDescription.slice(0, 60) + (followUp.activityDescription.length > 60 ? '…' : '')
                : 'Follow-up'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {[followUp.followUpTypeName, followUp.statusName, followUp.targetTypeName].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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

      {/* ── Info card ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/60 bg-card p-6 flex flex-col gap-6">
        {/* Target */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">About</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Target Type</Label>
              <p className="text-sm text-muted-foreground">{followUp.targetTypeName ?? '-'}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Target ID</Label>
              <p className="text-sm text-muted-foreground font-mono text-xs">
                {followUp.followUpTargetTargetId ?? '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Details</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              {textareaRow('Activity Description', followUp.activityDescription, 'activityDescription')}
            </div>
            <div className="sm:col-span-2">
              {textareaRow('Additional Info', followUp.additionalInfo, 'additionalInfo')}
            </div>
            {dateRow('Action Agenda', followUp.actionAgenda, 'actionAgenda')}
            {dateRow('Closed Agenda', followUp.closedAgenda, 'closedAgenda')}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Recurring Call Days</Label>
              {editing ? (
                <Input
                  type="number"
                  min={1}
                  value={(form.recurringCallDays as string | number) ?? ''}
                  onChange={e => s('recurringCallDays', e.target.value)}
                  className="bg-secondary border-border"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{followUp.recurringCallDays ?? '-'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Classification */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Classification</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selectRow('Type', followUp.followUpTypeName, 'followUpTypeId', followUpTypeOptions)}
            {selectRow('Status', followUp.statusName, 'statusId', statusOptions)}
            {selectRow('Urgency', followUp.urgencyTypeName, 'urgencyTypeId', urgencyTypeOptions)}
          </div>
        </div>

        {/* Assignment */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Assignment</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selectRow('Owned By', followUp.ownedByName, 'ownedBy', employeeOptions)}
            {selectRow('Executed By', followUp.executedByName, 'executedBy', employeeOptions)}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Created By</Label>
              <p className="text-sm text-muted-foreground">{followUp.createdByName}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Created At</Label>
              <p className="text-sm text-muted-foreground">{formatDate(followUp.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Flags */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Flags</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {toggleRow('Item Closed', followUp.itemClosed, 'itemClosed')}
            {toggleRow('Sales Follow-up', followUp.salesFollowUp, 'salesFollowUp')}
            {toggleRow('Non-conform', followUp.nonConform, 'nonConform')}
            {toggleRow('Periodic Control', followUp.periodicControl, 'periodicControl')}
            {toggleRow('Recurring Active', followUp.recurringActive, 'recurringActive')}
            {toggleRow('Review', followUp.review, 'review')}
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="structures">
        <TabsList className="bg-secondary border border-border/60 flex-wrap h-auto gap-1">
          <TabsTrigger value="structures">
            Entries
            <Badge variant="secondary" className="ml-2 text-xs">
              {activeStructures.length}
            </Badge>
          </TabsTrigger>
          {isAdmin && <TabsTrigger value="visibility">Visibility</TabsTrigger>}
        </TabsList>

        {/* ── Structures tab ───────────────────────────────────────────────── */}
        <TabsContent value="structures" className="mt-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">Follow-up log entries linked to this follow-up.</p>
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 border-border gap-1"
                onClick={() => {
                  setEditingStructure(null)
                  setStructureDialogOpen(true)
                }}>
                <Plus className="h-3.5 w-3.5" /> Add Entry
              </Button>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className={thClass}>Contact Date</TableHead>
                  <TableHead className={thClass}>Item</TableHead>
                  <TableHead className={thClass}>Activity</TableHead>
                  <TableHead className={thClass}>Task</TableHead>
                  <TableHead className={thClass}>Status</TableHead>
                  <TableHead className={thClass}>Urgency</TableHead>
                  <TableHead className={thClass}>Action Agenda</TableHead>
                  <TableHead className={thClass}>Closed Agenda</TableHead>
                  <TableHead className={thClass}>Created By</TableHead>
                  <TableHead className="w-24">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeStructures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-20 text-center text-muted-foreground">
                      No entries yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeStructures.map(st => (
                    <StructureRow
                      key={st.id}
                      st={st}
                      department={department}
                      canEdit={canEdit}
                      isAdmin={isAdmin}
                      onEdit={() => {
                        // Build a minimal MappedFollowUpStructure for the dialog
                        setEditingStructure({
                          id: st.id,
                          activityDescription: st.activityDescription,
                          additionalInfo: null,
                          actionAgenda: st.actionAgenda,
                          closedAgenda: st.closedAgenda,
                          recurringItem: null,
                          item: st.item,
                          contactDate: st.contactDate,
                          taskDescription: st.taskDescription,
                          taskStartDate: null,
                          taskCompleteDate: null,
                          createdAt: new Date().toISOString(),
                          recurringActive: false,
                          createdBy: '',
                          createdByName: st.createdByName,
                          ownedBy: '',
                          ownedByName: '',
                          executedBy: '',
                          executedByName: '',
                          taskFor: '',
                          taskForName: '',
                          statusId: '',
                          statusName: st.statusName,
                          urgencyTypeId: '',
                          urgencyTypeName: st.urgencyTypeName,
                          followUpId: followUp.id,
                          contactId: '',
                          contactName: '',
                          targetId: '',
                          visibilityForRoles: [],
                          deleted: st.deleted,
                          deletedAt: null,
                          deletedBy: null,
                          deletedByName: null,
                        })
                        setStructureDialogOpen(true)
                      }}
                      onSoftDelete={async () => {
                        await softDeleteFollowUpStructureAction({id: st.id})
                        router.refresh()
                      }}
                      onHardDelete={async () => {
                        await hardDeleteFollowUpStructureAction({id: st.id})
                        router.refresh()
                      }}
                      onRestore={async () => {
                        await undeleteFollowUpStructureAction({id: st.id})
                        router.refresh()
                      }}
                    />
                  ))
                )}
                {/* Deleted rows at the bottom, dimmed */}
                {deletedStructures.map(st => (
                  <StructureRow
                    key={st.id}
                    st={st}
                    department={department}
                    canEdit={canEdit}
                    isAdmin={isAdmin}
                    onEdit={() => {}}
                    onSoftDelete={async () => {}}
                    onHardDelete={async () => {
                      await hardDeleteFollowUpStructureAction({id: st.id})
                      router.refresh()
                    }}
                    onRestore={async () => {
                      await undeleteFollowUpStructureAction({id: st.id})
                      router.refresh()
                    }}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Visibility tab ───────────────────────────────────────────────── */}
        {isAdmin && (
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
        )}
      </Tabs>

      {/* ── Structure form dialog ───────────────────────────────────────────── */}
      <FollowUpStructureFormDialog
        open={structureDialogOpen}
        onOpenChange={setStructureDialogOpen}
        structure={editingStructure}
        fixedFollowUpId={followUp.id}
        onSave={handleStructureSave}
        isAdmin={isAdmin}
        roleLevelOptions={roleLevelOptions}
        defaultVisibleRoleNames={defaultVisibleRoleNames}
        statusOptions={statusOptions}
        urgencyTypeOptions={urgencyTypeOptions}
        employeeOptions={employeeOptions}
        contactOptions={contactOptions}
      />
    </div>
  )
}

// ─── Structure row sub-component ──────────────────────────────────────────────

function StructureRow({
  st,
  department,
  canEdit,
  isAdmin,
  onEdit,
  onSoftDelete,
  onHardDelete,
  onRestore,
}: {
  st: MappedFollowUpStructureSummary
  department: string
  canEdit: boolean
  isAdmin: boolean
  onEdit: () => void
  onSoftDelete: () => Promise<void>
  onHardDelete: () => Promise<void>
  onRestore: () => Promise<void>
}) {
  return (
    <TableRow className={`border-border/40 hover:bg-secondary/50 ${st.deleted ? 'opacity-40' : ''}`}>
      <TableCell className="whitespace-nowrap text-sm text-foreground font-medium">
        {formatDate(st.contactDate)}
      </TableCell>
      <TableCell className={tdClass}>{st.item ?? '-'}</TableCell>
      <TableCell className="text-sm text-muted-foreground max-w-xs">
        <p className="truncate max-w-[200px]" title={st.activityDescription ?? ''}>
          {st.activityDescription ?? '-'}
        </p>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground max-w-xs">
        <p className="truncate max-w-[200px]" title={st.taskDescription ?? ''}>
          {st.taskDescription ?? '-'}
        </p>
      </TableCell>
      <TableCell className={tdClass}>{st.statusName}</TableCell>
      <TableCell className={tdClass}>{st.urgencyTypeName}</TableCell>
      <TableCell className={tdClass}>{formatDate(st.actionAgenda)}</TableCell>
      <TableCell className={tdClass}>{formatDate(st.closedAgenda)}</TableCell>
      <TableCell className={tdClass}>{st.createdByName}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Link href={`/departments/${department}/followupstructure/${st.id}` as Route}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-accent/10">
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
          {!st.deleted && canEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
              onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {!st.deleted && canEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={onSoftDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {st.deleted && canEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
              onClick={onRestore}>
              Restore
            </Button>
          )}
          {st.deleted && isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:bg-destructive/10"
              onClick={onHardDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
