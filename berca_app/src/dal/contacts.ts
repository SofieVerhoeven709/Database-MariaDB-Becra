import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

export async function getContacts() {
  return prismaClient.contact.findMany({
    where: {deleted: false},
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
    orderBy: [{lastName: 'asc'}, {firstName: 'asc'}],
  })
}
