import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

export async function getCountries() {
  return prismaClient.country.findMany({
    where: {deleted: false},
    orderBy: {name: 'asc'},
    select: {id: true, name: true},
  })
}
