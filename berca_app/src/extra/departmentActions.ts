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
    {id: 'inventory', name: 'Office Inventory', description: 'Track office supplies and equipment', icon: 'Package'},
    {id: 'notices', name: 'Post Notices', description: 'Office-wide announcements and memos', icon: 'Megaphone'},
  ],
  Accounting: [
    {id: 'invoices', name: 'Invoices', description: 'Manage invoices and bills', icon: 'Calculator'},
    {id: 'reports', name: 'Reports', description: 'Financial reporting and statements', icon: 'FileText'},
    {id: 'audit', name: 'Audits', description: 'Conduct internal and external audits', icon: 'ShieldCheck'},
    {id: 'budget', name: 'Budgeting', description: 'Plan and track departmental budgets', icon: 'DollarSign'},
  ],
  Engineering: [
    {
      id: 'maintenance',
      name: 'Equipment Maintenance',
      description: 'Schedule and log machine maintenance',
      icon: 'Wrench',
    },
    {
      id: 'process',
      name: 'Process Improvement',
      description: 'Optimize manufacturing and industrial processes',
      icon: 'Activity',
    },
    {
      id: 'safety',
      name: 'Safety Checks',
      description: 'Perform inspections for industrial safety compliance',
      icon: 'ShieldCheck',
    },
    {
      id: 'documentation',
      name: 'Technical Docs',
      description: 'Manage engineering manuals and blueprints',
      icon: 'FileText',
    },
    {
      id: 'workflow',
      name: 'Workflow Management',
      description: 'Coordinate production workflows and schedules',
      icon: 'ClipboardList',
    },
  ],
  Training: [
    {id: 'onboarding', name: 'Employee Onboarding', description: 'Set up new employees for success', icon: 'Users'},
    {id: 'courses', name: 'Training Courses', description: 'Manage internal training programs', icon: 'BookOpen'},
    {
      id: 'certifications',
      name: 'Certifications',
      description: 'Track employee certifications and qualifications',
      icon: 'Award',
    },
  ],
  Project: [
    {id: 'planning', name: 'Project Planning', description: 'Plan timelines and deliverables', icon: 'ClipboardList'},
    {
      id: 'tracking',
      name: 'Progress Tracking',
      description: 'Monitor project progress and milestones',
      icon: 'BarChart2',
    },
    {
      id: 'resources',
      name: 'Resource Allocation',
      description: 'Assign staff and equipment to projects',
      icon: 'Users',
    },
  ],
  SHEQ: [
    {
      id: 'safety-audit',
      name: 'Safety Audit',
      description: 'Inspect workplace for safety compliance',
      icon: 'ShieldCheck',
    },
    {
      id: 'health-monitor',
      name: 'Health Monitoring',
      description: 'Track employee health and incidents',
      icon: 'Heart',
    },
    {
      id: 'quality-check',
      name: 'Quality Checks',
      description: 'Inspect product quality standards',
      icon: 'CheckCircle',
    },
    {
      id: 'env-monitor',
      name: 'Environmental Monitoring',
      description: 'Monitor environmental safety and compliance',
      icon: 'Leaf',
    },
  ],
  HR: [
    {id: 'recruitment', name: 'Recruitment', description: 'Manage job postings and applications', icon: 'UserPlus'},
    {id: 'records', name: 'Employee Records', description: 'Maintain employee information', icon: 'Users'},
    {
      id: 'benefits',
      name: 'Benefits Administration',
      description: 'Manage payroll, insurance, and perks',
      icon: 'CreditCard',
    },
    {id: 'performance', name: 'Performance Reviews', description: 'Conduct employee evaluations', icon: 'BarChart2'},
  ],
  Management: [
    {id: 'strategy', name: 'Strategic Planning', description: 'Define company goals and strategy', icon: 'Briefcase'},
    {id: 'meetings', name: 'Executive Meetings', description: 'Organize leadership meetings', icon: 'Calendar'},
    {id: 'reports', name: 'Reports', description: 'Review departmental and company reports', icon: 'FileText'},
  ],
  Database: [
    {id: 'admin', name: 'DB Administration', description: 'Manage databases and access', icon: 'Database'},
    {id: 'backup', name: 'Backup & Restore', description: 'Ensure data safety and recovery', icon: 'Server'},
    {
      id: 'integrity',
      name: 'Data Integrity',
      description: 'Monitor and maintain database consistency',
      icon: 'CheckCircle',
    },
  ],
  Purchasing: [
    {id: 'orders', name: 'Purchase Orders', description: 'Create and manage purchase orders', icon: 'ShoppingCart'},
    {id: 'vendors', name: 'Vendor Management', description: 'Communicate with suppliers and vendors', icon: 'Users'},
    {id: 'inventory', name: 'Inventory Control', description: 'Track procurement and stock levels', icon: 'Package'},
  ],
  Warehouse: [
    {id: 'storage', name: 'Inventory Storage', description: 'Manage warehouse storage locations', icon: 'Package'},
    {id: 'shipping', name: 'Shipping', description: 'Coordinate outgoing shipments', icon: 'Truck'},
    {id: 'receiving', name: 'Receiving', description: 'Track incoming goods', icon: 'Package'},
  ],
  Sales: [
    {id: 'leads', name: 'Lead Management', description: 'Track and follow up on sales leads', icon: 'TrendingUp'},
    {id: 'deals', name: 'Deals', description: 'Manage deals and negotiations', icon: 'Handshake'},
    {id: 'reports', name: 'Sales Reports', description: 'Analyze performance metrics', icon: 'BarChart2'},
  ],
  PR: [
    {id: 'media', name: 'Media Outreach', description: 'Manage press and media contacts', icon: 'Megaphone'},
    {id: 'campaigns', name: 'PR Campaigns', description: 'Plan and execute campaigns', icon: 'Bullhorn'},
    {id: 'monitoring', name: 'Social Monitoring', description: 'Track social media presence', icon: 'Globe'},
  ],
  'Product Quality': [
    {id: 'inspection', name: 'Product Inspection', description: 'Inspect products for defects', icon: 'CheckCircle'},
    {id: 'standards', name: 'Standards Compliance', description: 'Ensure products meet standards', icon: 'ShieldCheck'},
    {id: 'reports', name: 'Quality Reports', description: 'Generate QA reports', icon: 'FileText'},
  ],
}
