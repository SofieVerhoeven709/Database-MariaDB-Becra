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
import type {MappedDocument, MappedDocumentGroup, DocumentPlaceOption, DocumentStatusOption} from '@/types/document'
import {type DocumentTargetTypeName} from '@/types/document'
import type {RoleLevelOption} from '@/types/roleLevel'
import {generateDocumentNumber} from '@/lib/utils'
import {getDocumentGroupId} from '@/dal/documents'

interface SelectOption {
  id: string
  name: string
}

interface GroupOption {
  id: string
  name: string | null
}

// What gets passed back to the save handler for target assignments
export interface DocumentTargetAssignment {
  typeName: DocumentTargetTypeName
  targetId: string // the Target.id (not entity id)
}

interface DocumentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: MappedDocument | null
  onSave: (
    document: MappedDocument,
    visibilityRows: VisibilityRow[],
    targetAssignments: DocumentTargetAssignment[],
  ) => Promise<void>
  isAdmin: boolean
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  employeeOptions: SelectOption[]
  groupAOptions: GroupOption[]
  groupBOptions: GroupOption[]
  groupCOptions: GroupOption[]
  groupDOptions: GroupOption[]
  // All existing DocumentGroup junction rows — used for cascading filtering
  documentGroups: MappedDocumentGroup[]
  placeOptions: DocumentPlaceOption[]
  statusOptions: DocumentStatusOption[]
  documentOptions: SelectOption[]
  // targetOptions maps type name → [{id: Target.id, name: string}]
  targetOptions: Record<DocumentTargetTypeName, SelectOption[]>
  canManageVisibility: boolean
  canEditNumber: boolean
}

function emptyDocument(): MappedDocument {
  return {
    id: '',
    documentNumber: generateDocumentNumber(),
    description: null,
    descriptionShort: '',
    createdAt: new Date().toISOString(),
    expiryDate: null,
    revisionNumber: null,
    revisionDetail: null,
    valid: true,
    process: false,
    canCopy: false,
    additionalInfo: null,
    referenceDocId: null,
    referenceDocNumber: null,
    documentGroup: null,
    documentGroupId: null,
    documentPlaceId: '',
    documentPlaceLabel: '',
    documentStatusId: null,
    documentStatusName: null,
    createdBy: '',
    createdByName: '',
    revisedById: null,
    revisedByName: null,
    managedById: null,
    managedByName: null,
    // target link fields — read-only display only
    documentTargetId: null,
    documentTargetTargetId: null,
    documentTargetTypeName: null,
    targetId: '',
    visibilityForRoles: [],
    deleted: false,
    deletedAt: null,
    deletedBy: null,
    deletedByName: null,
  }
}

