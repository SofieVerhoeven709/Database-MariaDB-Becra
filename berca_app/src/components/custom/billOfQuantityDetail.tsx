'use client'

import {useState, useEffect} from 'react'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import type {Route} from 'next'
import {ArrowLeft, Pencil, X, Save, Plus, Trash2, ExternalLink, AlertTriangle} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Checkbox} from '@/components/ui/checkbox'
import {
  updateBoqAction,
  addBoqContactDirectAction,
  removeBoqContactDirectAction,
  getActiveWorkOrdersForProjectAction,
  addWorkOrdersToBoqAction,
  assignPriceListToBoqAction,
  getAvailableVatMarginsAction,
  updateWorkOrderStructureVatAction,
  updateTimeRegistryVatMarginAction,
  updateTrainingVatMarginAction,
} from '@/serverFunctions/billOfQuantities'
import type {MappedBoq, MappedBillingLine, BoqLookup, PriceListOption} from '@/types/billOfQuantity'

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function toDateInput(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toISOString().slice(0, 10)
}

function formatEur(value: number) {
  return `€${value.toFixed(2)}`
}

function BoolBadge({value}: {value: boolean}) {
  return value ? (
    <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
  ) : (
    <Badge variant="secondary" className="text-muted-foreground font-medium">
      No
    </Badge>
  )
}

function TypeBadge({type}: {type: MappedBillingLine['type']}) {
  const map = {
    hours: {label: 'Hours', cls: 'bg-blue-500/10 text-blue-500 border-0'},
    material: {label: 'Material', cls: 'bg-purple-500/10 text-purple-500 border-0'},
    training: {label: 'Training', cls: 'bg-green-500/10 text-green-500 border-0'},
    stay_over: {label: 'Stay Over', cls: 'bg-amber-500/10 text-amber-600 border-0'},
  }
  const {label, cls} = map[type]
  return <Badge className={`${cls} font-medium text-xs`}>{label}</Badge>
}

interface WorkOrderOption {
  id: string
  workOrderNumber: string | null
  description: string | null
}

interface BoqDetailProps {
  boq: MappedBoq
  boqTypes: BoqLookup[]
  paymentMethods: BoqLookup[]
  boqSentTypes: BoqLookup[]
  boqStatuses: BoqLookup[]
  contactOptions: BoqLookup[]
  priceListOptions: PriceListOption[]
  currentUserLevel: number
  currentUserRole: string
  departmentId: string
}

