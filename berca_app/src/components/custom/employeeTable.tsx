'use client'

import {useEffect, useState} from 'react'
import {Search, Plus, Pencil, ChevronDown, ChevronUp, Trash2, ExternalLink} from 'lucide-react'
import {EmployeeFormDialog} from '@/components/custom/employeeFormDialog'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Badge} from '@/components/ui/badge'
import Link from 'next/link'
import type {Route} from 'next'
import type {ManagedEmployeeOption, MappedEmployee} from '@/types/employee'
import {
  createEmployeeBenefitOptionAction,
  createEmployeeAction,
  createEmployeeContractStatusOptionAction,
  createEmployeeContractTypeOptionAction,
  hardDeleteEmployeeBenefitOptionAction,
  hardDeleteEmployeeContractStatusOptionAction,
  hardDeleteEmployeeContractTypeOptionAction,
  hardDeleteEmployeeAction,
  restoreEmployeeBenefitOptionAction,
  restoreEmployeeContractStatusOptionAction,
  restoreEmployeeContractTypeOptionAction,
  softDeleteEmployeeBenefitOptionAction,
  softDeleteEmployeeContractStatusOptionAction,
  softDeleteEmployeeContractTypeOptionAction,
  softDeleteEmployeeAction,
  updateEmployeeBenefitOptionAction,
  updateEmployeeAdminAction,
  updateEmployeeContractStatusOptionAction,
  updateEmployeeContractTypeOptionAction,
} from '@/serverFunctions/employees'
import {useRouter} from 'next/navigation'

type SortField =
  | 'name'
  | 'username'
  | 'role'
  | 'title'
  | 'mail'
  | 'phoneNumber'
  | 'birthDate'
  | 'startDate'
  | 'endDate'
  | 'info'
  | 'street'
  | 'houseNumber'
  | 'busNumber'
  | 'zipCode'
  | 'place'
  | 'permanentEmployee'
  | 'checkInfo'
  | 'newYearCard'
  | 'active'
  | 'createdAt'
  | 'createdBy'
  | 'passwordCreatedAt'
  | 'pictureId'
  | 'deleted'
type SortDir = 'asc' | 'desc'
type FilterStatus = 'all' | 'active' | 'inactive'
type FilterDeleted = 'not-deleted' | 'deleted' | 'all'

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function boolLabel(val: boolean) {
  return val ? 'Yes' : 'No'
}

function SortIcon({field, sortField, sortDir}: {field: SortField; sortField: SortField; sortDir: SortDir}) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? (
    <ChevronUp className="inline h-3.5 w-3.5 ml-1" />
  ) : (
    <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
  )
}

interface EmployeeOption {
  id: string
  name: string
}

interface EmployeeTableProps {
  initialEmployees: MappedEmployee[]
  initialContractStatusOptions: ManagedEmployeeOption[]
  initialContractTypeOptions: ManagedEmployeeOption[]
  initialBenefitOptions: ManagedEmployeeOption[]
  roleOptions: EmployeeOption[]
  titleOptions: EmployeeOption[]
  currentUserRole: string
  currentUserLevel: number
  departmentId: string
}

