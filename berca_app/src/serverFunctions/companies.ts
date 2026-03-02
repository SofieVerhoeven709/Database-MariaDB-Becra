'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {
  createCompanySchema,
  updateCompanySchema,
  companyIdSchema,
  createCompanyAddressSchema,
  updateCompanyAddressSchema,
  companyAddressIdSchema,
} from '@/schemas/companySchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {createTargetForType} from '@/dal/targets'
import {upsertVisibilityRows} from '@/serverFunctions/visibilityForRoles'
import {generateCompanyNumber} from '@/lib/utils'

// ─── Company ──────────────────────────────────────────────────────────────────
export const createCompanyAction = protectedServerFunction({
  schema: createCompanySchema,
  functionName: 'Create company action',
  serverFn: async ({data: {addresses, visibilityForRoles, ...data}, logger, profile}) => {
    logger.info(`Creating company, createdBy: ${profile.id}`)

    const target = await createTargetForType('Company', profile.id)
    const companyId = crypto.randomUUID()
    const now = new Date()

    // Retry loop — regenerate number on unique constraint collision (P2002)
    let companyNumber = data.number || generateCompanyNumber()
    let attempts = 0

    while (attempts < 5) {
      try {
        await prismaClient.$transaction([
          prismaClient.company.create({
            data: {
              ...data,
              number: companyNumber,
              id: companyId,
              createdBy: profile.id,
              createdAt: now,
              targetId: target.id,
            },
          }),
          ...addresses.map(a =>
            prismaClient.companyAdress.create({
              data: {
                ...a,
                id: crypto.randomUUID(),
                companyId,
                createdBy: profile.id,
                createdAt: now,
              },
            }),
          ),
        ])
        break
      } catch (err: unknown) {
        const prismaErr = err as {code?: string}
        if (prismaErr.code === 'P2002') {
          attempts++
          companyNumber = generateCompanyNumber()
          continue
        }
        throw err
      }
    }

    if (attempts >= 5) {
      throw new Error('Failed to generate a unique company number after 5 attempts')
    }

    if (visibilityForRoles.length > 0) {
      await upsertVisibilityRows(target.id, visibilityForRoles)
    }

    logger.info(
      `Company created: ${companyId} with ${addresses.length} address(es) ` +
        `and ${visibilityForRoles.length} visibility row(s)`,
    )
    revalidatePath('/companies')
  },
})

export const updateCompanyAction = protectedServerFunction({
  schema: updateCompanySchema,
  functionName: 'Update company action',
  serverFn: async ({data: {id, visibilityForRoles, ...data}, logger}) => {
    const {targetId} = await prismaClient.company.findUniqueOrThrow({
      where: {id},
      select: {targetId: true},
    })

    await Promise.all([
      prismaClient.company.update({where: {id}, data}),
      upsertVisibilityRows(targetId, visibilityForRoles),
    ])

    logger.info(`Company updated: ${id} with ${visibilityForRoles.length} visibility row(s)`)
    revalidatePath('/companies')
  },
})

export const softDeleteCompanyAction = protectedServerFunction({
  schema: companyIdSchema,
  functionName: 'Soft delete company action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.company.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Company soft deleted: ${id}`)
    revalidatePath('/companies')
  },
})

export const hardDeleteCompanyAction = protectedServerFunction({
  schema: companyIdSchema,
  functionName: 'Hard delete company action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.company.delete({where: {id}})
    logger.info(`Company hard deleted: ${id}`)
    revalidatePath('/companies')
  },
})

export const undeleteCompanyAction = protectedServerFunction({
  schema: companyIdSchema,
  functionName: 'Undelete company action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.company.update({where: {id}, data: {deleted: false}})
    logger.info(`Company undeleted: ${id}`)
    revalidatePath('/companies')
  },
})

// ─── Company Address ──────────────────────────────────────────────────────────
export const createCompanyAddressAction = protectedServerFunction({
  schema: createCompanyAddressSchema,
  functionName: 'Create company address action',
  serverFn: async ({data, logger, profile}) => {
    const address = await prismaClient.companyAdress.create({
      data: {...data, id: crypto.randomUUID(), createdBy: profile.id, createdAt: new Date()},
    })
    logger.info(`Company address created: ${address.id}`)
    revalidatePath('/companies')
  },
})

export const updateCompanyAddressAction = protectedServerFunction({
  schema: updateCompanyAddressSchema,
  functionName: 'Update company address action',
  serverFn: async ({data: {id, ...data}, logger}) => {
    await prismaClient.companyAdress.update({where: {id}, data})
    logger.info(`Company address updated: ${id}`)
    revalidatePath('/companies')
  },
})

export const softDeleteCompanyAddressAction = protectedServerFunction({
  schema: companyAddressIdSchema,
  functionName: 'Soft delete company address action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.companyAdress.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Company address soft deleted: ${id}`)
    revalidatePath('/companies')
  },
})

export const hardDeleteCompanyAddressAction = protectedServerFunction({
  schema: companyAddressIdSchema,
  functionName: 'Hard delete company address action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.companyAdress.delete({where: {id}})
    logger.info(`Company address hard deleted: ${id}`)
    revalidatePath('/companies')
  },
})

export const undeleteCompanyAddressAction = protectedServerFunction({
  schema: companyAddressIdSchema,
  functionName: 'Undelete company address action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.companyAdress.update({where: {id}, data: {deleted: false}})
    logger.info(`Company address undeleted: ${id}`)
    revalidatePath('/companies')
  },
})
