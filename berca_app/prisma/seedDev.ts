import type {PrismaClient} from '@/generated/prisma/client'
import {randomUUID} from 'crypto'

const uuidToBytes = (uuid: string) => Buffer.from(uuid.replace(/-/g, ''), 'hex')

export const seedDev = async (prisma: PrismaClient) => {
  console.log('Running DEVELOPMENT seed (administrator)')

  const now = new Date()

  const adminEmployee = await prisma.employee.create({
    data: {
      id: uuidToBytes(randomUUID()),
      firstName: 'System',
      lastName: 'Administrator',
      mail: 'admin@yourapp.com',
      username: 'admin',
      password_hash: 'change-me',
      startDate: now,
      createdAt: now,
      passwordCreatedAt: now,
      permanentEmployee: true,
      active: true,
    },
  })

  const adminRole = await prisma.role.create({
    data: {
      id: uuidToBytes(randomUUID()),
      name: 'Administrator',
      level: 100,
      createdAt: now,
      createdBy: adminEmployee.id,
    },
  })

  await prisma.employee.update({
    where: {id: adminEmployee.id},
    data: {
      roleId: adminRole.id,
    },
  })

  console.log('Administrator account created')
}
