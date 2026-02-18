'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {LogOut, LayoutDashboard} from 'lucide-react'
import {Avatar, AvatarFallback} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type {Department, Employee, Role} from '@/generated/prisma/client'
import {useEffect, useState} from 'react'

interface DashboardNavbarProps {
  employee: EmployeeSafe
  role: Role
}
export type EmployeeSafe = Omit<Employee, 'password_hash'>

export function DashboardNavbar({employee, role}: DashboardNavbarProps) {
  const [departmentMap, setDepartmentMap] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch('/api/departments', {
          method: 'POST', // match what DepartmentGrid does
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(role), // send the full role object
        })
        if (!res.ok) throw new Error('Failed to fetch departments')
        const data: Department[] = await res.json()
        const map = Object.fromEntries(data.map(d => [d.id, d.name]))
        setDepartmentMap(map)
      } catch (err) {
        console.error('Error fetching departments for navbar:', err)
      }
    }
    fetchDepartments()
  }, [role])

  const pathname = usePathname()

  const initials = employee.username
    .split(/[\s._-]+/)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const isHome = pathname === '/dashboard'

  const pathSegments = pathname.split('/').filter(Boolean).slice(1) // skip 'dashboard'

  const breadcrumb = pathSegments
    .map(segment => departmentMap[segment] || segment) // replace id with name
    .join(' / ')

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-lg transition-colors hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
            <LayoutDashboard className="h-4 w-4 text-accent" />
          </div>
          <span className="text-sm font-semibold text-foreground">Dashboard</span>
        </Link>
        {!isHome && (
          <nav className="flex items-center" aria-label="Breadcrumb">
            <span className="mx-2 text-muted-foreground/40">/</span>
            <span className="text-sm text-muted-foreground capitalize">{breadcrumb || 'Home'}</span>
          </nav>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-secondary outline-none">
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-sm font-medium text-foreground">{employee.username}</span>
              <span className="text-xs text-muted-foreground capitalize">{role.name}</span>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-secondary text-foreground text-xs font-medium">{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-card border-border">
          <DropdownMenuLabel className="text-foreground">My Account</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border" />
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link
              href="/"
              className="flex items-center gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive">
              <LogOut className="h-4 w-4" />
              Sign out
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
