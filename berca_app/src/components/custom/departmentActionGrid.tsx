'use client'

import {DEPARTMENT_ACTIONS, type DepartmentAction} from '@/extra/departmentActions'
import Link from 'next/link'
import type {Department} from '@/generated/prisma/client'
import camelCase from 'lodash/camelCase'
import {getIconByName} from '@/extra/icons'

interface DepartmentActionGridProps {
  department: Department
}

export function DepartmentActionGrid({department}: DepartmentActionGridProps) {
  const departmentActions = DEPARTMENT_ACTIONS[department.name] ?? []
  const generalActions = DEPARTMENT_ACTIONS['General'] ?? []

  const actions: DepartmentAction[] =
    department.name === 'General' ? generalActions : [...departmentActions, ...generalActions]

  if (!actions.length) return <p>No actions available for {department.name}</p>

  const folderSlug = camelCase(department.name)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {actions.map(action => {
        const Icon = getIconByName(action.icon)
        const accentColor = department.color
        const accentBg = `${accentColor}1F`
        const accentBgHover = `${accentColor}2E`

        return (
          <Link
            key={action.id}
            href={`/departments/${folderSlug}/${action.id}`}
            className="group flex flex-col items-start gap-4 rounded-xl border border-border/60 bg-card p-5 transition-all hover:shadow-lg hover:-translate-y-0.5"
            style={
              {
                '--dept-accent': accentColor,
                '--dept-bg': accentBg,
                '--dept-bg-hover': accentBgHover,
              } as React.CSSProperties
            }>
            <div
              className="flex h-11 w-11 items-center justify-center rounded-lg"
              style={{backgroundColor: 'var(--dept-bg)'}}>
              <Icon className="h-5 w-5" style={{color: 'var(--dept-accent)'}} />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold">{action.name}</span>
              <span className="text-xs text-muted-foreground">{action.description}</span>
            </div>

            <div
              className="mt-auto h-0.5 w-0 rounded-full transition-all group-hover:w-full"
              style={{backgroundColor: 'var(--dept-accent)'}}
            />
          </Link>
        )
      })}
    </div>
  )
}
