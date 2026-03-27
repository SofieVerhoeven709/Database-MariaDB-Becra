'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import type {Route} from 'next'
import {Check, LogOut, LayoutDashboard} from 'lucide-react'
import {Avatar, AvatarFallback} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type {Department, Employee} from '@/generated/prisma/client'
import {useEffect, useState} from 'react'
import type {RoleContext, RoleContextInput} from '@/schemas/roleSchemas'
import {useTheme} from 'next-themes'

interface DashboardNavbarProps {
  employee: EmployeeSafe
  roleContext: RoleContext
  roleContextInput: RoleContextInput
}
export type EmployeeSafe = Omit<Employee, 'password_hash'>
type AppTheme = 'light' | 'dark' | 'high-contrast'
type BreadcrumbItem = {
  href: Route
  label: string
  isLast: boolean
}

// ── Breadcrumb helpers ──────────────────────────────────────────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isUUID = (s: string) => UUID_REGEX.test(s)

/** Human-readable labels for known path segments */
const SEGMENT_LABELS: Record<string, string> = {
  departments: 'Departments',
  dashboard: 'Dashboard',
  project: 'Projects',
  projectBom: 'Project BOMs',
  projectBomStructure: 'Project BOM Structures',
  workOrder: 'Work Orders',
  workOrderSales: 'Work Orders (Sales)',
  workOrderStructure: 'Work Order Structures',
  material: 'Materials',
  materialPrice: 'Material Prices',
  materialPlace: 'Material Places',
  followUp: 'Follow Ups',
  followUpStructure: 'Follow Up Structures',
  company: 'Companies',
  contact: 'Contacts',
  inventory: 'Inventory',
  purchaseBom: 'Purchase BOMs',
  quoteBecra: 'Quotes (Becra)',
  quoteSupplier: 'Quote Suppliers',
  timeRegistry: 'Time Registry',
  orders: 'Orders',
  orderQuote: 'Order Quotes',
  orderRequests: 'Order Requests',
  admin: 'Admin',
  audit: 'Audit',
  budget: 'Budget',
  campaigns: 'Campaigns',
  certificateTraining: 'Certificate Training',
  certificationTraining: 'Certification Training',
  companyMonitoring: 'Company Monitoring',
  course: 'Courses',
  courseContact: 'Course Contacts',
  courseStandard: 'Course Standards',
  departmentVisibility: 'Department Visibility',
  document: 'Documents',
  envMonitor: 'Environment Monitoring',
  healthMonitor: 'Health Monitoring',
  integrity: 'Integrity',
  invoicesIn: 'Invoices (In)',
  invoicesOut: 'Invoices (Out)',
  maintenance: 'Maintenance',
  media: 'Media',
  meetings: 'Meetings',
  monitoring: 'Monitoring',
  onboarding: 'Onboarding',
  performance: 'Performance',
  place: 'Places',
  process: 'Processes',
  qualityCheck: 'Quality Checks',
  records: 'Records',
  recruitment: 'Recruitment',
  reports: 'Reports',
  safety: 'Safety',
  safetyAudit: 'Safety Audit',
  saleReport: 'Sale Reports',
  schedule: 'Schedule',
  serialTracked: 'Serial Tracked',
  spec: 'Specifications',
  standards: 'Standards',
  strategy: 'Strategy',
  warehousePlace: 'Warehouse Places',
  workflow: 'Workflow',
  backup: 'Backup',
  benefits: 'Benefits',
}

/** Convert camelCase or kebab-case to Title Case for unknown segments */
const segmentToTitle = (segment: string): string => {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment]
  return segment
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]+/g, ' ')
    .replace(/^./, s => s.toUpperCase())
    .trim()
}

// ───────────────────────────────────────────────────────────────────────────