type EditForm = {
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

const thClass = 'whitespace-nowrap text-xs'
const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

type Tab = 'lines' | 'workOrders' | 'contacts'

export function BoqDetail({
  boq,
  boqTypes,
  paymentMethods,
  boqSentTypes,
  boqStatuses,
  contactOptions,
  priceListOptions,
  currentUserLevel,
  currentUserRole,
  departmentId,
}: BoqDetailProps) {
  const router = useRouter()
  const canEdit = currentUserLevel >= 40
  const canDelete = currentUserLevel >= 80
  const canEditNumber = currentUserLevel >= 80

  const isDraft = boq.boqStatusName === 'Draft'

  const buildForm = (): EditForm => ({
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
  })

  const [activeTab, setActiveTab] = useState<Tab>('lines')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<EditForm>(buildForm)
  const [numberError, setNumberError] = useState<string | null>(null)

  const [assigningPriceList, setAssigningPriceList] = useState(false)
  const [selectedPriceListId, setSelectedPriceListId] = useState<string>(boq.priceListId ?? 'none')

  const s = <K extends keyof EditForm>(key: K, v: EditForm[K]) => {
    setForm(f => ({...f, [key]: v}))
    if (key === 'boqNumber') setNumberError(null)
  }

  async function handleAssignPriceList() {
    const value = selectedPriceListId === 'none' ? null : selectedPriceListId
    setAssigningPriceList(true)
    try {
      await assignPriceListToBoqAction(boq.id, value)
      router.refresh()
    } finally {
      setAssigningPriceList(false)
    }
  }

  // Contact management
  const [addingContact, setAddingContact] = useState(false)
  const [newContactId, setNewContactId] = useState('none')
  const linkedContactIds = new Set(boq.contacts.map(c => c.contactId))
  const availableContacts = contactOptions.filter(c => !linkedContactIds.has(c.id))

  // Work order management
  const [availableWorkOrders, setAvailableWorkOrders] = useState<WorkOrderOption[]>([])
  const [selectedNewWorkOrderIds, setSelectedNewWorkOrderIds] = useState<string[]>([])
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false)
  const [addingWorkOrders, setAddingWorkOrders] = useState(false)
  const [savingWorkOrders, setSavingWorkOrders] = useState(false)

  const linkedWorkOrderIds = new Set(boq.workOrders.map(wo => wo.id))
  const linkedProjectIds = [...new Set(boq.workOrders.map(wo => wo.projectId))]

  useEffect(() => {
    if (!addingWorkOrders || !isDraft) return
    setLoadingWorkOrders(true)
    Promise.all(linkedProjectIds.map(pid => getActiveWorkOrdersForProjectAction(pid)))
      .then(results => {
        const all = results.flat()
        setAvailableWorkOrders(all.filter(wo => !linkedWorkOrderIds.has(wo.id)))
      })
      .finally(() => setLoadingWorkOrders(false))
  }, [addingWorkOrders])

  function toggleNewWorkOrder(id: string) {
    setSelectedNewWorkOrderIds(prev => (prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]))
  }

  const projectsOnBoq = Array.from(
    new Map(
      boq.workOrders.map(wo => [
        wo.projectId,
        {
          projectId: wo.projectId,
          projectNumber: wo.projectNumber,
          projectName: wo.projectName,
          companyId: wo.companyId,
          companyName: wo.companyName,
        },
      ]),
    ).values(),
  )

  async function handleSave() {
    if (!form.boqNumber.trim()) {
      setNumberError('BoQ number is required.')
      return
    }
    setSaving(true)
    try {
      await updateBoqAction({
        id: boq.id,
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
        priceListId: boq.priceListId,
      })
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setForm(buildForm())
    setNumberError(null)
    setEditing(false)
  }

  async function handleAddContact() {
    if (newContactId === 'none') return
    await addBoqContactDirectAction(boq.id, newContactId)
    setNewContactId('none')
    setAddingContact(false)
    router.refresh()
  }

  async function handleRemoveContact(id: string) {
    await removeBoqContactDirectAction(id)
    router.refresh()
  }

  async function handleAddWorkOrders() {
    if (selectedNewWorkOrderIds.length === 0) return
    setSavingWorkOrders(true)
    try {
      await addWorkOrdersToBoqAction(boq.id, selectedNewWorkOrderIds)
      setSelectedNewWorkOrderIds([])
      setAddingWorkOrders(false)
      router.refresh()
    } finally {
      setSavingWorkOrders(false)
    }
  }

  const allLines = boq.workOrders.flatMap(wo =>
    wo.billingLines.map(l => ({...l, workOrderNumber: wo.workOrderNumber, workOrderDesc: wo.description})),
  )
  const unmatchedCount = allLines.filter(l => l.unmatched).length

  // VAT management
  const [availableVatMargins, setAvailableVatMargins] = useState<
    Array<{countryId: string | null; countryName: string; rates: Array<{id: string; vat: number}>}>
  >([])
  const [editingVatLineKey, setEditingVatLineKey] = useState<string | null>(null)
  const [savingVat, setSavingVat] = useState(false)
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null)
  const [selectedVatMarginId, setSelectedVatMarginId] = useState<string | null>(null)

  useEffect(() => {
    getAvailableVatMarginsAction()
      .then(setAvailableVatMargins)
      .catch(err => console.error(err))
  }, [])

  function normalizeCountryName(name: string | null | undefined) {
    return (name ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  }

  function getVatRatesForSelectedCountry(countrySelection: string | null) {
    if (!countrySelection || countrySelection === '__unset__') return [] as Array<{id: string; vat: number}>
    if (countrySelection === '__none__') {
      const globalRates = availableVatMargins.find(group => group.countryId === null)?.rates ?? []
      const belgiumRates =
        availableVatMargins.find(group => normalizeCountryName(group.countryName).includes('belg'))?.rates ?? []
      const merged = [...globalRates, ...belgiumRates]
      const dedupedById = new Map(merged.map(rate => [rate.id, rate]))
      return Array.from(dedupedById.values()).sort((a, b) => a.vat - b.vat)
    }
    return availableVatMargins.find(group => group.countryId === countrySelection)?.rates ?? []
  }

  function getVatLabel(vatMarginId: string | null) {
    if (!vatMarginId) return '—'
    for (const group of availableVatMargins) {
      const rate = group.rates.find(r => r.id === vatMarginId)
      if (rate) return `${rate.vat}%`
    }
    return '?'
  }

  function beginVatEdit(line: MappedBillingLine, lineKey: string) {
    setEditingVatLineKey(lineKey)
    const currentGroup = availableVatMargins.find(group => group.rates.some(rate => rate.id === line.vatMarginId))
    setSelectedCountryId(currentGroup ? (currentGroup.countryId ?? '__none__') : '__unset__')
    setSelectedVatMarginId(line.vatMarginId ?? null)
  }

  function handleCountrySelection(value: string) {
    setSelectedCountryId(value)
    if (value === '__unset__') {
      setSelectedVatMarginId(null)
      return
    }
    setSelectedVatMarginId(null)
  }

  function handleVatRateSelection(value: string) {
    if (value === '__unset_vat__') {
      setSelectedVatMarginId(null)
      return
    }
    setSelectedVatMarginId(value)
  }

  async function handleSetVat(line: MappedBillingLine) {
    const currentVatMarginId = line.vatMarginId ?? null
    if (selectedVatMarginId === currentVatMarginId) return
    setSavingVat(true)
    try {
      if (line.type === 'material' && line.workOrderStructureId) {
        await updateWorkOrderStructureVatAction({
          workOrderStructureId: line.workOrderStructureId,
          vatMarginId: selectedVatMarginId,
        })
      } else if ((line.type === 'hours' || line.type === 'stay_over') && line.timeRegistryIds?.length) {
        await updateTimeRegistryVatMarginAction({
          timeRegistryIds: line.timeRegistryIds,
          vatMarginId: selectedVatMarginId,
        })
      } else if (line.type === 'training') {
        await updateTrainingVatMarginAction({trainingId: line.sourceId, vatMarginId: selectedVatMarginId})
      }
      setEditingVatLineKey(null)
      setSelectedCountryId(null)
      setSelectedVatMarginId(null)
      router.refresh()
    } catch (err) {
      console.error('Failed to update VAT:', err)
    } finally {
      setSavingVat(false)
    }
  }

  const belowCostCount = allLines.filter(l => l.type === 'material' && l.priceListBelowCost).length

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
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
            <h1 className="text-lg font-semibold text-foreground">{boq.boqNumber}</h1>
            <p className="text-sm text-muted-foreground">
              {boq.clientReference ? `#${boq.clientReference} · ` : ''}
              {boq.boqTypeName} · {boq.boqStatusName}
            </p>
          </div>
        </div>
        {canEdit && (
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
              <Button onClick={() => setEditing(true)} variant="outline" className="gap-2 border-border">
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-border/60 bg-card p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* BoQ Number */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              BoQ Number
              {editing && !canEditNumber && <span className="ml-1.5 text-muted-foreground/60">(locked)</span>}
            </Label>
            {editing ? (
              canEditNumber ? (
                <div className="flex flex-col gap-1">
                  <Input
                    value={form.boqNumber}
                    onChange={e => s('boqNumber', e.target.value)}
                    className={`bg-secondary border-border ${numberError ? 'border-destructive' : ''}`}
                  />
                  {numberError && <p className="text-xs text-destructive">{numberError}</p>}
                </div>
              ) : (
                <div className="flex h-10 items-center rounded-md border border-border bg-secondary/40 px-3 text-sm text-muted-foreground cursor-not-allowed select-none">
                  {form.boqNumber}
                </div>
              )
            ) : (
              <p className="text-sm text-muted-foreground">{boq.boqNumber}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Client Reference</Label>
            {editing ? (
              <Input
                value={form.clientReference}
                onChange={e => s('clientReference', e.target.value)}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{boq.clientReference ?? '-'}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">PO Number</Label>
            {editing ? (
              <Input
                value={form.poNumber}
                onChange={e => s('poNumber', e.target.value)}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{boq.poNumber ?? '-'}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">BoQ Date</Label>
            {editing ? (
              <Input
                type="date"
                value={form.boqDate}
                onChange={e => s('boqDate', e.target.value)}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{formatDate(boq.boqDate)}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Due Date</Label>
            {editing ? (
              <Input
                type="date"
                value={form.dueDate}
                onChange={e => s('dueDate', e.target.value)}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{formatDate(boq.dueDate)}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Sent Date</Label>
            {editing ? (
              <Input
                type="date"
                value={form.sentDate}
                onChange={e => s('sentDate', e.target.value)}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{formatDate(boq.sentDate)}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">BoQ Type</Label>
            {editing ? (
              <Select value={form.boqTypeId} onValueChange={v => s('boqTypeId', v)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {boqTypes.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">{boq.boqTypeName}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            {editing ? (
              <Select value={form.boqStatusId} onValueChange={v => s('boqStatusId', v)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {boqStatuses.map(st => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline" className="border-border w-fit">
                {boq.boqStatusName}
              </Badge>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Payment Method</Label>
            {editing ? (
              <Select value={form.paymentMethodId} onValueChange={v => s('paymentMethodId', v)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {paymentMethods.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">{boq.paymentMethodName}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Sent Type</Label>
            {editing ? (
              <Select value={form.boqSentTypeId} onValueChange={v => s('boqSentTypeId', v)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {boqSentTypes.map(st => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">{boq.boqSentTypeName}</p>
            )}
          </div>

          {/* Price List */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Price List</Label>
            {canEdit ? (
              <div className="flex items-center gap-2">
                <Select value={selectedPriceListId} onValueChange={setSelectedPriceListId}>
                  <SelectTrigger className="bg-secondary border-border flex-1 text-sm">
                    <SelectValue placeholder="No price list…" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none" className="text-xs text-muted-foreground">
                      — No price list —
                    </SelectItem>
                    {priceListOptions.map(pl => (
                      <SelectItem key={pl.id} value={pl.id} className="text-xs">
                        {pl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPriceListId !== (boq.priceListId ?? 'none') && (
                  <Button
                    size="sm"
                    className="h-9 text-xs bg-accent text-accent-foreground hover:bg-accent/80 shrink-0"
                    disabled={assigningPriceList}
                    onClick={handleAssignPriceList}>
                    {assigningPriceList ? 'Saving…' : 'Apply'}
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{boq.priceListName ?? '-'}</p>
            )}
            {priceListOptions.length === 0 && (
              <p className="text-xs text-amber-500 mt-0.5">No price lists assigned to the companies on this BoQ.</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Created By</Label>
            <p className="text-sm text-muted-foreground">{boq.createdByName}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Created At</Label>
            <p className="text-sm text-muted-foreground">{formatDate(boq.createdAt)}</p>
          </div>

          {boq.modifiedByName && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Last Modified By</Label>
              <p className="text-sm text-muted-foreground">
                {boq.modifiedByName} · {formatDate(boq.modifiedAt)}
              </p>
            </div>
          )}

          <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-2 gap-3">
            {[
              {key: 'outstanding' as const, label: 'Outstanding'},
              {key: 'reminderSent' as const, label: 'Reminder Sent'},
            ].map(({key, label}) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                {editing ? (
                  <Switch checked={form[key]} onCheckedChange={v => s(key, v)} />
                ) : (
                  <BoolBadge value={boq[key]} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="flex border-b border-border/60">
          {[
            {id: 'lines' as Tab, label: 'Billing Lines', count: allLines.length, warn: unmatchedCount > 0},
            {id: 'workOrders' as Tab, label: 'Work Orders', count: boq.workOrders.length, warn: false},
            {id: 'contacts' as Tab, label: 'Contacts', count: boq.contacts.length, warn: false},
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-accent text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}>
              {tab.label}
              <Badge variant={activeTab === tab.id ? 'default' : 'secondary'} className="text-xs h-4 px-1.5">
                {tab.count}
              </Badge>
              {tab.warn && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
            </button>
          ))}
        </div>

        {/* ── Billing Lines tab ── */}
        {activeTab === 'lines' && (
          <div className="p-4 flex flex-col gap-4">
            {!boq.priceListId && (
              <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-secondary/40 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground">
                  No price list assigned. Select one above to calculate billing amounts.
                </p>
              </div>
            )}
            {unmatchedCount > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {unmatchedCount} line{unmatchedCount !== 1 ? 's' : ''} have no matching price list item and will not
                  be included in the total.
                </p>
              </div>
            )}
            {belowCostCount > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-600 dark:text-red-400">
                  {belowCostCount} material line{belowCostCount !== 1 ? 's are' : ' is'} priced below supplier cost.
                </p>
              </div>
            )}

            {allLines.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No billing lines found.</p>
            ) : (
              <>
                {boq.workOrders.map(wo => {
                  if (wo.billingLines.length === 0) return null
                  return (
                    <div key={wo.id} className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-foreground">
                          {wo.workOrderNumber ?? '(no number)'}
                          {wo.description ? ` — ${wo.description}` : ''}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {wo.projectNumber} · {wo.companyName}
                        </span>
                      </div>
                      <div className="rounded-lg border border-border/60 overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent border-border/60">
                              <TableHead className={thClass}>Type</TableHead>
                              <TableHead className={thClass}>Description</TableHead>
                              <TableHead className={thClass}>Qty</TableHead>
                              <TableHead className={thClass}>Unit</TableHead>
                              <TableHead className={thClass}>Unit Price</TableHead>
                              <TableHead className={thClass}>Total (ex VAT)</TableHead>
                              <TableHead className={thClass}>VAT %</TableHead>
                              <TableHead className={thClass}>VAT Amount</TableHead>
                              <TableHead className={thClass}>Total (incl VAT)</TableHead>
                              {canEdit && <TableHead className={thClass}>VAT</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {wo.billingLines.map((line, i) => (
                              <TableRow
                                key={`${line.sourceId}-${i}`}
                                className={`border-border/40 ${line.unmatched ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-secondary/50'}`}>
                                <TableCell>
                                  <TypeBadge type={line.type} />
                                </TableCell>
                                <TableCell
                                  className={`${tdClass} ${line.unmatched ? 'text-amber-600 dark:text-amber-400' : 'text-foreground font-medium'}`}>
                                  <div className="flex items-center gap-1.5">
                                    {line.unmatched && (
                                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                    )}
                                    {line.sourceLabel}
                                  </div>
                                </TableCell>
                                <TableCell className={tdClass}>{line.quantity}</TableCell>
                                <TableCell className={tdClass}>{line.unit}</TableCell>
                                <TableCell className={`${tdClass} font-mono`}>
                                  {line.unitPriceFinal != null ? (
                                    formatEur(line.unitPriceFinal)
                                  ) : (
                                    <span className="text-amber-500 text-xs">No price</span>
                                  )}
                                </TableCell>
                                <TableCell className={`${tdClass} font-mono`}>
                                  {line.unitPriceFinal != null ? (
                                    <span className="flex items-center gap-1">
                                      {formatEur(line.unitPriceFinal)}
                                      {line.priceListBelowCost && (
                                        <span
                                          title={`Supplier cost: ${line.materialSupplierPrice != null ? formatEur(line.materialSupplierPrice) : '?'} — price list base (${line.unitPriceBase != null ? formatEur(line.unitPriceBase) : '?'}) is below cost`}
                                          className="cursor-help">
                                          <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                        </span>
                                      )}
                                    </span>
                                  ) : (
                                    <span className="text-amber-500 text-xs">No price</span>
                                  )}
                                </TableCell>
                                <TableCell className={`${tdClass} font-mono font-medium`}>
                                  {getVatLabel(line.vatMarginId ?? null)}
                                </TableCell>
                                <TableCell className={`${tdClass} font-mono font-medium`}>
                                  {line.lineVatAmount != null ? (
                                    formatEur(line.lineVatAmount)
                                  ) : (
                                    <span className="text-amber-500 text-xs">—</span>
                                  )}
                                </TableCell>
                                <TableCell className={`${tdClass} font-mono font-medium`}>
                                  {line.lineTotalInclVat != null ? (
                                    formatEur(line.lineTotalInclVat)
                                  ) : (
                                    <span className="text-amber-500 text-xs">—</span>
                                  )}
                                </TableCell>
                                {canEdit && (
                                  <TableCell className={tdClass}>
                                    {(() => {
                                      const lineKey =
                                        line.workOrderStructureId ?? `${wo.id}:${line.type}:${line.sourceId}`
                                      const canEditVatLine =
                                        (line.type === 'material' && !!line.workOrderStructureId) ||
                                        (line.type === 'hours' && (line.timeRegistryIds?.length ?? 0) > 0) ||
                                        line.type === 'training'
                                      const isEditing = editingVatLineKey === lineKey
                                      const hasVatChange = selectedVatMarginId !== (line.vatMarginId ?? null)

                                      if (!canEditVatLine)
                                        return <span className="text-xs text-muted-foreground">—</span>

                                      return (
                                        <div className="flex items-center gap-1">
                                          {isEditing ? (
                                            <div className="flex flex-col gap-2 w-60">
                                              <Select
                                                value={selectedCountryId ?? '__unset__'}
                                                onValueChange={handleCountrySelection}>
                                                <SelectTrigger className="h-7 text-xs bg-secondary border-border">
                                                  <SelectValue placeholder="Select country..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border-border text-xs">
                                                  <SelectItem value="__unset__">Select country...</SelectItem>
                                                  <SelectItem value="__none__">
                                                    No country (Belgium / Global)
                                                  </SelectItem>
                                                  {availableVatMargins
                                                    .filter(group => !!group.countryId)
                                                    .map(group => (
                                                      <SelectItem key={group.countryId!} value={group.countryId!}>
                                                        {group.countryName}
                                                      </SelectItem>
                                                    ))}
                                                </SelectContent>
                                              </Select>
                                              {selectedCountryId && selectedCountryId !== '__unset__' && (
                                                <Select
                                                  value={selectedVatMarginId ?? '__unset_vat__'}
                                                  onValueChange={handleVatRateSelection}>
                                                  <SelectTrigger className="h-7 text-xs bg-secondary border-border">
                                                    <SelectValue placeholder="Select VAT rate..." />
                                                  </SelectTrigger>
                                                  <SelectContent className="bg-card border-border text-xs">
                                                    <SelectItem value="__unset_vat__">Unset VAT</SelectItem>
                                                    {getVatRatesForSelectedCountry(selectedCountryId).map(rate => (
                                                      <SelectItem key={rate.id} value={rate.id}>
                                                        {rate.vat}%
                                                      </SelectItem>
                                                    ))}
                                                  </SelectContent>
                                                </Select>
                                              )}
                                              <div className="flex gap-1">
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-7 w-7 p-0"
                                                  disabled={savingVat || !hasVatChange}
                                                  onClick={() => handleSetVat(line)}>
                                                  <Save className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-7 w-7 p-0"
                                                  onClick={() => {
                                                    setEditingVatLineKey(null)
                                                    setSelectedCountryId(null)
                                                    setSelectedVatMarginId(null)
                                                  }}>
                                                  <X className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </div>
                                          ) : (
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-7 w-7 p-0"
                                              onClick={() => beginVatEdit(line, lineKey)}>
                                              <Pencil className="h-3 w-3" />
                                            </Button>
                                          )}
                                        </div>
                                      )
                                    })()}
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )
                })}

                <div className="flex justify-end">
                  <div className="flex flex-col gap-1.5 min-w-[260px] rounded-lg border border-border/60 bg-secondary/40 px-4 py-3">
                    <div className="flex items-center justify-between gap-8">
                      <span className="text-xs text-muted-foreground">Subtotal (ex VAT)</span>
                      <span className="text-sm font-mono text-foreground">{formatEur(boq.subtotalExVat)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-8">
                      <span className="text-xs text-muted-foreground">Total VAT</span>
                      <span className="text-sm font-mono text-muted-foreground">{formatEur(boq.totalVat)}</span>
                    </div>
                    <div className="border-t border-border/60 pt-1.5 flex items-center justify-between gap-8">
                      <span className="text-sm font-medium text-foreground">Total (incl. VAT)</span>
                      <span className="text-base font-mono font-semibold text-foreground">
                        {formatEur(boq.totalInclVat)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Work Orders tab ── */}
        {activeTab === 'workOrders' && (
          <div className="p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {boq.workOrders.length} work order{boq.workOrders.length !== 1 ? 's' : ''} linked
              </p>
              {canEdit && isDraft && linkedProjectIds.length > 0 && !addingWorkOrders && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 border-border gap-1"
                  onClick={() => setAddingWorkOrders(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add Work Orders
                </Button>
              )}
            </div>

            {addingWorkOrders && isDraft && (
              <div className="p-3 rounded-lg border border-border bg-secondary/30 flex flex-col gap-3">
                <p className="text-xs font-medium text-foreground">
                  Select additional work orders from linked projects
                </p>
                {loadingWorkOrders ? (
                  <p className="text-xs text-muted-foreground">Loading…</p>
                ) : availableWorkOrders.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No additional active work orders available.</p>
                ) : (
                  <div className="rounded-lg border border-border bg-secondary/40 divide-y divide-border/60">
                    {availableWorkOrders.map(wo => (
                      <label
                        key={wo.id}
                        className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-secondary/80 transition-colors">
                        <Checkbox
                          checked={selectedNewWorkOrderIds.includes(wo.id)}
                          onCheckedChange={() => toggleNewWorkOrder(wo.id)}
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
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-accent text-accent-foreground hover:bg-accent/80"
                    disabled={selectedNewWorkOrderIds.length === 0 || savingWorkOrders}
                    onClick={handleAddWorkOrders}>
                    {savingWorkOrders
                      ? 'Adding…'
                      : `Add ${selectedNewWorkOrderIds.length > 0 ? `(${selectedNewWorkOrderIds.length})` : ''}`}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-border"
                    onClick={() => {
                      setAddingWorkOrders(false)
                      setSelectedNewWorkOrderIds([])
                    }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {projectsOnBoq.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {projectsOnBoq.map(p => (
                  <div
                    key={p.projectId}
                    className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2">
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {p.projectNumber} — {p.projectName}
                      </p>
                      <p className="text-xs text-muted-foreground">{p.companyName}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link href={`/departments/${departmentId}/project/${p.projectId}` as Route}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-accent hover:bg-accent/10"
                          title="Open project">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                      <Link href={`/departments/${departmentId}/company/${p.companyId}` as Route}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-accent hover:bg-accent/10"
                          title="Open company">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {boq.workOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No work orders linked.</p>
            ) : (
              <div className="rounded-lg border border-border/60 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/60">
                      <TableHead className={thClass}>Work Order #</TableHead>
                      <TableHead className={thClass}>Description</TableHead>
                      <TableHead className={thClass}>Project</TableHead>
                      <TableHead className={thClass}>Company</TableHead>
                      <TableHead className={thClass}>Completed</TableHead>
                      <TableHead className={thClass}>Hours Closed</TableHead>
                      <TableHead className="w-10">
                        <span className="sr-only">Open</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {boq.workOrders.map(wo => (
                      <TableRow key={wo.id} className="border-border/40 hover:bg-secondary/50">
                        <TableCell className={`${tdClass} text-foreground font-medium`}>
                          {wo.workOrderNumber ?? '(no number)'}
                        </TableCell>
                        <TableCell className={tdClass}>{wo.description ?? '-'}</TableCell>
                        <TableCell className={tdClass}>
                          {wo.projectNumber} — {wo.projectName}
                        </TableCell>
                        <TableCell className={tdClass}>{wo.companyName}</TableCell>
                        <TableCell>
                          <BoolBadge value={wo.completed} />
                        </TableCell>
                        <TableCell>
                          <BoolBadge value={wo.hoursMaterialClosed} />
                        </TableCell>
                        <TableCell>
                          <Link href={`/departments/${departmentId}/workOrder/${wo.id}` as Route}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-accent/10">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* ── Contacts tab ── */}
        {activeTab === 'contacts' && (
          <div className="p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {boq.contacts.length} contact{boq.contacts.length !== 1 ? 's' : ''} linked
              </p>
              {canEdit && !addingContact && availableContacts.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 border-border gap-1"
                  onClick={() => setAddingContact(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add Contact
                </Button>
              )}
            </div>

            {addingContact && (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-secondary/30">
                <Select value={newContactId} onValueChange={setNewContactId}>
                  <SelectTrigger className="h-8 text-xs bg-background border-border flex-1">
                    <SelectValue placeholder="Select contact…" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none" disabled>
                      Select contact…
                    </SelectItem>
                    {availableContacts.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="h-8 text-xs bg-accent text-accent-foreground hover:bg-accent/80"
                  onClick={handleAddContact}
                  disabled={newContactId === 'none'}>
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-border"
                  onClick={() => {
                    setAddingContact(false)
                    setNewContactId('none')
                  }}>
                  Cancel
                </Button>
              </div>
            )}

            <div className="rounded-lg border border-border/60 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/60">
                    <TableHead className={thClass}>Name</TableHead>
                    <TableHead className={thClass}>Email</TableHead>
                    <TableHead className={thClass}>Phone</TableHead>
                    {canDelete && (
                      <TableHead className="w-12">
                        <span className="sr-only">Remove</span>
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {boq.contacts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canDelete ? 4 : 3} className="h-16 text-center text-muted-foreground text-sm">
                        No contacts linked.
                      </TableCell>
                    </TableRow>
                  ) : (
                    boq.contacts.map(c => (
                      <TableRow key={c.id} className="border-border/40 hover:bg-secondary/50">
                        <TableCell className={`${tdClass} text-foreground font-medium`}>{c.contactName}</TableCell>
                        <TableCell className={tdClass}>{c.contactMail ?? '-'}</TableCell>
                        <TableCell className={tdClass}>{c.contactPhone ?? '-'}</TableCell>
                        {canDelete && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveContact(c.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
