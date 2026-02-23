import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

export async function getTargets() {
  return prismaClient.target.findMany({
    include: {
      TargetType: true,
    },
  })
}
