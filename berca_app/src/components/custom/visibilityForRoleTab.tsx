'use client'

import {Switch} from '@/components/ui/switch'
import type {RoleLevelOption} from '@/types/roleLevel'
import type {MappedVisibilityForRole} from '@/types/visibilityForRole'

// ─── Shared type used by every consumer ───────────────────────────────────────
export interface VisibilityRow {
  roleLevelId: string
  visible: boolean
}

// ─── Helper: build initial rows from server data + defaults ───────────────────
// defaultVisibleRoleNameFragments: substrings to match against roleName.
// e.g. ['Project'] will match 'Project Role', 'Project Manager', etc.
// Pass exact full names if you need precise control.
const ALWAYS_VISIBLE_ROLES = ['Administrator', 'Management']

export function buildInitialVisibilityRows(
  savedRows: MappedVisibilityForRole[],
  roleLevelOptions: RoleLevelOption[],
  defaultVisibleRoleNameFragments: string[],
): VisibilityRow[] {
  return roleLevelOptions
    .filter(rl => !ALWAYS_VISIBLE_ROLES.some(r => rl.roleName.toLowerCase().includes(r.toLowerCase())))
    .map(rl => {
      const saved = savedRows.find(v => v.roleLevelId === rl.id)
      const isDefault = defaultVisibleRoleNameFragments.some(fragment =>
        rl.roleName.toLowerCase().includes(fragment.toLowerCase()),
      )
      return {
        roleLevelId: rl.id,
        visible: saved !== undefined ? saved.visible : isDefault,
      }
    })
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface VisibilityForRoleTabProps {
  roleLevelOptions: RoleLevelOption[]
  /** Controlled: current working state owned by the parent */
  value: VisibilityRow[]
  onChange: (rows: VisibilityRow[]) => void
}

// ─── Component ────────────────────────────────────────────────────────────────
// Pure UI — no server calls, no router.refresh. Parent owns state and persists
// everything when the form is saved.
export function VisibilityForRoleTab({roleLevelOptions, value, onChange}: VisibilityForRoleTabProps) {
  function getVisible(roleLevelId: string): boolean {
    return value.find(r => r.roleLevelId === roleLevelId)?.visible ?? false
  }

  function handleToggle(roleLevelId: string, newVisible: boolean) {
    onChange(value.map(r => (r.roleLevelId === roleLevelId ? {...r, visible: newVisible} : r)))
  }

  const filteredOptions = roleLevelOptions.filter(
    rl => !['administrator', 'management'].some(r => rl.roleName.toLowerCase().includes(r)),
  )

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
              <p className="text-sm text-foreground">{rl.roleName}</p>
              <p className="text-xs text-muted-foreground">
                {rl.subRoleName} — level {rl.subRoleLevel}
              </p>
            </div>
            <Switch checked={getVisible(rl.id)} onCheckedChange={v => handleToggle(rl.id, v)} />
          </div>
        ))}
      </div>
    </div>
  )
}
