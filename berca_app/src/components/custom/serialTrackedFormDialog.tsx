'use client'

import {useEffect, useMemo, useState, useTransition, useRef} from 'react'
//import {useRouter} from 'next/navigation'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Button} from '@/components/ui/button'
import {Switch} from '@/components/ui/switch'
import {Select, SelectTrigger, SelectValue, SelectContent, SelectItem} from '@/components/ui/select'
import {
  createMaterialSerialTrackedAction,
  updateMaterialSerialTrackedAction,
} from '@/serverFunctions/materialSerialTracked'

type MaterialSerialTrackedFormValue = {
  id: string
  beNumber: string | null
  brandName: string | null
  management: string | null
  brandOrderNumber: string | null
  companyId: string | null
  orderNumber: string | null
  shortDescription: string | null
  longDescription: string | null
  transactionType: string | null
  materialGroupId: string | null
  fromLocation: string | null
  toLocation: string | null
  preferredSupplier: string | null
  rejected: boolean | null
  additionalInfo: string | null
  projectId: string | null
  becraCode: string | null
  warehousePlaceId: string | null
  lastInspectionDate?: string | Date | null
  nextInspectionDate?: string | Date | null
  inspectionIntervalValue?: number | null
  inspectionIntervalUnit?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'
}

interface MaterialSerialTrackedFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  materialSerialTracked: MaterialSerialTrackedFormValue | null
  mode?: 'create' | 'edit' | 'duplicate'
  companyOptions: {id: string; name: string}[]
  projectOptions: {id: string; name: string}[]
  materialGroupOptions: {id: string; name: string}[]
  warehousePlaceOptions: {id: string; label: string}[]
  materialOptions: {
    id: string
    beNumber: string
    brandName: string | null
    management: string | null
    brandOrderNr: string | null
    shortDescription: string
    longDescription: string | null
    materialGroupId: string
  }[]
  departmentId: string
}

type FormState = {
  id?: string
  materialId: string // New: selected materialId
  beNumber: string
  brandName: string
  management: string
  brandOrderNumber: string
  companyId: string
  orderNumber: string
  shortDescription: string
  longDescription: string
  transactionType: string
  materialGroupId: string
  fromLocation: string
  toLocation: string
  preferredSupplier: string
  rejected: boolean | null
  additionalInfo: string
  projectId: string
  becraCode: string
  warehousePlaceId: string
  lastInspectionDate: string
  nextInspectionDate: string
  inspectionIntervalValue: string
  inspectionIntervalUnit: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'
}

const emptyForm: FormState = {
  materialId: '',
  beNumber: '',
  brandName: '',
  management: '',
  brandOrderNumber: '',
  companyId: '',
  orderNumber: '',
  shortDescription: '',
  longDescription: '',
  transactionType: '',
  materialGroupId: '',
  fromLocation: '',
  toLocation: '',
  preferredSupplier: '',
  rejected: null,
  additionalInfo: '',
  projectId: '',
  becraCode: '',
  warehousePlaceId: '',
  lastInspectionDate: '',
  nextInspectionDate: '',
  inspectionIntervalValue: '',
  inspectionIntervalUnit: 'DAY',
}

function toFormState(item: MaterialSerialTrackedFormValue | null, mode: 'create' | 'edit' | 'duplicate'): FormState {
  if (!item) return emptyForm

  const isDuplicate = mode === 'duplicate'

  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return ''

    // DAL-backed edit flows can provide Date objects; inputs need YYYY-MM-DD strings.
    if (date instanceof Date) {
      return Number.isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0]
    }

    // Already a string, might be ISO date - extract just the date part.
    return date.split('T')[0]
  }

  return {
    id: isDuplicate ? undefined : item.id,
    materialId: '',
    // Force user to pick a BE/material when duplicating, so create validation stays correct.
    beNumber: isDuplicate ? '' : (item.beNumber ?? ''),
    brandName: item.brandName ?? '',
    management: item.management ?? '',
    brandOrderNumber: item.brandOrderNumber ?? '',
    companyId: item.companyId ?? '',
    orderNumber: item.orderNumber ?? '',
    shortDescription: item.shortDescription ?? '',
    longDescription: item.longDescription ?? '',
    transactionType: item.transactionType ?? '',
    materialGroupId: item.materialGroupId ?? '',
    fromLocation: item.fromLocation ?? '',
    toLocation: item.toLocation ?? '',
    preferredSupplier: item.preferredSupplier ?? '',
    rejected: typeof item.rejected === 'boolean' ? item.rejected : null,
    additionalInfo: item.additionalInfo ?? '',
    projectId: item.projectId ?? '',
    becraCode: item.becraCode ?? '',
    warehousePlaceId: item.warehousePlaceId ?? (item as any).WarehousePlace?.[0]?.id ?? '',
    lastInspectionDate: formatDate(item.lastInspectionDate),
    nextInspectionDate: formatDate(item.nextInspectionDate),
    inspectionIntervalValue: item.inspectionIntervalValue ? String(item.inspectionIntervalValue) : '',
    inspectionIntervalUnit: item.inspectionIntervalUnit ?? 'DAY',
  }
}

