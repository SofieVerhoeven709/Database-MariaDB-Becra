'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Checkbox} from '@/components/ui/checkbox'
import type {MappedBoq, BoqLookup} from '@/types/billOfQuantity'
import {createBoqAction, updateBoqAction, getActiveWorkOrdersForProjectAction} from '@/serverFunctions/billOfQuantities'
import {getNextBoqNumberAction} from '@/serverFunctions/billOfQuantities'

export interface ProjectOption {
  id: string
  projectNumber: string
  projectName: string
  companyName: string
}

export interface WorkOrderOption {
  id: string
  workOrderNumber: string | null
  description: string | null
}

interface BoqFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  boq: MappedBoq | null
  boqTypes: BoqLookup[]
  paymentMethods: BoqLookup[]
  boqSentTypes: BoqLookup[]
  boqStatuses: BoqLookup[]
  projectOptions: ProjectOption[]
  onSaved: () => void
}

type FormState = {
  boqNumber: string
  poNumber: string
  clientReference: string
  boqDate: string
  dueDate: string
  sentDate: string
  boqTypeId: string
  paymentMethodId: string
  boqSentTypeId: string
  boqStatusId: string
  reminderSent: boolean
  outstanding: boolean
}

function toDateInput(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toISOString().slice(0, 10)
}

function emptyForm(boq: MappedBoq | null): FormState {
  const today = new Date().toISOString().slice(0, 10)
  if (!boq) {
    return {
      boqNumber: '',
      poNumber: '',
      clientReference: '',
      boqDate: today,
      dueDate: today,
      sentDate: '',
      boqTypeId: '',
      paymentMethodId: '',
      boqSentTypeId: '',
      boqStatusId: '',
      reminderSent: false,
      outstanding: true,
    }
  }
  return {
    boqNumber: boq.boqNumber,
    poNumber: boq.poNumber ?? '',
    clientReference: boq.clientReference ?? '',
    boqDate: toDateInput(boq.boqDate),
    dueDate: toDateInput(boq.dueDate),
    sentDate: toDateInput(boq.sentDate),
    boqTypeId: boq.boqTypeId,
    paymentMethodId: boq.paymentMethodId,
    boqSentTypeId: boq.boqSentTypeId,
    boqStatusId: boq.boqStatusId,
    reminderSent: boq.reminderSent,
    outstanding: boq.outstanding,
  }
}

