'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowLeft, Pencil, X, Save} from 'lucide-react'
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
import {updateProjectAction} from '@/serverFunctions/projects'
import type {Route} from 'next'
import type {ProjectDetailData} from '@/extra/projectDetails'

interface Option {
  id: string
  name: string
}

interface EmployeeOption {
  id: string
  firstName: string
  lastName: string
}

interface ProjectDetailProps {
  project: ProjectDetailData
  projectTypes: Option[]
  companies: Option[]
  employees: EmployeeOption[]
  currentUserRole: string
  currentUserLevel: number
}

function formatDate(date: Date | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function toInputDate(date: Date | null) {
  if (!date) return ''
  return new Date(date).toISOString().slice(0, 10)
}

const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'
const thClass = 'whitespace-nowrap text-xs'

export function ProjectDetail({
  project,
  projectTypes,
  companies,
  employees,
  currentUserRole,
  currentUserLevel,
}: ProjectDetailProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const getEmployeeName = (id: string | null) => {
    if (!id) return '-'
    const emp = employees.find(e => e.id === id)
    return emp ? `${emp.firstName} ${emp.lastName}` : '-'
  }

  // Form state mirrors editable project fields
  const [form, setForm] = useState({
    projectNumber: project.projectNumber,
    description: project.description ?? '',
    extraInfo: project.extraInfo ?? '',
    companyId: project.companyId,
    projectTypeId: project.projectTypeId,
    startDate: toInputDate(project.startDate),
    endDate: toInputDate(project.endDate),
    engineeringStartDate: toInputDate(project.engineeringStartDate),
    closingDate: toInputDate(project.closingDate),
    isMainProject: project.isMainProject,
    isIntern: project.isIntern,
    isOpen: project.isOpen,
    isClosed: project.isClosed,
  })

  function handleCancel() {
    setForm({
      projectNumber: project.projectNumber,
      description: project.description ?? '',
      extraInfo: project.extraInfo ?? '',
      companyId: project.companyId,
      projectTypeId: project.projectTypeId,
      startDate: toInputDate(project.startDate),
      endDate: toInputDate(project.endDate),
      engineeringStartDate: toInputDate(project.engineeringStartDate),
      closingDate: toInputDate(project.closingDate),
      isMainProject: project.isMainProject,
      isIntern: project.isIntern,
      isOpen: project.isOpen,
      isClosed: project.isClosed,
    })
    setEditing(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateProjectAction({
        id: project.id,
        projectNumber: form.projectNumber,
        description: form.description || null,
        extraInfo: form.extraInfo || null,
        companyId: form.companyId,
        projectTypeId: form.projectTypeId,
        startDate: form.startDate ? new Date(form.startDate) : null,
        endDate: form.endDate ? new Date(form.endDate) : null,
        engineeringStartDate: form.engineeringStartDate ? new Date(form.engineeringStartDate) : null,
        closingDate: form.closingDate ? new Date(form.closingDate) : null,
        isMainProject: form.isMainProject,
        isIntern: form.isIntern,
        isOpen: form.isOpen,
        isClosed: form.isClosed,
        createdAt: project.createdAt,
        createdBy: project.createdBy,
        parentProjectId: project.parentProjectId,
        deleted: project.deleted,
        deletedAt: project.deletedAt,
        deletedBy: project.deletedBy,
      })
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={'/departments/project/project' as Route}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{project.projectNumber}</h1>
            <p className="text-sm text-muted-foreground">
              {project.Company.name} · {project.ProjectType.name}
            </p>
          </div>
        </div>
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
      </div>

      {/* Project info */}
      <div className="rounded-xl border border-border/60 bg-card p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Project Number */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Project Number</Label>
            {editing ? (
              <Input
                value={form.projectNumber}
                onChange={e => setForm(f => ({...f, projectNumber: e.target.value}))}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-foreground font-medium">{project.projectNumber}</p>
            )}
          </div>

          {/* Company */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Company</Label>
            {editing ? (
              <Select value={form.companyId} onValueChange={v => setForm(f => ({...f, companyId: v}))}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">{project.Company.name}</p>
            )}
          </div>

          {/* Project Type */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Project Type</Label>
            {editing ? (
              <Select value={form.projectTypeId} onValueChange={v => setForm(f => ({...f, projectTypeId: v}))}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {projectTypes.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline" className="w-fit border-border text-muted-foreground font-normal">
                {project.ProjectType.name}
              </Badge>
            )}
          </div>

          {/* Parent Project */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Parent Project</Label>
            <p className="text-sm text-muted-foreground">{project.Project?.projectNumber ?? '-'}</p>
          </div>

          {/* Start Date */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Start Date</Label>
            {editing ? (
              <Input
                type="date"
                value={form.startDate}
                onChange={e => setForm(f => ({...f, startDate: e.target.value}))}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{formatDate(project.startDate)}</p>
            )}
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">End Date</Label>
            {editing ? (
              <Input
                type="date"
                value={form.endDate}
                onChange={e => setForm(f => ({...f, endDate: e.target.value}))}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{formatDate(project.endDate)}</p>
            )}
          </div>

          {/* Engineering Start Date */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Engineering Start</Label>
            {editing ? (
              <Input
                type="date"
                value={form.engineeringStartDate}
                onChange={e => setForm(f => ({...f, engineeringStartDate: e.target.value}))}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{formatDate(project.engineeringStartDate)}</p>
            )}
          </div>

          {/* Closing Date */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Closing Date</Label>
            {editing ? (
              <Input
                type="date"
                value={form.closingDate}
                onChange={e => setForm(f => ({...f, closingDate: e.target.value}))}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{formatDate(project.closingDate)}</p>
            )}
          </div>

          {/* Created By */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Created By</Label>
            <p className="text-sm text-muted-foreground">
              {project.Employee.firstName} {project.Employee.lastName}
            </p>
          </div>

          {/* Created At */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Created At</Label>
            <p className="text-sm text-muted-foreground">{formatDate(project.createdAt)}</p>
          </div>

          {/* Toggles */}
          <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(
              [
                {key: 'isMainProject', label: 'Main Project'},
                {key: 'isIntern', label: 'Internal'},
                {key: 'isOpen', label: 'Open'},
                {key: 'isClosed', label: 'Closed'},
              ] as const
            ).map(({key, label}) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                {editing ? (
                  <Switch checked={form[key]} onCheckedChange={v => setForm(f => ({...f, [key]: v}))} />
                ) : project[key] ? (
                  <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
                ) : (
                  <Badge variant="secondary" className="text-muted-foreground font-medium">
                    No
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
            <Label className="text-xs text-muted-foreground">Description</Label>
            {editing ? (
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({...f, description: e.target.value}))}
                rows={3}
                className="bg-secondary border-border resize-none"
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description ?? '-'}</p>
            )}
          </div>

          {/* Extra Info */}
          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
            <Label className="text-xs text-muted-foreground">Extra Info</Label>
            {editing ? (
              <Textarea
                value={form.extraInfo}
                onChange={e => setForm(f => ({...f, extraInfo: e.target.value}))}
                rows={3}
                className="bg-secondary border-border resize-none"
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.extraInfo ?? '-'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs for related data */}
      <Tabs defaultValue="contacts">
        <TabsList className="bg-secondary border border-border/60">
          <TabsTrigger value="contacts">
            Contacts
            <Badge variant="secondary" className="ml-2 text-xs">
              {project.ProjectContact.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="workorders">
            Work Orders
            <Badge variant="secondary" className="ml-2 text-xs">
              {project.WorkOrder.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="purchases">
            Purchases
            <Badge variant="secondary" className="ml-2 text-xs">
              {project.Purchase.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="materials">
            Material Tracks
            <Badge variant="secondary" className="ml-2 text-xs">
              {project.MaterialSerialTrack.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Contacts */}
        <TabsContent value="contacts">
          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className={thClass}>Name</TableHead>
                  <TableHead className={thClass}>Email</TableHead>
                  <TableHead className={thClass}>Phone</TableHead>
                  <TableHead className={thClass}>Description</TableHead>
                  <TableHead className={thClass}>Valid</TableHead>
                  <TableHead className={thClass}>Added By</TableHead>
                  <TableHead className={thClass}>Added At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.ProjectContact.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No contacts linked.
                    </TableCell>
                  </TableRow>
                ) : (
                  project.ProjectContact.map(pc => (
                    <TableRow key={pc.id} className="border-border/40 hover:bg-secondary/50">
                      <TableCell className={`${tdClass} text-foreground font-medium`}>
                        {pc.Contact ? `${pc.Contact.firstName} ${pc.Contact.lastName}` : '-'}
                      </TableCell>
                      <TableCell className={tdClass}>{pc.Contact?.mail1 ?? '-'}</TableCell>
                      <TableCell className={tdClass}>{pc.Contact?.generalPhone ?? '-'}</TableCell>
                      <TableCell className={tdClass}>
                        <span className="max-w-[200px] truncate inline-block">{pc.description ?? '-'}</span>
                      </TableCell>
                      <TableCell>
                        {pc.idValid ? (
                          <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground font-medium">
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className={tdClass}>
                        {pc.Employee_ProjectContact_createdByToEmployee.firstName}{' '}
                        {pc.Employee_ProjectContact_createdByToEmployee.lastName}
                      </TableCell>
                      <TableCell className={tdClass}>{formatDate(pc.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Work Orders */}
        <TabsContent value="workorders">
          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className={thClass}>Work Order #</TableHead>
                  <TableHead className={thClass}>Description</TableHead>
                  <TableHead className={thClass}>Start Date</TableHead>
                  <TableHead className={thClass}>End Date</TableHead>
                  <TableHead className={thClass}>Completed</TableHead>
                  <TableHead className={thClass}>Invoice Sent</TableHead>
                  <TableHead className={thClass}>Hours/Material Closed</TableHead>
                  <TableHead className={thClass}>Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.WorkOrder.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No work orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  project.WorkOrder.map(wo => (
                    <TableRow key={wo.id} className="border-border/40 hover:bg-secondary/50">
                      <TableCell className={`${tdClass} text-foreground font-medium`}>
                        {wo.workOrderNumber ?? '-'}
                      </TableCell>
                      <TableCell className={tdClass}>
                        <span className="max-w-[200px] truncate inline-block">{wo.description ?? '-'}</span>
                      </TableCell>
                      <TableCell className={tdClass}>{formatDate(wo.startDate)}</TableCell>
                      <TableCell className={tdClass}>{formatDate(wo.endDate)}</TableCell>
                      <TableCell>
                        {wo.completed ? (
                          <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground font-medium">
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {wo.invoiceSent ? (
                          <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground font-medium">
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {wo.hoursMaterialClosed ? (
                          <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground font-medium">
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className={tdClass}>
                        {wo.Employee.firstName} {wo.Employee.lastName}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Purchases */}
        <TabsContent value="purchases">
          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className={thClass}>Order #</TableHead>
                  <TableHead className={thClass}>Description</TableHead>
                  <TableHead className={thClass}>Status</TableHead>
                  <TableHead className={thClass}>Supplier</TableHead>
                  <TableHead className={thClass}>Purchase Date</TableHead>
                  <TableHead className={thClass}>Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.Purchase.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No purchases found.
                    </TableCell>
                  </TableRow>
                ) : (
                  project.Purchase.map(p => (
                    <TableRow key={p.id} className="border-border/40 hover:bg-secondary/50">
                      <TableCell className={`${tdClass} text-foreground font-medium`}>{p.orderNumber ?? '-'}</TableCell>
                      <TableCell className={tdClass}>
                        <span className="max-w-[200px] truncate inline-block">{p.shortDescription ?? '-'}</span>
                      </TableCell>
                      <TableCell>
                        {p.status && (
                          <Badge variant="outline" className="border-border text-muted-foreground font-normal">
                            {p.status}
                          </Badge>
                        )}
                        {!p.status && <span className="text-muted-foreground text-sm">-</span>}
                      </TableCell>
                      <TableCell className={tdClass}>{p.Company?.name ?? '-'}</TableCell>
                      <TableCell className={tdClass}>{formatDate(p.purchaseDate)}</TableCell>
                      <TableCell className={tdClass}>
                        {p.Employee.firstName} {p.Employee.lastName}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Material Serial Tracks */}
        <TabsContent value="materials">
          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className={thClass}>Becra Code</TableHead>
                  <TableHead className={thClass}>Description</TableHead>
                  <TableHead className={thClass}>Brand</TableHead>
                  <TableHead className={thClass}>Transaction Type</TableHead>
                  <TableHead className={thClass}>Supplier</TableHead>
                  <TableHead className={thClass}>Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.MaterialSerialTrack.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No material tracks found.
                    </TableCell>
                  </TableRow>
                ) : (
                  project.MaterialSerialTrack.map(m => (
                    <TableRow key={m.id} className="border-border/40 hover:bg-secondary/50">
                      <TableCell className={`${tdClass} text-foreground font-medium`}>{m.becraCode ?? '-'}</TableCell>
                      <TableCell className={tdClass}>
                        <span className="max-w-[200px] truncate inline-block">{m.shortDescription ?? '-'}</span>
                      </TableCell>
                      <TableCell className={tdClass}>{m.brandName ?? '-'}</TableCell>
                      <TableCell className={tdClass}>{m.transactionType ?? '-'}</TableCell>
                      <TableCell className={tdClass}>{m.Company?.name ?? '-'}</TableCell>
                      <TableCell className={tdClass}>
                        {m.Employee ? `${m.Employee.firstName} ${m.Employee.lastName}` : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
