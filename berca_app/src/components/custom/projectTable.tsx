'use client'

import {useState} from 'react'
import {Search, Plus, Pencil, ChevronDown, ChevronUp, Trash2} from 'lucide-react'
import {ProjectFormDialog} from '@/components/custom/projectFormDialog'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import type {MappedProject} from '@/types/project'
import {
  createProjectAction,
  hardDeleteProjectAction,
  softDeleteProjectAction,
  updateProjectAction,
} from '@/serverFunctions/projects'
import {useRouter} from 'next/navigation'

type SortField =
  | 'projectNumber'
  | 'company'
  | 'projectType'
  | 'parentProject'
  | 'startDate'
  | 'endDate'
  | 'engineeringStartDate'
  | 'closingDate'
  | 'isMainProject'
  | 'isIntern'
  | 'isOpen'
  | 'isClosed'
  | 'createdAt'
  | 'createdBy'
  | 'deleted'

type SortDir = 'asc' | 'desc'
type FilterOpen = 'all' | 'open' | 'closed'
type FilterDeleted = 'not-deleted' | 'deleted' | 'all'

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function SortIcon({field, sortField, sortDir}: {field: SortField; sortField: SortField; sortDir: SortDir}) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? (
    <ChevronUp className="inline h-3.5 w-3.5 ml-1" />
  ) : (
    <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
  )
}

interface Option {
  id: string
  name: string
}

interface ProjectTableProps {
  initialProjects: MappedProject[]
  projectTypes: Option[]
  companies: Option[]
  currentUserRole: string
  currentUserLevel: number
  employees: Option[]
}

