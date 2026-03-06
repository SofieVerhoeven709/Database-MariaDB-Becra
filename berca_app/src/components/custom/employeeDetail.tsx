'use client'

import {useState, useMemo} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowLeft, Pencil, X, Save, ExternalLink, ChevronUp, ChevronDown, ChevronsUpDown} from 'lucide-react'
import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {updateEmployeeAdminAction} from '@/serverFunctions/employees'
import type {Route} from 'next'
import type {EmployeeDetailData, UnifiedRecord, RecordType} from '@/types/employee'
import {TYPE_COLOURS} from '@/types/employee'

interface SelectOption {
  id: string
  name: string
}

interface EmployeeDetailProps {
  employee: EmployeeDetailData
  currentUserRole: string
  currentUserLevel: number
  roleOptions: SelectOption[]
  titleOptions: SelectOption[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(date: string | null | undefined) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function formatDateTime(date: string | null | undefined) {
  if (!date) return '-'
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function YesNoBadge({value}: {value: boolean}) {
  return value ? (
    <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
  ) : (
    <Badge variant="secondary" className="text-muted-foreground font-medium">
      No
    </Badge>
  )
}

function RoleBadge({role}: {role: string}) {
  const map: Record<string, string> = {
    owner: 'Owner',
    executor: 'Executor',
    taskFor: 'Task For',
    manager: 'Manager',
    revisor: 'Revisor',
  }
  return (
    <Badge variant="outline" className="border-border text-muted-foreground font-normal text-xs">
      {map[role] ?? role}
    </Badge>
  )
}

const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'
const thClass = 'whitespace-nowrap text-xs'

function EmptyRow({colSpan, label}: {colSpan: number; label?: string}) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-16 text-center text-muted-foreground text-sm">
        {label ?? 'No records found.'}
      </TableCell>
    </TableRow>
  )
}

function SectionLabel({children}: {children: React.ReactNode}) {
  return <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{children}</p>
}

function TableCard({children}: {children: React.ReactNode}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
      <Table>{children}</Table>
    </div>
  )
}

// ─── Sort helpers ─────────────────────────────────────────────────────────────
type SortDir = 'asc' | 'desc'
type CreatedSortKey = 'type' | 'label' | 'detail' | 'date'
type DeletedSortKey = 'type' | 'label' | 'detail' | 'date' | 'deletedAt'

function sortRecords<K extends string>(records: UnifiedRecord[], key: K, dir: SortDir): UnifiedRecord[] {
  return [...records].sort((a, b) => {
    const av = (a as unknown as Record<string, string | null>)[key] ?? ''
    const bv = (b as unknown as Record<string, string | null>)[key] ?? ''
    const cmp = av.localeCompare(bv)
    return dir === 'asc' ? cmp : -cmp
  })
}

function SortableHead<K extends string>({
  col,
  label,
  sortKey,
  sortDir,
  onSort,
}: {
  col: K
  label: string
  sortKey: K
  sortDir: SortDir
  onSort: (col: K) => void
}) {
  const active = sortKey === col
  return (
    <TableHead
      className={`${thClass} cursor-pointer select-none hover:text-foreground transition-colors`}
      onClick={() => onSort(col)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          sortDir === 'asc' ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        ) : (
          <ChevronsUpDown className="h-3 w-3 text-muted-foreground/40" />
        )}
      </span>
    </TableHead>
  )
}

function TypeBadge({type}: {type: RecordType}) {
  return <Badge className={`border text-xs font-medium ${TYPE_COLOURS[type]}`}>{type}</Badge>
}

