'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowLeft, Pencil, X, Save, Plus, Trash2} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {VisibilityForRoleTab, buildInitialVisibilityRows} from '@/components/custom/visibilityForRoleTab'
import type {VisibilityRow} from '@/components/custom/visibilityForRoleTab'
import {
  updateDocumentAction,
  createDocumentRevisionAction,
  softDeleteDocumentRevisionAction,
  hardDeleteDocumentRevisionAction,
} from '@/serverFunctions/documents'
import type {DocumentDetailData, MappedDocumentGroup, DocumentPlaceOption, DocumentStatusOption} from '@/types/document'
import {DOCUMENT_TARGET_TYPE_NAMES, type DocumentTargetTypeName} from '@/types/document'
import type {RoleLevelOption} from '@/types/roleLevel'

interface SelectOption {
  id: string
  name: string
}

interface GroupOption {
  id: string
  name: string | null
}

interface DocumentDetailProps {
  document: DocumentDetailData
  currentUserRole: string
  currentUserLevel: number
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  employeeOptions: SelectOption[]
  // Flat unique lists of A/B/C/D items (derived from junction rows in the page)
  groupAOptions: GroupOption[]
  groupBOptions: GroupOption[]
  groupCOptions: GroupOption[]
  groupDOptions: GroupOption[]
  // All junction rows — used to drive cascade filtering and to resolve groupId on save
  documentGroups: MappedDocumentGroup[]
  placeOptions: DocumentPlaceOption[]
  statusOptions: DocumentStatusOption[]
  documentOptions: SelectOption[]
  targetOptions: Record<DocumentTargetTypeName, SelectOption[]>
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

const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

export function DocumentDetail({
  document,
  currentUserRole,
  currentUserLevel,
  roleLevelOptions,
  defaultVisibleRoleNames,
  employeeOptions,
  groupAOptions,
  groupBOptions,
  groupCOptions,
  groupDOptions,
  documentGroups,
  placeOptions,
  statusOptions,
  documentOptions,
  targetOptions,
  departmentId,
}: DocumentDetailProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canEdit = currentUserLevel >= 40
  const canCreate = currentUserLevel >= 60
  const canDelete = currentUserLevel >= 80
  const canManageVisibility = currentUserLevel >= 80

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // ─── Find which A/B/C/D the current documentGroupId resolves to ───────────

  function resolveCurrentGroup() {
    if (!document.documentGroupId) return {aId: '', bId: '', cId: '', dId: ''}
    const g = documentGroups.find(g => g.id === document.documentGroupId)
    if (!g) return {aId: '', bId: '', cId: '', dId: ''}
    return {
      aId: g.groupAId ?? '',
      bId: g.groupBId ?? '',
      cId: g.groupCId ?? '',
      dId: g.groupDId ?? '',
    }
  }

  // ─── Edit form ─────────────────────────────────────────────────────────────

  const buildForm = () => {
    const {aId, bId, cId, dId} = resolveCurrentGroup()
    return {
      documentNumber: document.documentNumber,
      description: document.description ?? '',
      descriptionShort: document.descriptionShort,
      expiryDate: document.expiryDate ? document.expiryDate.slice(0, 10) : '',
      revisionNumber: document.revisionNumber?.toString() ?? '',
      revisionDetail: document.revisionDetail ?? '',
      valid: document.valid,
      process: document.process,
      canCopy: document.canCopy,
      additionalInfo: document.additionalInfo ?? '',
      referenceDocId: document.referenceDocId ?? null,
      revisedById: document.revisedById ?? null,
      managedById: document.managedById ?? null,
      documentPlaceId: document.documentPlaceId ?? null,
      documentStatusId: document.documentStatusId ?? null,
      // Group cascade selectors — separate from form, but kept together for simplicity
      selAId: aId,
      selBId: bId,
      selCId: cId,
      selDId: dId,
    }
  }

  const [form, setForm] = useState(buildForm)
  const s = <K extends keyof ReturnType<typeof buildForm>>(key: K, v: ReturnType<typeof buildForm>[K]) =>
    setForm(f => ({...f, [key]: v}))

  // ─── Cascade filtering using junction rows ─────────────────────────────────

  const validBIds = new Set(documentGroups.filter(g => g.groupAId === form.selAId && g.groupBId).map(g => g.groupBId!))
  const validCIds = new Set(
    documentGroups
      .filter(g => g.groupAId === form.selAId && g.groupBId === form.selBId && g.groupCId)
      .map(g => g.groupCId!),
  )
  const validDIds = new Set(
    documentGroups
      .filter(g => g.groupAId === form.selAId && g.groupBId === form.selBId && g.groupCId === form.selCId && g.groupDId)
      .map(g => g.groupDId!),
  )

  const filteredGroupBs = groupBOptions.filter(o => validBIds.has(o.id))
  const filteredGroupCs = groupCOptions.filter(o => validCIds.has(o.id))
  const filteredGroupDs = groupDOptions.filter(o => validDIds.has(o.id))

  // ─── Resolve the DocumentGroup.id from the current A/B/C/D selection ───────

  function resolveGroupId(): string | null {
    if (!form.selAId) return null
    const match = documentGroups.find(
      g =>
        (g.groupAId ?? '') === form.selAId &&
        (g.groupBId ?? '') === form.selBId &&
        (g.groupCId ?? '') === form.selCId &&
        (g.groupDId ?? '') === form.selDId,
    )
    return match?.id ?? null
  }

  // ─── Target assignments ────────────────────────────────────────────────────

  const [targetMaterial, setTargetMaterial] = useState('')
  const [targetProject, setTargetProject] = useState('')
  const [targetCompany, setTargetCompany] = useState('')

  // ─── Visibility ────────────────────────────────────────────────────────────

  const [visibilityRows, setVisibilityRows] = useState<VisibilityRow[]>(() =>
    buildInitialVisibilityRows(document.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames),
  )

  function handleCancel() {
    setForm(buildForm())
    setVisibilityRows(
      buildInitialVisibilityRows(document.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames),
    )
    setTargetMaterial('')
    setTargetProject('')
    setTargetCompany('')
    setEditing(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const core = {
        id: document.id,
        documentNumber: form.documentNumber,
        description: form.description || null,
        descriptionShort: form.descriptionShort,
        expiryDate: form.expiryDate ? new Date(form.expiryDate) : null,
        revisionNumber: form.revisionNumber ? parseInt(form.revisionNumber, 10) : null,
        revisionDetail: form.revisionDetail || null,
        valid: form.valid,
        process: form.process,
        canCopy: form.canCopy,
        additionalInfo: form.additionalInfo || null,
        referenceDocId: form.referenceDocId || null,
        revisedById: form.revisedById || null,
        managedById: form.managedById || null,
        documentGroupId: resolveGroupId(),
        documentPlaceId: form.documentPlaceId,
        documentStatusId: form.documentStatusId || null,
        visibilityForRoles: visibilityRows,
      }
      await updateDocumentAction({...core})
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  // ─── Revision dialog ───────────────────────────────────────────────────────

  const [revDialogOpen, setRevDialogOpen] = useState(false)
  const [revShort, setRevShort] = useState('')
  const [revLong, setRevLong] = useState('')
  const [revSaving, setRevSaving] = useState(false)

  async function handleAddRevision() {
    setRevSaving(true)
    try {
      await createDocumentRevisionAction({
        documentId: document.id,
        shortDescription: revShort.trim() || null,
        longDescription: revLong.trim() || null,
      })
      setRevDialogOpen(false)
      setRevShort('')
      setRevLong('')
      router.refresh()
    } finally {
      setRevSaving(false)
    }
  }

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
    options: {id: string; name: string | null}[],
  ) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing ? (
        <Select
          value={(form[formKey] as string) || 'none'}
          onValueChange={v => s(formKey, (v === 'none' ? null : v) as ReturnType<typeof buildForm>[typeof formKey])}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="none">None</SelectItem>
            {options.map(o => (
              <SelectItem key={o.id} value={o.id}>
                {o.name ?? o.id}
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

  // ─── Current group display (view mode) ────────────────────────────────────

  const currentGroup = document.documentGroupId ? documentGroups.find(g => g.id === document.documentGroupId) : null

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
            {selectRow('Status', document.documentStatusName, 'documentStatusId', statusOptions)}
          </div>
        </div>

        {/* Grouping */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Grouping</p>

          {editing ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Group A */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Group A</Label>
                <Select
                  value={form.selAId || 'none'}
                  onValueChange={v => {
                    const id = v === 'none' ? '' : v
                    setForm(f => ({...f, selAId: id, selBId: '', selCId: '', selDId: ''}))
                  }}>
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
                  value={form.selBId || 'none'}
                  disabled={!form.selAId || filteredGroupBs.length === 0}
                  onValueChange={v => {
                    const id = v === 'none' ? '' : v
                    setForm(f => ({...f, selBId: id, selCId: '', selDId: ''}))
                  }}>
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
                  value={form.selCId || 'none'}
                  disabled={!form.selBId || filteredGroupCs.length === 0}
                  onValueChange={v => {
                    const id = v === 'none' ? '' : v
                    setForm(f => ({...f, selCId: id, selDId: ''}))
                  }}>
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
                  value={form.selDId || 'none'}
                  disabled={!form.selCId || filteredGroupDs.length === 0}
                  onValueChange={v => {
                    const id = v === 'none' ? '' : v
                    setForm(f => ({...f, selDId: id}))
                  }}>
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
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(['A', 'B', 'C', 'D'] as const).map(letter => {
                const name = currentGroup?.[`group${letter}Name` as keyof MappedDocumentGroup] as string | null
                return (
                  <div key={letter} className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Group {letter}</Label>
                    <p className="text-sm text-muted-foreground">{name ?? '-'}</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Place */}
          <div className="mt-4">
            {selectRow(
              'Document Place',
              document.documentPlaceLabel,
              'documentPlaceId',
              placeOptions.map(p => ({id: p.id, name: p.label})),
            )}
          </div>
        </div>

        {/* People */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">People</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selectRow('Revised By', document.revisedByName, 'revisedById', employeeOptions)}
            {selectRow('Managed By', document.managedByName, 'managedById', employeeOptions)}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {toggleRow('Valid', document.valid, 'valid')}
            {toggleRow('Process', document.process, 'process')}
            {toggleRow('Can Copy', document.canCopy, 'canCopy')}
          </div>
        </div>

        {/* Target links — edit mode dropdowns */}
        {editing && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Target Links</p>
            <p className="text-xs text-muted-foreground mb-3">
              Add or update links. Leave as None to keep existing links unchanged.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {DOCUMENT_TARGET_TYPE_NAMES.map(type => {
                const value = type === 'Material' ? targetMaterial : type === 'Project' ? targetProject : targetCompany
                const setter =
                  type === 'Material' ? setTargetMaterial : type === 'Project' ? setTargetProject : setTargetCompany
                return (
                  <div key={type} className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">{type}</Label>
                    <Select value={value || 'none'} onValueChange={v => setter(v === 'none' ? '' : v)}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="None (keep existing)" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="none">None (keep existing)</SelectItem>
                        {(targetOptions[type] ?? []).map(o => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Target links — view mode ──────────────────────────────────────── */}
      {!editing && document.documentStructureTargets.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Target Links</p>
          <div className="flex flex-wrap gap-3">
            {document.documentStructureTargets.map(t => (
              <div
                key={t.id}
                className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2">
                <Badge variant="outline" className="text-xs border-border">
                  {t.targetTypeName}
                </Badge>
                <span className="text-sm text-muted-foreground">{t.targetDisplayName ?? t.targetId}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="revisions">
        <TabsList className="bg-secondary border border-border/60 flex-wrap h-auto gap-1">
          <TabsTrigger value="revisions">
            Revisions
            <Badge variant="secondary" className="ml-2 text-xs">
              {document.revisions.length}
            </Badge>
          </TabsTrigger>
          {canManageVisibility && <TabsTrigger value="visibility">Visibility</TabsTrigger>}
        </TabsList>

        {/* ── Revisions ──────────────────────────────────────────────────────── */}
        <TabsContent value="revisions" className="mt-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">Revision history for this document.</p>
            {canCreate && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 border-border gap-1"
                onClick={() => {
                  setRevShort('')
                  setRevLong('')
                  setRevDialogOpen(true)
                }}>
                <Plus className="h-3.5 w-3.5" /> Add Revision
              </Button>
            )}
          </div>
          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="text-xs">Short Description</TableHead>
                  <TableHead className="text-xs">Detail</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Created By</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Created At</TableHead>
                  <TableHead className="w-20">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {document.revisions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                      No revisions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  document.revisions.map(r => (
                    <TableRow
                      key={r.id}
                      className={`border-border/40 hover:bg-secondary/50 ${r.deleted ? 'opacity-50' : ''}`}>
                      <TableCell className="text-sm text-foreground">{r.shortDescription ?? '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs">
                        <p className="truncate max-w-[240px]" title={r.longDescription ?? ''}>
                          {r.longDescription ?? '-'}
                        </p>
                      </TableCell>
                      <TableCell className={tdClass}>{r.createdByName}</TableCell>
                      <TableCell className={tdClass}>{formatDate(r.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {!r.deleted && canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={async () => {
                                await softDeleteDocumentRevisionAction({id: r.id})
                                router.refresh()
                              }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {r.deleted && isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={async () => {
                                await hardDeleteDocumentRevisionAction({id: r.id})
                                router.refresh()
                              }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Visibility ─────────────────────────────────────────────────────── */}
        {canManageVisibility && (
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

      {/* ── Add Revision dialog ───────────────────────────────────────────── */}
      <Dialog open={revDialogOpen} onOpenChange={setRevDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Revision</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Short Description</Label>
              <Input
                value={revShort}
                onChange={e => setRevShort(e.target.value)}
                className="bg-secondary border-border"
                placeholder="e.g. Updated section 3.2"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Detail</Label>
              <Textarea
                value={revLong}
                onChange={e => setRevLong(e.target.value)}
                rows={4}
                className="bg-secondary border-border resize-none"
                placeholder="Describe what changed…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevDialogOpen(false)} className="border-border">
              Cancel
            </Button>
            <Button
              onClick={handleAddRevision}
              disabled={revSaving}
              className="bg-accent text-accent-foreground hover:bg-accent/80">
              {revSaving ? 'Saving…' : 'Add Revision'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
