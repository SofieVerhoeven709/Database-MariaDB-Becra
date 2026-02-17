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
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import {useEffect, useState} from 'react'
import type {Role} from '@/generated/prisma/client'

interface Department {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

const ICONS: Record<string, LucideIcon> = {
  Clipboard, // Admin
  Users, // HR
  Wrench, // Engineering
  Megaphone, // PR
  ShieldCheck, // SHEQ
  Calculator, // Accounting
  BookOpen, // Training
  ClipboardList, // Project
  Briefcase, // Management
  Database, // Database
  ShoppingCart, // Purchasing
  TrendingUp, // Sales
}

interface DepartmentGridProps {
  role: Role
}

export function DepartmentGrid({role}: DepartmentGridProps) {
  const [departments, setDepartments] = useState<Department[]>([])

  useEffect(() => {
    const fetchDepartments = async () => {
      const res = await fetch('/api/departments', {
        method: 'POST', // use POST because you’re sending a JSON body
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(role), // full Role object
      })
      const data: Department[] = await res.json()
      setDepartments(data)
    }

    fetchDepartments()
  }, [role])

  if (!departments.length) return <p>Loading departments...</p>

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {departments.map(dept => {
        const Icon = ICONS[dept.icon]
        const accentColor = dept.color
        const accentBg = `${accentColor}1F` // ~12% opacity
        const accentBgHover = `${accentColor}2E` // ~18% opacity

        return (
          <Link
            key={dept.id}
            href={`/departments/${dept.id}`}
            className="group flex flex-col items-start gap-4 rounded-xl border border-border/60 bg-card p-5 text-left transition-all duration-200 hover:shadow-lg hover:shadow-black/15 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={
              {
                '--dept-accent': accentColor,
                '--dept-bg': accentBg,
                '--dept-bg-hover': accentBgHover,
              } as React.CSSProperties
            }>
            <div
              className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors duration-200"
              style={{backgroundColor: 'var(--dept-bg)'}}>
              <Icon className="h-5 w-5" style={{color: 'var(--dept-accent)'}} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-foreground group-hover:text-foreground/90">{dept.name}</span>
              <span className="text-xs text-muted-foreground leading-relaxed">{dept.description}</span>
            </div>
            <div
              className="mt-auto h-0.5 w-0 rounded-full transition-all duration-300 group-hover:w-full"
              style={{backgroundColor: 'var(--dept-accent)'}}
            />
          </Link>
        )
      })}
    </div>
  )
}
