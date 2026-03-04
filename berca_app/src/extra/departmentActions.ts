export interface DepartmentAction {
  id: string
  name: string
  description: string
  icon: string
  owner: string
}

export const DEPARTMENT_ACTIONS: Record<string, DepartmentAction[]> = {
  General: [
    {
      id: 'schedule',
      name: 'Schedule Meetings',
      description: 'Plan and coordinate internal and external meetings',
      icon: 'CalendarDays',
      owner: 'general',
    },
    {
      id: 'document',
      name: 'Documents',
      description: 'Manage and distribute general company documents',
      icon: 'FileText',
      owner: 'general',
    },
    {
      id: 'timeRegistry',
      name: 'Time Registry',
      description: 'Register and review employee working hours',
      icon: 'Clock',
      owner: 'general',
    },
    {
      id: 'followUp',
      name: 'Follow Up',
      description: 'Track pending actions and communication follow-ups',
      icon: 'ListTodo',
      owner: 'general',
    },
    {
      id: 'company',
      name: 'Companies',
      description: 'Maintain company and partner organization records',
      icon: 'Building2',
      owner: 'general',
    },
    {
      id: 'contact',
      name: 'Contacts',
      description: 'Manage shared contact and address information',
      icon: 'Users',
      owner: 'general',
    },
    {
      id: 'followUpStructure',
      name: 'Follow Up Structure',
      description: 'Configure follow-up workflows and responsibilities',
      icon: 'Workflow',
      owner: 'general',
    },
  ],

  Accounting: [
    {
      id: 'invoicesIn',
      name: 'Invoices Incoming',
      description: 'Register and process incoming supplier invoices',
      icon: 'FileDown',
      owner: 'accounting',
    },
    {
      id: 'invoicesOut',
      name: 'Invoices Outgoing',
      description: 'Create and manage customer invoices',
      icon: 'FileUp',
      owner: 'accounting',
    },
    {
      id: 'reports',
      name: 'Reports',
      description: 'Generate financial and accounting reports',
      icon: 'BarChart3',
      owner: 'accounting',
    },
    {
      id: 'audit',
      name: 'Audits',
      description: 'Support internal and external financial audits',
      icon: 'SearchCheck',
      owner: 'accounting',
    },
    {
      id: 'budget',
      name: 'Budgeting',
      description: 'Plan, monitor, and control departmental budgets',
      icon: 'Wallet',
      owner: 'accounting',
    },
  ],

  Engineering: [
    {
      id: 'maintenance',
      name: 'Equipment Maintenance',
      description: 'Plan, register, and track industrial equipment maintenance',
      icon: 'Wrench',
      owner: 'engineering',
    },
    {
      id: 'process',
      name: 'Process Improvement',
      description: 'Analyze and optimize manufacturing and production processes',
      icon: 'Factory',
      owner: 'engineering',
    },
    {
      id: 'safety',
      name: 'Safety Checks',
      description: 'Perform technical safety inspections on machines and installations',
      icon: 'ShieldCheck',
      owner: 'engineering',
    },
    {
      id: 'workflow',
      name: 'Workflow Management',
      description: 'Coordinate engineering and production workflow steps',
      icon: 'GitBranch',
      owner: 'engineering',
    },
    {
      id: 'material',
      name: 'Materials',
      description: 'Manage engineering materials, components, and specifications',
      icon: 'Boxes',
      owner: 'engineering',
    },
  ],

  Training: [
    {
      id: 'onboarding',
      name: 'Employee Onboarding',
      description: 'Prepare and guide new employees during onboarding',
      icon: 'UserPlus',
      owner: 'training',
    },
    {
      id: 'course',
      name: 'Training Courses',
      description: 'Organize and manage internal training programs',
      icon: 'GraduationCap',
      owner: 'training',
    },
    {
      id: 'courseContact',
      name: 'Training Course contacts',
      description: 'Maintain instructors and participant contact lists',
      icon: 'Contact',
      owner: 'training',
    },
    {
      id: 'courseStandard',
      name: 'Training Course standards',
      description: 'Define and maintain training course standards and requirements',
      icon: 'BookCheck',
      owner: 'training',
    },
    {
      id: 'certificateTraining',
      name: 'Training Course Certificate',
      description: 'Issue and track training certificates and validity',
      icon: 'Award',
      owner: 'training',
    },
  ],

  Project: [
    {
      id: 'project',
      name: 'Project',
      description: 'Create and manage project definitions and timelines',
      icon: 'FolderKanban',
      owner: 'project',
    },
    {
      id: 'projectBom',
      name: 'Project Bill Of Material',
      description: 'Maintain project-specific bill of materials',
      icon: 'ListTree',
      owner: 'project',
    },
    {
      id: 'projectBomStructure',
      name: 'Project Bill Of Material Structure',
      description: 'Configure hierarchical BOM structures for projects',
      icon: 'Network',
      owner: 'project',
    },
    {
      id: 'workOrderStructure',
      name: 'Work Order Structure',
      description: 'Define work order flow and structural setup',
      icon: 'Workflow',
      owner: 'project',
    },
  ],

  SHEQ: [
    {
      id: 'safetyAudit',
      name: 'Safety Audit',
      description: 'Conduct workplace safety inspections and audits',
      icon: 'ClipboardCheck',
      owner: 'sheq',
    },
    {
      id: 'healthMonitor',
      name: 'Health Monitoring',
      description: 'Track health incidents and employee wellbeing metrics',
      icon: 'HeartPulse',
      owner: 'sheq',
    },
    {
      id: 'qualityCheck',
      name: 'Quality Checks',
      description: 'Perform quality inspections on products and processes',
      icon: 'CheckCircle2',
      owner: 'sheq',
    },
    {
      id: 'envMonitor',
      name: 'Environmental Monitoring',
      description: 'Monitor environmental impact and compliance metrics',
      icon: 'Leaf',
      owner: 'sheq',
    },
  ],

  HR: [
    {
      id: 'recruitment',
      name: 'Recruitment',
      description: 'Manage vacancies and candidate pipelines',
      icon: 'UserSearch',
      owner: 'hr',
    },
    {
      id: 'records',
      name: 'Employee Records',
      description: 'Maintain employee master data and files',
      icon: 'FolderUser',
      owner: 'hr',
    },
    {
      id: 'certificationTraining',
      name: 'Employee Certificates & Training',
      description: 'Track employee certifications and required trainings',
      icon: 'BadgeCheck',
      owner: 'hr',
    },
    {
      id: 'benefits',
      name: 'Benefits Administration',
      description: 'Manage employee benefits, payroll inputs, and perks',
      icon: 'CreditCard',
      owner: 'hr',
    },
    {
      id: 'performance',
      name: 'Performance Reviews',
      description: 'Conduct and archive employee evaluations',
      icon: 'BarChart3',
      owner: 'hr',
    },
  ],

  Management: [
    {
      id: 'workOrderManagement',
      name: 'Work Order',
      description: 'Oversee and approve organizational work orders',
      icon: 'ClipboardSignature',
      owner: 'management',
    },
    {
      id: 'strategy',
      name: 'Strategic Planning',
      description: 'Define and monitor company strategic initiatives',
      icon: 'Target',
      owner: 'management',
    },
    {
      id: 'meetings',
      name: 'Executive Meetings',
      description: 'Coordinate leadership and board meetings',
      icon: 'CalendarDays',
      owner: 'management',
    },
    {
      id: 'reports',
      name: 'Reports',
      description: 'Review high-level operational and financial reports',
      icon: 'FileBarChart',
      owner: 'management',
    },
  ],

  Database: [
    {
      id: 'admin',
      name: 'DB Administration',
      description: 'Manage database access, users, and configuration',
      icon: 'Database',
      owner: 'database',
    },
    {
      id: 'backup',
      name: 'Backup & Restore',
      description: 'Execute and monitor database backup procedures',
      icon: 'HardDriveDownload',
      owner: 'database',
    },
    {
      id: 'integrity',
      name: 'Data Integrity',
      description: 'Monitor and enforce database consistency rules',
      icon: 'ShieldCheck',
      owner: 'database',
    },
    {
      id: 'departmentVisibility',
      name: 'Department Visibility',
      description: 'Make departments visible to roles',
      icon: 'Eye',
      owner: 'database',
    },
  ],

  Purchasing: [
    {
      id: 'orders',
      name: 'Purchase Orders',
      description: 'Create and manage supplier purchase orders',
      icon: 'ShoppingCart',
      owner: 'purchasing',
    },
    {
      id: 'purchaseBom',
      name: 'Purchase BOM Structure',
      description: 'Maintain purchasing bill of materials structures',
      icon: 'ListTree',
      owner: 'purchasing',
    },
    {
      id: 'materialPrice',
      name: 'Material Price',
      description: 'Manage and update material pricing information',
      icon: 'Tag',
      owner: 'purchasing',
    },
    {
      id: 'orderRequests',
      name: 'Order Requests',
      description: 'Process and approve internal purchase requests',
      icon: 'ClipboardList',
      owner: 'purchasing',
    },
    {
      id: 'orderQuote',
      name: 'Order Quotes',
      description: 'Manage supplier quotations and comparisons',
      icon: 'FileSpreadsheet',
      owner: 'purchasing',
    },
  ],

  Warehouse: [
    {
      id: 'inventory',
      name: 'Inventory Management',
      description: 'Monitor and control warehouse stock levels',
      icon: 'Warehouse',
      owner: 'warehouse',
    },
    {
      id: 'spec',
      name: 'Material Specs',
      description: 'Maintain material specifications and properties',
      icon: 'FileCog',
      owner: 'warehouse',
    },
    {
      id: 'place',
      name: 'Inventory Place',
      description: 'Manage warehouse storage locations',
      icon: 'MapPin',
      owner: 'warehouse',
    },
    {
      id: 'materialPlace',
      name: 'Material Place',
      description: 'Assign materials to physical storage locations',
      icon: 'Boxes',
      owner: 'warehouse',
    },
  ],

  Sales: [
    {
      id: 'quoteBecra',
      name: 'Quote Becra',
      description: 'Prepare and manage customer quotations',
      icon: 'FileText',
      owner: 'sales',
    },
    {
      id: 'workOrderSales',
      name: 'Work Order',
      description: 'Convert sales into executable work orders',
      icon: 'Handshake',
      owner: 'sales',
    },
    {
      id: 'saleReport',
      name: 'Sales Reports',
      description: 'Analyze sales performance and pipeline metrics',
      icon: 'TrendingUp',
      owner: 'sales',
    },
  ],

  PR: [
    {
      id: 'media',
      name: 'Media Outreach',
      description: 'Coordinate communication with media partners',
      icon: 'Megaphone',
      owner: 'pr',
    },
    {
      id: 'campaigns',
      name: 'PR Campaigns',
      description: 'Plan and manage public relations campaigns',
      icon: 'Sparkles',
      owner: 'pr',
    },
    {
      id: 'monitoring',
      name: 'Social Monitoring',
      description: 'Track and review social media activity',
      icon: 'Radar',
      owner: 'pr',
    },
    {
      id: 'companyMonitoring',
      name: 'Company Monitoring',
      description: 'Monitor mentions and activity of other companies',
      icon: 'Building2',
      owner: 'pr',
    },
  ],

  'Product Quality': [
    {
      id: 'serialTracked',
      name: 'Serial Tracked',
      description: 'Manage serial-number-based product tracking',
      icon: 'ScanLine',
      owner: 'productQuality',
    },
    {
      id: 'standards',
      name: 'Standards Compliance',
      description: 'Verify products against required standards',
      icon: 'ShieldCheck',
      owner: 'productQuality',
    },
    {
      id: 'reports',
      name: 'Quality Reports',
      description: 'Generate and review product quality reports',
      icon: 'FileBarChart',
      owner: 'productQuality',
    },
  ],
}
