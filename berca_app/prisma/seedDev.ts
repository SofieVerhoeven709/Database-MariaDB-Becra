import type {Prisma, PrismaClient} from '@/generated/prisma/client'
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

export const seedDev = async (prisma: PrismaClient) => {
  console.log('Running DEVELOPMENT seed (administrator)')
  const now = new Date()

  // 1. Create admin employee
  const adminEmployee = await prisma.employee.create({
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

  // 2. Create Administrator role
  const adminRole = await prisma.role.create({
    data: {
      id: randomUUID(),
      name: 'Administrator',
      createdAt: now,
      createdBy: adminEmployee.id,
    },
  })

  // 3. Create Administrator subRole
  const adminSubRole = await prisma.subRole.create({
    data: {
      id: randomUUID(),
      name: 'Administrator',
      createdAt: now,
      createdBy: adminEmployee.id,
    },
  })

  // 4. Create Administrator roleLevel
  const adminRoleLevel = await prisma.roleLevel.create({
    data: {
      id: randomUUID(),
      level: 100,
      roleId: adminRole.id,
      subRoleId: adminSubRole.id,
      createdAt: now,
      createdBy: adminEmployee.id,
    },
  })

  // 5. Attach admin roleLevel
  await prisma.employee.update({
    where: {id: adminEmployee.id},
    data: {roleLevelId: adminRoleLevel.id},
  })

  console.log('Administrator account created')

  // 6. Create shared subRoles
  for (const sub of SUB_ROLES) {
    const created = await prisma.subRole.create({
      data: {
        id: randomUUID(),
        name: sub.name,
        createdAt: now,
        createdBy: adminEmployee.id,
      },
    })
    createdSubRoles[sub.name] = {id: created.id, level: sub.level}
  }

  // 7. Create a default TargetType (needed for Departments)
  const defaultTargetType = await prisma.targetType.create({
    data: {
      id: randomUUID(),
      name: 'Department',
      createdAt: now,
      createdBy: adminEmployee.id,
    },
  })

  // 8. Create Departments + Department Roles + RoleLevels + Target
  for (const dept of ALL_DEPARTMENTS) {
    // Create Target for department
    const deptTarget = await prisma.target.create({
      data: {
        id: randomUUID(),
        createdAt: now,
        createdBy: adminEmployee.id,
        targetTypeId: defaultTargetType.id,
      },
    })

    // Create Department
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

    // Create Department Role
    const departmentRole = await prisma.role.create({
      data: {
        id: randomUUID(),
        name: `${dept.name} Role`,
        createdAt: now,
        createdBy: adminEmployee.id,
      },
    })

    // Create 4 roleLevels per department role
    for (const sub of SUB_ROLES) {
      const roleLevel = await prisma.roleLevel.create({
        data: {
          id: randomUUID(),
          level: sub.level,
          roleId: departmentRole.id,
          subRoleId: createdSubRoles[sub.name].id,
          createdAt: now,
          createdBy: adminEmployee.id,
        },
      })

      // ONLY Administrator sees all departments
      await prisma.visibilityForRole.create({
        data: {
          id: randomUUID(),
          visible: true,
          roleLevelId: adminRoleLevel.id, // admin sees all departments
          targetId: deptTarget.id,
        },
      })
    }
  }

  console.log('Departments, Roles, SubRoles, RoleLevels, Targets, and VisibilityForRole seeded')
  console.log('Total roleLevels created: 57 (14 × 4 + 1 Administrator)')
}