export function ProjectTable({
  initialProjects,
  projectTypes,
  companies,
  currentUserRole,
  currentUserLevel,
  employees,
}: ProjectTableProps) {
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const projects = initialProjects

  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<MappedProject | null>(null)
  const [sortField, setSortField] = useState<SortField>('projectNumber')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [filterOpen, setFilterOpen] = useState<FilterOpen>('all')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')

  const router = useRouter()

  const getEmployeeName = (id: string | null) => {
    if (!id) return '-'
    const emp = employees.find(e => e.id === id)
    return emp ? emp.name : '-'
  }

  const getProjectLabel = (id: string | null) => {
    if (!id) return '-'
    const p = projects.find(p => p.id === id)
    return p ? p.projectNumber : '-'
  }

  const filtered = projects
    .filter(p => {
      if (filterOpen === 'open' && !p.isOpen) return false
      if (filterOpen === 'closed' && !p.isClosed) return false
      if (filterDeleted === 'not-deleted' && p.deleted) return false
      if (filterDeleted === 'deleted' && !p.deleted) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        p.projectNumber.toLowerCase().includes(q) ||
        p.companyName.toLowerCase().includes(q) ||
        p.projectTypeName.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false) ||
        (p.extraInfo?.toLowerCase().includes(q) ?? false)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const cmpStr = (x: string | null, y: string | null) => dir * (x ?? '').localeCompare(y ?? '')
      const cmpBool = (x: boolean, y: boolean) => dir * (Number(x) - Number(y))
      switch (sortField) {
        case 'projectNumber':
          return cmpStr(a.projectNumber, b.projectNumber)
        case 'company':
          return cmpStr(a.companyName, b.companyName)
        case 'projectType':
          return cmpStr(a.projectTypeName, b.projectTypeName)
        case 'parentProject':
          return cmpStr(getProjectLabel(a.parentProjectId), getProjectLabel(b.parentProjectId))
        case 'startDate':
          return cmpStr(a.startDate, b.startDate)
        case 'endDate':
          return cmpStr(a.endDate, b.endDate)
        case 'engineeringStartDate':
          return cmpStr(a.engineeringStartDate, b.engineeringStartDate)
        case 'closingDate':
          return cmpStr(a.closingDate, b.closingDate)
        case 'isMainProject':
          return cmpBool(a.isMainProject, b.isMainProject)
        case 'isIntern':
          return cmpBool(a.isIntern, b.isIntern)
        case 'isOpen':
          return cmpBool(a.isOpen, b.isOpen)
        case 'isClosed':
          return cmpBool(a.isClosed, b.isClosed)
        case 'createdAt':
          return cmpStr(a.createdAt, b.createdAt)
        case 'createdBy':
          return cmpStr(getEmployeeName(a.createdBy), getEmployeeName(b.createdBy))
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
    setEditingProject(null)
    setDialogOpen(true)
  }

  function handleEdit(p: MappedProject) {
    setEditingProject(p)
    setDialogOpen(true)
  }

  async function handleSave(p: MappedProject) {
    const payload = {
      ...p,
      startDate: p.startDate ? new Date(p.startDate) : null,
      endDate: p.endDate ? new Date(p.endDate) : null,
      closingDate: p.closingDate ? new Date(p.closingDate) : null,
      engineeringStartDate: p.engineeringStartDate ? new Date(p.engineeringStartDate) : null,
      createdAt: new Date(p.createdAt),
      deletedAt: p.deletedAt ? new Date(p.deletedAt) : null,
      // strip UI-only fields
      companyName: undefined,
      projectTypeName: undefined,
      targetName: undefined,
    }

    if (editingProject) {
      await updateProjectAction(payload)
    } else {
      await createProjectAction(payload)
    }

    setDialogOpen(false)
    router.refresh()
  }

  async function handleSoftDelete(p: MappedProject) {
    await softDeleteProjectAction({id: p.id})
    router.refresh()
  }

  async function handleHardDelete(p: MappedProject) {
    await hardDeleteProjectAction({id: p.id})
    router.refresh()
  }

  const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
  const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'
  const totalCols = filterDeleted !== 'not-deleted' ? 21 : 17

  return (
    <div className="flex flex-col gap-6">
      {/* Search + filters + create */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search project number, company, type..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border placeholder:text-muted-foreground/60 focus-visible:ring-accent"
            />
          </div>
          <Select value={filterOpen} onValueChange={v => setFilterOpen(v as FilterOpen)}>
            <SelectTrigger className="w-[140px] bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
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
          New Project
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className={thClass} onClick={() => toggleSort('projectNumber')}>
                Project # <SortIcon field="projectNumber" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('company')}>
                Company <SortIcon field="company" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('projectType')}>
                Type <SortIcon field="projectType" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('parentProject')}>
                Parent Project <SortIcon field="parentProject" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('startDate')}>
                Start Date <SortIcon field="startDate" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('endDate')}>
                End Date <SortIcon field="endDate" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('engineeringStartDate')}>
                Eng. Start <SortIcon field="engineeringStartDate" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('closingDate')}>
                Closing Date <SortIcon field="closingDate" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('isMainProject')}>
                Main <SortIcon field="isMainProject" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('isIntern')}>
                Internal <SortIcon field="isIntern" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('isOpen')}>
                Open <SortIcon field="isOpen" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('isClosed')}>
                Closed <SortIcon field="isClosed" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass}>Description</TableHead>
              <TableHead className={thClass} onClick={() => toggleSort('createdAt')}>
                Created At <SortIcon field="createdAt" sortField={sortField} sortDir={sortDir} />
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
              <TableHead className="w-20">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={totalCols} className="h-32 text-center text-muted-foreground">
                  No projects found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(p => (
                <TableRow
                  key={p.id}
                  className={`border-border/40 hover:bg-secondary/50 ${p.deleted ? 'opacity-50' : ''}`}>
                  <TableCell className={`${tdClass} text-foreground font-medium`}>{p.projectNumber}</TableCell>
                  <TableCell className={tdClass}>{p.companyName}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-border text-muted-foreground font-normal whitespace-nowrap">
                      {p.projectTypeName}
                    </Badge>
                  </TableCell>
                  <TableCell className={tdClass}>{getProjectLabel(p.parentProjectId)}</TableCell>
                  <TableCell className={tdClass}>{formatDate(p.startDate)}</TableCell>
                  <TableCell className={tdClass}>{formatDate(p.endDate)}</TableCell>
                  <TableCell className={tdClass}>{formatDate(p.engineeringStartDate)}</TableCell>
                  <TableCell className={tdClass}>{formatDate(p.closingDate)}</TableCell>
                  <TableCell>
                    {p.isMainProject ? (
                      <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground font-medium">
                        No
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.isIntern ? (
                      <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground font-medium">
                        No
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.isOpen ? (
                      <Badge className="bg-accent/15 text-accent border-0 font-medium">Open</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground font-medium">
                        Closed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.isClosed ? (
                      <Badge variant="destructive" className="font-medium">
                        Closed
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground font-medium">
                        No
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className={tdClass}>
                    <span className="max-w-[200px] truncate inline-block">{p.description ?? '-'}</span>
                  </TableCell>
                  <TableCell className={tdClass}>{formatDate(p.createdAt)}</TableCell>
                  <TableCell className={tdClass}>{getEmployeeName(p.createdBy)}</TableCell>
                  {filterDeleted !== 'not-deleted' && (
                    <>
                      <TableCell>
                        {p.deleted ? (
                          <Badge variant="destructive" className="font-medium">
                            Yes
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No</span>
                        )}
                      </TableCell>
                      <TableCell className={tdClass}>{formatDate(p.deletedAt)}</TableCell>
                      <TableCell className={tdClass}>{getEmployeeName(p.deletedBy)}</TableCell>
                    </>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                        onClick={() => handleEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="sr-only">Edit {p.projectNumber}</span>
                      </Button>
                      {!p.deleted && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleSoftDelete(p)}>
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete {p.projectNumber}</span>
                        </Button>
                      )}
                      {p.deleted && isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleHardDelete(p)}>
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Permanently delete {p.projectNumber}</span>
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
        Showing {filtered.length} of {projects.length} projects
      </div>

      <ProjectFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editingProject}
        projects={projects}
        projectTypes={projectTypes}
        companies={companies}
        onSave={handleSave}
      />
    </div>
  )
}
