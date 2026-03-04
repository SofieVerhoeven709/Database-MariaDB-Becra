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

  // 7. Create default TargetType for Departments
  // 7. Create one TargetType per table — reused for every target of that table
  const departmentTargetType = await prisma.targetType.create({
    data: {id: randomUUID(), name: 'Department', createdAt: now, createdBy: adminEmployee.id},
  })

  const companyTargetType = await prisma.targetType.create({
    data: {id: randomUUID(), name: 'Company', createdAt: now, createdBy: adminEmployee.id},
  })

  await prisma.targetType.create({
    data: {id: randomUUID(), name: 'Project', createdAt: now, createdBy: adminEmployee.id},
  })
  await prisma.targetType.create({
    data: {id: randomUUID(), name: 'WorkOrder', createdAt: now, createdBy: adminEmployee.id},
  })
  await prisma.targetType.create({
    data: {id: randomUUID(), name: 'WorkOrderStructure', createdAt: now, createdBy: adminEmployee.id},
  })
  await prisma.targetType.create({
    data: {id: randomUUID(), name: 'Contact', createdAt: now, createdBy: adminEmployee.id},
  })

  // 9. Create Departments + Department Roles + RoleLevels + Target
  for (const dept of ALL_DEPARTMENTS) {
    const deptTarget = await prisma.target.create({
      data: {
        id: randomUUID(),
        roleId: adminRole.id,
        subRoleId: adminSubRole.id,
        createdAt: now,
        createdBy: adminEmployee.id,
      },
    })
  }
  // 5. Attach admin roleLevel
  await prisma.employee.update({where: {id: adminEmployee.id}, data: {roleLevelId: adminRoleLevel.id}})
  console.log('Administrator account created')
  // 6. Upsert shared subRoles
  for (const sub of SUB_ROLES) {
    let existing = await prisma.subRole.findFirst({where: {name: sub.name, level: sub.level}})
    if (!existing) {
      existing = await prisma.subRole.create({
        data: {id: randomUUID(), name: sub.name, level: sub.level, createdAt: now, createdBy: adminEmployee.id},
      })
    }
    createdSubRoles[sub.name] = {id: existing.id, level: existing.level}
  }
  // 7. Upsert TargetTypes
  async function upsertTargetType(name: string) {
    let tt = await prisma.targetType.findFirst({where: {name}})
    if (!tt) {
      tt = await prisma.targetType.create({
        data: {id: randomUUID(), name, createdAt: now, createdBy: adminEmployee!.id},
      })
    }
    return tt
  }
  const departmentTargetType = await upsertTargetType('Department')
  const companyTargetType = await upsertTargetType('Company')
  await upsertTargetType('Project')
  await upsertTargetType('WorkOrder')
  await upsertTargetType('WorkOrderStructure')
  // 9. Upsert Departments + Roles + RoleLevels + Targets
  for (const dept of ALL_DEPARTMENTS) {
    const existingDept = await prisma.department.findFirst({where: {name: dept.name}})
    if (existingDept) continue
    const deptTarget = await prisma.target.create({
      data: {id: randomUUID(), createdAt: now, createdBy: adminEmployee.id, targetTypeId: departmentTargetType.id},
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
      data: {id: randomUUID(), name: `${dept.name} Role`, createdAt: now, createdBy: adminEmployee.id},
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
        data: {id: randomUUID(), visible: true, roleLevelId: adminRoleLevel.id, targetId: deptTarget.id},
      })
    }
  }
  // 10. Upsert default Titles
  const DEFAULT_TITLES = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'Ir.']
  for (const titleName of DEFAULT_TITLES) {
    const existing = await prisma.title.findFirst({where: {name: titleName}})
    if (!existing) {
      await prisma.title.create({
        data: {id: randomUUID(), name: titleName, createdAt: now, createdBy: adminEmployee.id, deleted: false},
      })
    }
  }
  console.log('Default titles seeded')
  // 11-12. Upsert Becra company
  let becraCompany = await prisma.company.findFirst({where: {name: 'Becra BV'}})
  if (!becraCompany) {
    const becraTarget = await prisma.target.create({
      data: {id: randomUUID(), createdAt: now, createdBy: adminEmployee.id, targetTypeId: companyTargetType.id},
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
    // 13. Create address only when company is new
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
        data: {id: randomUUID(), name: pt.name, createdAt: now, createdBy: adminEmployee.id, deleted: false},
      })
    }
  }
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
  console.log('Project types seeded')
  console.log('Departments, Roles, SubRoles, RoleLevels, Targets, and VisibilityForRole seeded')
  console.log('Total roleLevels created: 57 (14 x 4 + 1 Administrator)')
  console.log('NOTE: MaterialGroups, Units, Materials, and Performance Specs are managed via the frontend only.')
}
