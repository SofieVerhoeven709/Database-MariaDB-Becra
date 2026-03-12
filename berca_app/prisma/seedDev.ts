import type {PrismaClient} from '@/generated/prisma/client'
import {randomUUID} from 'crypto'
import {hashPassword} from '@/lib/passwordUtils'

// Departments with icons and HEX colors
const ALL_DEPARTMENTS = [
  {
    name: 'General',
    description: 'Office coordination, scheduling, and general administration',
    icon: 'Clipboard',
    color: '#00b0f0',
    number: 1,
  },
  {
    name: 'Accounting',
    description: 'Financial records, audits, and reporting',
    icon: 'Calculator',
    color: '#0c78d2',
    number: 2,
  },
  {
    name: 'Engineering',
    description: 'Development, deployments, and infrastructure',
    icon: 'Wrench',
    color: '#aeaaaa',
    number: 3,
  },
  {
    name: 'Training',
    description: 'Employee development and learning programs',
    icon: 'BookOpen',
    color: '#00cc00',
    number: 4,
  },
  {
    name: 'Project',
    description: 'Project planning, timelines, and deliverables',
    icon: 'ClipboardList',
    color: '#ffff00',
    number: 5,
  },
  {
    name: 'SHEQ',
    description: 'Safety, Health, Environment, and Quality',
    icon: 'ShieldCheck',
    color: '#f7caac',
    number: 6,
  },
  {
    name: 'HR',
    description: 'Employee records, recruitment, and onboarding',
    icon: 'Users',
    color: '#7030a0',
    number: 7,
  },
  {
    name: 'Management',
    description: 'Leadership, strategy, and organizational planning',
    icon: 'Briefcase',
    color: '#ffc000',
    number: 8,
  },
  {
    name: 'Database',
    description: 'Database administration and data integrity',
    icon: 'Database',
    color: '#2de2e6',
    number: 9,
  },
  {
    name: 'Purchasing',
    description: 'Supplies, vendor management, and procurement',
    icon: 'ShoppingCart',
    color: '#ff4fa3',
    number: 10,
  },
  {
    name: 'Warehouse',
    description: 'Inventory storage, stock control, and goods handling',
    icon: 'Package',
    color: '#e3c2e4',
    number: 11,
  },
  {
    name: 'Sales',
    description: 'Leads, deals, and customer acquisition',
    icon: 'TrendingUp',
    color: '#fe6f5e',
    number: 12,
  },
  {
    name: 'PR',
    description: 'Public relations, media, and communications',
    icon: 'Megaphone',
    color: '#7800ef',
    number: 13,
  },
  {
    name: 'Product Quality',
    description: 'Product inspection, quality assurance, and standards compliance',
    icon: 'CheckCircle',
    color: '#8c92ac',
    number: 14,
  },
]

const SUB_ROLES = [
  {name: 'user', level: 20},
  {name: 'senior-user', level: 40},
  {name: 'supervisor', level: 60},
  {name: 'manager', level: 80},
]

type SubRoleName = (typeof SUB_ROLES)[number]['name']

const createdSubRoles: Record<SubRoleName, {id: string; level: number}> = {} as Record<
  SubRoleName,
  {id: string; level: number}
>

const PROJECT_TYPES = [{name: 'Engineering'}, {name: 'Training'}, {name: 'Consulting'}, {name: 'Internal'}]

// ─── All target type names used across the system ─────────────────────────────

const ALL_TARGET_TYPES = [
  'Department',
  'Company',
  'Project',
  'WorkOrder',
  'WorkOrderStructure',
  'Contact',
  'Certificate',
  'DocumentStructure',
  'FollowUp',
  'FollowUpStructure',
  'InvoiceIn',
  'InvoiceOut',
  'Training',
  'TrainingStandard',
  'Employee',
  'DepartmentExtern',
]

// ─── Urgency types ────────────────────────────────────────────────────────────

const URGENCY_TYPES = ['Low', 'Medium', 'High', 'Critical']

// ─── Statuses ─────────────────────────────────────────────────────────────────

const STATUSES = ['Open', 'In Progress', 'Pending', 'On Hold', 'Resolved', 'Closed', 'Cancelled']

// ─── Follow-up types ──────────────────────────────────────────────────────────

const FOLLOW_UP_TYPES = [
  'Sales',
  'Support',
  'Non-Conformance',
  'Periodic Control',
  'Review',
  'General',
  'Task',
  'Complaint',
]

