'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/ui/dialog'

import {Textarea} from '@/components/ui/textarea'

import {Switch} from '@/components/ui/switch'

import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import type {MappedEmployee} from '@/types/employee'

interface EmployeeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: MappedEmployee | null
  employees: MappedEmployee[]
  roles: {id: string; name: string}[]
  titles: {id: string; name: string}[]
  onSave: (employee: MappedEmployee, password: string) => void
}

export const EMPTY_EMPLOYEE: MappedEmployee = {
  id: crypto.randomUUID(),
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
  deleted: false,
  deletedAt: null,
  deletedBy: null,
  roleLevelId: null,
  titleId: null,
  roleName: '-',
  titleName: '-',
  emergencyContacts: [],
}

const inputStyles = 'bg-secondary border-border placeholder:text-muted-foreground/60 focus-visible:ring-accent'

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
  onSave,
  titles,
  roles,
}: EmployeeFormDialogProps) {
  const isEditing = employee !== null
  const [form, setForm] = useState<MappedEmployee>(EMPTY_EMPLOYEE)
  const [password, setPassword] = useState('')
  const [passwordTouched, setPasswordTouched] = useState(false)

  const passwordTooShort = password.length > 0 && password.length < 8
  const showPasswordError = passwordTouched && passwordTooShort

  useEffect(() => {
    if (open) {
      if (employee) {
        setForm({
          ...employee,
          startDate: employee.startDate ? employee.startDate.split('T')[0] : '',
          endDate: employee.endDate ? employee.endDate.split('T')[0] : null,
          birthDate: employee.birthDate ? employee.birthDate.split('T')[0] : null,
          deletedAt: employee.deletedAt ? employee.deletedAt.split('T')[0] : null,
        })
      } else {
        setForm({...EMPTY_EMPLOYEE, id: `e-${Date.now()}`})
      }
      setPassword('')
      setPasswordTouched(false)
    }
  }, [open, employee])

  function update<K extends keyof MappedEmployee>(field: K, value: MappedEmployee[K]) {
    setForm(prev => ({...prev, [field]: value}))
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
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEditing ? 'Edit Employee' : 'New Employee'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Editing ${employee.firstName} ${employee.lastName}`
              : 'Fill in the details to create a new employee.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={e => {
            e.preventDefault()
            // Block submit if password is set but too short
            if (passwordTooShort) {
              setPasswordTouched(true)
              return
            }
            onSave(form, password)
          }}
          className="flex flex-col gap-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full bg-secondary">
              <TabsTrigger value="general" className="flex-1 data-[state=active]:bg-card">
                General
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex-1 data-[state=active]:bg-card">
                Contact
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
                <div className="flex flex-col gap-2">
                  <Label htmlFor="roleLevelId">Role</Label>
                  <Select
                    value={form.roleLevelId ?? ''}
                    onValueChange={v => {
                      const role = roles.find(r => r.id === v)
                      update('roleLevelId', v || null)
                      update('roleName', role?.name ?? '-')
                    }}>
                    <SelectTrigger className={inputStyles}>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {roles.map(r => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
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
                  <Label htmlFor="pictureId">Profile Picture</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary border border-border text-xs text-muted-foreground">
                      {form.firstName && form.lastName ? `${form.firstName[0]}${form.lastName[0]}`.toUpperCase() : '?'}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-secondary border-border text-foreground hover:bg-muted hover:text-foreground">
                      Upload
                    </Button>
                    {form.pictureId && (
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">{form.pictureId}</span>
                    )}
                  </div>
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
            <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/80">
              {isEditing ? 'Save Changes' : 'Create Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
