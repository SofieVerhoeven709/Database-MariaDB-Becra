export interface DepartmentAction {
  id: string
  name: string
  description: string
  icon: string
}

export const DEPARTMENT_ACTIONS: Record<string, DepartmentAction[]> = {
  General: [
    {id: 'schedule', name: 'Schedule Meetings', description: 'Manage office schedules', icon: 'Calendar'},
    {id: 'admin', name: 'Admin Tasks', description: 'General administrative tasks', icon: 'Clipboard'},
  ],
  Accounting: [
    {id: 'invoices', name: 'Invoices', description: 'Manage invoices and bills', icon: 'Calculator'},
    {id: 'reports', name: 'Reports', description: 'Financial reporting', icon: 'FileText'},
  ],
  Engineering: [
    {id: 'deploy', name: 'Deployments', description: 'Manage releases and deployments', icon: 'Code'},
    {id: 'infra', name: 'Infrastructure', description: 'Servers, databases, and CI/CD', icon: 'Server'},
  ],
}
