import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

// Countries list for select inputs and filters.
export async function getCountries() {
  return prismaClient.country.findMany({
    // Only expose active records to the UI.
    where: {deleted: false},
    // Stable ordering for dropdowns.
    orderBy: {name: 'asc'},
    select: {id: true, name: true},
  })
}
