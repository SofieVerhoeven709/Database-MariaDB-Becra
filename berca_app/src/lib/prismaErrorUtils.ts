import {Prisma} from '@/generated/prisma/client'

export function isPrismaConnectivityError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true

  if (!(error instanceof Error)) return false

  return /Can't reach database server|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(error.message)
}

