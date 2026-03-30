'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowLeft, Pencil, X, Save} from 'lucide-react'
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
import {updateDocumentAction} from '@/serverFunctions/documents'
import type {DocumentDetailData, DocumentGroupOption, DocumentPlaceOption} from '@/types/document'
import type {RoleLevelOption} from '@/types/roleLevel'

interface SelectOption {
  id: string
  name: string
}

interface DocumentDetailProps {
  document: DocumentDetailData
  currentUserRole: string
  currentUserLevel: number
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  employeeOptions: SelectOption[]
  roleOptions: SelectOption[]
  groupOptions: DocumentGroupOption[]
  placeOptions: DocumentPlaceOption[]
  documentOptions: SelectOption[]
  departmentId: string
}

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

export function DocumentDetail({
  document,
  currentUserRole,
  currentUserLevel,
  roleLevelOptions,
  defaultVisibleRoleNames,
  employeeOptions,
  roleOptions,
  groupOptions,
  placeOptions,
  documentOptions,
  departmentId,
}: DocumentDetailProps) {
  const router = useRouter()
  const canEdit = currentUserLevel >= 40
  const canManageVisibility = currentUserLevel >= 80

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const buildForm = () => ({
    documentNumber: document.documentNumber,
    description: document.description ?? '',
    descriptionShort: document.descriptionShort,
    expiryDate: document.expiryDate ? document.expiryDate.slice(0, 10) : '',
    revisionNumber: document.revisionNumber?.toString() ?? '',
    revisionDetail: document.revisionDetail ?? '',
    valid: document.valid,
    process: document.process,
    additionalInfo: document.additionalInfo ?? '',
    referenceDocId: document.referenceDocId ?? '',
    roleId: document.roleId ?? '',
    revisedById: document.revisedById,
    managedById: document.managedById,
    documentGroupAId: document.documentGroupAId,
    documentGroupBId: document.documentGroupBId,
    documentGroupCId: document.documentGroupCId,
    documentGroupDId: document.documentGroupDId,
    documentPlaceId: document.documentPlaceId,
  })

  const [form, setForm] = useState(buildForm)
  const s = <K extends keyof ReturnType<typeof buildForm>>(key: K, v: ReturnType<typeof buildForm>[K]) =>
    setForm(f => ({...f, [key]: v}))

  const [visibilityRows, setVisibilityRows] = useState<VisibilityRow[]>(() =>
    buildInitialVisibilityRows(document.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames),
  )

  function handleCancel() {
    setForm(buildForm())
    setVisibilityRows(
      buildInitialVisibilityRows(document.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames),
    )
    setEditing(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateDocumentAction({
        id: document.id,
        documentNumber: form.documentNumber,
        description: form.description || null,
        descriptionShort: form.descriptionShort,
        expiryDate: form.expiryDate ? new Date(form.expiryDate) : null,
        revisionNumber: form.revisionNumber ? parseInt(form.revisionNumber, 10) : null,
        revisionDetail: form.revisionDetail || null,
        valid: form.valid,
        process: form.process,
        additionalInfo: form.additionalInfo || null,
        referenceDocId: form.referenceDocId || null,
        roleId: form.roleId || null,
        revisedById: form.revisedById,
        managedById: form.managedById,
        documentGroupAId: form.documentGroupAId,
        documentGroupBId: form.documentGroupBId,
        documentGroupCId: form.documentGroupCId,
        documentGroupDId: form.documentGroupDId,
        documentPlaceId: form.documentPlaceId,
        visibilityForRoles: visibilityRows,
      })
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  // Cascading group filters
  const filteredGroupBs = groupBOptions.filter(
    b => !form.documentGroupAId || b.documentGroupAId === form.documentGroupAId,
  )
  const filteredGroupCs = groupCOptions.filter(
    c => !form.documentGroupBId || c.documentGroupBId === form.documentGroupBId,
  )
  const filteredGroupDs = groupDOptions.filter(
    d => !form.documentGroupCId || d.documentGroupCId === form.documentGroupCId,
  )

  // ─── Field helpers ─────────────────────────────────────────────────────────

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

  const inputRow = (
    label: string,
    val: string | number | null,
    formKey: keyof ReturnType<typeof buildForm>,
    type = 'text',
  ) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing ? (
        <Input
          type={type}
          value={(form[formKey] as string) ?? ''}
          onChange={e => s(formKey, e.target.value as ReturnType<typeof buildForm>[typeof formKey])}
          className="bg-secondary border-border"
        />
      ) : (
        <p className="text-sm text-muted-foreground">{val ?? '-'}</p>
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
    displayVal: string | null,
    formKey: keyof ReturnType<typeof buildForm>,
    options: SelectOption[],
  ) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing ? (
        <Select
          value={(form[formKey] as string) || 'none'}
          onValueChange={v => s(formKey, (v === 'none' ? '' : v) as ReturnType<typeof buildForm>[typeof formKey])}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="none">None</SelectItem>
            {options.map(o => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="text-sm text-muted-foreground">{displayVal || '-'}</p>
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
      {/* ── Header ──────────────────────────────────────────────────────── */}
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
            <h1 className="text-lg font-semibold text-foreground">{document.documentNumber}</h1>
            <p className="text-sm text-muted-foreground">{document.descriptionShort}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={handleCancel} className="gap-2 border-border">
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2 bg-accent text-accent-foreground hover:bg-accent/80">
                <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}
              </Button>
            </>
          ) : (
            canEdit && (
              <Button onClick={() => setEditing(true)} variant="outline" className="gap-2 border-border">
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            )
          )}
        </div>
      </div>

      {/* ── Info card ────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/60 bg-card p-6 flex flex-col gap-6">
        {/* Identification */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Identification</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {inputRow('Document Number', document.documentNumber, 'documentNumber')}
            {inputRow('Short Description', document.descriptionShort, 'descriptionShort')}
            <div className="sm:col-span-2">{textareaRow('Description', document.description, 'description')}</div>
            <div className="sm:col-span-2">
              {textareaRow('Additional Info', document.additionalInfo, 'additionalInfo')}
            </div>
          </div>
        </div>

        {/* Revision */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Revision</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inputRow('Revision Number', document.revisionNumber, 'revisionNumber', 'number')}
            {dateRow('Expiry Date', document.expiryDate, 'expiryDate')}
            <div className="sm:col-span-2">
              {textareaRow('Revision Detail', document.revisionDetail, 'revisionDetail')}
            </div>
            {selectRow('Reference Document', document.referenceDocNumber, 'referenceDocId', documentOptions)}
          </div>
        </div>

        {/* Grouping */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Grouping</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {editing ? (
              <>
                {/* Group A */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Group A</Label>
                  <Select
                    value={form.documentGroupAId || 'none'}
                    onValueChange={v =>
                      setForm(f => ({
                        ...f,
                        documentGroupAId: v === 'none' ? '' : v,
                        documentGroupBId: '',
                        documentGroupCId: '',
                        documentGroupDId: '',
                      }))
                    }>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="none">None</SelectItem>
                      {groupAOptions.map(o => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name ?? o.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Group B */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Group B</Label>
                  <Select
                    value={form.documentGroupBId || 'none'}
                    disabled={!form.documentGroupAId}
                    onValueChange={v =>
                      setForm(f => ({
                        ...f,
                        documentGroupBId: v === 'none' ? '' : v,
                        documentGroupCId: '',
                        documentGroupDId: '',
                      }))
                    }>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="none">None</SelectItem>
                      {filteredGroupBs.map(o => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name ?? o.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Group C */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Group C</Label>
                  <Select
                    value={form.documentGroupCId || 'none'}
                    disabled={!form.documentGroupBId}
                    onValueChange={v =>
                      setForm(f => ({...f, documentGroupCId: v === 'none' ? '' : v, documentGroupDId: ''}))
                    }>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="none">None</SelectItem>
                      {filteredGroupCs.map(o => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name ?? o.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Group D */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Group D</Label>
                  <Select
                    value={form.documentGroupDId || 'none'}
                    disabled={!form.documentGroupCId}
                    onValueChange={v => setForm(f => ({...f, documentGroupDId: v === 'none' ? '' : v}))}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="none">None</SelectItem>
                      {filteredGroupDs.map(o => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name ?? o.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Group A</Label>
                  <p className="text-sm text-muted-foreground">{document.documentGroupAName ?? '-'}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Group B</Label>
                  <p className="text-sm text-muted-foreground">{document.documentGroupBName ?? '-'}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Group C</Label>
                  <p className="text-sm text-muted-foreground">{document.documentGroupCName ?? '-'}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Group D</Label>
                  <p className="text-sm text-muted-foreground">{document.documentGroupDName ?? '-'}</p>
                </div>
              </>
            )}
          </div>

          {/* Place */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {editing ? (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Document Place</Label>
                <Select
                  value={form.documentPlaceId || 'none'}
                  onValueChange={v => s('documentPlaceId', v === 'none' ? '' : v)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">None</SelectItem>
                    {placeOptions.map(o => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Document Place</Label>
                <p className="text-sm text-muted-foreground">{document.documentPlaceLabel}</p>
              </div>
            )}
          </div>
        </div>

        {/* People */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">People</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selectRow('Revised By', document.revisedByName, 'revisedById', employeeOptions)}
            {selectRow('Managed By', document.managedByName, 'managedById', employeeOptions)}
            {selectRow('Role', document.roleName, 'roleId', roleOptions)}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Created By</Label>
              <p className="text-sm text-muted-foreground">{document.createdByName}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Created At</Label>
              <p className="text-sm text-muted-foreground">{formatDate(document.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Flags */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Flags</p>
          <div className="grid grid-cols-2 gap-3">
            {toggleRow('Valid', document.valid, 'valid')}
            {toggleRow('Process', document.process, 'process')}
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      {canManageVisibility && (
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