export function MaterialSerialTrackedFormDialog({
  open,
  onOpenChange,
  materialSerialTracked,
  mode,
  companyOptions,
  materialGroupOptions,
  warehousePlaceOptions,
  materialOptions,
}: MaterialSerialTrackedFormDialogProps) {
  //const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [createdId] = useState<string | null>(null)
  const idInputRef = useRef<HTMLInputElement>(null)
  const resolvedMode: 'create' | 'edit' | 'duplicate' = mode ?? (materialSerialTracked ? 'edit' : 'create')
  const isEditing = resolvedMode === 'edit' && !!materialSerialTracked
  const selectableMaterialOptions = useMemo(
    () => materialOptions.filter(option => option.beNumber.trim().length > 0),
    [materialOptions],
  )

  useEffect(() => {
    if (open) {
      setForm(toFormState(materialSerialTracked, resolvedMode))
    }
  }, [open, materialSerialTracked, resolvedMode])

  const title = useMemo(() => {
    if (resolvedMode === 'edit') return 'Edit Serial Tracked Item'
    if (resolvedMode === 'duplicate') return 'Duplicate Serial Tracked Item'
    return 'New Serial Tracked Item'
  }, [resolvedMode])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({...prev, [key]: value}))

    // Auto-calculate nextInspectionDate when lastInspectionDate, inspectionIntervalValue, or inspectionIntervalUnit changes
    if (key === 'lastInspectionDate' || key === 'inspectionIntervalValue' || key === 'inspectionIntervalUnit') {
      const updatedForm =
        key === 'lastInspectionDate'
          ? {...form, lastInspectionDate: value as string}
          : key === 'inspectionIntervalValue'
            ? {...form, inspectionIntervalValue: value as string}
            : {...form, inspectionIntervalUnit: value as 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'}

      if (updatedForm.lastInspectionDate && updatedForm.inspectionIntervalValue) {
        try {
          const lastDate = new Date(updatedForm.lastInspectionDate)
          const intervalValue = parseInt(updatedForm.inspectionIntervalValue, 10)
          const intervalUnit = updatedForm.inspectionIntervalUnit || 'DAY'

          if (!isNaN(lastDate.getTime()) && !isNaN(intervalValue) && intervalValue > 0) {
            const nextDate = new Date(lastDate)

            if (intervalUnit === 'DAY') {
              nextDate.setDate(nextDate.getDate() + intervalValue)
            } else if (intervalUnit === 'WEEK') {
              nextDate.setDate(nextDate.getDate() + intervalValue * 7)
            } else if (intervalUnit === 'MONTH') {
              nextDate.setMonth(nextDate.getMonth() + intervalValue)
            } else if (intervalUnit === 'YEAR') {
              nextDate.setFullYear(nextDate.getFullYear() + intervalValue)
            }

            // Format as YYYY-MM-DD for the input
            const nextDateStr = nextDate.toISOString().split('T')[0]
            setForm(prev => ({...prev, nextInspectionDate: nextDateStr}))
          }
        } catch (e) {
          // Silently ignore date calculation errors
        }
      }
    }
  }

  async function handleBeNumberSelect(beNumber: string) {
    if (!beNumber.trim()) return

    const material = selectableMaterialOptions.find(m => m.beNumber === beNumber)
    if (material) {
      setForm(prev => ({
        ...prev,
        materialId: material.id, // Set materialId
        beNumber: material.beNumber,
        brandName: material.brandName ?? '',
        management: material.management ?? '',
        brandOrderNumber: material.brandOrderNr ?? '',
        shortDescription: material.shortDescription ?? '',
        longDescription: material.longDescription ?? '',
        materialGroupId: material.materialGroupId ?? '',
      }))
    } else {
      setForm(prev => ({...prev, beNumber, materialId: ''}))
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const materialGroupId = form.materialGroupId || null
        const lastInspectionDate = form.lastInspectionDate ? new Date(form.lastInspectionDate) : null
        const nextInspectionDate = form.nextInspectionDate ? new Date(form.nextInspectionDate) : null
        const inspectionIntervalValue = form.inspectionIntervalValue ? parseInt(form.inspectionIntervalValue, 10) : null
        const inspectionIntervalUnit =
          form.inspectionIntervalValue && form.inspectionIntervalUnit ? form.inspectionIntervalUnit : null

        if (isEditing && form.id) {
          await updateMaterialSerialTrackedAction({
            id: form.id,
            materialId: form.materialId || null,
            beNumber: form.beNumber,
            brandName: form.brandName,
            management: form.management,
            brandOrderNumber: form.brandOrderNumber,
            companyId: form.companyId,
            orderNumber: form.orderNumber,
            shortDescription: form.shortDescription,
            longDescription: form.longDescription,
            transactionType: form.transactionType,
            materialGroupId,
            fromLocation: form.fromLocation,
            toLocation: form.toLocation,
            preferredSupplier: form.preferredSupplier,
            rejected: form.rejected,
            additionalInfo: form.additionalInfo,
            projectId: form.projectId,
            becraCode: form.becraCode,
            warehousePlaceId: form.warehousePlaceId || null,
            lastInspectionDate,
            nextInspectionDate,
            inspectionIntervalValue,
            inspectionIntervalUnit,
          })
        } else {
          await createMaterialSerialTrackedAction({
            materialId: form.materialId || null,
            beNumber: form.beNumber,
            brandName: form.brandName,
            management: form.management,
            brandOrderNumber: form.brandOrderNumber,
            companyId: form.companyId,
            orderNumber: form.orderNumber,
            shortDescription: form.shortDescription,
            longDescription: form.longDescription,
            transactionType: form.transactionType,
            materialGroupId,
            fromLocation: form.fromLocation,
            toLocation: form.toLocation,
            preferredSupplier: form.preferredSupplier,
            rejected: form.rejected,
            additionalInfo: form.additionalInfo,
            projectId: form.projectId,
            becraCode: form.becraCode,
            warehousePlaceId: form.warehousePlaceId || null,
            lastInspectionDate,
            nextInspectionDate,
            inspectionIntervalValue,
            inspectionIntervalUnit,
          })
        }
        onOpenChange(false)
      } catch (err: any) {
        setError(err?.message || 'Failed to save. Please check your input and try again.')
      }
    })
  }

  function handleCopyId() {
    if (createdId) {
      navigator.clipboard.writeText(createdId)
      alert('Serial tracked ID copied to clipboard.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {resolvedMode === 'edit'
              ? 'Update the serial tracked item details.'
              : resolvedMode === 'duplicate'
                ? 'Create a new item from copied values. Select a new BE Number before saving.'
                : 'Create a new serial tracked item.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="beNumber">BE Number</Label>
              <Select value={form.beNumber} onValueChange={handleBeNumberSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select BE Number" />
                </SelectTrigger>
                <SelectContent>
                  {selectableMaterialOptions.map(option => (
                    <SelectItem key={option.id} value={option.beNumber}>
                      {option.beNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input
                id="shortDescription"
                value={form.shortDescription}
                onChange={e => setField('shortDescription', e.target.value)}
                placeholder="Short description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name</Label>
              <Input
                id="brandName"
                value={form.brandName}
                onChange={e => setField('brandName', e.target.value)}
                placeholder="Brand name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="management">Management</Label>
              <Input
                id="management"
                value={form.management}
                onChange={e => setField('management', e.target.value)}
                placeholder="Management"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandOrderNumber">Brand Order Number</Label>
              <Input
                id="brandOrderNumber"
                value={form.brandOrderNumber}
                onChange={e => setField('brandOrderNumber', e.target.value)}
                placeholder="Brand order number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderNumber">Order Number</Label>
              <Input
                id="orderNumber"
                value={form.orderNumber}
                onChange={e => setField('orderNumber', e.target.value)}
                placeholder="Order number"
              />
            </div>

            <div className="space-y-2">
              <Label>Company</Label>
              <Select
                value={form.companyId || '__none__'}
                onValueChange={value => setField('companyId', value === '__none__' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No company</SelectItem>
                  {companyOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Material Group</Label>
              <Select
                value={form.materialGroupId || '__none__'}
                onValueChange={() => {}} // No-op, disables user changes
                disabled>
                <SelectTrigger>
                  <SelectValue
                    placeholder="Select material group"
                    // Show the group name if available, otherwise fallback
                  >
                    {(() => {
                      const group = materialGroupOptions.find(option => option.id === form.materialGroupId)
                      return group ? group.name : 'No group'
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No group</SelectItem>
                  {materialGroupOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Stock Location</Label>
              <Select
                value={form.warehousePlaceId || '__none__'}
                onValueChange={value => setField('warehousePlaceId', value === '__none__' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stock location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No location</SelectItem>
                  {warehousePlaceOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionType">Transaction Type</Label>
              <Input
                id="transactionType"
                value={form.transactionType}
                onChange={e => setField('transactionType', e.target.value)}
                placeholder="Transaction type"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromLocation">From Location</Label>
              <Input
                id="fromLocation"
                value={form.fromLocation}
                onChange={e => setField('fromLocation', e.target.value)}
                placeholder="From location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toLocation">To Location</Label>
              <Input
                id="toLocation"
                value={form.toLocation}
                onChange={e => setField('toLocation', e.target.value)}
                placeholder="To location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredSupplier">Preferred Supplier</Label>
              <Input
                id="preferredSupplier"
                value={form.preferredSupplier}
                onChange={e => setField('preferredSupplier', e.target.value)}
                placeholder="Preferred supplier"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="becraCode">Becra Code</Label>
              <Input
                id="becraCode"
                value={form.becraCode}
                onChange={e => setField('becraCode', e.target.value)}
                placeholder="Becra code"
              />
            </div>

            <div className="space-y-2 flex items-center gap-4 pt-6">
              <Label>Rejected</Label>
              <Switch
                checked={!!form.rejected}
                onCheckedChange={checked => setField('rejected', checked)}
                id="rejected-switch"
              />
              <span className="text-xs text-muted-foreground">{form.rejected ? 'Yes' : 'No'}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastInspectionDate">Last Inspection Date</Label>
              <Input
                id="lastInspectionDate"
                type="date"
                value={form.lastInspectionDate}
                onChange={e => setField('lastInspectionDate', e.target.value)}
                placeholder="Last inspection date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspectionIntervalValue">Inspection Interval</Label>
              <div className="flex gap-2">
                <Input
                  id="inspectionIntervalValue"
                  type="number"
                  min="1"
                  value={form.inspectionIntervalValue}
                  onChange={e => setField('inspectionIntervalValue', e.target.value)}
                  placeholder="e.g., 365"
                  className="flex-1"
                />
                <Select
                  value={form.inspectionIntervalUnit}
                  onValueChange={(value: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR') =>
                    setField('inspectionIntervalUnit', value)
                  }>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAY">Days</SelectItem>
                    <SelectItem value="WEEK">Weeks</SelectItem>
                    <SelectItem value="MONTH">Months</SelectItem>
                    <SelectItem value="YEAR">Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextInspectionDate">Next Inspection Date</Label>
              <Input
                id="nextInspectionDate"
                type="date"
                value={form.nextInspectionDate}
                onChange={e => setField('nextInspectionDate', e.target.value)}
                placeholder="Next inspection date"
              />
              <p className="text-xs text-muted-foreground">
                Auto-calculated from last inspection date + interval, or set manually
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="longDescription">Long Description</Label>
            <Textarea
              id="longDescription"
              value={form.longDescription}
              onChange={e => setField('longDescription', e.target.value)}
              placeholder="Long description"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalInfo">Additional Info</Label>
            <Textarea
              id="additionalInfo"
              value={form.additionalInfo}
              onChange={e => setField('additionalInfo', e.target.value)}
              placeholder="Additional information"
              rows={3}
            />
          </div>

          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

          {createdId && (
            <div className="mt-4 flex items-center gap-2">
              <Input ref={idInputRef} value={createdId} readOnly className="w-auto" />
              <Button type="button" onClick={handleCopyId}>
                Copy ID
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
