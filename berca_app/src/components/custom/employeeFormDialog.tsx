'use client'

import {useEffect, useRef, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/ui/dialog'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Trash2, Upload} from 'lucide-react'
import type {MappedEmployee} from '@/types/employee'

interface EmployeeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: MappedEmployee | null
  employees: MappedEmployee[]
  employmentStatusOptions: string[]
  contractTypeOptions: string[]
  benefitTemplateOptions: string[]
  roles: {id: string; name: string}[]
  titles: {id: string; name: string}[]
  onSave: (employee: MappedEmployee, password: string, photo?: File | null) => Promise<void>
}

// Defaults used when creating a new employee or resetting the form.
export const EMPTY_EMPLOYEE: MappedEmployee = {
  id: '',
  firstName: '',
  lastName: '',
  mail: null,
  username: '',
  phoneNumber: null,
  birthDate: null,
  startDate: new Date().toISOString().split('T')[0],
  endDate: null,
  info: null,
  street: null,
  houseNumber: null,
  busNumber: null,
  zipCode: null,
  place: null,
  permanentEmployee: false,
  checkInfo: false,
  newYearCard: false,
  active: true,
  createdAt: new Date().toISOString().split('T')[0],
  createdBy: null,
  passwordCreatedAt: new Date().toISOString().split('T')[0],
  pictureId: null,
  photoFileId: null,
  bankAccountNumber: null,
  rrn: null,
  idExpirationDate: null,
  driversLicense: false,
  maritalStatus: null,
  dependents: null,
  employmentStatus: null,
  contractType: null,
  contractDuration: null,
  grossSalary: null,
  mealVouchers: false,
  ecoVouchers: false,
  companyCar: false,
  companyCarDescription: null,
  fuelCard: false,
  bikeLease: false,
  mobilePhone: false,
  laptop: false,
  fixedExpenseAllowance: false,
  homeWorkInternetAllowance: false,
  extraLegalBenefits: null,
  deleted: false,
  deletedAt: null,
  deletedBy: null,
  roleLevelIds: [],
  titleId: null,
  roleName: '-',
  titleName: '-',
  emergencyContacts: [],
}

const inputStyles = 'bg-secondary border-border placeholder:text-muted-foreground/60 focus-visible:ring-accent'

type BenefitSwitchField =
  | 'mealVouchers'
  | 'ecoVouchers'
  | 'companyCar'
  | 'fuelCard'
  | 'bikeLease'
  | 'mobilePhone'
  | 'laptop'
  | 'fixedExpenseAllowance'
  | 'homeWorkInternetAllowance'

const benefitSwitches: {field: BenefitSwitchField; label: string}[] = [
  {field: 'mealVouchers', label: 'MC'},
  {field: 'ecoVouchers', label: 'Eco'},
  {field: 'companyCar', label: 'Company Car'},
  {field: 'fuelCard', label: 'Fuel Card'},
  {field: 'bikeLease', label: 'Bike Lease'},
  {field: 'mobilePhone', label: 'GSM'},
  {field: 'laptop', label: 'Laptop'},
  {field: 'fixedExpenseAllowance', label: 'Fixed Expense Allowance'},
  {field: 'homeWorkInternetAllowance', label: 'Home Work Internet Allowance'},
]

const defaultEmploymentStatusOptions = ['Arbeider', 'Bediende']

const defaultContractTypeOptions = [
  'Bepaalde duur arbeider',
  'Bepaalde duur bediende',
  'Bepaalde duur duidelijk omschreven werk',
  'Onbepaalde duur bediende',
  'Onbepaalde duur arbeider',
  'Deeltijds contract',
]

