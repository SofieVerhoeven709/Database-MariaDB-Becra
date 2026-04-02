'use client'

import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import type {MappedProjectBOM, ProjectOption} from '@/types/projectBOM'
import {createProjectBOMAction, updateProjectBOMAction, searchProjectsAction} from '@/serverFunctions/projectBOM'
import {generateBomNumber} from '@/lib/utils'

interface ProjectBOMFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pass to edit an existing BOM; null/undefined = create mode */
  bom?: MappedProjectBOM | null
  /** When scoped to a project page, skip the project search */
  defaultProjectId?: string
  /** All BOMs in scope — used for the parent BOM selector */
  allBOMs?: MappedProjectBOM[]
  canEditNumber: boolean
  onSaved?: () => void
}

function emptyForm(defaultProjectBomNumber: string) {
  return {
    projectId: '',
    description: '',
    shortDescription: '',
    projectBomId: '',
    projectBomNumber: defaultProjectBomNumber,
    additionalInfo: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    closed: false,
    materialClosed: false,
    readyForPurchase: false,
  }
}

export function ProjectBOMFormDialog({
  open,
  onOpenChange,
  bom,
  defaultProjectId,
  allBOMs = [],
  canEditNumber,
  onSaved,
}: ProjectBOMFormDialogProps) {
  const router = useRouter()
  const isEdit = !!bom
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ─── Form fields ─────────────────────────────────────────────────────────────
  const [description, setDescription] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [projectBomId, setProjectBomId] = useState('')
  const [projectBomNumber, setProjectBomNumber] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState('')
  const [closed, setClosed] = useState(false)
  const [materialClosed, setMaterialClosed] = useState(false)
  const [readyForPurchase, setReadyForPurchase] = useState(false)

  // ─── Project search (create mode only) ───────────────────────────────────────
  const [projectQuery, setProjectQuery] = useState('')
  const [projectResults, setProjectResults] = useState<ProjectOption[]>([])
  const [projectSearching, setProjectSearching] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ProjectOption | null>(null)

  // ─── Parent BOM selector ──────────────────────────────────────────────────────
  const [parentBomId, setParentBomId] = useState<string>('none')

  // Populate form when dialog opens or bom changes
  useEffect(() => {
    if (!open) return
    if (bom) {
      setDescription(bom.description ?? '')
      setShortDescription(bom.shortDescription ?? '')
      setProjectBomId(bom.projectBomId ?? '')
      setProjectBomNumber(bom.projectBomNumber ?? '')
      setAdditionalInfo(bom.additionalInfo ?? '')
      setStartDate(bom.startDate.slice(0, 10))
      setEndDate(bom.endDate?.slice(0, 10) ?? '')
      setClosed(bom.closed)
      setMaterialClosed(bom.materialClosed)
      setReadyForPurchase(bom.readyForPurchase)
      setParentBomId(bom.projectBomId ?? 'none')
    } else {
      setDescription('')
      setShortDescription('')
      setProjectBomId('')
      setProjectBomNumber(generateBomNumber())
      setAdditionalInfo('')
      setStartDate(new Date().toISOString().slice(0, 10))
      setEndDate('')
      setClosed(false)
      setMaterialClosed(false)
      setReadyForPurchase(false)
      setParentBomId('none')
      setProjectQuery('')
      setProjectResults([])
      setSelectedProject(null)
    }
    setErrors({})
  }, [bom?.id, open])

  // Project search effect (create mode)
  useEffect(() => {
    if (!open || isEdit) return
    setProjectSearching(true)
    searchProjectsAction(projectQuery)
      .then(setProjectResults)
      .finally(() => setProjectSearching(false))
  }, [projectQuery, open, isEdit])

  // Parent BOM options: exclude self
  const parentBomOptions = allBOMs.filter(b => !bom || b.id !== bom.id)

  async function handleSubmit() {
    const e: Record<string, string> = {}
    if (!isEdit && !selectedProject && !defaultProjectId) e.project = 'Please select a project.'
    if (!startDate) e.startDate = 'Start date is required.'
    if (Object.keys(e).length > 0) {
      setErrors(e)
      return
    }

    setSaving(true)
    try {
      const payload = {
        description: description.trim() || null,
        shortDescription: shortDescription.trim(),
        projectBomId: parentBomId !== 'none' ? parentBomId : null,
        projectBomNumber: projectBomNumber.trim(),
        additionalInfo: additionalInfo.trim() || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        closed,
        materialClosed,
        readyForPurchase,
      }

      if (isEdit) {
        await updateProjectBOMAction({id: bom.id, ...payload})
      } else {
        await createProjectBOMAction({
          projectId: selectedProject?.id ?? defaultProjectId!,
          ...payload,
        })
      }

      onSaved?.()
      onOpenChange(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const numberEditable = !isEdit || canEditNumber

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? 'Edit Project BOM' : 'New Project BOM'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Project search — create mode only, not when scoped to a project */}
          {!isEdit && !defaultProjectId && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Project *</Label>
              {selectedProject ? (
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm text-foreground font-medium">
                      {selectedProject.projectName ?? selectedProject.id}
                    </span>
                    {selectedProject.projectNumber && (
                      <span className="text-xs text-muted-foreground">{selectedProject.projectNumber}</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
                    onClick={() => setSelectedProject(null)}>
                    Change
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    value={projectQuery}
                    onChange={e => {
                      setProjectQuery(e.target.value)
                      setErrors(prev => ({...prev, project: ''}))
                    }}
                    placeholder="Search by name or number…"
                    className={`bg-secondary border-border ${errors.project ? 'border-destructive' : ''}`}
                    autoFocus
                  />
                  {errors.project && <p className="text-xs text-destructive">{errors.project}</p>}
                  <div className="flex flex-col gap-1 max-h-40 overflow-y-auto rounded-lg border border-border bg-secondary/30">
                    {projectSearching ? (
                      <p className="text-xs text-muted-foreground px-3 py-3 text-center">Searching…</p>
                    ) : projectResults.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-3 py-3 text-center">No projects found.</p>
                    ) : (
                      projectResults.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedProject(p)}
                          className="flex flex-col gap-0.5 px-3 py-2 text-left hover:bg-secondary/80 transition-colors border-b border-border/40 last:border-0">
                          <span className="text-sm text-foreground font-medium">{p.projectName ?? p.id}</span>
                          {p.projectNumber && <span className="text-xs text-muted-foreground">{p.projectNumber}</span>}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* BOM Number */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">
                BOM Number *{!numberEditable && <span className="ml-1.5 text-muted-foreground/60">(locked)</span>}
              </Label>
              {numberEditable ? (
                <div className="flex gap-2">
                  <Input
                    value={projectBomNumber}
                    onChange={e => setProjectBomNumber(e.target.value)}
                    className="bg-secondary border-border flex-1"
                  />
                  {!isEdit && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 px-3 border-border text-xs shrink-0"
                      onClick={() => setProjectBomNumber(generateBomNumber())}>
                      Regenerate
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex h-10 items-center rounded-md border border-border bg-secondary/40 px-3 text-sm text-muted-foreground cursor-not-allowed select-none">
                  {projectBomNumber}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="BOM description…"
                className="bg-secondary border-border"
                autoFocus={!isEdit && !!defaultProjectId}
              />
            </div>

            {/* Short Description */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Short Description</Label>
              <Input
                value={shortDescription}
                onChange={e => setShortDescription(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            {/* Parent BOM */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Parent BOM</Label>
              <Select value={parentBomId} onValueChange={setParentBomId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="none">None</SelectItem>
                  {parentBomOptions.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.projectBomNumber}
                      {b.shortDescription ? ` — ${b.shortDescription}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Start Date *</Label>
              <Input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value)
                  setErrors(prev => ({...prev, startDate: ''}))
                }}
                className={`bg-secondary border-border ${errors.startDate ? 'border-destructive' : ''}`}
              />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
            </div>

            {/* End Date */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            {/* Additional Info */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Additional Info</Label>
              <Input
                value={additionalInfo}
                onChange={e => setAdditionalInfo(e.target.value)}
                placeholder="Additional info…"
                className="bg-secondary border-border"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-2">
            {(
              [
                {label: 'Closed', value: closed, onChange: setClosed},
                {label: 'Material Closed', value: materialClosed, onChange: setMaterialClosed},
                {label: 'Ready for Purchase', value: readyForPurchase, onChange: setReadyForPurchase},
              ] as {label: string; value: boolean; onChange: (v: boolean) => void}[]
            ).map(({label, value, onChange}) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Switch checked={value} onCheckedChange={onChange} />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? 'Save Changes' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