// ─── Unified sortable Created table ──────────────────────────────────────────
function CreatedTable({records}: {records: UnifiedRecord[]}) {
  const [sortKey, setSortKey] = useState<CreatedSortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [typeFilter, setTypeFilter] = useState<RecordType | 'all'>('all')

  const types = useMemo(
    () => ['all', ...Array.from(new Set(records.map(r => r.type))).sort()] as (RecordType | 'all')[],
    [records],
  )

  const sorted = useMemo(() => {
    const filtered = typeFilter === 'all' ? records : records.filter(r => r.type === typeFilter)
    return sortRecords(filtered, sortKey, sortDir)
  }, [records, sortKey, sortDir, typeFilter])

  function handleSort(col: CreatedSortKey) {
    if (sortKey === col) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(col)
      setSortDir('asc')
    }
  }

  const headProps = {sortKey, sortDir, onSort: handleSort}

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground">Filter by type:</p>
        <div className="flex flex-wrap gap-1.5">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors ${
                typeFilter === t
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'border-border text-muted-foreground hover:border-accent/50 hover:text-foreground'
              }`}>
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {sorted.length} record{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      <TableCard>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/60">
            <SortableHead col="type" label="Type" {...headProps} />
            <SortableHead col="label" label="Name / Number" {...headProps} />
            <SortableHead col="detail" label="Detail" {...headProps} />
            <SortableHead col="date" label="Date" {...headProps} />
            <TableHead className="w-10">
              <span className="sr-only">Open</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <EmptyRow colSpan={5} label="No records created." />
          ) : (
            sorted.map(r => (
              <TableRow key={`${r.type}-${r.id}`} className="border-border/40 hover:bg-secondary/50">
                <TableCell className="py-2">
                  <TypeBadge type={r.type} />
                </TableCell>
                <TableCell className={`${tdClass} text-foreground font-medium`}>{r.label}</TableCell>
                <TableCell className={tdClass}>{r.detail ?? '-'}</TableCell>
                <TableCell className={tdClass}>{formatDate(r.date)}</TableCell>
                <TableCell>
                  {r.href ? (
                    <Link href={r.href as Route}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-accent/10">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  ) : null}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </TableCard>
    </div>
  )
}

// ─── Unified sortable Deleted table ──────────────────────────────────────────
function DeletedTable({records}: {records: UnifiedRecord[]}) {
  const [sortKey, setSortKey] = useState<DeletedSortKey>('deletedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [typeFilter, setTypeFilter] = useState<RecordType | 'all'>('all')

  const types = useMemo(
    () => ['all', ...Array.from(new Set(records.map(r => r.type))).sort()] as (RecordType | 'all')[],
    [records],
  )

  const sorted = useMemo(() => {
    const filtered = typeFilter === 'all' ? records : records.filter(r => r.type === typeFilter)
    return sortRecords(filtered, sortKey, sortDir)
  }, [records, sortKey, sortDir, typeFilter])

  function handleSort(col: DeletedSortKey) {
    if (sortKey === col) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(col)
      setSortDir('asc')
    }
  }

  const headProps = {sortKey, sortDir, onSort: handleSort}

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground">Filter by type:</p>
        <div className="flex flex-wrap gap-1.5">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors ${
                typeFilter === t
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'border-border text-muted-foreground hover:border-accent/50 hover:text-foreground'
              }`}>
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {sorted.length} record{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      <TableCard>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/60">
            <SortableHead col="type" label="Type" {...headProps} />
            <SortableHead col="label" label="Name / Number" {...headProps} />
            <SortableHead col="detail" label="Detail" {...headProps} />
            <SortableHead col="date" label="Record Date" {...headProps} />
            <SortableHead col="deletedAt" label="Deleted At" {...headProps} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <EmptyRow colSpan={5} label="No records deleted." />
          ) : (
            sorted.map(r => (
              <TableRow key={`${r.type}-${r.id}`} className="border-border/40 hover:bg-secondary/50 opacity-75">
                <TableCell className="py-2">
                  <TypeBadge type={r.type} />
                </TableCell>
                <TableCell className={`${tdClass} text-foreground font-medium`}>{r.label}</TableCell>
                <TableCell className={tdClass}>{r.detail ?? '-'}</TableCell>
                <TableCell className={tdClass}>{formatDate(r.date)}</TableCell>
                <TableCell className={tdClass}>{formatDateTime(r.deletedAt)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </TableCard>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export function EmployeeDetail({
  employee,
  currentUserRole,
  currentUserLevel,
  roleOptions,
  titleOptions,
}: EmployeeDetailProps) {
  const router = useRouter()
  const isAdmin = currentUserLevel >= 80
  const canEdit = currentUserLevel >= 20

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const buildForm = () => ({
    firstName: employee.firstName,
    lastName: employee.lastName,
    mail: employee.mail ?? '',
    username: employee.username,
    phoneNumber: employee.phoneNumber ?? '',
    birthDate: employee.birthDate ? employee.birthDate.slice(0, 10) : '',
    startDate: employee.startDate.slice(0, 10),
    endDate: employee.endDate ? employee.endDate.slice(0, 10) : '',
    info: employee.info ?? '',
    street: employee.street ?? '',
    houseNumber: employee.houseNumber ?? '',
    busNumber: employee.busNumber ?? '',
    zipCode: employee.zipCode ?? '',
    place: employee.place ?? '',
    permanentEmployee: employee.permanentEmployee,
    checkInfo: employee.checkInfo,
    newYearCard: employee.newYearCard,
    active: employee.active,
    roleLevelId: employee.roleLevelId ?? 'none',
    titleId: employee.titleId ?? 'none',
  })

  const [form, setForm] = useState(buildForm)
  const s = <K extends keyof ReturnType<typeof buildForm>>(key: K, v: ReturnType<typeof buildForm>[K]) =>
    setForm(f => ({...f, [key]: v}))

  function handleCancel() {
    setForm(buildForm())
    setEditing(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateEmployeeAdminAction({
        id: employee.id,
        firstName: form.firstName,
        lastName: form.lastName,
        mail: form.mail || null,
        username: form.username,
        phoneNumber: form.phoneNumber || null,
        birthDate: form.birthDate ? new Date(form.birthDate) : null,
        startDate: new Date(form.startDate),
        endDate: form.endDate ? new Date(form.endDate) : null,
        info: form.info || null,
        street: form.street || null,
        houseNumber: form.houseNumber || null,
        busNumber: form.busNumber || null,
        zipCode: form.zipCode || null,
        place: form.place || null,
        permanentEmployee: form.permanentEmployee,
        checkInfo: form.checkInfo,
        newYearCard: form.newYearCard,
        active: form.active,
        roleLevelId: form.roleLevelId === 'none' ? null : form.roleLevelId,
        titleId: form.titleId === 'none' ? null : form.titleId,
        // required by upsertEmployeeSchema but not editable here
        createdAt: new Date(employee.createdAt),
        passwordCreatedAt: new Date(employee.passwordCreatedAt),
        deleted: employee.deleted,
      })
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  // ─── Reusable field renderers ──────────────────────────────────────────────
  const textRow = (label: string, val: string | null, formKey?: keyof typeof form, opts?: {type?: string}) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing && formKey ? (
        <Input
          type={opts?.type ?? 'text'}
          value={(form[formKey] as string) ?? ''}
          onChange={e => s(formKey, e.target.value as ReturnType<typeof buildForm>[typeof formKey])}
          className="bg-secondary border-border"
        />
      ) : (
        <p className="text-sm text-muted-foreground">{val || '-'}</p>
      )}
    </div>
  )

  const toggleRow = (label: string, val: boolean, formKey: keyof typeof form) => (
    <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing ? (
        <Switch
          checked={form[formKey] as boolean}
          onCheckedChange={v => s(formKey, v as ReturnType<typeof buildForm>[typeof formKey])}
        />
      ) : (
        <YesNoBadge value={val} />
      )}
    </div>
  )

  const selectRow = (label: string, val: string, formKey: keyof typeof form, options: SelectOption[]) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing ? (
        <Select
          value={(form[formKey] as string) ?? 'none'}
          onValueChange={v => s(formKey, v as ReturnType<typeof buildForm>[typeof formKey])}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="none">None</SelectItem>
            {options.map(o => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="text-sm text-muted-foreground">{val || '-'}</p>
      )}
    </div>
  )

  // ─── Tab counts ────────────────────────────────────────────────────────────
  const assignedCount =
    employee.assignedFollowUps.length +
    employee.assignedFollowUpStructures.length +
    employee.assignedDocuments.length +
    employee.participatedTimeRegistries.length

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
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
            <h1 className="text-lg font-semibold text-foreground">
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">{employee.roleName}</p>
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={handleCancel} className="gap-2 border-border">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2 bg-accent text-accent-foreground hover:bg-accent/80">
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)} variant="outline" className="gap-2 border-border">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Info card ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/60 bg-card p-6 flex flex-col gap-6">
        {/* Identity */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Identity</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {textRow('First Name', employee.firstName, 'firstName')}
            {textRow('Last Name', employee.lastName, 'lastName')}
            {textRow('Username', employee.username, 'username')}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Birth Date</Label>
              {editing ? (
                <Input
                  type="date"
                  value={form.birthDate}
                  onChange={e => s('birthDate', e.target.value)}
                  className="bg-secondary border-border"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{formatDate(employee.birthDate)}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Start Date</Label>
              {editing ? (
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={e => s('startDate', e.target.value)}
                  className="bg-secondary border-border"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{formatDate(employee.startDate)}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">End Date</Label>
              {editing ? (
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={e => s('endDate', e.target.value)}
                  className="bg-secondary border-border"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{formatDate(employee.endDate)}</p>
              )}
            </div>
            {selectRow('Role', employee.roleName, 'roleLevelId', roleOptions)}
            {selectRow('Title', employee.titleName, 'titleId', titleOptions)}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Created By</Label>
              <p className="text-sm text-muted-foreground">{employee.createdByName ?? '-'}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Created At</Label>
              <p className="text-sm text-muted-foreground">{formatDate(employee.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Contact Info</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {textRow('Email', employee.mail, 'mail', {type: 'email'})}
            {textRow('Phone', employee.phoneNumber, 'phoneNumber', {type: 'tel'})}
          </div>
        </div>

        {/* Address */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Address</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {textRow('Street', employee.street, 'street')}
            {textRow('House Number', employee.houseNumber, 'houseNumber')}
            {textRow('Bus Number', employee.busNumber, 'busNumber')}
            {textRow('Zip Code', employee.zipCode, 'zipCode')}
            {textRow('City', employee.place, 'place')}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Info</Label>
          {editing ? (
            <Textarea
              value={form.info}
              onChange={e => s('info', e.target.value)}
              rows={2}
              className="bg-secondary border-border resize-none"
            />
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{employee.info || '-'}</p>
          )}
        </div>

        {/* Flags */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Flags</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {toggleRow('Active', employee.active, 'active')}
            {toggleRow('Permanent', employee.permanentEmployee, 'permanentEmployee')}
            {toggleRow('Check Info', employee.checkInfo, 'checkInfo')}
            {toggleRow('New Year Card', employee.newYearCard, 'newYearCard')}
          </div>
        </div>

        {/* Emergency Contacts */}
        {employee.emergencyContacts.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Emergency Contacts</p>
            <div className="flex flex-col gap-2">
              {employee.emergencyContacts.map(ec => (
                <div key={ec.id} className="rounded-lg border border-border bg-secondary px-4 py-2.5">
                  <p className="text-sm text-foreground font-medium">{ec.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ec.relationship} · {ec.phoneNumber} · {ec.mail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="assigned">
        <TabsList className="bg-secondary border border-border/60 flex-wrap h-auto gap-1">
          <TabsTrigger value="assigned">
            Assigned
            <Badge variant="secondary" className="ml-2 text-xs">
              {assignedCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="created">
            Created
            <Badge variant="secondary" className="ml-2 text-xs">
              {employee.createdMainRecords.length + employee.createdOtherRecords.length}
            </Badge>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="deleted">
              Deleted
              <Badge variant="secondary" className="ml-2 text-xs">
                {employee.deletedMainRecords.length + employee.deletedOtherRecords.length}
              </Badge>
            </TabsTrigger>
          )}
        </TabsList>

        {/* ══ SECTION 1 — ASSIGNED ════════════════════════════════════════════ */}
        <TabsContent value="assigned" className="mt-3">
          <div className="flex flex-col gap-6">
            {/* Follow-ups */}
            <div>
              <SectionLabel>Follow-ups ({employee.assignedFollowUps.length})</SectionLabel>
              <TableCard>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/60">
                    <TableHead className={thClass}>Role</TableHead>
                    <TableHead className={thClass}>Type</TableHead>
                    <TableHead className={thClass}>Status</TableHead>
                    <TableHead className={thClass}>Urgency</TableHead>
                    <TableHead className={thClass}>Action Agenda</TableHead>
                    <TableHead className={thClass}>Closed Agenda</TableHead>
                    <TableHead className={thClass}>Closed</TableHead>
                    <TableHead className={thClass}>Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employee.assignedFollowUps.length === 0 ? (
                    <EmptyRow colSpan={8} label="No follow-ups assigned." />
                  ) : (
                    employee.assignedFollowUps.map(f => (
                      <TableRow key={`${f.id}-${f.role}`} className="border-border/40 hover:bg-secondary/50">
                        <TableCell>
                          <RoleBadge role={f.role} />
                        </TableCell>
                        <TableCell className={tdClass}>{f.followUpTypeName}</TableCell>
                        <TableCell className={tdClass}>{f.statusName}</TableCell>
                        <TableCell className={tdClass}>{f.urgencyTypeName}</TableCell>
                        <TableCell className={tdClass}>{formatDate(f.actionAgenda)}</TableCell>
                        <TableCell className={tdClass}>{formatDate(f.closedAgenda)}</TableCell>
                        <TableCell>
                          <YesNoBadge value={f.itemClosed} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs">
                          <p className="truncate max-w-[200px]" title={f.activityDescription ?? ''}>
                            {f.activityDescription ?? '-'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </TableCard>
            </div>

            {/* Follow-up Structures */}
            <div>
              <SectionLabel>Follow-up Structures ({employee.assignedFollowUpStructures.length})</SectionLabel>
              <TableCard>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/60">
                    <TableHead className={thClass}>Role</TableHead>
                    <TableHead className={thClass}>Item</TableHead>
                    <TableHead className={thClass}>Contact Date</TableHead>
                    <TableHead className={thClass}>Status</TableHead>
                    <TableHead className={thClass}>Urgency</TableHead>
                    <TableHead className={thClass}>Action Agenda</TableHead>
                    <TableHead className={thClass}>Closed Agenda</TableHead>
                    <TableHead className={thClass}>Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employee.assignedFollowUpStructures.length === 0 ? (
                    <EmptyRow colSpan={8} label="No follow-up structures assigned." />
                  ) : (
                    employee.assignedFollowUpStructures.map(f => (
                      <TableRow key={`${f.id}-${f.role}`} className="border-border/40 hover:bg-secondary/50">
                        <TableCell>
                          <RoleBadge role={f.role} />
                        </TableCell>
                        <TableCell className={tdClass}>{f.item ?? '-'}</TableCell>
                        <TableCell className={tdClass}>{formatDate(f.contactDate)}</TableCell>
                        <TableCell className={tdClass}>{f.statusName}</TableCell>
                        <TableCell className={tdClass}>{f.urgencyTypeName}</TableCell>
                        <TableCell className={tdClass}>{formatDate(f.actionAgenda)}</TableCell>
                        <TableCell className={tdClass}>{formatDate(f.closedAgenda)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs">
                          <p className="truncate max-w-[200px]" title={f.activityDescription ?? ''}>
                            {f.activityDescription ?? '-'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </TableCard>
            </div>

            {/* Documents */}
            <div>
              <SectionLabel>Documents — Managed / Revised ({employee.assignedDocuments.length})</SectionLabel>
              <TableCard>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/60">
                    <TableHead className={thClass}>Role</TableHead>
                    <TableHead className={thClass}>Doc Number</TableHead>
                    <TableHead className={thClass}>Description</TableHead>
                    <TableHead className={thClass}>Valid</TableHead>
                    <TableHead className={thClass}>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employee.assignedDocuments.length === 0 ? (
                    <EmptyRow colSpan={5} label="No documents assigned." />
                  ) : (
                    employee.assignedDocuments.map(d => (
                      <TableRow key={`${d.id}-${d.role}`} className="border-border/40 hover:bg-secondary/50">
                        <TableCell>
                          <RoleBadge role={d.role} />
                        </TableCell>
                        <TableCell className={`${tdClass} text-foreground font-medium`}>{d.documentNumber}</TableCell>
                        <TableCell className={tdClass}>{d.descriptionShort}</TableCell>
                        <TableCell>
                          <YesNoBadge value={d.valid} />
                        </TableCell>
                        <TableCell className={tdClass}>{formatDate(d.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </TableCard>
            </div>

            {/* Time Registry Participation */}
            <div>
              <SectionLabel>Time Registry Participation ({employee.participatedTimeRegistries.length})</SectionLabel>
              <TableCard>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/60">
                    <TableHead className={thClass}>Work Date</TableHead>
                    <TableHead className={thClass}>Work Order</TableHead>
                    <TableHead className={thClass}>Start</TableHead>
                    <TableHead className={thClass}>End</TableHead>
                    <TableHead className={thClass}>Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employee.participatedTimeRegistries.length === 0 ? (
                    <EmptyRow colSpan={5} label="No time registries participated in." />
                  ) : (
                    employee.participatedTimeRegistries.map(t => (
                      <TableRow key={t.id} className="border-border/40 hover:bg-secondary/50">
                        <TableCell className={`${tdClass} text-foreground font-medium`}>
                          {formatDate(t.workDate)}
                        </TableCell>
                        <TableCell className={tdClass}>{t.workOrderNumber ?? '-'}</TableCell>
                        <TableCell className={tdClass}>{formatDateTime(t.startTime)}</TableCell>
                        <TableCell className={tdClass}>{t.endTime ? formatDateTime(t.endTime) : '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs">
                          <p className="truncate max-w-[200px]" title={t.activityDescription ?? ''}>
                            {t.activityDescription ?? '-'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </TableCard>
            </div>
          </div>
        </TabsContent>

        {/* ══ SECTION 2 — CREATED ═════════════════════════════════════════════ */}
        <TabsContent value="created" className="mt-3">
          <Tabs defaultValue="created-main">
            <TabsList className="bg-secondary border border-border/60 mb-3">
              <TabsTrigger value="created-main">
                Main
                <Badge variant="secondary" className="ml-2 text-xs">
                  {employee.createdMainRecords.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="created-other">
                Other
                <Badge variant="secondary" className="ml-2 text-xs">
                  {employee.createdOtherRecords.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="created-main">
              <CreatedTable records={employee.createdMainRecords} />
            </TabsContent>
            <TabsContent value="created-other">
              <CreatedTable records={employee.createdOtherRecords} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ══ SECTION 3 — DELETED (admin only) ═══════════════════════════════ */}
        {isAdmin && (
          <TabsContent value="deleted" className="mt-3">
            <Tabs defaultValue="deleted-main">
              <TabsList className="bg-secondary border border-border/60 mb-3">
                <TabsTrigger value="deleted-main">
                  Main
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {employee.deletedMainRecords.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="deleted-other">
                  Other
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {employee.deletedOtherRecords.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="deleted-main">
                <DeletedTable records={employee.deletedMainRecords} />
              </TabsContent>
              <TabsContent value="deleted-other">
                <DeletedTable records={employee.deletedOtherRecords} />
              </TabsContent>
            </Tabs>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
