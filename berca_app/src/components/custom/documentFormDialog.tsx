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
import type {MappedDocument, DocumentGroupOption, DocumentPlaceOption} from '@/types/document'
import type {RoleLevelOption} from '@/types/roleLevel'
import {generatedocumentNumber} from '@/lib/utils'

interface SelectOption {
  id: string
  name: string
}

interface DocumentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: MappedDocument | null
  onSave: (document: MappedDocument, visibilityRows: VisibilityRow[]) => Promise<void>
  isAdmin: boolean
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  employeeOptions: SelectOption[]
  roleOptions: SelectOption[]
  groupAOptions: DocumentGroupOption[]
  groupBOptions: DocumentGroupOption[]
  groupCOptions: DocumentGroupOption[]
  groupDOptions: DocumentGroupOption[]
  placeOptions: DocumentPlaceOption[]
  documentOptions: SelectOption[] // for referenceDocId
  canManageVisibility: boolean
  canEditNumber: boolean
}

function emptyDocument(): MappedDocument {
  return {
    id: '',
    documentNumber: generatedocumentNumber(),
    description: null,
    descriptionShort: '',
    createdAt: new Date().toISOString(),
    expiryDate: null,
    revisionNumber: null,
    revisionDetail: null,
    valid: true,
    process: false,
    additionalInfo: null,
    referenceDocId: null,
    referenceDocNumber: null,
    roleId: null,
    roleName: null,
    documentGroupAId: '',
    documentGroupAName: null,
    documentGroupBId: null,
    documentGroupBName: null,
    documentGroupCId: null,
    documentGroupCName: null,
    documentGroupDId: null,
    documentGroupDName: null,
    documentPlaceId: '',
    documentPlaceLabel: '',
    createdBy: '',
    createdByName: '',
    revisedById: '',
    revisedByName: '',
    managedById: '',
    managedByName: '',
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
  roleOptions,
  groupAOptions,
  groupBOptions,
  groupCOptions,
  groupDOptions,
  placeOptions,
  documentOptions,
  canManageVisibility,
  canEditNumber,
}: DocumentFormDialogProps) {
  const [form, setForm] = useState<MappedDocument>(emptyDocument())
  const [saving, setSaving] = useState(false)
  const [numberError, setNumberError] = useState<string | null>(null)
  const [visibilityRows, setVisibilityRows] = useState<VisibilityRow[]>(() =>
    buildInitialVisibilityRows(document?.visibilityForRoles ?? [], roleLevelOptions, defaultVisibleRoleNames),
  )

  const isEdit = !!document

  useEffect(() => {
    const next = document ?? emptyDocument()
    setForm(next)
    setNumberError(null)
    setVisibilityRows(buildInitialVisibilityRows(next.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames))
  }, [document?.id, open])

  function set<K extends keyof MappedDocument>(key: K, value: MappedDocument[K]) {
    setForm(prev => ({...prev, [key]: value}))
  }

  async function handleSubmit() {
    if (!form.documentNumber.trim()) {
      setNumberError('Company number is required.')
      return
    }
    setSaving(true)
    try {
      await onSave(
        {
          ...form,
          descriptionShort: form.descriptionShort.trim(),
          description: form.description?.trim() || null,
          additionalInfo: form.additionalInfo?.trim() || null,
          revisionDetail: form.revisionDetail?.trim() || null,
          documentNumber: form.documentNumber.trim(),
        },
        visibilityRows,
      )
    } finally {
      setSaving(false)
    }
  }

  const isValid =
    form.documentNumber.trim() !== '' &&
    form.descriptionShort.trim() !== '' &&
    form.documentGroupAId !== '' &&
    form.documentPlaceId !== '' &&
    form.revisedById !== '' &&
    form.managedById !== ''

  // ─── Filtered group options (cascading) ────────────────────────────────────
  const filteredGroupBs = groupBOptions.filter(b => {
    // Need to know the parent — we stored documentGroupAId in the option list payload
    // The groupBOptions are raw DocumentGroupOption; for cascade we need the parentId too.
    // We pass the full b items with an optional parentId via a cast trick below.
    const bWithParent = b as DocumentGroupOption & {documentGroupAId?: string}
    return !form.documentGroupAId || bWithParent.documentGroupAId === form.documentGroupAId
  })
  const filteredGroupCs = groupCOptions.filter(c => {
    const cWithParent = c as DocumentGroupOption & {documentGroupBId?: string}
    return !form.documentGroupBId || cWithParent.documentGroupBId === form.documentGroupBId
  })
  const filteredGroupDs = groupDOptions.filter(d => {
    const dWithParent = d as DocumentGroupOption & {documentGroupCId?: string}
    return !form.documentGroupCId || dWithParent.documentGroupCId === form.documentGroupCId
  })

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

  const inputField = (key: keyof MappedDocument, label: string, required = false, type = 'text') => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">
        {label}
        {required && ' *'}
      </Label>
      <Input
        type={type}
        value={(form[key] as string | number | null) ?? ''}
        onChange={e => {
          const v = e.target.value
          if (type === 'number') set(key, (v ? parseInt(v, 10) : null) as MappedDocument[typeof key])
          else set(key, (v || null) as MappedDocument[typeof key])
        }}
        className="bg-secondary border-border"
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
    options: SelectOption[],
    required = false,
    onChange?: (v: string) => void,
  ) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">
        {label}
        {required && ' *'}
      </Label>
      <Select
        value={(form[key] as string | null) ?? 'none'}
        onValueChange={v => {
          const val = v === 'none' ? null : v
          set(key, val as MappedDocument[typeof key])
          onChange?.(v)
        }}>
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

  const toggleField = (key: keyof MappedDocument, label: string) => (
    <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Switch checked={form[key] as boolean} onCheckedChange={v => set(key, v as MappedDocument[typeof key])} />
    </div>
  )
  const numberEditable = !isEdit || canEditNumber

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
            <TabsTrigger value="flags">Flags</TabsTrigger>
            {canManageVisibility && <TabsTrigger value="visibility">Visibility</TabsTrigger>}
          </TabsList>

          {/* ── Details ──────────────────────────────────────────────────── */}
          <TabsContent value="details">
            <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">
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
                          onChange={e => set('documentNumber', e.target.value)}
                          className={`bg-secondary border-border flex-1 ${numberError ? 'border-destructive' : ''}`}
                        />
                        {!isEdit && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-10 px-3 border-border text-xs shrink-0"
                            onClick={() => set('documentNumber', generatedocumentNumber())}>
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
              {inputField('revisionNumber', 'Revision Number', false, 'number')}
              <div className="sm:col-span-2">{textareaField('revisionDetail', 'Revision Detail', 2)}</div>
              {selectField('referenceDocId', 'Reference Document', documentOptions)}
              {selectField('roleId', 'Role', roleOptions)}
            </div>
          </TabsContent>

          {/* ── Grouping ─────────────────────────────────────────────────── */}
          <TabsContent value="grouping">
            <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">
              {/* Group A */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Group A *</Label>
                <Select
                  value={form.documentGroupAId || 'none'}
                  onValueChange={v => {
                    const val = v === 'none' ? '' : v
                    setForm(f => ({
                      ...f,
                      documentGroupAId: val,
                    }))
                  }}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">Select…</SelectItem>
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
                <Label className="text-xs text-muted-foreground">Group B *</Label>
                <Select
                  value={form.documentGroupBId || 'none'}
                  disabled={!form.documentGroupAId}
                  onValueChange={v => {
                    const val = v === 'none' ? '' : v
                    setForm(f => ({...f, documentGroupBId: val, documentGroupCId: '', documentGroupDId: ''}))
                  }}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder={!form.documentGroupAId ? 'Select A first…' : 'Select…'} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">Select…</SelectItem>
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
                <Label className="text-xs text-muted-foreground">Group C *</Label>
                <Select
                  value={form.documentGroupCId || 'none'}
                  disabled={!form.documentGroupBId}
                  onValueChange={v => {
                    const val = v === 'none' ? '' : v
                    setForm(f => ({...f, documentGroupCId: val, documentGroupDId: ''}))
                  }}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder={!form.documentGroupBId ? 'Select B first…' : 'Select…'} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">Select…</SelectItem>
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
                <Label className="text-xs text-muted-foreground">Group D *</Label>
                <Select
                  value={form.documentGroupDId || 'none'}
                  disabled={!form.documentGroupCId}
                  onValueChange={v => {
                    const val = v === 'none' ? '' : v
                    setForm(f => ({...f, documentGroupDId: val}))
                  }}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder={!form.documentGroupCId ? 'Select C first…' : 'Select…'} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">Select…</SelectItem>
                    {filteredGroupDs.map(o => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name ?? o.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
            </div>
          </TabsContent>

          {/* ── People ───────────────────────────────────────────────────── */}
          <TabsContent value="people">
            <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">
              {selectField('revisedById', 'Revised By', employeeOptions, true)}
              {selectField('managedById', 'Managed By', employeeOptions, true)}
            </div>
          </TabsContent>

          {/* ── Flags ────────────────────────────────────────────────────── */}
          <TabsContent value="flags">
            <div className="grid grid-cols-2 gap-3 py-3">
              {toggleField('valid', 'Valid')}
              {toggleField('process', 'Process')}
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
