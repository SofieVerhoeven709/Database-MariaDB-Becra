'use client'

import {useState} from 'react'
import {Search, Plus, Pencil, ChevronDown, ChevronUp, Trash2} from 'lucide-react'
import {EmployeeFormDialog} from '@/components/custom/employeeFormDialog'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import type {MappedEmployee} from '@/types/employee'

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
  roleOptions: EmployeeOption[]
  titleOptions: EmployeeOption[]
}

export function EmployeeTable({initialEmployees, roleOptions, titleOptions}: EmployeeTableProps) {
  const [employees, setEmployees] = useState<MappedEmployee[]>(initialEmployees)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<MappedEmployee | null>(null)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')

  const getEmployeeName = (id: string | null) => {
    if (!id) return '-'
    const emp = employees.find(e => e.id === id)
    return emp ? `${emp.firstName} ${emp.lastName}` : '-'
  }

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

  function handleSave(emp: MappedEmployee) {
    setEmployees(prev => {
      const exists = prev.find(e => e.id === emp.id)
      if (exists) {
        return prev.map(e => (e.id === emp.id ? emp : e))
      }
      return [...prev, emp]
    })
    setDialogOpen(false)
  }

  function handleSoftDelete(emp: MappedEmployee) {
    setEmployees(prev =>
      prev.map(e =>
        e.id === emp.id
          ? {...e, deleted: true, deletedAt: new Date().toISOString().split('T')[0], deletedBy: 'e-001'}
          : e,
      ),
    )
  }

  const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
  const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

  // Total column count for the empty state colspan
  const totalCols = filterDeleted !== 'not-deleted' ? 29 : 26

  return (
    <div className="flex flex-col gap-6">
      {/* Search + filters + create */}
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
            <SelectTrigger className="w-[130px] bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterDeleted} onValueChange={v => setFilterDeleted(v as FilterDeleted)}>
            <SelectTrigger className="w-[150px] bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="not-deleted">Not Deleted</SelectItem>
              <SelectItem value="deleted">Deleted Only</SelectItem>
              <SelectItem value="all">Show All</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreate} className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
          <Plus className="h-4 w-4" />
          New Employee
        </Button>
      </div>

      {/* Table with horizontal scroll */}
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
              <TableHead className={thClass} onClick={() => toggleSort('role')}>
                Role Level <SortIcon field="role" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('mail')}>
                Email <SortIcon field="mail" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('phoneNumber')}>
                Phone <SortIcon field="phoneNumber" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('birthDate')}>
                Birth Date <SortIcon field="birthDate" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('startDate')}>
                Start Date <SortIcon field="startDate" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('endDate')}>
                End Date <SortIcon field="endDate" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('street')}>
                Street <SortIcon field="street" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('houseNumber')}>
                House Nr <SortIcon field="houseNumber" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('busNumber')}>
                Bus Nr <SortIcon field="busNumber" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('zipCode')}>
                Zip Code <SortIcon field="zipCode" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('place')}>
                Place <SortIcon field="place" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('info')}>
                Info <SortIcon field="info" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('permanentEmployee')}>
                Permanent <SortIcon field="permanentEmployee" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('checkInfo')}>
                Check Info <SortIcon field="checkInfo" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('newYearCard')}>
                New Year Card <SortIcon field="newYearCard" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('active')}>
                Active <SortIcon field="active" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('pictureId')}>
                Picture <SortIcon field="pictureId" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('createdAt')}>
                Created At <SortIcon field="createdAt" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('createdBy')}>
                Created By <SortIcon field="createdBy" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('passwordCreatedAt')}>
                Password Created <SortIcon field="passwordCreatedAt" sortField={sortField} sortDir={sortDir} />
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
              <TableHead className="w-20">
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
                  {/* titleId */}
                  <TableCell className={tdClass}>{emp.titleId}</TableCell>
                  {/* firstName */}
                  <TableCell className={`${tdClass} text-foreground font-medium`}>{emp.firstName}</TableCell>
                  {/* lastName */}
                  <TableCell className={`${tdClass} text-foreground font-medium`}>{emp.lastName}</TableCell>
                  {/* username */}
                  <TableCell className={tdClass}>{emp.username}</TableCell>
                  {/* role subrole Name */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-border text-muted-foreground font-normal whitespace-nowrap">
                      {emp.roleName}
                    </Badge>
                  </TableCell>
                  {/* mail */}
                  <TableCell className={tdClass}>{emp.mail ?? '-'}</TableCell>
                  {/* phoneNumber */}
                  <TableCell className={tdClass}>{emp.phoneNumber ?? '-'}</TableCell>
                  {/* birthDate */}
                  <TableCell className={tdClass}>{formatDate(emp.birthDate)}</TableCell>
                  {/* startDate */}
                  <TableCell className={tdClass}>{formatDate(emp.startDate)}</TableCell>
                  {/* endDate */}
                  <TableCell className={tdClass}>{formatDate(emp.endDate)}</TableCell>
                  {/* street */}
                  <TableCell className={tdClass}>{emp.street ?? '-'}</TableCell>
                  {/* houseNumber */}
                  <TableCell className={tdClass}>{emp.houseNumber ?? '-'}</TableCell>
                  {/* busNumber */}
                  <TableCell className={tdClass}>{emp.busNumber ?? '-'}</TableCell>
                  {/* zipCode */}
                  <TableCell className={tdClass}>{emp.zipCode ?? '-'}</TableCell>
                  {/* place */}
                  <TableCell className={tdClass}>{emp.place ?? '-'}</TableCell>
                  {/* info */}
                  <TableCell className={tdClass}>
                    <span className="max-w-[200px] truncate inline-block">{emp.info ?? '-'}</span>
                  </TableCell>
                  {/* permanentEmployee */}
                  <TableCell>
                    {emp.permanentEmployee ? (
                      <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground font-medium">
                        No
                      </Badge>
                    )}
                  </TableCell>
                  {/* checkInfo */}
                  <TableCell className={tdClass}>{boolLabel(emp.checkInfo)}</TableCell>
                  {/* newYearCard */}
                  <TableCell className={tdClass}>{boolLabel(emp.newYearCard)}</TableCell>
                  {/* active */}
                  <TableCell>
                    {emp.active ? (
                      <Badge className="bg-accent/15 text-accent border-0 font-medium">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground font-medium">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  {/* pictureId */}
                  <TableCell className={`${tdClass} font-mono text-xs`}>{emp.pictureId ?? '-'}</TableCell>
                  {/* createdAt */}
                  <TableCell className={tdClass}>{formatDate(emp.createdAt)}</TableCell>
                  {/* createdBy */}
                  <TableCell className={tdClass}>{getEmployeeName(emp.createdBy)}</TableCell>
                  {/* passwordCreatedAt */}
                  <TableCell className={tdClass}>{formatDate(emp.passwordCreatedAt)}</TableCell>
                  {/* deleted columns */}
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
                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center gap-1">
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
                      {!emp.deleted && (
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
        titles={titleOptions}
        roles={roleOptions}
        onSave={handleSave}
      />
    </div>
  )
}