export function EmployeeTable({
  initialEmployees,
  initialContractStatusOptions,
  initialContractTypeOptions,
  initialBenefitOptions,
  roleOptions,
  titleOptions,
  currentUserRole,
  currentUserLevel,
  departmentId,
}: EmployeeTableProps) {
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canEdit = currentUserLevel >= 40
  const canCreate = currentUserLevel >= 60
  const canDelete = currentUserLevel >= 80
  const canManageContractOptions = currentUserLevel >= 60
  const [employees, setEmployees] = useState(initialEmployees)
  const [contractStatusOptions, setContractStatusOptions] = useState(initialContractStatusOptions)
  const [contractTypeOptions, setContractTypeOptions] = useState(initialContractTypeOptions)
  const [benefitOptions, setBenefitOptions] = useState(initialBenefitOptions)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<MappedEmployee | null>(null)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const router = useRouter()

  useEffect(() => {
    // Keep local list in sync with server-provided employees.
    setEmployees(initialEmployees)
  }, [initialEmployees])

  useEffect(() => {
    setContractStatusOptions(initialContractStatusOptions)
  }, [initialContractStatusOptions])

  useEffect(() => {
    setContractTypeOptions(initialContractTypeOptions)
  }, [initialContractTypeOptions])

  useEffect(() => {
    setBenefitOptions(initialBenefitOptions)
  }, [initialBenefitOptions])

  const getEmployeeName = (id: string | null) => {
    if (!id) return '-'
    const emp = employees.find(e => e.id === id)
    return emp ? `${emp.firstName} ${emp.lastName}` : '-'
  }

  // Apply status/deleted filters and search before sorting.
  const filtered = employees
    .filter(emp => {
      if (filterStatus === 'active' && !emp.active) return false
      if (filterStatus === 'inactive' && emp.active) return false
      if (filterDeleted === 'not-deleted' && emp.deleted) return false
      if (filterDeleted === 'deleted' && !emp.deleted) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        emp.firstName.toLowerCase().includes(q) ||
        emp.lastName.toLowerCase().includes(q) ||
        emp.username.toLowerCase().includes(q) ||
        (emp.mail?.toLowerCase().includes(q) ?? false) ||
        (emp.phoneNumber?.toLowerCase().includes(q) ?? false) ||
        (emp.street?.toLowerCase().includes(q) ?? false) ||
        (emp.place?.toLowerCase().includes(q) ?? false)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const cmpStr = (x: string | null, y: string | null) => dir * (x ?? '').localeCompare(y ?? '')
      const cmpBool = (x: boolean, y: boolean) => dir * (Number(x) - Number(y))
      switch (sortField) {
        case 'name':
          return dir * (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName)
        case 'username':
          return cmpStr(a.username, b.username)
        case 'role':
          return cmpStr(a.roleName, b.roleName)
        case 'title':
          return cmpStr(a.titleName, b.titleName)
        case 'mail':
          return cmpStr(a.mail, b.mail)
        case 'phoneNumber':
          return cmpStr(a.phoneNumber, b.phoneNumber)
        case 'birthDate':
          return cmpStr(a.birthDate, b.birthDate)
        case 'startDate':
          return cmpStr(a.startDate, b.startDate)
        case 'endDate':
          return cmpStr(a.endDate, b.endDate)
        case 'info':
          return cmpStr(a.info, b.info)
        case 'street':
          return cmpStr(a.street, b.street)
        case 'houseNumber':
          return cmpStr(a.houseNumber, b.houseNumber)
        case 'busNumber':
          return cmpStr(a.busNumber, b.busNumber)
        case 'zipCode':
          return cmpStr(a.zipCode, b.zipCode)
        case 'place':
          return cmpStr(a.place, b.place)
        case 'permanentEmployee':
          return cmpBool(a.permanentEmployee, b.permanentEmployee)
        case 'checkInfo':
          return cmpBool(a.checkInfo, b.checkInfo)
        case 'newYearCard':
          return cmpBool(a.newYearCard, b.newYearCard)
        case 'active':
          return cmpBool(a.active, b.active)
        case 'createdAt':
          return cmpStr(a.createdAt, b.createdAt)
        case 'createdBy':
          return cmpStr(getEmployeeName(a.createdBy), getEmployeeName(b.createdBy))
        case 'passwordCreatedAt':
          return cmpStr(a.passwordCreatedAt, b.passwordCreatedAt)
        case 'pictureId':
          return cmpStr(a.pictureId, b.pictureId)
        case 'deleted':
          return cmpBool(a.deleted, b.deleted)
        default:
          return 0
      }
    })

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  function handleCreate() {
    setEditingEmployee(null)
    setDialogOpen(true)
  }

  function handleEdit(emp: MappedEmployee) {
    setEditingEmployee(emp)
    setDialogOpen(true)
  }

  async function uploadEmployeePhoto(employeeId: string, photo: File) {
    const uploadData = new FormData()
    uploadData.append('photo', photo)

    const response = await fetch(`/api/employees/${employeeId}/photo`, {
      method: 'POST',
      body: uploadData,
    })
    const result = (await response.json()) as {photoFileId?: string; error?: string}

    if (!response.ok || !result.photoFileId) {
      throw new Error(result.error ?? 'The employee photo could not be uploaded.')
    }

    return result.photoFileId
  }

  async function handleSave(emp: MappedEmployee, password: string, photo?: File | null) {
    // Convert UI strings to the schema's expected Date types and omit UI-only fields.
    const payload = {
      ...emp,
      password_hash: password || undefined,
      startDate: new Date(emp.startDate),
      createdAt: new Date(emp.createdAt),
      passwordCreatedAt: new Date(emp.passwordCreatedAt),
      birthDate: emp.birthDate ? new Date(emp.birthDate) : null,
      endDate: emp.endDate ? new Date(emp.endDate) : null,
      idExpirationDate: emp.idExpirationDate ? new Date(emp.idExpirationDate) : null,
      deletedAt: emp.deletedAt ? new Date(emp.deletedAt) : null,
      // strip UI-only fields the schema doesn't know about
      roleName: undefined,
      titleName: undefined,
      createdBy: undefined,
      deletedBy: undefined,
    }

    if (editingEmployee) {
      await updateEmployeeAdminAction(payload)
      const photoFileId = photo ? await uploadEmployeePhoto(emp.id, photo) : emp.photoFileId
      setEmployees(prev => prev.map(e => (e.id === emp.id ? {...emp, photoFileId} : e)))
    } else {
      await createEmployeeAction(payload)
      const photoFileId = photo ? await uploadEmployeePhoto(emp.id, photo) : emp.photoFileId
      setEmployees(prev => [...prev, {...emp, photoFileId}])
      router.refresh()
    }

    setDialogOpen(false)
  }

  async function handleSoftDelete(emp: MappedEmployee) {
    await softDeleteEmployeeAction({id: emp.id})
    setEmployees(prev =>
      prev.map(e => (e.id === emp.id ? {...e, deleted: true, deletedAt: new Date().toISOString()} : e)),
    )
  }

  async function handleHardDelete(emp: MappedEmployee) {
    await hardDeleteEmployeeAction({id: emp.id})
    setEmployees(prev => prev.filter(e => e.id !== emp.id))
  }

  const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
  const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

  const totalCols = filterDeleted !== 'not-deleted' ? 12 : 9
  const employmentStatusOptionNames = contractStatusOptions.flatMap(option =>
    !option.deleted && option.name ? [option.name] : [],
  )
  const contractTypeOptionNames = contractTypeOptions.flatMap(option =>
    !option.deleted && option.name ? [option.name] : [],
  )
  const benefitTemplateNames = benefitOptions.flatMap(option => (!option.deleted && option.name ? [option.name] : []))

  return (
    <Tabs defaultValue="employees" className="flex flex-col gap-6">
      <TabsList className="w-full justify-start overflow-x-auto bg-secondary/60">
        <TabsTrigger value="employees">Employees</TabsTrigger>
        {canManageContractOptions && <TabsTrigger value="contract-status">Contract Status</TabsTrigger>}
        {canManageContractOptions && <TabsTrigger value="contract-types">Contract Types</TabsTrigger>}
        {canManageContractOptions && <TabsTrigger value="benefit-templates">Benefit Templates</TabsTrigger>}
      </TabsList>

      <TabsContent value="employees" className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, username, email, phone, street, place..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 bg-secondary border-border placeholder:text-muted-foreground/60 focus-visible:ring-accent"
              />
            </div>
            <Select value={filterStatus} onValueChange={v => setFilterStatus(v as FilterStatus)}>
              <SelectTrigger className="w-32.5 bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterDeleted} onValueChange={v => setFilterDeleted(v as FilterDeleted)}>
              <SelectTrigger className="w-37.5 bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="not-deleted">Not Deleted</SelectItem>
                <SelectItem value="deleted">Deleted Only</SelectItem>
                <SelectItem value="all">Show All</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {canCreate && (
            <Button onClick={handleCreate} className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
              <Plus className="h-4 w-4" />
              New Employee
            </Button>
          )}
        </div>

        <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/60">
                <TableHead className={thClass} onClick={() => toggleSort('title')}>
                  Title <SortIcon field="title" sortField={sortField} sortDir={sortDir} />
                </TableHead>
                <TableHead className={thClass} onClick={() => toggleSort('name')}>
                  First Name <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                </TableHead>
                <TableHead className={thClass} onClick={() => toggleSort('name')}>
                  Last Name
                </TableHead>
                <TableHead className={thClass} onClick={() => toggleSort('username')}>
                  Username <SortIcon field="username" sortField={sortField} sortDir={sortDir} />
                </TableHead>
                <TableHead className={thClass} onClick={() => toggleSort('mail')}>
                  Email <SortIcon field="mail" sortField={sortField} sortDir={sortDir} />
                </TableHead>
                <TableHead className={thClass} onClick={() => toggleSort('permanentEmployee')}>
                  Permanent <SortIcon field="permanentEmployee" sortField={sortField} sortDir={sortDir} />
                </TableHead>
                <TableHead className={thClass} onClick={() => toggleSort('active')}>
                  Active <SortIcon field="active" sortField={sortField} sortDir={sortDir} />
                </TableHead>
                <TableHead className={thClass} onClick={() => toggleSort('createdBy')}>
                  Created By <SortIcon field="createdBy" sortField={sortField} sortDir={sortDir} />
                </TableHead>
                {filterDeleted !== 'not-deleted' && (
                  <>
                    <TableHead className={thClass} onClick={() => toggleSort('deleted')}>
                      Deleted <SortIcon field="deleted" sortField={sortField} sortDir={sortDir} />
                    </TableHead>
                    <TableHead className={thClass}>Deleted At</TableHead>
                    <TableHead className={thClass}>Deleted By</TableHead>
                  </>
                )}
                <TableHead className="w-24">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={totalCols} className="h-32 text-center text-muted-foreground">
                    No employees found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(emp => (
                  <TableRow
                    key={emp.id}
                    className={`border-border/40 hover:bg-secondary/50 ${emp.deleted ? 'opacity-50' : ''}`}>
                    <TableCell className={tdClass}>{emp.titleName}</TableCell>
                    <TableCell className={`${tdClass} text-foreground font-medium`}>{emp.firstName}</TableCell>
                    <TableCell className={`${tdClass} text-foreground font-medium`}>{emp.lastName}</TableCell>
                    <TableCell className={tdClass}>{emp.username}</TableCell>
                    <TableCell className={tdClass}>{emp.mail ?? '-'}</TableCell>
                    <TableCell>
                      {emp.permanentEmployee ? (
                        <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-muted-foreground font-medium">
                          No
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {emp.active ? (
                        <Badge className="bg-accent/15 text-accent border-0 font-medium">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-muted-foreground font-medium">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className={tdClass}>{getEmployeeName(emp.createdBy)}</TableCell>
                    {filterDeleted !== 'not-deleted' && (
                      <>
                        <TableCell>
                          {emp.deleted ? (
                            <Badge variant="destructive" className="font-medium">
                              Yes
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">No</span>
                          )}
                        </TableCell>
                        <TableCell className={tdClass}>{formatDate(emp.deletedAt)}</TableCell>
                        <TableCell className={tdClass}>{getEmployeeName(emp.deletedBy)}</TableCell>
                      </>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/departments/${departmentId}/records/${emp.id}` as Route}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10">
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span className="sr-only">
                              View {emp.firstName} {emp.lastName}
                            </span>
                          </Button>
                        </Link>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                            onClick={() => handleEdit(emp)}>
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">
                              Edit {emp.firstName} {emp.lastName}
                            </span>
                          </Button>
                        )}
                        {!emp.deleted && canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleSoftDelete(emp)}>
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">
                              Delete {emp.firstName} {emp.lastName}
                            </span>
                          </Button>
                        )}
                        {emp.deleted && isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleHardDelete(emp)}>
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">
                              Permanently delete {emp.firstName} {emp.lastName}
                            </span>
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

        <div className="text-xs text-muted-foreground">
          Showing {filtered.length} of {employees.length} employees
        </div>

        <EmployeeFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          employee={editingEmployee}
          employees={employees}
          employmentStatusOptions={employmentStatusOptionNames}
          contractTypeOptions={contractTypeOptionNames}
          benefitTemplateOptions={benefitTemplateNames}
          titles={titleOptions}
          roles={roleOptions}
          onSave={handleSave}
        />
      </TabsContent>

      {canManageContractOptions && (
        <TabsContent value="contract-status">
          <SimpleOptionTab
            title="Contract Status"
            items={contractStatusOptions}
            isAdmin={isAdmin}
            canEdit={canManageContractOptions}
            canCreate={canManageContractOptions}
            canDelete={canDelete}
            onCreate={async name => {
              await createEmployeeContractStatusOptionAction({name})
              router.refresh()
            }}
            onUpdate={async (id, name) => {
              await updateEmployeeContractStatusOptionAction({id, name})
              setContractStatusOptions(prev => prev.map(item => (item.id === id ? {...item, name} : item)))
            }}
            onSoftDelete={async id => {
              await softDeleteEmployeeContractStatusOptionAction({id})
              setContractStatusOptions(prev =>
                prev.map(item =>
                  item.id === id
                    ? {...item, deleted: true, deletedAt: new Date().toISOString(), deletedByName: 'You'}
                    : item,
                ),
              )
            }}
            onHardDelete={async id => {
              await hardDeleteEmployeeContractStatusOptionAction({id})
              setContractStatusOptions(prev => prev.filter(item => item.id !== id))
            }}
            onRestore={async id => {
              await restoreEmployeeContractStatusOptionAction({id})
              setContractStatusOptions(prev =>
                prev.map(item =>
                  item.id === id ? {...item, deleted: false, deletedAt: null, deletedByName: null} : item,
                ),
              )
            }}
          />
        </TabsContent>
      )}

      {canManageContractOptions && (
        <TabsContent value="contract-types">
          <SimpleOptionTab
            title="Contract Type"
            items={contractTypeOptions}
            isAdmin={isAdmin}
            canEdit={canManageContractOptions}
            canCreate={canManageContractOptions}
            canDelete={canDelete}
            onCreate={async name => {
              await createEmployeeContractTypeOptionAction({name})
              router.refresh()
            }}
            onUpdate={async (id, name) => {
              await updateEmployeeContractTypeOptionAction({id, name})
              setContractTypeOptions(prev => prev.map(item => (item.id === id ? {...item, name} : item)))
            }}
            onSoftDelete={async id => {
              await softDeleteEmployeeContractTypeOptionAction({id})
              setContractTypeOptions(prev =>
                prev.map(item =>
                  item.id === id
                    ? {...item, deleted: true, deletedAt: new Date().toISOString(), deletedByName: 'You'}
                    : item,
                ),
              )
            }}
            onHardDelete={async id => {
              await hardDeleteEmployeeContractTypeOptionAction({id})
              setContractTypeOptions(prev => prev.filter(item => item.id !== id))
            }}
            onRestore={async id => {
              await restoreEmployeeContractTypeOptionAction({id})
              setContractTypeOptions(prev =>
                prev.map(item =>
                  item.id === id ? {...item, deleted: false, deletedAt: null, deletedByName: null} : item,
                ),
              )
            }}
          />
        </TabsContent>
      )}

      {canManageContractOptions && (
        <TabsContent value="benefit-templates">
          <SimpleOptionTab
            title="Benefit Template"
            items={benefitOptions}
            isAdmin={isAdmin}
            canEdit={canManageContractOptions}
            canCreate={canManageContractOptions}
            canDelete={canDelete}
            onCreate={async name => {
              await createEmployeeBenefitOptionAction({name})
              router.refresh()
            }}
            onUpdate={async (id, name) => {
              await updateEmployeeBenefitOptionAction({id, name})
              setBenefitOptions(prev => prev.map(item => (item.id === id ? {...item, name} : item)))
            }}
            onSoftDelete={async id => {
              await softDeleteEmployeeBenefitOptionAction({id})
              setBenefitOptions(prev =>
                prev.map(item =>
                  item.id === id
                    ? {...item, deleted: true, deletedAt: new Date().toISOString(), deletedByName: 'You'}
                    : item,
                ),
              )
            }}
            onHardDelete={async id => {
              await hardDeleteEmployeeBenefitOptionAction({id})
              setBenefitOptions(prev => prev.filter(item => item.id !== id))
            }}
            onRestore={async id => {
              await restoreEmployeeBenefitOptionAction({id})
              setBenefitOptions(prev =>
                prev.map(item =>
                  item.id === id ? {...item, deleted: false, deletedAt: null, deletedByName: null} : item,
                ),
              )
            }}
          />
        </TabsContent>
      )}
    </Tabs>
  )
}

function SimpleOptionTab({
  title,
  items,
  isAdmin,
  canEdit,
  canCreate,
  canDelete,
  onCreate,
  onUpdate,
  onSoftDelete,
  onHardDelete,
  onRestore,
}: {
  title: string
  items: ManagedEmployeeOption[]
  isAdmin: boolean
  canEdit: boolean
  canCreate: boolean
  canDelete: boolean
  onCreate: (name: string | null) => Promise<void>
  onUpdate: (id: string, name: string | null) => Promise<void>
  onSoftDelete: (id: string) => Promise<void>
  onHardDelete: (id: string) => Promise<void>
  onRestore: (id: string) => Promise<void>
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ManagedEmployeeOption | null>(null)
  const [formName, setFormName] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')

  function openCreate() {
    setEditingItem(null)
    setFormName('')
    setDialogOpen(true)
  }

  function openEdit(item: ManagedEmployeeOption) {
    setEditingItem(item)
    setFormName(item.name ?? '')
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editingItem) await onUpdate(editingItem.id, formName.trim() || null)
      else await onCreate(formName.trim() || null)
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const visible = items.filter(item =>
    filterDeleted === 'all' ? true : filterDeleted === 'deleted' ? item.deleted : !item.deleted,
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Select value={filterDeleted} onValueChange={v => setFilterDeleted(v as FilterDeleted)}>
          <SelectTrigger className="w-37.5 bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="not-deleted">Not Deleted</SelectItem>
            <SelectItem value="deleted">Deleted Only</SelectItem>
            <SelectItem value="all">Show All</SelectItem>
          </SelectContent>
        </Select>
        {canCreate && (
          <Button onClick={openCreate} className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
            <Plus className="h-4 w-4" /> New {title}
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Created By</TableHead>
              <TableHead className="text-xs">Created At</TableHead>
              {filterDeleted !== 'not-deleted' && (
                <>
                  <TableHead className="text-xs">Deleted At</TableHead>
                  <TableHead className="text-xs">Deleted By</TableHead>
                </>
              )}
              <TableHead className="w-24">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={filterDeleted === 'not-deleted' ? 4 : 6}
                  className="h-20 text-center text-muted-foreground">
                  No {title.toLowerCase()} entries found.
                </TableCell>
              </TableRow>
            ) : (
              visible.map(item => (
                <TableRow
                  key={item.id}
                  className={`border-border/40 hover:bg-secondary/50 ${item.deleted ? 'opacity-50' : ''}`}>
                  <TableCell className="text-sm text-foreground font-medium">
                    {item.name ?? <span className="italic text-muted-foreground">Unnamed</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {item.createdByName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(item.createdAt)}
                  </TableCell>
                  {filterDeleted !== 'not-deleted' && (
                    <>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(item.deletedAt)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {item.deletedByName ?? '-'}
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {!item.deleted && canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          onClick={() => openEdit(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {!item.deleted && canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onSoftDelete(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {item.deleted && canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          onClick={() => onRestore(item.id)}>
                          Restore
                        </Button>
                      )}
                      {item.deleted && isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => onHardDelete(item.id)}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingItem ? `Edit ${title}` : `New ${title}`}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Name</Label>
              <Input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Enter name..."
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-accent text-accent-foreground hover:bg-accent/80">
              {saving ? 'Saving...' : editingItem ? 'Save Changes' : `Create ${title}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
