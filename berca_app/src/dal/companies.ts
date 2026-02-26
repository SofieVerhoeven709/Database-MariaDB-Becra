import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

export async function getCompanies() {
  return prismaClient.company.findMany()
}