export function BoqFormDialog({
  open,
  onOpenChange,
  boq,
  boqTypes,
  paymentMethods,
  boqSentTypes,
  boqStatuses,
  projectOptions,
  onSaved,
}: BoqFormDialogProps) {
  const [form, setForm] = useState<FormState>(() => {
    const base = emptyForm(boq)
    if (!boq && boqStatuses.length > 0) {
      const draft = boqStatuses.find(s => s.name.toLowerCase() === 'draft')
      if (draft) base.boqStatusId = draft.id
    }
    return base
  })
  const [saving, setSaving] = useState(false)
  const [numberLoading, setNumberLoading] = useState(false)
  const [numberError, setNumberError] = useState<string | null>(null)

  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [workOrders, setWorkOrders] = useState<WorkOrderOption[]>([])
  const [selectedWorkOrderIds, setSelectedWorkOrderIds] = useState<string[]>([])
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false)

  const isEdit = !!boq

  useEffect(() => {
    const base = emptyForm(boq)
    if (!boq && boqStatuses.length > 0) {
      const draft = boqStatuses.find(s => s.name.toLowerCase() === 'draft')
      if (draft) base.boqStatusId = draft.id
    }
    setForm(base)
    setSelectedProjectId('')
    setWorkOrders([])
    setSelectedWorkOrderIds([])
    setNumberError(null)

    if (!boq && open) {
      setNumberLoading(true)
      getNextBoqNumberAction()
        .then(n => setForm(f => ({...f, boqNumber: n})))
        .catch(() => setNumberError('Could not fetch next number.'))
        .finally(() => setNumberLoading(false))
    }
  }, [boq?.id, open])

  useEffect(() => {
    if (!selectedProjectId || boq) return
    setWorkOrders([])
    setSelectedWorkOrderIds([])
    setLoadingWorkOrders(true)
    getActiveWorkOrdersForProjectAction(selectedProjectId)
      .then(setWorkOrders)
      .finally(() => setLoadingWorkOrders(false))
  }, [selectedProjectId, boq])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({...f, [key]: value}))
    if (key === 'boqNumber') setNumberError(null)
  }

  async function handleRegenerate() {
    setNumberLoading(true)
    setNumberError(null)
    try {
      const n = await getNextBoqNumberAction()
      setForm(f => ({...f, boqNumber: n}))
    } catch {
      setNumberError('Could not fetch next number.')
    } finally {
      setNumberLoading(false)
    }
  }

  function toggleWorkOrder(id: string) {
    setSelectedWorkOrderIds(prev => (prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]))
  }

  const isValid =
    form.boqNumber.trim() &&
    form.boqDate &&
    form.dueDate &&
    form.boqTypeId &&
    form.paymentMethodId &&
    form.boqSentTypeId &&
    form.boqStatusId &&
    (isEdit || selectedWorkOrderIds.length > 0)

  async function handleSubmit() {
    if (!isValid) return
    setSaving(true)
    try {
      const payload = {
        boqNumber: form.boqNumber.trim(),
        poNumber: form.poNumber || null,
        clientReference: form.clientReference || null,
        boqDate: new Date(form.boqDate),
        dueDate: new Date(form.dueDate),
        sentDate: form.sentDate ? new Date(form.sentDate) : null,
        boqTypeId: form.boqTypeId,
        paymentMethodId: form.paymentMethodId,
        boqSentTypeId: form.boqSentTypeId,
        boqStatusId: form.boqStatusId,
        reminderSent: form.reminderSent,
        outstanding: form.outstanding,
      }

      if (boq) {
        await updateBoqAction({id: boq.id, ...payload})
      } else {
        await createBoqAction({...payload, workOrderIds: selectedWorkOrderIds})
      }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  const selectedProject = projectOptions.find(p => p.id === selectedProjectId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEdit ? 'Edit Bill of Quantities' : 'New Bill of Quantities'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-5 py-3 sm:grid-cols-2">
          {/* BoQ Number */}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">
              BoQ Number *
              {isEdit && <span className="ml-1.5 text-muted-foreground/60">(locked — edit from detail page)</span>}
            </Label>
            {isEdit ? (
              <div className="flex h-10 items-center rounded-md border border-border bg-secondary/40 px-3 text-sm text-muted-foreground cursor-not-allowed select-none">
                {form.boqNumber}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex gap-2">
                  <Input
                    value={numberLoading ? '' : form.boqNumber}
                    placeholder={numberLoading ? 'Fetching next number…' : 'BoQ number…'}
                    onChange={e => set('boqNumber', e.target.value)}
                    disabled={numberLoading}
                    className={`bg-secondary border-border flex-1 ${numberError ? 'border-destructive' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 px-3 border-border text-xs shrink-0"
                    onClick={handleRegenerate}
                    disabled={numberLoading}>
                    {numberLoading ? 'Loading…' : 'Regenerate'}
                  </Button>
                </div>
                {numberError && <p className="text-xs text-destructive">{numberError}</p>}
              </div>
            )}
          </div>

          {/* Project + Work Orders (create only) */}
          {!isEdit && (
            <div className="sm:col-span-2 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">
                  Project *
                  <span className="ml-1.5 text-muted-foreground/60">(required — select to pick work orders)</span>
                </Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select project…" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {projectOptions.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.projectNumber} — {p.projectName}
                        <span className="ml-1 text-muted-foreground text-xs">({p.companyName})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProjectId && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      Work Orders *<span className="ml-1.5 text-muted-foreground/60">(select at least one)</span>
                    </Label>
                    {selectedWorkOrderIds.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedWorkOrderIds.length} selected
                      </Badge>
                    )}
                  </div>
                  {loadingWorkOrders ? (
                    <p className="text-xs text-muted-foreground py-2">Loading work orders…</p>
                  ) : workOrders.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No active work orders for this project.</p>
                  ) : (
                    <div className="rounded-lg border border-border bg-secondary/40 divide-y divide-border/60">
                      {workOrders.map(wo => (
                        <label
                          key={wo.id}
                          className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-secondary/80 transition-colors">
                          <Checkbox
                            checked={selectedWorkOrderIds.includes(wo.id)}
                            onCheckedChange={() => toggleWorkOrder(wo.id)}
                          />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm text-foreground font-medium">
                              {wo.workOrderNumber ?? '(no number)'}
                            </span>
                            {wo.description && (
                              <span className="text-xs text-muted-foreground line-clamp-1">{wo.description}</span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!selectedProjectId && <p className="text-xs text-amber-500">Select a project to choose work orders.</p>}
              {selectedProjectId && selectedWorkOrderIds.length === 0 && (
                <p className="text-xs text-amber-500">At least one work order must be selected.</p>
              )}
              {selectedProject && selectedWorkOrderIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Billing: <span className="text-foreground">{selectedProject.companyName}</span>
                </p>
              )}

              <div className="border-t border-border/60 pt-1" />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Client Reference</Label>
            <Input
              value={form.clientReference}
              onChange={e => set('clientReference', e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">PO Number</Label>
            <Input
              value={form.poNumber}
              onChange={e => set('poNumber', e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">BoQ Date *</Label>
            <Input
              type="date"
              value={form.boqDate}
              onChange={e => set('boqDate', e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Due Date *</Label>
            <Input
              type="date"
              min={form.boqDate}
              value={form.dueDate}
              onChange={e => set('dueDate', e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Sent Date</Label>
            <Input
              type="date"
              min={form.boqDate}
              value={form.sentDate}
              onChange={e => set('sentDate', e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">BoQ Type *</Label>
            <Select value={form.boqTypeId} onValueChange={v => set('boqTypeId', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select type…" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {boqTypes.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Status *</Label>
            <Select value={form.boqStatusId} onValueChange={v => set('boqStatusId', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select status…" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {boqStatuses.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Payment Method *</Label>
            <Select value={form.paymentMethodId} onValueChange={v => set('paymentMethodId', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select method…" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {paymentMethods.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Sent Type *</Label>
            <Select value={form.boqSentTypeId} onValueChange={v => set('boqSentTypeId', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select sent type…" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {boqSentTypes.map(st => (
                  <SelectItem key={st.id} value={st.id}>
                    {st.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2 grid grid-cols-2 gap-3">
            {[
              {key: 'outstanding' as const, label: 'Outstanding'},
              {key: 'reminderSent' as const, label: 'Reminder Sent'},
            ].map(({key, label}) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Switch checked={form[key]} onCheckedChange={v => set(key, v)} />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !isValid}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create BoQ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