export function DashboardNavbar({employee, roleContext, roleContextInput}: DashboardNavbarProps) {
  const [departmentMap, setDepartmentMap] = useState<Record<string, string>>({})
  const [entityNames, setEntityNames] = useState<Record<string, string>>({})
  const {theme, resolvedTheme, setTheme} = useTheme()

  const applyTheme = (nextTheme: AppTheme) => {
    setTheme(nextTheme)
    const root = document.documentElement
    root.classList.remove('light', 'dark', 'high-contrast')
    root.classList.add(nextTheme)
    localStorage.setItem('theme', nextTheme)
  }

  // Fetch all departments once for label resolution
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch('/api/departments', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(roleContextInput),
        })
        if (!res.ok) return
        const rawData: unknown = await res.json()
        if (!Array.isArray(rawData)) return

        const departments = rawData.filter(
          (item): item is Pick<Department, 'id' | 'name'> =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as {id?: unknown}).id === 'string' &&
            typeof (item as {name?: unknown}).name === 'string',
        )

        const map = Object.fromEntries(departments.map(d => [d.id, d.name]))
        setDepartmentMap(map)
      } catch (err) {
        console.error('Error fetching departments for navbar:', err)
      }
    }
    void fetchDepartments()
  }, [roleContextInput])

  const pathname = usePathname()

  // Resolve entity names for UUID segments whenever the path changes
  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean)

    // Collect all UUID segments and resolve them via the breadcrumb API
    const toFetch: {id: string; type: string}[] = []
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      if (!isUUID(segment)) continue
      const parentSegment = segments[i - 1]
      if (parentSegment) {
        toFetch.push({id: segment, type: parentSegment})
      }
    }

    if (toFetch.length === 0) return

    const controller = new AbortController()

    const fetchNames = async () => {
      const results = await Promise.all(
        toFetch.map(async ({id, type}) => {
          try {
            const res = await fetch(
              `/api/breadcrumb?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`,
              {signal: controller.signal},
            )
            if (!res.ok) return {id, name: null}
            const data = (await res.json()) as {name: string | null}
            return {id, name: data.name}
          } catch {
            return {id, name: null}
          }
        }),
      )

      const namesMap: Record<string, string> = {}
      for (const {id, name} of results) {
        if (name) namesMap[id] = name
      }
      setEntityNames(namesMap)
    }

    void fetchNames()
    return () => controller.abort()
  }, [pathname])

  const activeTheme = theme === 'system' ? resolvedTheme : theme

  const initials = employee.username
    .split(/[\s._-]+/)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const displayRole = roleContext.role.replace(/\sRole$/, '')

  const routeSegments = pathname.split('/').filter(Boolean)
  const isDashboardRoute = routeSegments[0] === 'dashboard'
  const breadcrumbSegments = isDashboardRoute ? routeSegments.slice(1) : routeSegments
  const isHome = breadcrumbSegments.length === 0

  const breadcrumbItems: BreadcrumbItem[] = breadcrumbSegments.map((segment, index) => {
    const hrefSegments = [
      ...(isDashboardRoute ? ['dashboard'] : []),
      ...breadcrumbSegments.slice(0, index + 1),
    ]

    const isDepartmentsRoot = !isDashboardRoute && index === 0 && segment === 'departments'
    const isDepartmentId =
      !isDashboardRoute && isUUID(segment) && breadcrumbSegments[index - 1] === 'departments'
    const isEntityId = isUUID(segment) && !isDepartmentsRoot && !isDepartmentId

    const getLabel = (): string => {
      if (isDepartmentsRoot) return 'Departments'
      if (isDepartmentId) return entityNames[segment] || departmentMap[segment] || segment
      if (isEntityId) return entityNames[segment] || segment
      return segmentToTitle(segment)
    }

    const getHref = (): string => {
      if (isDepartmentsRoot) return '/dashboard'
      return `/${hrefSegments.join('/')}`
    }

    return {
      href: getHref() as Route<string>,
      label: getLabel(),
      isLast: index === breadcrumbSegments.length - 1,
    }
  })

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
            <div className="flex items-center gap-1 text-sm">
              {breadcrumbItems.map(item =>
                item.isLast ? (
                  <span key={item.href} className="capitalize text-foreground" aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  <div key={item.href} className="flex items-center gap-1">
                    <Link
                      href={item.href}
                      className="capitalize text-muted-foreground transition-colors hover:text-foreground">
                      {item.label}
                    </Link>
                    <span className="text-muted-foreground/40">/</span>
                  </div>
                ),
              )}
            </div>
          </nav>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-secondary outline-none">
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-sm font-medium text-foreground">{employee.username}</span>
              <span className="text-xs text-muted-foreground capitalize">{displayRole}</span>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-secondary text-foreground text-xs font-medium">{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-card border-border">
          <DropdownMenuLabel className="text-foreground">My Account</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border" />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-44">
              <DropdownMenuItem onSelect={() => applyTheme('light')}>
                Light
                {activeTheme === 'light' && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => applyTheme('dark')}>
                Dark
                {activeTheme === 'dark' && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => applyTheme('high-contrast')}>
                High contrast
                {activeTheme === 'high-contrast' && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
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
