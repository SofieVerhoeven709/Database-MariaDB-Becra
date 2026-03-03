import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

export async function getHourTypes() {
  return prismaClient.hourType.findMany({
    where: {deleted: false},
  })
}

export async function getHourTypeById(id: string) {
  return prismaClient.hourType.findUniqueOrThrow({
    where: {id},
  })
}
