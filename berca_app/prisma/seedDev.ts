import type {Prisma, PrismaClient} from '@/generated/prisma/client'
import {randomUUID} from 'crypto'
import {hashPassword} from '@/lib/passwordUtils'

// Departments with icons and HEX colors
const ALL_DEPARTMENTS = [
  {
    name: 'General',
    description: 'Office coordination, scheduling, and general administration',
    icon: 'Clipboard',
    color: '#d9b94a',
    number: 1,
  },
  {
    name: 'Accounting',
    description: 'Financial records, audits, and reporting',
    icon: 'Calculator',
    color: '#f39c12',
    number: 2,
  },
  {
    name: 'Engineering',
    description: 'Development, deployments, and infrastructure',
    icon: 'Wrench',
    color: '#33998a',
    number: 3,
  },
  {
    name: 'Training',
    description: 'Employee development and learning programs',
    icon: 'BookOpen',
    color: '#6c5ce7',
    number: 4,
  },
  {
    name: 'Project',
    description: 'Project planning, timelines, and deliverables',
    icon: 'ClipboardList',
    color: '#fd79a8',
    number: 5,
  },
  {
    name: 'SHEQ',
    description: 'Safety, Health, Environment, and Quality',
    icon: 'ShieldCheck',
    color: '#e17055',
    number: 6,
  },
  {
    name: 'Human Resources',
    description: 'Employee records, recruitment, and onboarding',
    icon: 'Users',
    color: '#5c99cc',
    number: 7,
  },
  {
    name: 'Management',
    description: 'Leadership, strategy, and organizational planning',
    icon: 'Briefcase',
    color: '#00b894',
    number: 8,
  },
  {
    name: 'Database',
    description: 'Database administration and data integrity',
    icon: 'Database',
    color: '#0984e3',
    number: 9,
  },
  {
    name: 'Purchasing',
    description: 'Supplies, vendor management, and procurement',
    icon: 'ShoppingCart',
    color: '#fdcb6e',
    number: 10,
  },
  {
    name: 'Sales',
    description: 'Leads, deals, and customer acquisition',
    icon: 'TrendingUp',
    color: '#e84393',
    number: 11,
  },
  {
    name: 'PR',
    description: 'Public relations, media, and communications',
    icon: 'Megaphone',
    color: '#6c5ce7',
    number: 12,
  },
]

export const seedDev = async (prisma: PrismaClient) => {
  console.log('Running DEVELOPMENT seed (administrator)')

  const now = new Date()

  // Create admin employee
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

  // Create admin role
  const adminRole = await prisma.role.create({
    data: {
      id: randomUUID(),
      name: 'Administrator',
      level: 100,
      createdAt: now,
      createdBy: adminEmployee.id,
    },
  })

  await prisma.employee.update({
    where: {id: adminEmployee.id},
    data: {roleId: adminRole.id},
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