export function DocumentFormDialog({
  open,
  onOpenChange,
  document,
  onSave,
  isAdmin,
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
  canManageVisibility,
  canEditNumber,
}: DocumentFormDialogProps) {
  const [form, setForm] = useState<MappedDocument>(emptyDocument())
  const [saving, setSaving] = useState(false)
  const [numberError, setNumberError] = useState<string | null>(null)
  const [visibilityRows, setVisibilityRows] = useState<VisibilityRow[]>(() =>
    buildInitialVisibilityRows(document?.visibilityForRoles ?? [], roleLevelOptions, defaultVisibleRoleNames),
  )

  // ─── Group cascade state ───────────────────────────────────────────────────
  // These mirror the A/B/C/D ids the user is selecting in the form
  const [selAId, setSelAId] = useState('')
  const [selBId, setSelBId] = useState('')
  const [selCId, setSelCId] = useState('')
  const [selDId, setSelDId] = useState('')

  // ─── Target assignments (all 3 types at once) ──────────────────────────────
  const [targetMaterial, setTargetMaterial] = useState('')
  const [targetProject, setTargetProject] = useState('')
  const [targetCompany, setTargetCompany] = useState('')

  const isEdit = !!document
  const numberEditable = !isEdit || canEditNumber

  // ─── Reset on open/document change ────────────────────────────────────────

  useEffect(() => {
    const next = document ?? emptyDocument()
    setForm(next)
    setNumberError(null)
    setVisibilityRows(buildInitialVisibilityRows(next.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames))
    // Seed group selectors from the document
    setSelAId(next.documentGroup?.groupAId ?? '')
    setSelBId(next.documentGroup?.groupBId ?? '')
    setSelCId(next.documentGroup?.groupCId ?? '')
    setSelDId(next.documentGroup?.groupDId ?? '')
    // Reset targets on open
    setTargetMaterial('')
    setTargetProject('')
    setTargetCompany('')
  }, [document?.id, open])

  function set<K extends keyof MappedDocument>(key: K, value: MappedDocument[K]) {
    setForm(prev => ({...prev, [key]: value}))
  }

  // ─── Cascading group filtering ─────────────────────────────────────────────
  // documentGroups are junction rows: {groupAId, groupBId, groupCId, groupDId}
  // To get valid B options given A: find all group junctions where groupAId === selAId,
  // then return the unique B ids from those junctions.

  const validBIds = new Set(documentGroups.filter(g => g.groupAId === selAId && g.groupBId).map(g => g.groupBId!))
  const validCIds = new Set(
    documentGroups.filter(g => g.groupAId === selAId && g.groupBId === selBId && g.groupCId).map(g => g.groupCId!),
  )
  const validDIds = new Set(
    documentGroups
      .filter(g => g.groupAId === selAId && g.groupBId === selBId && g.groupCId === selCId && g.groupDId)
      .map(g => g.groupDId!),
  )

  const filteredGroupBs = groupBOptions.filter(o => validBIds.has(o.id))
  const filteredGroupCs = groupCOptions.filter(o => validCIds.has(o.id))
  const filteredGroupDs = groupDOptions.filter(o => validDIds.has(o.id))

  function handleSelectA(v: string) {
    const id = v === 'none' ? '' : v
    setSelAId(id)
    setSelBId('')
    setSelCId('')
    setSelDId('')
    setForm(f => ({...f, documentGroupAId: id, documentGroupBId: null, documentGroupCId: null, documentGroupDId: null}))
  }

  function handleSelectB(v: string) {
    const id = v === 'none' ? '' : v
    setSelBId(id)
    setSelCId('')
    setSelDId('')
    setForm(f => ({...f, documentGroupBId: id || null, documentGroupCId: null, documentGroupDId: null}))
  }

  function handleSelectC(v: string) {
    const id = v === 'none' ? '' : v
    setSelCId(id)
    setSelDId('')
    setForm(f => ({...f, documentGroupCId: id || null, documentGroupDId: null}))
  }

  function handleSelectD(v: string) {
    const id = v === 'none' ? '' : v
    setSelDId(id)
    setForm(f => ({...f, documentGroupDId: id || null}))
  }

  // ─── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!form.documentNumber.trim()) {
      setNumberError('Document number is required.')
      return
    }
    setSaving(true)
    try {
      const assignments: DocumentTargetAssignment[] = []
      if (targetMaterial) assignments.push({typeName: 'Material', targetId: targetMaterial})
      if (targetProject) assignments.push({typeName: 'Project', targetId: targetProject})
      if (targetCompany) assignments.push({typeName: 'Company', targetId: targetCompany})
      const docGroup = documentGroups.find(
        group =>
          group.groupAId === selAId &&
          group.groupBId === selBId &&
          group.groupCId === selCId &&
          group.groupDId === selDId,
      )
      await onSave(
        {
          ...form,
          descriptionShort: form.descriptionShort.trim(),
          description: form.description?.trim() || null,
          additionalInfo: form.additionalInfo?.trim() || null,
          revisionDetail: form.revisionDetail?.trim() || null,
          documentNumber: form.documentNumber.trim(),
          documentGroupId: docGroup!.id,
        },
        visibilityRows,
        assignments,
      )
    } finally {
      setSaving(false)
    }
  }

  const isValid =
    form.documentNumber.trim() !== '' && form.descriptionShort.trim() !== '' && form.documentPlaceId !== ''

  // ─── Field helpers ─────────────────────────────────────────────────────────

  const textareaField = (key: keyof MappedDocument, label: string, rows = 3) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Textarea
        value={(form[key] as string | null) ?? ''}
        onChange={e => set(key, (e.target.value || null) as MappedDocument[typeof key])}
        rows={rows}
        className="bg-secondary border-border resize-none"
      />
    </div>
  )

  const dateField = (key: keyof MappedDocument, label: string) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="date"
        value={(form[key] as string | null) ? (form[key] as string).slice(0, 10) : ''}
        onChange={e =>
          set(key, (e.target.value ? new Date(e.target.value).toISOString() : null) as MappedDocument[typeof key])
        }
        className="bg-secondary border-border"
      />
    </div>
  )

  const selectField = (
    key: keyof MappedDocument,
    label: string,
    options: {id: string; name: string | null}[],
    required = false,
  ) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">
        {label}
        {required && ' *'}
      </Label>
      <Select
        value={(form[key] as string | null) ?? 'none'}
        onValueChange={v => set(key, (v === 'none' ? null : v) as MappedDocument[typeof key])}>
        <SelectTrigger className="bg-secondary border-border">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {!required && <SelectItem value="none">None</SelectItem>}
          {options.map(o => (
            <SelectItem key={o.id} value={o.id}>
              {o.name ?? o.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  const toggleField = (key: keyof MappedDocument, label: string) => (
    <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Switch checked={form[key] as boolean} onCheckedChange={v => set(key, v as MappedDocument[typeof key])} />
    </div>
  )

  const targetSelectField = (label: DocumentTargetTypeName, value: string, onChange: (v: string) => void) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value || 'none'} onValueChange={v => onChange(v === 'none' ? '' : v)}>
        <SelectTrigger className="bg-secondary border-border">
          <SelectValue placeholder="None" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          <SelectItem value="none">None</SelectItem>
          {(targetOptions[label] ?? []).map(o => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? 'Edit Document' : 'New Document'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="bg-secondary border border-border/60 flex-wrap h-auto gap-1">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="grouping">Grouping</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
            <TabsTrigger value="target">Target</TabsTrigger>
            <TabsTrigger value="flags">Flags</TabsTrigger>
            {canManageVisibility && <TabsTrigger value="visibility">Visibility</TabsTrigger>}
          </TabsList>

          {/* ── Details ──────────────────────────────────────────────────── */}
          <TabsContent value="details">
            <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">
              {/* Document number */}
              <div className="sm:col-span-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Number *{!numberEditable && <span className="ml-1.5 text-muted-foreground/60">(locked)</span>}
                  </Label>
                  {numberEditable ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-2">
                        <Input
                          value={form.documentNumber}
                          onChange={e => {
                            set('documentNumber', e.target.value)
                            if (numberError) setNumberError(null)
                          }}
                          className={`bg-secondary border-border flex-1 ${numberError ? 'border-destructive' : ''}`}
                        />
                        {!isEdit && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-10 px-3 border-border text-xs shrink-0"
                            onClick={() => set('documentNumber', generateDocumentNumber())}>
                            Regenerate
                          </Button>
                        )}
                      </div>
                      {numberError && <p className="text-xs text-destructive">{numberError}</p>}
                    </div>
                  ) : (
                    <div className="flex h-10 items-center rounded-md border border-border bg-secondary/40 px-3 text-sm text-muted-foreground cursor-not-allowed select-none">
                      {form.documentNumber}
                    </div>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Short Description *</Label>
                  <Input
                    value={form.descriptionShort}
                    onChange={e => set('descriptionShort', e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">{textareaField('description', 'Description', 3)}</div>
              <div className="sm:col-span-2">{textareaField('additionalInfo', 'Additional Info', 2)}</div>
              {dateField('expiryDate', 'Expiry Date')}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Revision Number</Label>
                <Input
                  type="number"
                  value={form.revisionNumber ?? ''}
                  onChange={e => set('revisionNumber', e.target.value ? parseInt(e.target.value, 10) : null)}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="sm:col-span-2">{textareaField('revisionDetail', 'Revision Detail', 2)}</div>
              {selectField('referenceDocId', 'Reference Document', documentOptions)}
              {selectField('documentStatusId', 'Status', statusOptions)}
            </div>
          </TabsContent>

          {/* ── Grouping ─────────────────────────────────────────────────── */}
          <TabsContent value="grouping">
            <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">
              <p className="sm:col-span-2 text-xs text-muted-foreground">
                Select Group A first. B, C and D are filtered based on existing group combinations.
              </p>

              {/* Place */}
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Document Place *</Label>
                <Select
                  value={form.documentPlaceId || 'none'}
                  onValueChange={v => set('documentPlaceId', v === 'none' ? '' : v)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">Select…</SelectItem>
                    {placeOptions.map(o => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Group A */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Group A *</Label>
                <Select value={selAId || 'none'} onValueChange={handleSelectA}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select…" />
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
                  value={selBId || 'none'}
                  disabled={!selAId || filteredGroupBs.length === 0}
                  onValueChange={handleSelectB}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue
                      placeholder={!selAId ? 'Select A first' : filteredGroupBs.length === 0 ? 'No B options' : 'None'}
                    />
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
                  value={selCId || 'none'}
                  disabled={!selBId || filteredGroupCs.length === 0}
                  onValueChange={handleSelectC}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue
                      placeholder={!selBId ? 'Select B first' : filteredGroupCs.length === 0 ? 'No C options' : 'None'}
                    />
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
                  value={selDId || 'none'}
                  disabled={!selCId || filteredGroupDs.length === 0}
                  onValueChange={handleSelectD}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue
                      placeholder={!selCId ? 'Select C first' : filteredGroupDs.length === 0 ? 'No D options' : 'None'}
                    />
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
          </TabsContent>

          {/* ── People ───────────────────────────────────────────────────── */}
          <TabsContent value="people">
            <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">
              {selectField('revisedById', 'Revised By', employeeOptions)}
              {selectField('managedById', 'Managed By', employeeOptions)}
            </div>
          </TabsContent>

          {/* ── Target ───────────────────────────────────────────────────── */}
          <TabsContent value="target">
            <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">
              <p className="sm:col-span-2 text-xs text-muted-foreground">
                Link this document to a material, project and/or company. All are optional and can be assigned
                independently.
              </p>
              <div className="sm:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {targetSelectField('Material', targetMaterial, setTargetMaterial)}
                {targetSelectField('Project', targetProject, setTargetProject)}
                {targetSelectField('Company', targetCompany, setTargetCompany)}
              </div>
              {/* Show existing links when editing */}
              {isEdit && document?.documentTargetTypeName && (
                <div className="sm:col-span-2 rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Currently linked to: </span>
                  {document.documentTargetTypeName}
                  {' — use the dropdowns above to add or change links.'}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Flags ────────────────────────────────────────────────────── */}
          <TabsContent value="flags">
            <div className="grid grid-cols-2 gap-3 py-3">
              {toggleField('valid', 'Valid')}
              {toggleField('process', 'Process')}
              {toggleField('canCopy', 'Can Copy')}
            </div>
          </TabsContent>

          {/* ── Visibility ───────────────────────────────────────────────── */}
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
            disabled={saving || !isValid}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Copy Document Dialog ─────────────────────────────────────────────────────

interface CopyDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceDocument: MappedDocument
  onCopy: (documentNumber: string, descriptionShort: string) => Promise<void>
}

export function CopyDocumentDialog({open, onOpenChange, sourceDocument, onCopy}: CopyDocumentDialogProps) {
  const [documentNumber, setDocumentNumber] = useState('')
  const [descriptionShort, setDescriptionShort] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setDocumentNumber(`${sourceDocument.documentNumber}-COPY`)
      setDescriptionShort(sourceDocument.descriptionShort)
    }
  }, [open, sourceDocument.id])

  async function handleCopy() {
    setSaving(true)
    try {
      await onCopy(documentNumber.trim(), descriptionShort.trim())
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Copy Document</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <p className="text-xs text-muted-foreground">
            Copying <span className="font-medium text-foreground">{sourceDocument.documentNumber}</span>. Provide a new
            document number and short description for the copy.
          </p>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">New Document Number *</Label>
            <Input
              value={documentNumber}
              onChange={e => setDocumentNumber(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">New Short Description *</Label>
            <Input
              value={descriptionShort}
              onChange={e => setDescriptionShort(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleCopy}
            disabled={saving || !documentNumber.trim() || !descriptionShort.trim()}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Copying…' : 'Copy Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
