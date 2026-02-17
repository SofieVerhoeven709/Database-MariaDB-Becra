import type {PrismaClient} from '@/generated/prisma/client'
import {randomUUID} from 'crypto'
import {hashPassword} from '@/lib/passwordUtils'

// Departments with icons and HEX colors
const ALL_DEPARTMENTS = [
  {
    id: 'finance',
    name: 'Finance',
    description: 'Budgets, invoices, and financial reports',
    icon: 'DollarSign',
    color: '#d9b94a',
  },
  {id: 'hr', name: 'Human Resources', description: 'Employee records and onboarding', icon: 'Users', color: '#5c99cc'},
  {
    id: 'engineering',
    name: 'Engineering',
    description: 'Development, deployments, and infrastructure',
    icon: 'Code',
    color: '#33998a',
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Campaigns, analytics, and brand assets',
    icon: 'Megaphone',
    color: '#cc6699',
  },
  {
    id: 'support',
    name: 'Customer Support',
    description: 'Tickets, live chat, and knowledge base',
    icon: 'HeadphonesIcon',
    color: '#8566cc',
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Access control, audits, and compliance',
    icon: 'ShieldCheck',
    color: '#cc6040',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Data insights and performance metrics',
    icon: 'BarChart3',
    color: '#4d78cc',
  },
  {
    id: 'operations',
    name: 'Operations',
    description: 'Workflows, logistics, and process management',
    icon: 'Package',
    color: '#4d9a70',
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
        createdAt: now,
        createdBy: adminEmployee.id,
      },
    })
  }

  console.log('Departments seeded with colors and icons')
}
