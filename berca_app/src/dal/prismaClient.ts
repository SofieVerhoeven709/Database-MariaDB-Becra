import {PrismaClient} from '@/generated/prisma/client'
const globalForPrisma = globalThis as unknown as {prisma: PrismaClient}

export const prismaClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'], // optional logging
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaClient
}
