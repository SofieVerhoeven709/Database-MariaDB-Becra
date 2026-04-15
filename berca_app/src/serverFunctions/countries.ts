'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {createCountrySchema} from '@/schemas/countrySchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'

// ─── Country ──────────────────────────────────────────────────────────────────
const _createCountryAction = protectedServerFunction({
  schema: createCountrySchema,
  functionName: 'Create country action',
  serverFn: async ({data: {name}, logger, profile}) => {
    await prismaClient.country.create({
      data: {
        id: crypto.randomUUID(),
        name,
        createdBy: profile.id,
        createdAt: new Date(),
      },
    })
    logger.info(`Country created by ${profile.id}: ${name}`)
    // Refresh cached country lists across layouts.
    revalidatePath('/', 'layout')
  },
})

export async function createCountryAction(data: {name: string}): Promise<{id: string; name: string}> {
  await _createCountryAction(data)
  // Read back the newest match to get the generated id.
  return prismaClient.country.findFirstOrThrow({
    where: {name: data.name},
    orderBy: {createdAt: 'desc'},
    select: {id: true, name: true},
  })
}
