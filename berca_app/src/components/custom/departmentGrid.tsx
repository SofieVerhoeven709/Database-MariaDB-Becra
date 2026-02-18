'use client'

import {
  Clipboard,
  Users,
  Wrench,
  Megaphone,
  ShieldCheck,
  Calculator,
  BookOpen,
  ClipboardList,
  Briefcase,
  Database,
  ShoppingCart,
  TrendingUp,
  Package,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import {useEffect, useState} from 'react'
import type {RoleContext} from '@/schemas/roleSchemas'

interface Department {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

const ICONS: Record<string, LucideIcon> = {
  Clipboard,
  Users,
  Wrench,
  Megaphone,
  ShieldCheck,
  Calculator,
  BookOpen,
  ClipboardList,
  Briefcase,
  Database,
  ShoppingCart,
  TrendingUp,
  Package,
  CheckCircle,
}

interface DepartmentGridProps {
  roleContext: RoleContext
}

export function DepartmentGrid({roleContext}: DepartmentGridProps) {
  const [departments, setDepartments] = useState<Department[]>([])

  useEffect(() => {
    const fetchDepartments = async () => {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(roleContext),
      })

      if (!res.ok) {
        console.error('Failed to fetch departments')
        return
      }

      const data: Department[] = await res.json()
      setDepartments(data)
    }

    fetchDepartments()
  }, [roleContext])

  if (!departments.length) return <p>Loading departments...</p>

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {departments.map(dept => {
        const Icon = ICONS[dept.icon]
        const accentColor = dept.color
        const accentBg = `${accentColor}1F`
        const accentBgHover = `${accentColor}2E`

        return (
          <Link
            key={dept.id}
            href={`/departments/${dept.id}`}
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
              <span className="text-sm font-semibold">{dept.name}</span>
              <span className="text-xs text-muted-foreground">{dept.description}</span>
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
