import {DashboardNavbar} from '@/components/custom/dashboardNavbar'

export default function DashboardLayout({children}: {children: React.ReactNode}) {
  return (
    <div className="flex min-h-svh flex-col">
      <DashboardNavbar username="john.doe" role="admin" />
      <div className="flex-1">{children}</div>
    </div>
  )
}
