'use client'

import {useRef, useState} from 'react'
import {Switch} from '@/components/ui/switch'

import {useRouter} from 'next/navigation'
import type {RoleLevelOption} from '@/types/roleLevel'
import type {MappedVisibilityForRole} from '@/types/visibilityForRole'
import {upsertVisibilityForRoleAction} from '@/serverFunctions/visibilityForRoles'

interface VisibilityForRoleTabProps {
  targetId: string | null // null = company not saved yet
  visibilityForRoles: MappedVisibilityForRole[]
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  revalidatePath: string
}

export function VisibilityForRoleTab({
  targetId,
  visibilityForRoles,
  roleLevelOptions,
  defaultVisibleRoleNames,
  revalidatePath,
}: VisibilityForRoleTabProps) {
  const router = useRouter()

  // roleLevelId -> optimistic value while a save is in flight
  const [pending, setPending] = useState<Record<string, boolean | null>>(() => {
    // Pre-seed defaults when no rows exist yet
    if (visibilityForRoles.length === 0) {
      const seeds: Record<string, boolean> = {}
      roleLevelOptions.forEach(rl => {
        if (defaultVisibleRoleNames.includes(rl.roleName)) seeds[rl.id] = true
      })
      return seeds
    }
    return {}
  })

  // Holds seeds that need flushing once a targetId arrives (new entity flow).
  // The parent should call flushSeeds() after save when it finally has a targetId.
  const pendingSeedsRef = useRef<Record<string, boolean>>(
    visibilityForRoles.length === 0
      ? Object.fromEntries(
          roleLevelOptions.filter(rl => defaultVisibleRoleNames.includes(rl.roleName)).map(rl => [rl.id, true]),
        )
      : {},
  )

  async function handleToggle(roleLevelId: string, newVisible: boolean) {
    if (!targetId) return
    setPending(p => ({...p, [roleLevelId]: newVisible}))
    await upsertVisibilityForRoleAction({
      targetId,
      roleLevelId,
      visible: newVisible,
      revalidate: revalidatePath,
    })
    router.refresh()
    setPending(p => ({...p, [roleLevelId]: null}))
  }

  function getVisible(roleLevelId: string): boolean {
    const p = pending[roleLevelId]
    if (p !== undefined && p !== null) return p
    return visibilityForRoles.find(v => v.roleLevelId === roleLevelId)?.visible ?? false
  }

  if (!targetId) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Save the record first to configure visibility per role.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Control which roles can see this record. Administrators always have full access.
      </p>
      {roleLevelOptions.map(rl => {
        const isSaving = pending[rl.id] !== undefined && pending[rl.id] !== null
        return (
          <div
            key={rl.id}
            className="flex items-center justify-between rounded-lg border border-border bg-secondary px-4 py-2.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-foreground">{rl.roleName}</span>
              <span className="text-xs text-muted-foreground">
                {rl.subRoleName} — level {rl.subRoleLevel}
              </span>
            </div>
            <Switch checked={getVisible(rl.id)} disabled={isSaving} onCheckedChange={v => handleToggle(rl.id, v)} />
          </div>
        )
      })}
    </div>
  )
}

// Exported so a parent can flush pending seeds after a new entity is saved
// and the targetId becomes available via router.refresh()
export function useVisibilitySeeds(
  targetId: string | null,
  revalidatePath: string,
  pendingSeedsRef: React.MutableRefObject<Record<string, boolean>>,
) {
  async function flushIfNeeded() {
    const seeds = pendingSeedsRef.current
    const entries = Object.entries(seeds).filter(([, v]) => v)
    if (!targetId || entries.length === 0) return
    pendingSeedsRef.current = {}
    await Promise.all(
      entries.map(([roleLevelId]) =>
        upsertVisibilityForRoleAction({
          targetId,
          roleLevelId,
          visible: true,
          revalidate: revalidatePath,
        }),
      ),
    )
  }
  return {flushIfNeeded}
}
