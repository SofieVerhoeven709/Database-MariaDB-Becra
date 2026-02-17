'use client'

import {
  DollarSign,
  Users,
  Code,
  Megaphone,
  HeadphonesIcon,
  ShieldCheck,
  BarChart3,
  Package,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'

export interface Department {
  id: string
  name: string
  description: string
  icon: LucideIcon
  hue: number
  saturation: number
  lightness: number
}

const ALL_DEPARTMENTS: Department[] = [
  {
    id: 'finance',
    name: 'Finance',
    description: 'Budgets, invoices, and financial reports',
    icon: DollarSign,
    hue: 45,
    saturation: 50,
    lightness: 45,
  },
  {
    id: 'hr',
    name: 'Human Resources',
    description: 'Employee records and onboarding',
    icon: Users,
    hue: 200,
    saturation: 45,
    lightness: 45,
  },
  {
    id: 'engineering',
    name: 'Engineering',
    description: 'Development, deployments, and infrastructure',
    icon: Code,
    hue: 160,
    saturation: 40,
    lightness: 40,
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Campaigns, analytics, and brand assets',
    icon: Megaphone,
    hue: 340,
    saturation: 40,
    lightness: 45,
  },
  {
    id: 'support',
    name: 'Customer Support',
    description: 'Tickets, live chat, and knowledge base',
    icon: HeadphonesIcon,
    hue: 270,
    saturation: 35,
    lightness: 45,
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Access control, audits, and compliance',
    icon: ShieldCheck,
    hue: 15,
    saturation: 50,
    lightness: 42,
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Data insights and performance metrics',
    icon: BarChart3,
    hue: 220,
    saturation: 40,
    lightness: 48,
  },
  {
    id: 'operations',
    name: 'Operations',
    description: 'Workflows, logistics, and process management',
    icon: Package,
    hue: 130,
    saturation: 35,
    lightness: 38,
  },
]

// Mock: which departments each role can access
const ROLE_DEPARTMENTS: Record<number, string[]> = {
  100: ALL_DEPARTMENTS.map(d => d.id),
  50: ['finance', 'hr', 'marketing', 'analytics', 'operations'],
  20: ['engineering', 'analytics', 'security'],
  10: ['support', 'hr'],
}

interface DepartmentGridProps {
  role: number
}

export function PerDepartmentGrid({role}: DepartmentGridProps) {
  const allowedIds = ROLE_DEPARTMENTS[role] ?? ROLE_DEPARTMENTS[100]
  const departments = ALL_DEPARTMENTS.filter(d => allowedIds.includes(d.id))

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {departments.map(dept => {
        const Icon = dept.icon
        const accentColor = `hsl(${dept.hue}, ${dept.saturation}%, ${dept.lightness}%)`
        const accentBg = `hsl(${dept.hue}, ${dept.saturation}%, ${dept.lightness}%, 0.12)`
        const accentBgHover = `hsl(${dept.hue}, ${dept.saturation}%, ${dept.lightness}%, 0.18)`

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