function ReadOnlyField({label, value}: {label: string; value: string}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <div className="rounded-md border border-border/40 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        {value || '-'}
      </div>
    </div>
  )
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  employees,
  employmentStatusOptions,
  contractTypeOptions,
  benefitTemplateOptions,
  onSave,
  titles,
  roles,
}: EmployeeFormDialogProps) {
  const isEditing = employee !== null
  const [form, setForm] = useState<MappedEmployee>(EMPTY_EMPLOYEE)
  const [password, setPassword] = useState('')
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const photoInputRef = useRef<HTMLInputElement | null>(null)

  const availableEmploymentStatusOptions = employmentStatusOptions.length
    ? employmentStatusOptions
    : defaultEmploymentStatusOptions
  const availableContractTypeOptions = contractTypeOptions.length ? contractTypeOptions : defaultContractTypeOptions

  const passwordTooShort = password.length > 0 && password.length < 8
  const showPasswordError = passwordTouched && passwordTooShort

  useEffect(() => {
    if (open) {
      // Re-seed the form when opening or switching the edited employee.
      if (employee) {
        setForm({
          ...employee,
          startDate: employee.startDate ? employee.startDate.split('T')[0] : '',
          endDate: employee.endDate ? employee.endDate.split('T')[0] : null,
          birthDate: employee.birthDate ? employee.birthDate.split('T')[0] : null,
          idExpirationDate: employee.idExpirationDate ? employee.idExpirationDate.split('T')[0] : null,
          deletedAt: employee.deletedAt ? employee.deletedAt.split('T')[0] : null,
          roleLevelIds: employee.roleLevelIds ?? [],
        })
      } else {
        setForm({...EMPTY_EMPLOYEE})
      }
      setPassword('')
      setPasswordTouched(false)
      setSelectedPhoto(null)
      setPhotoPreview(null)
      setPhotoError(null)
    }
  }, [open, employee])

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  function update<K extends keyof MappedEmployee>(field: K, value: MappedEmployee[K]) {
    setForm(prev => ({...prev, [field]: value}))
  }

  function handlePhotoSelect(file: File | undefined) {
    setPhotoError(null)

    if (!file) return

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setPhotoError('Only JPG and PNG photos are allowed.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('The photo must be smaller than 5 MB.')
      return
    }

    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setSelectedPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function clearSelectedPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setSelectedPhoto(null)
    setPhotoPreview(null)
    setPhotoError(null)
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  async function handleSubmit() {
    if (passwordTooShort) {
      setPasswordTouched(true)
      return
    }

    setSaving(true)
    setPhotoError(null)

    try {
      await onSave({...form, id: form.id || crypto.randomUUID()}, password, selectedPhoto)
      clearSelectedPhoto()
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'The employee could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  function appendBenefitTemplate(template: string) {
    const current = form.extraLegalBenefits?.trim() ?? ''
    const lines = current
      ? current
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean)
      : []
    if (lines.includes(template)) return
    update('extraLegalBenefits', [...lines, template].join('\n'))
  }

  function getEmployeeName(id: string | null) {
    if (!id) return '-'
    const emp = employees.find(e => e.id === id)
    return emp ? `${emp.firstName} ${emp.lastName}` : '-'
  }

  function formatDateTime(date: string | null) {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEditing ? 'Edit Employee' : 'New Employee'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Editing ${employee.firstName} ${employee.lastName}`
              : 'Fill in the details to create a new employee.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={async e => {
            e.preventDefault()
            await handleSubmit()
          }}
          className="flex flex-col gap-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full bg-secondary">
              <TabsTrigger value="general" className="flex-1 data-[state=active]:bg-card">
                General
              </TabsTrigger>
              <TabsTrigger value="roles" className="flex-1 data-[state=active]:bg-card">
                Roles
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex-1 data-[state=active]:bg-card">
                Contact
              </TabsTrigger>
              <TabsTrigger value="contract" className="flex-1 data-[state=active]:bg-card">
                Contract
              </TabsTrigger>
              <TabsTrigger value="address" className="flex-1 data-[state=active]:bg-card">
                Address
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1 data-[state=active]:bg-card">
                Settings
              </TabsTrigger>
              {isEditing && (
                <TabsTrigger value="meta" className="flex-1 data-[state=active]:bg-card">
                  Meta
                </TabsTrigger>
              )}
            </TabsList>

            {/* ---- General tab ---- */}
            <TabsContent value="general" className="flex flex-col gap-4 mt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="titleId">Title</Label>
                  <Select
                    value={form.titleId ?? ''}
                    onValueChange={v => {
                      const title = titles.find(t => t.id === v)
                      update('titleId', v || null)
                      update('titleName', title?.name ?? '-')
                    }}>
                    <SelectTrigger className={inputStyles}>
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {titles.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={e => update('firstName', e.target.value)}
                    className={inputStyles}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={e => update('lastName', e.target.value)}
                    className={inputStyles}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="username">
                    Username <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={e => update('username', e.target.value)}
                    className={inputStyles}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">Password {!isEditing && <span className="text-destructive">*</span>}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value)
                      setPasswordTouched(true)
                    }}
                    onBlur={() => setPasswordTouched(true)}
                    placeholder={isEditing ? 'Leave blank to keep current' : 'Min. 8 characters'}
                    className={`${inputStyles} ${showPasswordError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    minLength={isEditing ? undefined : 8}
                    required={!isEditing}
                  />
                  {showPasswordError && (
                    <p className="text-xs text-destructive">Password must be at least 8 characters.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="birthDate">Birth Date</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={form.birthDate ?? ''}
                    onChange={e => update('birthDate', e.target.value || null)}
                    className={inputStyles}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="employeePhoto">Employee Photo</Label>
                  <div className="flex items-center gap-3">
                    {photoPreview || form.photoFileId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoPreview ?? form.photoFileId ?? ''}
                        alt={`${form.firstName} ${form.lastName}`}
                        className="h-12 w-12 rounded-full border border-border bg-secondary object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary border border-border text-xs text-muted-foreground">
                        {form.firstName && form.lastName
                          ? `${form.firstName[0]}${form.lastName[0]}`.toUpperCase()
                          : '?'}
                      </div>
                    )}
                    <input
                      ref={photoInputRef}
                      id="employeePhoto"
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={e => handlePhotoSelect(e.target.files?.[0])}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2 bg-secondary border-border text-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => photoInputRef.current?.click()}>
                      <Upload className="h-4 w-4" />
                      Upload
                    </Button>
                    {(selectedPhoto || form.photoFileId) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 border-border text-destructive hover:text-destructive"
                        onClick={() => {
                          if (selectedPhoto) {
                            clearSelectedPhoto()
                          } else {
                            update('photoFileId', null)
                          }
                        }}>
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">JPG or PNG, maximum 5 MB.</p>
                  {selectedPhoto && <p className="text-xs text-muted-foreground truncate">{selectedPhoto.name}</p>}
                  {photoError && <p className="text-xs text-destructive">{photoError}</p>}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="photoFileId">Photo File</Label>
                <div className="rounded-md border border-border/40 bg-muted/30 px-3 py-2 text-sm text-muted-foreground break-all">
                  {form.photoFileId ?? 'The file path will appear here after upload.'}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="startDate">
                    Start Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={e => update('startDate', e.target.value)}
                    className={inputStyles}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={form.endDate ?? ''}
                    onChange={e => update('endDate', e.target.value || null)}
                    className={inputStyles}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="info">Additional Info</Label>
                <Textarea
                  id="info"
                  value={form.info ?? ''}
                  onChange={e => update('info', e.target.value || null)}
                  className={`${inputStyles} min-h-20`}
                  placeholder="Notes about this employee..."
                />
              </div>
            </TabsContent>

            {/* ---- Roles tab ---- */}
            <TabsContent value="roles" className="flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-1.5 rounded-md border border-border bg-secondary p-2">
                {roles.map(r => (
                  <label key={r.id} className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={form.roleLevelIds.includes(r.id)}
                      onChange={e => {
                        const next = e.target.checked
                          ? [...form.roleLevelIds, r.id]
                          : form.roleLevelIds.filter(id => id !== r.id)
                        update('roleLevelIds', next)
                      }}
                      className="accent-accent"
                    />
                    <span className="text-sm">{r.name}</span>
                  </label>
                ))}
              </div>
            </TabsContent>

            {/* ---- Contact tab ---- */}
            <TabsContent value="contact" className="flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="mail">Email</Label>
                <Input
                  id="mail"
                  type="email"
                  value={form.mail ?? ''}
                  onChange={e => update('mail', e.target.value || null)}
                  className={inputStyles}
                  placeholder="employee@company.com"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={form.phoneNumber ?? ''}
                  onChange={e => update('phoneNumber', e.target.value || null)}
                  className={inputStyles}
                  placeholder="+32 471 123 456"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                  <Input
                    id="bankAccountNumber"
                    value={form.bankAccountNumber ?? ''}
                    onChange={e => update('bankAccountNumber', e.target.value || null)}
                    className={inputStyles}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="rrn">RRN</Label>
                  <Input
                    id="rrn"
                    value={form.rrn ?? ''}
                    onChange={e => update('rrn', e.target.value || null)}
                    className={inputStyles}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="idExpirationDate">ID Expiration Date</Label>
                  <Input
                    id="idExpirationDate"
                    type="date"
                    value={form.idExpirationDate ?? ''}
                    onChange={e => update('idExpirationDate', e.target.value || null)}
                    className={inputStyles}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="maritalStatus">Marital Status</Label>
                  <Input
                    id="maritalStatus"
                    value={form.maritalStatus ?? ''}
                    onChange={e => update('maritalStatus', e.target.value || null)}
                    className={inputStyles}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/50 p-4">
                  <Label htmlFor="driversLicense" className="text-sm font-medium">
                    Drivers License
                  </Label>
                  <Switch
                    id="driversLicense"
                    checked={form.driversLicense}
                    onCheckedChange={v => update('driversLicense', v)}
                    className="data-[state=checked]:bg-accent"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="dependents">Dependents</Label>
                  <Input
                    id="dependents"
                    type="number"
                    min={0}
                    value={form.dependents ?? ''}
                    onChange={e => update('dependents', e.target.value ? Number(e.target.value) : null)}
                    className={inputStyles}
                  />
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="flex flex-col gap-3 mt-4">
                <div className="flex items-center justify-between">
                  <Label>Emergency Contacts</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      update('emergencyContacts', [
                        ...(form.emergencyContacts ?? []),
                        {
                          id: crypto.randomUUID(),
                          name: '',
                          relationship: '',
                          mail: '',
                          phoneNumber: '',
                          employeeId: '',
                        },
                      ])
                    }>
                    + Add contact
                  </Button>
                </div>

                {(form.emergencyContacts ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No emergency contacts added.</p>
                )}

                {(form.emergencyContacts ?? []).map((contact, index) => (
                  <div key={contact.id ?? index} className="flex flex-col gap-3 p-3 border border-border rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground">Contact #{index + 1}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        placeholder="Name"
                        value={contact.name ?? ''}
                        onChange={e => {
                          const updated = [...(form.emergencyContacts ?? [])]
                          updated[index] = {...updated[index], name: e.target.value}
                          update('emergencyContacts', updated)
                        }}
                        className={inputStyles}
                      />
                      <Input
                        placeholder="Relationship"
                        value={contact.relationship ?? ''}
                        onChange={e => {
                          const updated = [...(form.emergencyContacts ?? [])]
                          updated[index] = {...updated[index], relationship: e.target.value}
                          update('emergencyContacts', updated)
                        }}
                        className={inputStyles}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
                      <Input
                        type="email"
                        placeholder="contact@email.com"
                        value={contact.mail ?? ''}
                        onChange={e => {
                          const updated = [...(form.emergencyContacts ?? [])]
                          updated[index] = {...updated[index], mail: e.target.value}
                          update('emergencyContacts', updated)
                        }}
                        className={inputStyles}
                      />
                      <Input
                        placeholder="+32 471 123 456"
                        value={contact.phoneNumber ?? ''}
                        onChange={e => {
                          const updated = [...(form.emergencyContacts ?? [])]
                          updated[index] = {...updated[index], phoneNumber: e.target.value}
                          update('emergencyContacts', updated)
                        }}
                        className={inputStyles}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() =>
                          update(
                            'emergencyContacts',
                            (form.emergencyContacts ?? []).filter((_, i) => i !== index),
                          )
                        }>
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* ---- Contract tab ---- */}
            <TabsContent value="contract" className="flex flex-col gap-4 mt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="employmentStatus">Status</Label>
                  <Input
                    id="employmentStatus"
                    list="employment-status-options"
                    value={form.employmentStatus ?? ''}
                    onChange={e => update('employmentStatus', e.target.value || null)}
                    className={inputStyles}
                    placeholder="Kies of vul zelf aan"
                  />
                  <datalist id="employment-status-options">
                    {availableEmploymentStatusOptions.map(option => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="contractType">Contract Type</Label>
                  <Input
                    id="contractType"
                    list="contract-type-options"
                    value={form.contractType ?? ''}
                    onChange={e => update('contractType', e.target.value || null)}
                    className={inputStyles}
                  />
                  <datalist id="contract-type-options">
                    {availableContractTypeOptions.map(option => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="contractDuration">Contract Duration</Label>
                  <Input
                    id="contractDuration"
                    value={form.contractDuration ?? ''}
                    onChange={e => update('contractDuration', e.target.value || null)}
                    className={inputStyles}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="grossSalary">Gross Salary</Label>
                  <Input
                    id="grossSalary"
                    value={form.grossSalary ?? ''}
                    onChange={e => update('grossSalary', e.target.value || null)}
                    className={inputStyles}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {benefitSwitches.map(({field, label}) => (
                  <div
                    key={field}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/50 p-4">
                    <Label htmlFor={field} className="text-sm font-medium">
                      {label}
                    </Label>
                    <Switch
                      id={field}
                      checked={form[field]}
                      onCheckedChange={v => update(field, v)}
                      className="data-[state=checked]:bg-accent"
                    />
                  </div>
                ))}
              </div>

              {form.companyCar && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="companyCarDescription">Company Car Description</Label>
                  <Input
                    id="companyCarDescription"
                    value={form.companyCarDescription ?? ''}
                    onChange={e => update('companyCarDescription', e.target.value || null)}
                    className={inputStyles}
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="extraLegalBenefits">Extra Legal Benefits</Label>
                <Textarea
                  id="extraLegalBenefits"
                  value={form.extraLegalBenefits ?? ''}
                  onChange={e => update('extraLegalBenefits', e.target.value || null)}
                  className={`${inputStyles} min-h-20`}
                />
                {benefitTemplateOptions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {benefitTemplateOptions.map(option => (
                      <Button
                        key={option}
                        type="button"
                        variant="outline"
                        className="h-8 border-border bg-secondary/40 text-xs"
                        onClick={() => appendBenefitTemplate(option)}>
                        {option}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ---- Address tab ---- */}
            <TabsContent value="address" className="flex flex-col gap-4 mt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="street">Street</Label>
                  <Input
                    id="street"
                    value={form.street ?? ''}
                    onChange={e => update('street', e.target.value || null)}
                    className={inputStyles}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="houseNumber">House Number</Label>
                  <Input
                    id="houseNumber"
                    value={form.houseNumber ?? ''}
                    onChange={e => update('houseNumber', e.target.value || null)}
                    className={inputStyles}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="busNumber">Bus Number</Label>
                  <Input
                    id="busNumber"
                    value={form.busNumber ?? ''}
                    onChange={e => update('busNumber', e.target.value || null)}
                    className={inputStyles}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input
                    id="zipCode"
                    value={form.zipCode ?? ''}
                    onChange={e => update('zipCode', e.target.value || null)}
                    className={inputStyles}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="place">City / Place</Label>
                  <Input
                    id="place"
                    value={form.place ?? ''}
                    onChange={e => update('place', e.target.value || null)}
                    className={inputStyles}
                  />
                </div>
              </div>
            </TabsContent>

            {/* ---- Settings tab ---- */}
            <TabsContent value="settings" className="flex flex-col gap-5 mt-4">
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/50 p-4">
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="active" className="text-sm font-medium">
                    Active
                  </Label>
                  <span className="text-xs text-muted-foreground">Whether this employee can log in</span>
                </div>
                <Switch
                  id="active"
                  checked={form.active}
                  onCheckedChange={v => update('active', v)}
                  className="data-[state=checked]:bg-accent"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/50 p-4">
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="permanentEmployee" className="text-sm font-medium">
                    Permanent Employee
                  </Label>
                  <span className="text-xs text-muted-foreground">Full-time permanent contract</span>
                </div>
                <Switch
                  id="permanentEmployee"
                  checked={form.permanentEmployee}
                  onCheckedChange={v => update('permanentEmployee', v)}
                  className="data-[state=checked]:bg-accent"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/50 p-4">
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="checkInfo" className="text-sm font-medium">
                    Check Info
                  </Label>
                  <span className="text-xs text-muted-foreground">Info has been verified</span>
                </div>
                <Switch
                  id="checkInfo"
                  checked={form.checkInfo}
                  onCheckedChange={v => update('checkInfo', v)}
                  className="data-[state=checked]:bg-accent"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/50 p-4">
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="newYearCard" className="text-sm font-medium">
                    New Year Card
                  </Label>
                  <span className="text-xs text-muted-foreground">Send a new year card to this employee</span>
                </div>
                <Switch
                  id="newYearCard"
                  checked={form.newYearCard}
                  onCheckedChange={v => update('newYearCard', v)}
                  className="data-[state=checked]:bg-accent"
                />
              </div>
            </TabsContent>

            {/* ---- Meta tab (edit only) ---- */}
            {isEditing && (
              <TabsContent value="meta" className="flex flex-col gap-4 mt-4">
                <p className="text-xs text-muted-foreground mb-2">Read-only metadata for this employee record.</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ReadOnlyField label="Employee ID" value={form.id} />
                  <ReadOnlyField label="Created At" value={formatDateTime(form.createdAt)} />
                  <ReadOnlyField label="Created By" value={getEmployeeName(form.createdBy)} />
                  <ReadOnlyField label="Password Created At" value={formatDateTime(form.passwordCreatedAt)} />
                  <ReadOnlyField label="Picture ID" value={form.pictureId ?? '-'} />
                  {form.deleted && (
                    <>
                      <ReadOnlyField label="Deleted At" value={formatDateTime(form.deletedAt)} />
                      <ReadOnlyField label="Deleted By" value={getEmployeeName(form.deletedBy)} />
                    </>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-secondary border-border text-foreground hover:bg-muted hover:text-foreground">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/80">
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
