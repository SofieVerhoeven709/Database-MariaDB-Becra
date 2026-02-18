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
    name: 'Human Resources',
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
    color: '#ff9898',
    number: 11,
  },
  {
    name: 'Sales',
    description: 'Leads, deals, and customer acquisition',
    icon: 'TrendingUp',
    color: '#e84393',
    number: 12,
  },
  {
    name: 'PR',
    description: 'Public relations, media, and communications',
    icon: 'Megaphone',
    color: '#6c5ce7',
    number: 13,
  },
  {
    name: 'Product Quality',
    description: 'Product inspection, quality assurance, and standards compliance',
    icon: 'CheckCircle',
    color: '#cc6040',
    number: 14,
  },
]

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

  // 2. Create admin role
  const adminRole = await prisma.role.create({
    data: {
      id: randomUUID(),
      name: 'Administrator',
      createdAt: now,
      createdBy: adminEmployee.id,
    },
  })

  // 3. Create admin subRole
  const adminSubRole = await prisma.subRole.create({
    data: {
      id: randomUUID(),
      name: 'Administrator',
      createdAt: now,
      createdBy: adminEmployee.id,
    },
  })

  // 4. Create roleLevel linking Role and SubRole
  const adminRoleLevel = await prisma.roleLevel.create({
    data: {
      id: randomUUID(),
      level: 100, // highest level for admin
      roleId: adminRole.id,
      subRoleId: adminSubRole.id,
      createdAt: now,
      createdBy: adminEmployee.id,
    },
  })

  // 5. Update employee with roleLevel
  await prisma.employee.update({
    where: {id: adminEmployee.id},
    data: {roleLevelId: adminRoleLevel.id},
  })

  console.log('Administrator account created')

  // Seed departments
  for (const dept of ALL_DEPARTMENTS) {
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
      } as Prisma.DepartmentUncheckedCreateInput,
    })
  }

  console.log('Departments seeded with colors and icons')
}
