import 'server-only'
import {prismaClient} from '@/dal/prismaClient'
import type {Title} from '@/generated/prisma/client'

export async function getTitles(): Promise<Title[] | null> {
  // Return titles sorted alphabetically for stable dropdown ordering.
  return prismaClient.title.findMany({orderBy: {name: 'asc'}})
}
