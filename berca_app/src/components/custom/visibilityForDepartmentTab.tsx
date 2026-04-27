'use client'

import {Switch} from '@/components/ui/switch'
import {MappedVisibilityForDepartment} from '@/types/visibilityForDepartment'
import {DepartmentOption} from '@/types/department'

// ─── Shared type used by every consumer ───────────────────────────────────────
export interface VisibilityDepartmentRow {
  departmentId: string
  visible: boolean
}

// ─── Helper: build initial rows from server data + defaults ───────────────────
// defaultVisibleRoleNameFragments: substrings to match against roleName.
// e.g. ['Project'] will match 'Project Role', 'Project Manager', etc.
// Pass exact full names if you need precise control.
export function buildInitialVisibilityDepartmentRows(
  savedRows: MappedVisibilityForDepartment[],
  departmentOptions: DepartmentOption[],
  defaultVisibleDepartmentNameFragments: string[],
): VisibilityDepartmentRow[] {
  const rows = savedRows ?? []
  return departmentOptions.map(dept => {
    const saved = rows.find(v => v.departmentId === dept.id)
    const isDefault = defaultVisibleDepartmentNameFragments.some(fragment =>
      dept.name.toLowerCase().includes(fragment.toLowerCase()),
    )
    return {
      departmentId: dept.id,
      visible: saved !== undefined ? saved.visible : isDefault,
    }
  })
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface VisibilityForDepartmentTabProps {
  departmentOptions: DepartmentOption[]
  /** Controlled: current working state owned by the parent */
  value: VisibilityDepartmentRow[]
  onChange: (rows: VisibilityDepartmentRow[]) => void
}

// ─── Component ────────────────────────────────────────────────────────────────
// Pure UI — no server calls, no router.refresh. Parent owns state and persists
// everything when the form is saved.
export function VisibilityForDepartmentTab({departmentOptions, value, onChange}: VisibilityForDepartmentTabProps) {
  function getVisible(departmentId: string): boolean {
    return value.find(r => r.departmentId === departmentId)?.visible ?? false
  }

  function handleToggle(departmentId: string, newVisible: boolean) {
    onChange(value.map(r => (r.departmentId === departmentId ? {...r, visible: newVisible} : r)))
  }

  const filteredOptions = departmentOptions

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Control which roles can see this record. Administrators always have full access. Changes take effect when you
          save.
        </p>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <button
            type="button"
            onClick={() => onChange(value.map(r => ({...r, visible: true})))}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
            All on
          </button>
          <span className="text-border">·</span>
          <button
            type="button"
            onClick={() => onChange(value.map(r => ({...r, visible: false})))}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
            All off
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {filteredOptions.map(rl => (
          <div
            key={rl.id}
            className="flex flex-col items-start gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 w-60">
            <div>
              <p className="text-sm text-foreground">{rl.name}</p>
            </div>
            <Switch checked={getVisible(rl.id)} onCheckedChange={v => handleToggle(rl.id, v)} />
          </div>
        ))}
      </div>
    </div>
  )
}