export const seedDev = async (prisma: PrismaClient) => {
  console.log('Running DEVELOPMENT seed (administrator)')
  const now = new Date()

  // 1. Upsert admin employee
  let adminEmployee = await prisma.employee.findFirst({where: {username: 'admin'}})
  if (!adminEmployee) {
    adminEmployee = await prisma.employee.create({
      data: {
        id: randomUUID(),
        firstName: 'System',
        lastName: 'Administrator',
        mail: 'admin@yourapp.com',
        username: 'admin',
        password_hash: hashPassword('change-me'),
        startDate: now,
        createdAt: now,
        passwordCreatedAt: now,
        permanentEmployee: true,
        active: true,
      },
    })
  }

  // 2. Upsert Administrator role
  let adminRole = await prisma.role.findFirst({where: {name: 'Administrator'}})
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        id: randomUUID(),
        name: 'Administrator',
        createdAt: now,
        createdBy: adminEmployee.id,
      },
    })
  }

  // 3. Upsert Administrator subRole
  let adminSubRole = await prisma.subRole.findFirst({where: {name: 'Administrator'}})
  if (!adminSubRole) {
    adminSubRole = await prisma.subRole.create({
      data: {
        id: randomUUID(),
        name: 'Administrator',
        level: 100,
        createdAt: now,
        createdBy: adminEmployee.id,
      },
    })
  }

  // 4. Upsert Administrator roleLevel
  let adminRoleLevel = await prisma.roleLevel.findFirst({
    where: {roleId: adminRole.id, subRoleId: adminSubRole.id},
  })
  if (!adminRoleLevel) {
    adminRoleLevel = await prisma.roleLevel.create({
      data: {
        id: randomUUID(),
        roleId: adminRole.id,
        subRoleId: adminSubRole.id,
        createdAt: now,
        createdBy: adminEmployee.id,
      },
    })
  }

  // 5. Attach admin roleLevel (only if not already set)
  if (!adminEmployee.roleLevelId) {
    await prisma.employee.update({
      where: {id: adminEmployee.id},
      data: {roleLevelId: adminRoleLevel.id},
    })
  }

  console.log('Administrator account ready')

  // 6. Upsert shared subRoles
  for (const sub of SUB_ROLES) {
    let existing = await prisma.subRole.findFirst({where: {name: sub.name}})
    if (!existing) {
      existing = await prisma.subRole.create({
        data: {
          id: randomUUID(),
          name: sub.name,
          level: sub.level,
          createdAt: now,
          createdBy: adminEmployee.id,
        },
      })
    }
    createdSubRoles[sub.name] = {id: existing.id, level: existing.level}
  }

  // 7. Upsert ALL TargetTypes
  async function upsertTargetType(name: string) {
    let tt = await prisma.targetType.findFirst({where: {name}})
    if (!tt) {
      tt = await prisma.targetType.create({
        data: {id: randomUUID(), name, createdAt: now, createdBy: adminEmployee!.id},
      })
    }
    return tt
  }

  for (const targetTypeName of ALL_TARGET_TYPES) {
    await upsertTargetType(targetTypeName)
  }

  console.log('Target types seeded')

  // Resolve the two target types needed for departments and companies below
  const departmentTargetType = await prisma.targetType.findFirst({where: {name: 'Department'}})!
  const companyTargetType = await prisma.targetType.findFirst({where: {name: 'Company'}})!

  // 8. Upsert UrgencyTypes
  for (const name of URGENCY_TYPES) {
    const existing = await prisma.urgencyType.findFirst({where: {name}})
    if (!existing) {
      await prisma.urgencyType.create({
        data: {
          id: randomUUID(),
          name,
          createdAt: now,
          createdBy: adminEmployee.id,
          deleted: false,
        },
      })
    }
  }

  console.log('Urgency types seeded')

  // 9. Upsert Statuses
  for (const name of STATUSES) {
    const existing = await prisma.status.findFirst({where: {name}})
    if (!existing) {
      await prisma.status.create({
        data: {
          id: randomUUID(),
          name,
          createdAt: now,
          createdBy: adminEmployee.id,
          deleted: false,
        },
      })
    }
  }

  console.log('Statuses seeded')

  // 10. Upsert FollowUpTypes
  for (const name of FOLLOW_UP_TYPES) {
    const existing = await prisma.followUpType.findFirst({where: {name}})
    if (!existing) {
      await prisma.followUpType.create({
        data: {
          id: randomUUID(),
          name,
          createdAt: now,
          createdBy: adminEmployee.id,
          deleted: false,
        },
      })
    }
  }

  console.log('Follow-up types seeded')

  // 11. Upsert Departments + Department Roles + RoleLevels + Targets
  for (const dept of ALL_DEPARTMENTS) {
    const existingDept = await prisma.department.findFirst({where: {name: dept.name}})
    if (existingDept) continue

    const deptTarget = await prisma.target.create({
      data: {
        id: randomUUID(),
        createdAt: now,
        createdBy: adminEmployee.id,
        targetTypeId: departmentTargetType!.id,
      },
    })

    await prisma.department.create({
      data: {
        id: randomUUID(),
        name: dept.name,
        color: dept.color,
        icon: dept.icon,
        description: dept.description,
        number: dept.number,
        createdAt: now,
        createdBy: adminEmployee.id,
        targetId: deptTarget.id,
      },
    })

    const departmentRole = await prisma.role.create({
      data: {
        id: randomUUID(),
        name: `${dept.name} Role`,
        createdAt: now,
        createdBy: adminEmployee.id,
      },
    })

    for (const sub of SUB_ROLES) {
      await prisma.roleLevel.create({
        data: {
          id: randomUUID(),
          roleId: departmentRole.id,
          subRoleId: createdSubRoles[sub.name].id,
          createdAt: now,
          createdBy: adminEmployee.id,
        },
      })

      await prisma.visibilityForRole.create({
        data: {
          id: randomUUID(),
          visible: true,
          roleLevelId: adminRoleLevel.id,
          targetId: deptTarget.id,
        },
      })
    }
  }

  console.log('Departments, Roles, SubRoles, RoleLevels, Targets, and VisibilityForRole seeded')

  // 12. Upsert default Titles
  const DEFAULT_TITLES = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'Ir.']

  for (const titleName of DEFAULT_TITLES) {
    const existing = await prisma.title.findFirst({where: {name: titleName}})
    if (!existing) {
      await prisma.title.create({
        data: {
          id: randomUUID(),
          name: titleName,
          createdAt: now,
          createdBy: adminEmployee.id,
          deleted: false,
        },
      })
    }
  }

  console.log('Default titles seeded')

  // 13. Upsert Becra company
  let becraCompany = await prisma.company.findFirst({where: {name: 'Becra BV'}})
  if (!becraCompany) {
    const becraTarget = await prisma.target.create({
      data: {
        id: randomUUID(),
        createdAt: now,
        createdBy: adminEmployee.id,
        targetTypeId: companyTargetType!.id,
      },
    })

    becraCompany = await prisma.company.create({
      data: {
        id: randomUUID(),
        name: 'Becra BV',
        number: 'BECRA-001',
        mail: 'info@becra.be',
        businessPhone: '+32 495 19 43 68',
        website: 'https://www.becra.be',
        companyActive: true,
        headQuarters: true,
        customer: false,
        supplier: false,
        createdAt: now,
        createdBy: adminEmployee.id,
        targetId: becraTarget.id,
      },
    })

    await prisma.companyAdress.create({
      data: {
        id: randomUUID(),
        street: 'Nijverheidsstraat',
        houseNumber: '14',
        zipCode: '2400',
        place: 'Mol',
        typeAdress: 'headquarters',
        createdAt: now,
        createdBy: adminEmployee.id,
        companyId: becraCompany.id,
      },
    })
  }

  console.log('Becra company and address seeded')

  // 14. Upsert project types
  for (const pt of PROJECT_TYPES) {
    const existing = await prisma.projectType.findFirst({where: {name: pt.name}})
    if (!existing) {
      await prisma.projectType.create({
        data: {
          id: randomUUID(),
          name: pt.name,
          createdAt: now,
          createdBy: adminEmployee.id,
          deleted: false,
        },
      })
    }
  }

  console.log('Project types seeded')

  // 15. Upsert default hour types
  const DEFAULT_HOUR_TYPES = [
    {name: 'Regular Hours', info: 'Standard working hours'},
    {name: 'Overtime 150%', info: 'Overtime paid at 150%'},
    {name: 'Overtime 200%', info: 'Overtime paid at 200%'},
    {name: 'Vacation', info: 'Paid vacation leave'},
    {name: 'Sick Leave', info: 'Employee sick leave'},
    {name: 'Training', info: 'Internal or external training hours'},
    {name: 'Public Holiday', info: 'Official public holiday'},
    {name: 'Unpaid Leave', info: 'Approved unpaid leave'},
  ]

  for (const ht of DEFAULT_HOUR_TYPES) {
    const existing = await prisma.hourType.findFirst({where: {name: ht.name}})
    if (!existing) {
      await prisma.hourType.create({
        data: {
          id: randomUUID(),
          name: ht.name,
          info: ht.info,
          createdAt: now,
          createdBy: adminEmployee.id,
          deleted: false,
        },
      })
    }
  }

  console.log('Default hour types seeded')

  // 16. Upsert MaterialGroups
  const MATERIAL_GROUPS = [
    {groupA: 'Electrical', groupB: 'Component', groupC: 'Power', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'HMI', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Switch', groupC: 'Safety', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Switch', groupC: 'Differential', groupD: 'Other'},
    {groupA: 'Automation', groupB: 'PLC', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Relay', groupC: 'Safety', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Relay', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Motor', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Wire', groupC: 'Other', groupD: '0,5mm'},
    {groupA: 'Electrical', groupB: 'Cable', groupC: 'Communication', groupD: 'Other'},
    {groupA: 'Tools', groupB: 'Electrical', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Fasteners', groupB: 'Nut', groupC: 'STL', groupD: 'M5'},
    {groupA: 'Tools', groupB: 'Mechanical', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Mechanical', groupB: 'Plate material', groupC: 'Other', groupD: 'STL - Steel'},
    {groupA: 'Mechanical', groupB: 'Plate material', groupC: 'Other', groupD: 'Wood'},
    {groupA: 'Mechanical', groupB: 'Plate material', groupC: 'Other', groupD: 'Plastic'},
    {groupA: 'Solvents', groupB: 'Gas', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Insurance', groupB: 'Other', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Mechanical', groupB: 'Plate material', groupC: 'Other', groupD: 'ALU - Aluminium'},
    {groupA: 'Solvents', groupB: 'Paints and lubricants', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Software', groupB: 'Other', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Mechanical', groupB: 'Plate material', groupC: 'Other', groupD: 'SS - Stainless steel'},
    {groupA: 'Mechanical', groupB: 'Plate material', groupC: 'Other', groupD: 'CU - Copper'},
    {groupA: 'Fasteners', groupB: 'Nut', groupC: 'SS', groupD: 'M5'},
    {groupA: 'Fasteners', groupB: 'Nut', groupC: 'STL', groupD: 'M6'},
    {groupA: 'Fasteners', groupB: 'Nut', groupC: 'STL', groupD: 'M8'},
    {groupA: 'Fasteners', groupB: 'Nut', groupC: 'STL', groupD: 'M10'},
    {groupA: 'Fasteners', groupB: 'Nut', groupC: 'STL', groupD: 'M12'},
    {groupA: 'Fasteners', groupB: 'Nut', groupC: 'STL', groupD: 'M16'},
    {groupA: 'Fasteners', groupB: 'Nut', groupC: 'STL', groupD: 'M18'},
    {groupA: 'Fasteners', groupB: 'Nut', groupC: 'STL', groupD: 'M20'},
    {groupA: 'Fasteners', groupB: 'Nut', groupC: 'STL', groupD: 'Other'},
    {groupA: 'Fasteners', groupB: 'Nut', groupC: 'SS', groupD: 'M6'},
    {groupA: 'Fasteners', groupB: 'Nut', groupC: 'SS', groupD: 'M8'},
    {groupA: 'Fasteners', groupB: 'Nut', groupC: 'SS', groupD: 'M10'},
    {groupA: 'Fasteners', groupB: 'Nut', groupC: 'SS', groupD: 'M12'},
    {groupA: 'Fasteners', groupB: 'Nut', groupC: 'SS', groupD: 'M16'},
    {groupA: 'Fasteners', groupB: 'Nut', groupC: 'SS', groupD: 'M18'},
    {groupA: 'Fasteners', groupB: 'Nut', groupC: 'SS', groupD: 'M20'},
    {groupA: 'Fasteners', groupB: 'Nut', groupC: 'SS', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Sleeve/Shoe', groupC: 'Wire', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Wire', groupC: 'Other', groupD: '0,75mm'},
    {groupA: 'Electrical', groupB: 'Wire', groupC: 'Other', groupD: '1mm'},
    {groupA: 'Electrical', groupB: 'Wire', groupC: 'Other', groupD: '1,5mm'},
    {groupA: 'Electrical', groupB: 'Wire', groupC: 'Other', groupD: '2,5mm'},
    {groupA: 'Electrical', groupB: 'Wire', groupC: 'Other', groupD: '4mm'},
    {groupA: 'Electrical', groupB: 'Wire', groupC: 'Other', groupD: '6mm'},
    {groupA: 'Electrical', groupB: 'Wire', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Cable', groupC: 'Multicore', groupD: '0,5mm'},
    {groupA: 'Electrical', groupB: 'Cable', groupC: 'Multicore', groupD: '0,75mm'},
    {groupA: 'Electrical', groupB: 'Cable', groupC: 'Multicore', groupD: '1,5mm'},
    {groupA: 'Electrical', groupB: 'Cable', groupC: 'Multicore', groupD: '2,5mm'},
    {groupA: 'Electrical', groupB: 'Cable', groupC: 'Multicore', groupD: '4mm'},
    {groupA: 'Electrical', groupB: 'Cable', groupC: 'Multicore', groupD: '6mm'},
    {groupA: 'Electrical', groupB: 'Cable', groupC: 'Multicore', groupD: '10mm'},
    {groupA: 'Electrical', groupB: 'Cable', groupC: 'Multicore', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Fuse', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Mechanical', groupB: 'Bearing', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Mechanical', groupB: 'Sealing', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Mechanical', groupB: 'Profile', groupC: 'Other', groupD: 'ALU - Aluminium'},
    {groupA: 'Mechanical', groupB: 'Profile', groupC: 'Other', groupD: 'CU - Copper'},
    {groupA: 'Mechanical', groupB: 'Profile', groupC: 'Other', groupD: 'STL - Steel'},
    {groupA: 'Mechanical', groupB: 'Profile', groupC: 'Other', groupD: 'Plastic'},
    {groupA: 'Mechanical', groupB: 'Profile', groupC: 'Other', groupD: 'SS - Stainless steel'},
    {groupA: 'Electrical', groupB: 'Component', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Mechanical', groupB: 'Plate material', groupC: 'Other', groupD: 'C STL- Corten Steel'},
    {groupA: 'Electrical', groupB: 'Component', groupC: 'Terminal', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Support', groupC: 'Duct/Ladder', groupD: 'Duct/Ladder'},
    {groupA: 'Electrical', groupB: 'Frequency_Drive', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Surcharge', groupB: 'Transport', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Office', groupB: 'Paper', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Office', groupB: 'Copies', groupC: 'Copies', groupD: 'Other'},
    {groupA: 'Office', groupB: 'Copies', groupC: 'Printer', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Profile', groupC: 'DIN rail', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Switch', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Cabinet', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Gland', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Mechanical', groupB: 'Component', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Cable', groupC: 'Multicore', groupD: '1mm'},
    {groupA: 'Electrical', groupB: 'Bolts and Nuts', groupC: 'Screws', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Bolts and Nuts', groupC: 'Iron', groupD: 'Other'},
    {groupA: 'PPE', groupB: 'PPE', groupC: 'PPE', groupD: 'PPE'},
    {groupA: 'Project', groupB: 'Project ID Part', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Project', groupB: 'Project Parent Part', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Component', groupC: 'Atex', groupD: 'Other'},
    {groupA: 'Fasteners', groupB: 'Blind Rivet', groupC: 'STL', groupD: 'All Diameters'},
    {groupA: 'Tools', groupB: 'Mechanical', groupC: 'Drill/Tap', groupD: 'Other'},
    {groupA: 'Surcharge', groupB: 'Small order', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Surcharge', groupB: 'Count Pieces', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Tape', groupB: 'Other', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Component', groupC: 'Surge Protector', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Component', groupC: 'Marking', groupD: 'Marking Holder'},
    {groupA: 'Mobile Equipment', groupB: 'Tires', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Light', groupC: 'Standard', groupD: 'Led'},
    {groupA: 'Solvents', groupB: 'Personal Cleaning', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Process', groupB: 'Valve', groupC: 'Solenoid', groupD: 'Standard'},
    {groupA: 'Electrical', groupB: 'Component', groupC: 'Atex', groupD: 'Fire detection'},
    {groupA: 'Electrical', groupB: 'Light', groupC: 'Atex', groupD: 'Buld/TL'},
    {groupA: 'Electrical', groupB: 'Fan', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Process', groupB: 'Sensor', groupC: 'Measurement', groupD: 'Other'},
    {groupA: 'Process', groupB: 'Sensor', groupC: 'Gas', groupD: 'Other'},
    {groupA: 'Process', groupB: 'Valve', groupC: 'Atex', groupD: 'Solenoid'},
    {groupA: 'Process', groupB: 'Valve', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Gas', groupB: 'Gas', groupC: 'Gas', groupD: 'Gas'},
    {groupA: 'Process', groupB: 'Tubing', groupC: 'Tube', groupD: 'Imperial (All Dia)'},
    {groupA: 'Process', groupB: 'Filter', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Process', groupB: 'Measurement', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Process', groupB: 'Vessel', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Process', groupB: 'Tubing', groupC: 'Tube', groupD: 'Metric (All Dia)'},
    {groupA: 'Electrical', groupB: 'Cable', groupC: 'Atex', groupD: '2,5mm'},
    {groupA: 'Electrical', groupB: 'Cable', groupC: 'Atex', groupD: '0,75mm'},
    {groupA: 'Electrical', groupB: 'Gland', groupC: 'Atex', groupD: 'M12X1'},
    {groupA: 'Electrical', groupB: 'Battery', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Process', groupB: 'Valve', groupC: 'Atex', groupD: 'Pneumatic'},
    {groupA: 'Electrical', groupB: 'Gland', groupC: 'Atex', groupD: 'Exi'},
    {groupA: 'Electrical', groupB: 'Gland', groupC: 'Atex', groupD: 'Exe'},
    {groupA: 'Electrical', groupB: 'Transmitter', groupC: 'Atex', groupD: 'Other'},
    {groupA: 'Process', groupB: 'Relief valve', groupC: 'Low Pressure', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Ferrule', groupC: '0.5 mm²', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Ferrule', groupC: 'Other', groupD: '0.75 mm²'},
    {groupA: 'Electrical', groupB: 'Ferrule', groupC: '1 mm²', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Ferrule', groupC: '1.5 mm²', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Ferrule', groupC: '2 mm²', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Ferrule', groupC: '2.5 mm²', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Ferrule', groupC: '4 mm²', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Ferrule', groupC: '6 mm²', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Ferrule', groupC: '10 mm²', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Ferrule', groupC: '16 mm²', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Ferrule', groupC: '25 mm²', groupD: 'Other'},
    {groupA: 'Process', groupB: 'Tubing', groupC: 'Connector', groupD: 'Metric (All Dia)'},
    {groupA: 'Electrical', groupB: 'Connector', groupC: 'Spring Cage Terminal', groupD: 'Other'},
    {groupA: 'PPE', groupB: 'Electrical', groupC: 'Arc Flash', groupD: 'Other'},
    {groupA: 'PPE', groupB: 'Mechanical', groupC: 'Other', groupD: 'Other'},
    {groupA: 'PPE', groupB: 'Electrical', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Tools', groupB: 'Electrical', groupC: 'Angle Grinder', groupD: '125mm'},
    {groupA: 'Tools', groupB: 'Electrical', groupC: 'Hot Air Gun', groupD: 'Other'},
    {groupA: 'Mechanical', groupB: 'Air Pressure', groupC: 'Vessel', groupD: 'Galvanized'},
    {groupA: 'Mechanical', groupB: 'Air Pressure', groupC: 'Fitting Set', groupD: 'Other'},
    {groupA: 'Tools', groupB: 'Electrical', groupC: 'Extension cord', groupD: '2f 250V 2,5mm²'},
    {groupA: 'Tools', groupB: 'Electrical', groupC: 'Extension cord', groupD: '3f 400V 2,5mm²'},
    {groupA: 'Electrical', groupB: 'Connector', groupC: 'Plug (Male)', groupD: '250V'},
    {groupA: 'Electrical', groupB: 'Connector', groupC: 'Plug (Male)', groupD: '400V'},
    {groupA: 'Electrical', groupB: 'Connector', groupC: 'Plug (Female)', groupD: '250V'},
    {groupA: 'Electrical', groupB: 'Connector', groupC: 'Plug (Female)', groupD: '400V'},
    {groupA: 'Electrical', groupB: 'Extension cord', groupC: '250V', groupD: '1,5mm²'},
    {groupA: 'Tools', groupB: 'Electrical', groupC: 'Impact Drill', groupD: 'Cordless'},
    {groupA: 'Tools', groupB: 'Electrical', groupC: 'Screwing Machine', groupD: 'Cordless'},
    {groupA: 'Tools', groupB: 'Electrical', groupC: 'Battery Charger', groupD: 'Other'},
    {groupA: 'Tools', groupB: 'Electrical', groupC: 'Impact Drill', groupD: 'With Cord'},
    {groupA: 'Tools', groupB: 'Electrical', groupC: 'Pump', groupD: 'Barrel Pump'},
    {groupA: 'Tools', groupB: 'Mechanical', groupC: 'Ladder', groupD: 'Other'},
    {groupA: 'Tools', groupB: 'Electrical', groupC: 'Cleaner', groupD: 'Other'},
    {groupA: 'Process', groupB: 'Component', groupC: 'Pressure Gauge', groupD: '0-40Bar'},
    {groupA: 'Tools', groupB: 'Process', groupC: 'Test stand', groupD: 'Pressure test'},
    {groupA: 'Process', groupB: 'Seal', groupC: 'ePTFE', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Actuator', groupC: 'Valve', groupD: 'Other'},
    {groupA: 'Process', groupB: 'Sensor', groupC: 'Temperature', groupD: 'Pt100'},
    {groupA: 'Electrical', groupB: 'Heater', groupC: 'Fan Heater', groupD: 'Other'},
    {groupA: 'Chemical', groupB: 'Treatment', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Plastic', groupB: 'PVC', groupC: 'PVC-U', groupD: 'Other'},
    {groupA: 'Solvents', groupB: 'Cleaner', groupC: 'Oxygen', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Support', groupC: 'Duct/Ladder', groupD: 'Attachments'},
    {groupA: 'Tools', groupB: 'Mechanical', groupC: 'Cutter', groupD: 'Cable'},
    {groupA: 'Tools', groupB: 'Mechanical', groupC: 'Cutter', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Insulator', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Chemical', groupB: 'Paste', groupC: 'Anchoring', groupD: 'Other'},
    {groupA: 'Office', groupB: 'Furniture', groupC: 'Chair', groupD: 'Other'},
    {groupA: 'Tools', groupB: 'Process', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Tools', groupB: 'Pneumatic', groupC: 'Pump', groupD: 'Other'},
    {groupA: 'Office', groupB: 'IT', groupC: 'Computer', groupD: 'Other'},
    {groupA: 'Fasteners', groupB: 'Blind Rivet Nut', groupC: 'STL', groupD: 'All Diameters'},
    {groupA: 'Chemical', groupB: 'Plastic', groupC: 'Hard tissue', groupD: 'Celleron'},
    {groupA: 'Automation', groupB: 'PLC', groupC: 'CPU', groupD: 'Other'},
    {groupA: 'Automation', groupB: 'PLC', groupC: 'I/O Systems', groupD: 'DO'},
    {groupA: 'Automation', groupB: 'PLC', groupC: 'I/O Systems', groupD: 'DI'},
    {groupA: 'Automation', groupB: 'PLC', groupC: 'I/O Systems', groupD: 'AO'},
    {groupA: 'Automation', groupB: 'PLC', groupC: 'I/O Systems', groupD: 'AI'},
    {groupA: 'Automation', groupB: 'PLC', groupC: 'I/O Systems', groupD: 'Filter'},
    {groupA: 'Automation', groupB: 'PLC', groupC: 'I/O Systems', groupD: 'Fail Safe / PROFI safe'},
    {groupA: 'Automation', groupB: 'PLC', groupC: 'I/O Systems', groupD: 'Intrinsically Safe'},
    {groupA: 'Automation', groupB: 'PLC', groupC: 'I/O Systems', groupD: 'RTD'},
    {groupA: 'Automation', groupB: 'PLC', groupC: 'I/O Systems', groupD: 'End Module'},
    {groupA: 'Fasteners', groupB: 'Screws', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Tools', groupB: 'Transport', groupC: 'Transport', groupD: 'Transport'},
    {groupA: 'Mechanical', groupB: 'Profile', groupC: 'C Shape', groupD: 'STL - Steel'},
    {groupA: 'Mechanical', groupB: 'Profile', groupC: 'C Shape', groupD: 'SS - Stainless steel'},
    {groupA: 'Electrical', groupB: 'Profile', groupC: 'C Shape', groupD: 'STL - Steel'},
    {groupA: 'Electrical', groupB: 'Clamp', groupC: 'Cable clamp', groupD: 'Placement Clamp'},
    {groupA: 'Electrical', groupB: 'Clamp', groupC: 'Cable clamp', groupD: 'Connection Clamp'},
    {groupA: 'Electrical', groupB: 'Busbar', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Electrical', groupB: 'Bracket', groupC: 'Other', groupD: 'Other'},
    {groupA: 'Fasteners', groupB: 'Bolt', groupC: 'STL', groupD: 'M5'},
    {groupA: 'Fasteners', groupB: 'Bolt', groupC: 'SS', groupD: 'M5'},
    {groupA: 'Fasteners', groupB: 'Bolt', groupC: 'STL', groupD: 'M6'},
    {groupA: 'Fasteners', groupB: 'Bolt', groupC: 'STL', groupD: 'M8'},
    {groupA: 'Fasteners', groupB: 'Bolt', groupC: 'STL', groupD: 'M10'},
    {groupA: 'Fasteners', groupB: 'Bolt', groupC: 'STL', groupD: 'M12'},
    {groupA: 'Fasteners', groupB: 'Bolt', groupC: 'STL', groupD: 'M16'},
    {groupA: 'Fasteners', groupB: 'Bolt', groupC: 'STL', groupD: 'M18'},
    {groupA: 'Fasteners', groupB: 'Bolt', groupC: 'STL', groupD: 'M20'},
    {groupA: 'Fasteners', groupB: 'Bolt', groupC: 'STL', groupD: 'Other'},
    {groupA: 'Fasteners', groupB: 'Bolt', groupC: 'SS', groupD: 'M6'},
    {groupA: 'Fasteners', groupB: 'Bolt', groupC: 'SS', groupD: 'M8'},
    {groupA: 'Fasteners', groupB: 'Bolt', groupC: 'SS', groupD: 'M10'},
    {groupA: 'Fasteners', groupB: 'Bolt', groupC: 'SS', groupD: 'M12'},
    {groupA: 'Fasteners', groupB: 'Bolt', groupC: 'SS', groupD: 'M16'},
    {groupA: 'Fasteners', groupB: 'Bolt', groupC: 'SS', groupD: 'M18'},
    {groupA: 'Fasteners', groupB: 'Bolt', groupC: 'SS', groupD: 'M20'},
    {groupA: 'Fasteners', groupB: 'Bolt', groupC: 'SS', groupD: 'Other'},
    {groupA: 'Fasteners', groupB: 'Washer', groupC: 'SS', groupD: 'All'},
    {groupA: 'Fasteners', groupB: 'Washer', groupC: 'STL', groupD: 'All'},
    {groupA: 'Electrical', groupB: 'Cable', groupC: 'Single core', groupD: 'Other'},
    {groupA: 'Process', groupB: 'Tubing', groupC: 'Union', groupD: 'Metric (All Dia)'},
    {groupA: 'Process', groupB: 'Regulator', groupC: 'Backpressure regulator', groupD: 'Other'},
    {groupA: 'Process', groupB: 'Check valve', groupC: 'Low Pressure', groupD: 'Other'},
    {groupA: 'Process', groupB: 'Valve', groupC: 'Needle Valve', groupD: 'Other'},
    {groupA: 'Process', groupB: 'Valve', groupC: 'Ball Valve', groupD: 'Other'},
    {groupA: 'Process', groupB: 'Tubing', groupC: 'Tubing Support', groupD: 'Metric (All Dia)'},
    {groupA: 'Tools', groupB: 'Mechanical', groupC: 'Pliers', groupD: 'Water Pump Pliers'},
    {groupA: 'Tools', groupB: 'Mechanical', groupC: 'Pliers', groupD: 'Wrench Pliers'},
    {groupA: 'Tools', groupB: 'Mechanical', groupC: 'Wrench', groupD: 'Adjustable'},
    {groupA: 'Tools', groupB: 'Mechanical', groupC: 'Wrench', groupD: 'Allen Key'},
    {groupA: 'Tools', groupB: 'Mechanical', groupC: 'Pliers', groupD: 'Combination Pliers'},
    {groupA: 'Process', groupB: 'Tubing', groupC: 'Adapter', groupD: 'Metric (All Dia)'},
    {groupA: 'Process', groupB: 'Tubing', groupC: 'Cap', groupD: 'Metric (All Dia)'},
    {groupA: 'Process', groupB: 'Tubing', groupC: 'Plugs', groupD: 'Metric (All Dia)'},
    {groupA: 'Process', groupB: 'Tubing', groupC: 'Ferrule', groupD: 'Metric (All Dia)'},
  ]

  const createdMaterialGroups: string[] = []

  for (const mg of MATERIAL_GROUPS) {
    let existing = await prisma.materialGroup.findFirst({
      where: {groupA: mg.groupA, groupB: mg.groupB, groupC: mg.groupC, groupD: mg.groupD},
    })
    if (!existing) {
      existing = await prisma.materialGroup.create({
        data: {
          id: randomUUID(),
          groupA: mg.groupA,
          groupB: mg.groupB,
          groupC: mg.groupC,
          groupD: mg.groupD,
          deleted: false,
        },
      })
    }
    createdMaterialGroups.push(existing.id)
  }

  console.log('MaterialGroups seeded')

  // 17. Upsert Units
  const UNITS = [
    {name: 'Piece', quantity: 1, abbreviation: 'pcs', shortDescription: 'Single piece'},
    {name: 'Meter', quantity: 1, abbreviation: 'm', shortDescription: 'Length in meters'},
    {name: 'Kilogram', quantity: 1, abbreviation: 'kg', shortDescription: 'Weight in kilograms'},
    {name: 'Box', quantity: 1, abbreviation: 'box', shortDescription: 'Box quantity'},
  ]

  const createdUnits: string[] = []

  for (const unit of UNITS) {
    let existing = await prisma.unit.findFirst({where: {abbreviation: unit.abbreviation}})
    if (!existing) {
      existing = await prisma.unit.create({
        data: {
          id: randomUUID(),
          unitName: unit.name,
          physicalQuantity: unit.quantity.toString(),
          abbreviation: unit.abbreviation,
          shortDescription: unit.shortDescription,
          longDescription: unit.shortDescription,
          valid: true,
          createdBy: adminEmployee.id,
          createdAt: now,
          deleted: false,
        },
      })
    }
    createdUnits.push(existing.id)
  }

  console.log('Units seeded')

  // 18. Upsert Materials
  const MATERIALS = [
    {
      beNumber: '1000173',
      name: 'Metaldrill 8mm',
      shortDescription: 'Wire H07V2-K 0,5 blue',
      longDescription: 'Wire H05V-K 0,5 blue \n' + 'Type: VTB-ST ECA 0,5 Blue D100 ',
      brandName: 'EUPEN',
      preferredSupplier: 'EUPEN',
    },
    {
      beNumber: 'BE-MAT-0002',
      name: 'Hex Nut M10',
      shortDescription: 'M10 hex nut',
      longDescription: 'Standard steel hex nut M10',
      brandName: 'Fabory',
      preferredSupplier: 'Fabory',
    },
    {
      beNumber: 'BE-MAT-0003',
      name: 'Power Cable 3G2.5',
      shortDescription: 'Power cable 3G2.5mm²',
      longDescription: 'Flexible copper power cable',
      brandName: 'Nexans',
      preferredSupplier: 'Nexans',
    },
    {
      beNumber: 'BE-MAT-0004',
      name: 'Industrial Switch',
      shortDescription: '24V industrial switch',
      longDescription: 'Heavy duty industrial control switch',
      brandName: 'Siemens',
      preferredSupplier: 'Siemens',
    },
    {
      beNumber: 'BE-MAT-0005',
      name: 'Hydraulic Coupling',
      shortDescription: 'Quick hydraulic coupling',
      longDescription: 'High pressure quick connect coupling',
      brandName: 'Parker',
      preferredSupplier: 'Parker',
    },
  ]

  let brandOrderCounter = (await prisma.material.count()) + 1

  for (let i = 0; i < MATERIALS.length; i++) {
    const mat = MATERIALS[i]
    const existing = await prisma.material.findFirst({where: {beNumber: mat.beNumber}})
    if (!existing) {
      await prisma.material.create({
        data: {
          id: randomUUID(),
          beNumber: mat.beNumber,
          name: mat.name,
          brandOrderNr: brandOrderCounter++,
          shortDescription: mat.shortDescription,
          longDescription: mat.longDescription,
          preferredSupplier: mat.preferredSupplier,
          brandName: mat.brandName,
          documentationPlace: 'SharePoint',
          bePartDoc: null,
          rejected: false,
          materialGroupId: createdMaterialGroups[i % createdMaterialGroups.length],
          unitId: createdUnits[i % createdUnits.length],
          createdBy: adminEmployee.id,
          deleted: false,
        },
      })
    }
  }

  console.log('Materials seeded')

  // 19. Upsert Warehouse Places
  const warehousePlaces = [
    {
      abbreviation: 'W140C800R70',
      beNumber: '1000943',
      serialTrackedId: 'RX2345',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 3,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C800R60',
      beNumber: '1000950',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 10,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C800R50',
      beNumber: '1000947',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 5,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C800R70b',
      beNumber: '1000944',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 7,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W100 Workshop',
      beNumber: '',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 0,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: 'Hall where people come in via the main door.',
    },
    {
      abbreviation: 'W110 TrainingSpace',
      beNumber: '',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 0,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: 'Space left (double green door)',
    },
    {
      abbreviation: 'W120 CompressorStorage',
      beNumber: '',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 0,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: 'Small space in the back (entering from the back)',
    },
    {
      abbreviation: 'W130 ChemicalStorage',
      beNumber: '',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 0,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: 'Small storage space, directly opposite the main door',
    },
    {
      abbreviation: 'W140 Warehouse',
      beNumber: '',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 0,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: 'Bigger storage space, on the right side of W130',
    },
    {
      abbreviation: 'W140C100R18',
      beNumber: '10001101',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 1,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W010',
      beNumber: '',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 0,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: 'previously bathroom 2',
    },
    {
      abbreviation: 'W020',
      beNumber: '',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 0,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: 'previously stockroom 1',
    },
    {
      abbreviation: 'W140C100R10',
      beNumber: '1001099',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 2,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C100R11',
      beNumber: '1001073',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 6,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C100R12',
      beNumber: '1001100',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 1,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C100R13',
      beNumber: '1000733',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 1,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C100R14',
      beNumber: '1000239',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 1,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W100C1',
      beNumber: '1000874',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 1,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C100R15',
      beNumber: '1001098',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 20,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C100R16',
      beNumber: '1001083',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 20,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C400R20',
      beNumber: '1000808',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 100,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C400R21',
      beNumber: '1000809',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 50,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C400R22',
      beNumber: '1000811',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 50,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C100R17',
      beNumber: '1000474',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 2,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C400R30',
      beNumber: '1000573',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 445,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C400C23',
      beNumber: '1000582',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 104,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C400C24',
      beNumber: '1000677',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 53,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C400R25',
      beNumber: '1000678',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 5,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C400R26',
      beNumber: '1001102',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 52,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C400R27',
      beNumber: '1001103',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 24,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C400C28',
      beNumber: '1001104',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 60,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C400R29',
      beNumber: '1001105',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 20,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C100R29a',
      beNumber: '1001106',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 8,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C100R29b',
      beNumber: '1001580',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 60,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C400C29c',
      beNumber: '1001107',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 50,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C100R30a',
      beNumber: '1000091',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 2,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C100R30b',
      beNumber: '1000078',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 3,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C100R30c',
      beNumber: '1000066',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 3,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C200R30d',
      beNumber: '1000067',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 4,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
    {
      abbreviation: 'W140C200R30e',
      beNumber: '1001108',
      serialTrackedId: '',
      place: 'Warehouse Nijverheidstraat 14',
      quantityInStock: 0,
      shelf: '',
      column: '',
      layer: '',
      layerPlace: '',
      information: '',
    },
  ]

  for (const wp of warehousePlaces) {
    const exists = await prisma.warehousePlace.findFirst({where: {abbreviation: wp.abbreviation}})
    if (!exists) {
      await prisma.warehousePlace.create({
        data: {
          id: randomUUID(),
          abbreviation: wp.abbreviation,
          beNumber: wp.beNumber || null,
          serialTrackedId: null,
          place: wp.place || null,
          shelf: wp.shelf || null,
          column: wp.column || null,
          layer: wp.layer || null,
          layerPlace: wp.layerPlace || null,
          information: wp.information || null,
          quantityInStock: wp.quantityInStock,
          createdAt: now,
          createdBy: adminEmployee.id,
          deleted: false,
        },
      })
    }
  }

  console.log('Warehouse places seeded')
  console.log('Seed complete')
}
