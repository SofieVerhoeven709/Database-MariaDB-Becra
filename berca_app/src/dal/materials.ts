import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

export async function getMaterials() {
  return prismaClient.material.findMany({
    where: {deleted: false},
  })
}

export async function getMaterialById(id: string) {
  return prismaClient.material.findUniqueOrThrow({
    where: {id},
  })
}
