'use client'

import {useMemo, useState} from 'react'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Checkbox} from '@/components/ui/checkbox'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Textarea} from '@/components/ui/textarea'
import {useRouter} from 'next/navigation'
import {CarFront, CreditCard, Pencil, Plus, ReceiptText, Search, Trash2} from 'lucide-react'
import {
  createHrFacilityFineAction,
  createHrFacilityFuelCardAction,
  createHrFacilityVehicleAction,
  deleteHrFacilityFineAction,
  deleteHrFacilityFuelCardAction,
  deleteHrFacilityVehicleAction,
  updateHrFacilityFineAction,
  updateHrFacilityFuelCardAction,
  updateHrFacilityVehicleAction,
} from '@/serverFunctions/hrFacility'
import type {
  HrFacilityEmployeeOption,
  HrFacilityFineRow,
  HrFacilityFuelCardRow,
  HrFacilitySerialTrackedOption,
  HrFacilityVehicleRow,
} from '@/types/hrFacility'

interface HrFacilityOverviewProps {
  rows: HrFacilityVehicleRow[]
  employees: HrFacilityEmployeeOption[]
  serialTrackedOptions: HrFacilitySerialTrackedOption[]
  departmentId: string
  canManageFacility: boolean
}

type VehicleForm = {
  serialTrackedId: string
  assignedEmployeeId: string
  licensePlate: string
  brand: string
  model: string
  vin: string
  status: string
  conditionStatus: string
  signedVehicleDocument: boolean
  signedDocumentFileId: string
  monthlyFuelBudget: string
  notes: string
}

type FuelCardForm = {
  vehicleId: string
  employeeId: string
  cardNumber: string
  provider: string
  monthlyBudget: string
  currentMonthSpend: string
  active: boolean
  notes: string
}

type FineForm = {
  vehicleId: string
  employeeId: string
  fineDate: string
  amount: string
  referenceNumber: string
  description: string
  paidByEmployee: boolean
  paidAt: string
}

const emptyVehicleForm: VehicleForm = {
  serialTrackedId: '',
  assignedEmployeeId: '',
  licensePlate: '',
  brand: '',
  model: '',
  vin: '',
  status: 'active',
  conditionStatus: '',
  signedVehicleDocument: false,
  signedDocumentFileId: '',
  monthlyFuelBudget: '',
  notes: '',
}

const emptyFuelCardForm: FuelCardForm = {
  vehicleId: '',
  employeeId: '',
  cardNumber: '',
  provider: '',
  monthlyBudget: '',
  currentMonthSpend: '0',
  active: true,
  notes: '',
}

