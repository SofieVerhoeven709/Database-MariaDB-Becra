import 'server-only'
import {prismaClient} from '@/dal/prismaClient'
import type {Title} from '@/generated/prisma/client'

export async function getTitles(): Promise<Title[] | null> {
  return prismaClient.title.findMany()
}
