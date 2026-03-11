import 'server-only'
import {prismaClient} from '@/dal/prismaClient'
import type {Function} from '@/generated/prisma/client'

export async function getFunctions(): Promise<Function[] | null> {
  return prismaClient.function.findMany()
}