function todayInputDate() {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const emptyFineForm: FineForm = {
  vehicleId: '',
  employeeId: '',
  fineDate: todayInputDate(),
  amount: '',
  referenceNumber: '',
  description: '',
  paidByEmployee: false,
  paidAt: '',
}

function formatMoney(value: string | null) {
  if (!value) return '-'
  return new Intl.NumberFormat('nl-BE', {style: 'currency', currency: 'EUR'}).format(Number(value))
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('nl-BE', {day: '2-digit', month: 'short', year: 'numeric'}).format(new Date(value))
}

function toInputDate(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function optionalValue(value: string) {
  return value.trim() || null
}

function selectedValue(value: string) {
  return value || '__none'
}

function normalizeSelectedValue(value: string) {
  return value === '__none' ? '' : value
}

function vehicleLabel(vehicle: HrFacilityVehicleRow) {
  return [vehicle.licensePlate, vehicle.brand, vehicle.model].filter(Boolean).join(' - ') || 'Vehicle'
}

function actionFailedMessage(result: unknown, fallback: string) {
  const response = result as {success?: boolean; errors?: {global?: string[]}} | undefined
  if (response?.success === false) return response.errors?.global?.[0] ?? fallback
  return null
}

export function HrFacilityOverview({
  rows,
  employees,
  serialTrackedOptions,
  departmentId,
  canManageFacility,
}: HrFacilityOverviewProps) {
  const router = useRouter()
  const [filter, setFilter] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingVehicle, setEditingVehicle] = useState<HrFacilityVehicleRow | null>(null)
  const [editingFuelCard, setEditingFuelCard] = useState<HrFacilityFuelCardRow | null>(null)
  const [editingFine, setEditingFine] = useState<HrFacilityFineRow | null>(null)
  const [vehicleForm, setVehicleForm] = useState<VehicleForm>(emptyVehicleForm)
  const [fuelCardForm, setFuelCardForm] = useState<FuelCardForm>(emptyFuelCardForm)
  const [fineForm, setFineForm] = useState<FineForm>(emptyFineForm)
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false)
  const [fuelCardDialogOpen, setFuelCardDialogOpen] = useState(false)
  const [fineDialogOpen, setFineDialogOpen] = useState(false)

  const filteredRows = useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase()
    if (!normalizedFilter) return rows

    return rows.filter(row =>
      [vehicleLabel(row), row.assignedEmployeeName, row.serialTrackedLabel, row.conditionStatus]
        .filter(Boolean)
        .some(value => value!.toLowerCase().includes(normalizedFilter)),
    )
  }, [filter, rows])

  const fuelCards = rows.flatMap(row => row.fuelCards)
  const fines = rows.flatMap(row => row.fines)
  const openFines = fines.filter(fine => !fine.paidByEmployee).length
  const signedDocuments = rows.filter(row => row.signedVehicleDocument).length
  const fuelBudgetWarnings = fuelCards.filter(card => {
    if (!card.monthlyBudget) return false
    return Number(card.currentMonthSpend) > Number(card.monthlyBudget)
  }).length
  const fuelCardBudgetError =
    fuelCardForm.monthlyBudget !== '' && Number(fuelCardForm.currentMonthSpend) > Number(fuelCardForm.monthlyBudget)
      ? 'Current month spend may not exceed the monthly fuel budget.'
      : null

  function openVehicleDialog(vehicle?: HrFacilityVehicleRow) {
    if (!canManageFacility) return

    setError(null)
    setEditingVehicle(vehicle ?? null)
    setVehicleForm(
      vehicle
        ? {
            serialTrackedId: vehicle.serialTrackedId ?? '',
            assignedEmployeeId: vehicle.assignedEmployeeId ?? '',
            licensePlate: vehicle.licensePlate ?? '',
            brand: vehicle.brand ?? '',
            model: vehicle.model ?? '',
            vin: vehicle.vin ?? '',
            status: vehicle.status,
            conditionStatus: vehicle.conditionStatus ?? '',
            signedVehicleDocument: vehicle.signedVehicleDocument,
            signedDocumentFileId: vehicle.signedDocumentFileId ?? '',
            monthlyFuelBudget: vehicle.monthlyFuelBudget ?? '',
            notes: vehicle.notes ?? '',
          }
        : emptyVehicleForm,
    )
    setVehicleDialogOpen(true)
  }

  function openFuelCardDialog(vehicle?: HrFacilityVehicleRow, fuelCard?: HrFacilityFuelCardRow) {
    if (!canManageFacility) return

    setError(null)
    setEditingFuelCard(fuelCard ?? null)
    setFuelCardForm(
      fuelCard
        ? {
            vehicleId: fuelCard.vehicleId ?? '',
            employeeId: fuelCard.employeeId ?? '',
            cardNumber: fuelCard.cardNumber,
            provider: fuelCard.provider ?? '',
            monthlyBudget: fuelCard.monthlyBudget ?? '',
            currentMonthSpend: fuelCard.currentMonthSpend,
            active: fuelCard.active,
            notes: fuelCard.notes ?? '',
          }
        : {...emptyFuelCardForm, vehicleId: vehicle?.id ?? '', employeeId: vehicle?.assignedEmployeeId ?? ''},
    )
    setFuelCardDialogOpen(true)
  }

  function openFineDialog(vehicle?: HrFacilityVehicleRow, fine?: HrFacilityFineRow) {
    if (!canManageFacility) return

    setError(null)
    setEditingFine(fine ?? null)
    setFineForm(
      fine
        ? {
            vehicleId: fine.vehicleId ?? '',
            employeeId: fine.employeeId ?? '',
            fineDate: toInputDate(fine.fineDate),
            amount: fine.amount,
            referenceNumber: fine.referenceNumber ?? '',
            description: fine.description ?? '',
            paidByEmployee: fine.paidByEmployee,
            paidAt: toInputDate(fine.paidAt),
          }
        : {...emptyFineForm, vehicleId: vehicle?.id ?? '', employeeId: vehicle?.assignedEmployeeId ?? ''},
    )
    setFineDialogOpen(true)
  }

  async function handleSaveVehicle() {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        departmentId,
        serialTrackedId: optionalValue(vehicleForm.serialTrackedId),
        assignedEmployeeId: optionalValue(vehicleForm.assignedEmployeeId),
        licensePlate: optionalValue(vehicleForm.licensePlate),
        brand: optionalValue(vehicleForm.brand),
        model: optionalValue(vehicleForm.model),
        vin: optionalValue(vehicleForm.vin),
        status: vehicleForm.status,
        conditionStatus: optionalValue(vehicleForm.conditionStatus),
        signedVehicleDocument: vehicleForm.signedVehicleDocument,
        signedDocumentFileId: optionalValue(vehicleForm.signedDocumentFileId),
        monthlyFuelBudget: vehicleForm.monthlyFuelBudget === '' ? null : Number(vehicleForm.monthlyFuelBudget),
        notes: optionalValue(vehicleForm.notes),
      }
      const result = editingVehicle
        ? await updateHrFacilityVehicleAction({...payload, id: editingVehicle.id})
        : await createHrFacilityVehicleAction(payload)
      const message = actionFailedMessage(result, 'Vehicle could not be saved.')
      if (message) throw new Error(message)

      setVehicleDialogOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vehicle could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveFuelCard() {
    if (fuelCardBudgetError) {
      setError(fuelCardBudgetError)
      return
    }

    setSaving(true)
    setError(null)
    try {
      const payload = {
        departmentId,
        vehicleId: optionalValue(fuelCardForm.vehicleId),
        employeeId: optionalValue(fuelCardForm.employeeId),
        cardNumber: fuelCardForm.cardNumber.trim(),
        provider: optionalValue(fuelCardForm.provider),
        monthlyBudget: fuelCardForm.monthlyBudget === '' ? null : Number(fuelCardForm.monthlyBudget),
        currentMonthSpend: Number(fuelCardForm.currentMonthSpend),
        active: fuelCardForm.active,
        notes: optionalValue(fuelCardForm.notes),
      }
      const result = editingFuelCard
        ? await updateHrFacilityFuelCardAction({...payload, id: editingFuelCard.id})
        : await createHrFacilityFuelCardAction(payload)
      const message = actionFailedMessage(result, 'Fuel card could not be saved.')
      if (message) throw new Error(message)

      setFuelCardDialogOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fuel card could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveFine() {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        departmentId,
        vehicleId: optionalValue(fineForm.vehicleId),
        employeeId: optionalValue(fineForm.employeeId),
        fineDate: new Date(`${fineForm.fineDate}T00:00:00`),
        amount: Number(fineForm.amount),
        referenceNumber: optionalValue(fineForm.referenceNumber),
        description: optionalValue(fineForm.description),
        paidByEmployee: fineForm.paidByEmployee,
        paidAt: fineForm.paidAt ? new Date(`${fineForm.paidAt}T00:00:00`) : null,
      }
      const result = editingFine
        ? await updateHrFacilityFineAction({...payload, id: editingFine.id})
        : await createHrFacilityFineAction(payload)
      const message = actionFailedMessage(result, 'Fine could not be saved.')
      if (message) throw new Error(message)

      setFineDialogOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fine could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(type: 'vehicle' | 'fuelCard' | 'fine', id: string) {
    if (!canManageFacility || !window.confirm('Delete this record?')) return

    if (type === 'vehicle') await deleteHrFacilityVehicleAction({id, departmentId})
    if (type === 'fuelCard') await deleteHrFacilityFuelCardAction({id, departmentId})
    if (type === 'fine') await deleteHrFacilityFineAction({id, departmentId})
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Facility</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Company car management, fuel cards, fuel budgets, signed vehicle documents and fines.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => openFuelCardDialog()} disabled={!canManageFacility}>
            <CreditCard className="mr-2 h-4 w-4" />
            Fuel card
          </Button>
          <Button type="button" variant="outline" onClick={() => openFineDialog()} disabled={!canManageFacility}>
            <ReceiptText className="mr-2 h-4 w-4" />
            Fine
          </Button>
          <Button type="button" onClick={() => openVehicleDialog()} disabled={!canManageFacility}>
            <Plus className="mr-2 h-4 w-4" />
            Vehicle
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CarFront className="h-4 w-4 text-muted-foreground" />
            Company Cars
          </div>
          <div className="mt-3 text-2xl font-semibold">{rows.length}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            Fuel Cards
          </div>
          <div className="mt-3 text-2xl font-semibold">{fuelCards.length}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium">Signed Documents</div>
          <div className="mt-3 text-2xl font-semibold">
            {signedDocuments}/{rows.length}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium">Open Fines</div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-2xl font-semibold">{openFines}</span>
            {fuelBudgetWarnings > 0 ? (
              <Badge variant="destructive">{fuelBudgetWarnings} budget warning(s)</Badge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={filter}
          onChange={event => setFilter(event.target.value)}
          placeholder="Search vehicles"
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Car document</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Fuel budget</TableHead>
              <TableHead>Fines</TableHead>
              <TableHead className="w-[170px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                  No vehicles found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map(row => {
                const vehicleSpend = row.fuelCards.reduce((total, card) => total + Number(card.currentMonthSpend), 0)
                const vehicleBudgetWarning =
                  row.monthlyFuelBudget !== null && vehicleSpend > Number(row.monthlyFuelBudget)
                const openVehicleFines = row.fines.filter(fine => !fine.paidByEmployee).length

                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{vehicleLabel(row)}</div>
                      <div className="text-xs text-muted-foreground">{row.vin ?? row.serialTrackedLabel ?? '-'}</div>
                    </TableCell>
                    <TableCell>{row.assignedEmployeeName ?? '-'}</TableCell>
                    <TableCell>
                      {row.signedVehicleDocument ? (
                        <Badge className="border-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                          Signed
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Missing</Badge>
                      )}
                    </TableCell>
                    <TableCell>{row.conditionStatus ?? '-'}</TableCell>
                    <TableCell>
                      <div>{formatMoney(String(vehicleSpend))}</div>
                      <div className="text-xs text-muted-foreground">Limit: {formatMoney(row.monthlyFuelBudget)}</div>
                      {vehicleBudgetWarning ? <div className="text-xs text-destructive">Budget exceeded</div> : null}
                    </TableCell>
                    <TableCell>
                      <div>{row.fines.length} total</div>
                      <div className="text-xs text-muted-foreground">{openVehicleFines} open</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => openFuelCardDialog(row)}>
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => openFineDialog(row)}>
                          <ReceiptText className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => openVehicleDialog(row)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete('vehicle', row.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fuel card</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fuelCards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-20 text-center text-sm text-muted-foreground">
                    No fuel cards found.
                  </TableCell>
                </TableRow>
              ) : (
                fuelCards.map(card => {
                  const vehicle = rows.find(row => row.id === card.vehicleId) ?? null
                  const budgetWarning =
                    card.monthlyBudget !== null && Number(card.currentMonthSpend) > Number(card.monthlyBudget)

                  return (
                    <TableRow key={card.id}>
                      <TableCell>
                        <div className="font-medium">{card.cardNumber}</div>
                        <div className="text-xs text-muted-foreground">{card.provider ?? '-'}</div>
                      </TableCell>
                      <TableCell>{vehicle ? vehicleLabel(vehicle) : '-'}</TableCell>
                      <TableCell>
                        <div>
                          {formatMoney(card.currentMonthSpend)} / {formatMoney(card.monthlyBudget)}
                        </div>
                        {budgetWarning ? <div className="text-xs text-destructive">Budget exceeded</div> : null}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => openFuelCardDialog(vehicle ?? undefined, card)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete('fuelCard', card.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-lg border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fine</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-20 text-center text-sm text-muted-foreground">
                    No fines found.
                  </TableCell>
                </TableRow>
              ) : (
                fines.map(fine => {
                  const vehicle = rows.find(row => row.id === fine.vehicleId) ?? null

                  return (
                    <TableRow key={fine.id}>
                      <TableCell>
                        <div className="font-medium">{formatMoney(fine.amount)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(fine.fineDate)} {fine.referenceNumber ? `- ${fine.referenceNumber}` : ''}
                        </div>
                      </TableCell>
                      <TableCell>{vehicle ? vehicleLabel(vehicle) : '-'}</TableCell>
                      <TableCell>
                        {fine.paidByEmployee ? (
                          <Badge className="border-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                            Paid by employee
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Open</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => openFineDialog(vehicle ?? undefined, fine)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete('fine', fine.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? 'Edit vehicle' : 'Add vehicle'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>License plate</Label>
              <Input
                value={vehicleForm.licensePlate}
                onChange={event => setVehicleForm({...vehicleForm, licensePlate: event.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select
                value={selectedValue(vehicleForm.assignedEmployeeId)}
                onValueChange={value =>
                  setVehicleForm({...vehicleForm, assignedEmployeeId: normalizeSelectedValue(value)})
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No employee</SelectItem>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Brand</Label>
              <Input
                value={vehicleForm.brand}
                onChange={event => setVehicleForm({...vehicleForm, brand: event.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input
                value={vehicleForm.model}
                onChange={event => setVehicleForm({...vehicleForm, model: event.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>VIN</Label>
              <Input
                value={vehicleForm.vin}
                onChange={event => setVehicleForm({...vehicleForm, vin: event.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={vehicleForm.status}
                onValueChange={value => setVehicleForm({...vehicleForm, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Serial tracked document</Label>
              <Select
                value={selectedValue(vehicleForm.serialTrackedId)}
                onValueChange={value =>
                  setVehicleForm({...vehicleForm, serialTrackedId: normalizeSelectedValue(value)})
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Select serial tracked item" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No document</SelectItem>
                  {serialTrackedOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monthly fuel budget</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={vehicleForm.monthlyFuelBudget}
                onChange={event => setVehicleForm({...vehicleForm, monthlyFuelBudget: event.target.value})}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Condition</Label>
              <Textarea
                value={vehicleForm.conditionStatus}
                onChange={event => setVehicleForm({...vehicleForm, conditionStatus: event.target.value})}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={vehicleForm.signedVehicleDocument}
                onCheckedChange={checked => setVehicleForm({...vehicleForm, signedVehicleDocument: checked === true})}
              />
              <Label>Signed vehicle document</Label>
            </div>
            <div className="space-y-2">
              <Label>Signed document reference</Label>
              <Input
                value={vehicleForm.signedDocumentFileId}
                onChange={event => setVehicleForm({...vehicleForm, signedDocumentFileId: event.target.value})}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={vehicleForm.notes}
                onChange={event => setVehicleForm({...vehicleForm, notes: event.target.value})}
              />
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setVehicleDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveVehicle} disabled={saving}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={fuelCardDialogOpen} onOpenChange={setFuelCardDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingFuelCard ? 'Edit fuel card' : 'Add fuel card'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Card number</Label>
              <Input
                value={fuelCardForm.cardNumber}
                onChange={event => setFuelCardForm({...fuelCardForm, cardNumber: event.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Input
                value={fuelCardForm.provider}
                onChange={event => setFuelCardForm({...fuelCardForm, provider: event.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Vehicle</Label>
              <Select
                value={selectedValue(fuelCardForm.vehicleId)}
                onValueChange={value => setFuelCardForm({...fuelCardForm, vehicleId: normalizeSelectedValue(value)})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No vehicle</SelectItem>
                  {rows.map(row => (
                    <SelectItem key={row.id} value={row.id}>
                      {vehicleLabel(row)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select
                value={selectedValue(fuelCardForm.employeeId)}
                onValueChange={value => setFuelCardForm({...fuelCardForm, employeeId: normalizeSelectedValue(value)})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No employee</SelectItem>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monthly budget</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={fuelCardForm.monthlyBudget}
                onChange={event => setFuelCardForm({...fuelCardForm, monthlyBudget: event.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Current month spend</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={fuelCardForm.currentMonthSpend}
                onChange={event => setFuelCardForm({...fuelCardForm, currentMonthSpend: event.target.value})}
              />
              {fuelCardBudgetError ? <p className="text-xs text-destructive">{fuelCardBudgetError}</p> : null}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={fuelCardForm.active}
                onCheckedChange={checked => setFuelCardForm({...fuelCardForm, active: checked === true})}
              />
              <Label>Active</Label>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={fuelCardForm.notes}
                onChange={event => setFuelCardForm({...fuelCardForm, notes: event.target.value})}
              />
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFuelCardDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveFuelCard} disabled={saving || Boolean(fuelCardBudgetError)}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={fineDialogOpen} onOpenChange={setFineDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingFine ? 'Edit fine' : 'Add fine'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Vehicle</Label>
              <Select
                value={selectedValue(fineForm.vehicleId)}
                onValueChange={value => setFineForm({...fineForm, vehicleId: normalizeSelectedValue(value)})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No vehicle</SelectItem>
                  {rows.map(row => (
                    <SelectItem key={row.id} value={row.id}>
                      {vehicleLabel(row)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select
                value={selectedValue(fineForm.employeeId)}
                onValueChange={value => setFineForm({...fineForm, employeeId: normalizeSelectedValue(value)})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No employee</SelectItem>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fine date</Label>
              <Input
                type="date"
                value={fineForm.fineDate}
                onChange={event => setFineForm({...fineForm, fineDate: event.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={fineForm.amount}
                onChange={event => setFineForm({...fineForm, amount: event.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Reference number</Label>
              <Input
                value={fineForm.referenceNumber}
                onChange={event => setFineForm({...fineForm, referenceNumber: event.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Paid at</Label>
              <Input
                type="date"
                value={fineForm.paidAt}
                onChange={event => setFineForm({...fineForm, paidAt: event.target.value})}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={fineForm.paidByEmployee}
                onCheckedChange={checked => setFineForm({...fineForm, paidByEmployee: checked === true})}
              />
              <Label>Paid by employee</Label>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={fineForm.description}
                onChange={event => setFineForm({...fineForm, description: event.target.value})}
              />
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFineDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveFine} disabled={saving}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
