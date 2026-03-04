'use client'

import {useState} from 'react'
import {Shield, ChevronRight} from 'lucide-react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Switch} from '@/components/ui/switch'
import type {RoleLevelOption} from '@/types/roleLevel'
import type {MappedVisibilityForRole} from '@/types/visibilityForRole'

import {useRouter} from 'next/navigation'
import {bulkUpsertVisibilityForRoleAction} from '@/serverFunctions/visibilityForRoles'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MappedDepartment {
  id: string
  name: string
  color: string | null
  icon: string | null
  description: string | null
  targetId: string
  visibilityForRoles: MappedVisibilityForRole[]
}

interface VisibilityRow {
  roleLevelId: string
  visible: boolean
}

interface DepartmentVisibilityTableProps {
  departments: MappedDepartment[]
  roleLevelOptions: RoleLevelOption[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildRows(saved: MappedVisibilityForRole[], options: RoleLevelOption[]): VisibilityRow[] {
  return options.map(rl => {
    const found = saved.find(v => v.roleLevelId === rl.id)
    return {roleLevelId: rl.id, visible: found?.visible ?? false}
  })
}

function visibleCount(rows: VisibilityRow[]): number {
  return rows.filter(r => r.visible).length
}

// ─── Visibility Dialog ────────────────────────────────────────────────────────

interface VisibilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  department: MappedDepartment
  roleLevelOptions: RoleLevelOption[]
}

function VisibilityDialog({open, onOpenChange, department, roleLevelOptions}: VisibilityDialogProps) {
  const router = useRouter()
  const [rows, setRows] = useState<VisibilityRow[]>(() => buildRows(department.visibilityForRoles, roleLevelOptions))
  const [saving, setSaving] = useState(false)

  function toggleRow(roleLevelId: string, value: boolean) {
    setRows(prev => prev.map(r => (r.roleLevelId === roleLevelId ? {...r, visible: value} : r)))
  }

  function setAll(value: boolean) {
    setRows(prev => prev.map(r => ({...r, visible: value})))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await bulkUpsertVisibilityForRoleAction({
        targetId: department.targetId,
        rows,
        revalidate: '/settings/department-visibility',
      })
      router.refresh()
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  // Group roles by roleName for a cleaner layout
  const grouped = roleLevelOptions.reduce<Record<string, RoleLevelOption[]>>((acc, rl) => {
    if (!acc[rl.roleName]) acc[rl.roleName] = []
    acc[rl.roleName].push(rl)
    return acc
  }, {})

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            Role Visibility — {department.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground max-w-sm">
              Choose which roles can see the <span className="text-foreground font-medium">{department.name}</span>{' '}
              department. Administrators always have full access.
            </p>
            <div className="flex items-center gap-3 shrink-0 ml-4">
              <button
                type="button"
                onClick={() => setAll(true)}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                All on
              </button>
              <span className="text-border">·</span>
              <button
                type="button"
                onClick={() => setAll(false)}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                All off
              </button>
            </div>
          </div>

          {/* Role groups */}
          <div className="flex flex-col gap-5">
            {Object.entries(grouped).map(([roleName, options]) => (
              <div key={roleName} className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider">{roleName}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {options.map(rl => {
                    const row = rows.find(r => r.roleLevelId === rl.id)
                    const isVisible = row?.visible ?? false
                    return (
                      <div
                        key={rl.id}
                        className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-colors ${
                          isVisible ? 'border-accent/40 bg-accent/5' : 'border-border bg-secondary'
                        }`}>
                        <div className="flex flex-col gap-0.5 min-w-0 pr-3">
                          <p className="text-sm text-foreground truncate">{rl.subRoleName}</p>
                          <p className="text-xs text-muted-foreground">Level {rl.subRoleLevel}</p>
                        </div>
                        <Switch checked={isVisible} onCheckedChange={v => toggleRow(rl.id, v)} />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Department Row ───────────────────────────────────────────────────────────

interface DepartmentRowProps {
  department: MappedDepartment
  roleLevelOptions: RoleLevelOption[]
}

function DepartmentRow({department, roleLevelOptions}: DepartmentRowProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const currentRows = buildRows(department.visibilityForRoles, roleLevelOptions)
  const visible = visibleCount(currentRows)
  const total = roleLevelOptions.length

  return (
    <>
      <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-card px-5 py-4 hover:bg-secondary/40 transition-colors">
        {/* Color dot + name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="h-3 w-3 rounded-full shrink-0"
            style={{backgroundColor: department.color ?? 'hsl(var(--muted-foreground))'}}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{department.name}</p>
            {department.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{department.description}</p>
            )}
          </div>
        </div>

        {/* Visibility summary */}
        <div className="flex items-center gap-3 shrink-0">
          <Badge
            variant="outline"
            className={`text-xs border-border font-normal ${
              visible === 0
                ? 'text-muted-foreground'
                : visible === total
                  ? 'text-accent border-accent/40 bg-accent/5'
                  : 'text-foreground'
            }`}>
            {visible === 0 ? 'No roles' : visible === total ? 'All roles' : `${visible} / ${total} roles`}
          </Badge>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/60"
            onClick={() => setDialogOpen(true)}>
            <Shield className="h-3.5 w-3.5" />
            Edit
            <ChevronRight className="h-3 w-3 opacity-50" />
          </Button>
        </div>
      </div>

      <VisibilityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        department={department}
        roleLevelOptions={roleLevelOptions}
      />
    </>
  )
}

// ─── Main Table ───────────────────────────────────────────────────────────────

export function DepartmentVisibilityTable({departments, roleLevelOptions}: DepartmentVisibilityTableProps) {
  return (
    <div className="flex flex-col gap-2">
      {departments.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card h-32 flex items-center justify-center text-muted-foreground text-sm">
          No departments found.
        </div>
      ) : (
        departments.map(dept => <DepartmentRow key={dept.id} department={dept} roleLevelOptions={roleLevelOptions} />)
      )}
      <p className="text-xs text-muted-foreground mt-2">
        {departments.length} department{departments.length !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
