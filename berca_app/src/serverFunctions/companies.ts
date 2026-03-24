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
import {getCompanyAddresses} from '@/dal/companies'

// ─── Company ──────────────────────────────────────────────────────────────────
export const createCompanyAction = protectedServerFunction({
  schema: createCompanySchema,
  functionName: 'Create company action',
  serverFn: async ({data: {addresses, visibilityForRoles, ...data}, logger, profile}) => {
    logger.info(`Creating company, createdBy: ${profile.id}`)

    const target = await createTargetForType('Company', profile.id)
    const companyId = crypto.randomUUID()
    const now = new Date()

    // If a first address is provided with no typeAddress, default it to Headquarters.
    const normalizedAddresses = addresses.map((a, i) => ({
      ...a,
      typeAddress: i === 0 && !a.typeAddress ? 'Headquarters' : (a.typeAddress ?? null),
    }))

    // Retry loop — regenerate number on unique constraint collision (P2002)
    let companyNumber = data.number || generateCompanyNumber()
    let attempts = 0
    const invoiceContactId = crypto.randomUUID()
    const invoiceContactTarget = await createTargetForType('Contact', profile.id)

    while (attempts < 5) {
      try {
        const createdAddresses = await prismaClient.$transaction(async tx => {
          await tx.company.create({
            data: {
              ...data,
              number: companyNumber,
              id: companyId,
              createdBy: profile.id,
              createdAt: now,
              targetId: target.id,
            },
          })

          const addrs = await Promise.all(
            normalizedAddresses.map(a =>
              tx.companyAddress.create({
                data: {
                  ...a,
                  id: crypto.randomUUID(),
                  companyId,
                  createdBy: profile.id,
                  createdAt: now,
                },
              }),
            ),
          )

          // Create the invoice contact for this company
          await tx.contact.create({
            data: {
              id: invoiceContactId,
              firstName: data.name,
              lastName: 'invoice',
              active: true,
              infoCorrect: false,
              checkInfo: false,
              newYearCard: false,
              newsLetter: false,
              mailing: false,
              trainingAdvice: false,
              contactForTrainingAndAdvice: false,
              customerTrainingAndAdvice: false,
              potentialCustomerTrainingAndAdvice: false,
              potentialTeacherTrainingAndAdvice: false,
              teacherTrainingAndAdvice: false,
              participantTrainingAndAdvice: false,
              createdBy: profile.id,
              createdAt: now,
              targetId: invoiceContactTarget.id,
            },
          })

          // Link invoice contact to the company, auto-assign address if exactly one
          await tx.companyContact.create({
            data: {
              id: crypto.randomUUID(),
              contactId: invoiceContactId,
              companyId,
              roleWithCompany: 'invoice',
              companyAddressId: addrs.length === 1 ? addrs[0].id : null,
              startedDate: now,
              createdBy: profile.id,
              createdAt: now,
            },
          })

          return addrs
        })

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
    // If this is the first non-deleted address for the company, default typeAddress to Headquarters.
    const existingCount = await prismaClient.companyAddress.count({
      where: {companyId: data.companyId, deleted: false},
    })
    const normalizedData = {
      ...data,
      typeAddress: existingCount === 0 && !data.typeAddress ? 'Headquarters' : (data.typeAddress ?? null),
    }

    const address = await prismaClient.companyAddress.create({
      data: {...normalizedData, id: crypto.randomUUID(), createdBy: profile.id, createdAt: new Date()},
    })
    logger.info(`Company address created: ${address.id}`)
    revalidatePath('/companies')
  },
})

export const updateCompanyAddressAction = protectedServerFunction({
  schema: updateCompanyAddressSchema,
  functionName: 'Update company address action',
  serverFn: async ({data: {id, ...data}, logger}) => {
    await prismaClient.companyAddress.update({where: {id}, data})
    logger.info(`Company address updated: ${id}`)
    revalidatePath('/companies')
  },
})

export const softDeleteCompanyAddressAction = protectedServerFunction({
  schema: companyAddressIdSchema,
  functionName: 'Soft delete company address action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.companyAddress.update({
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
    await prismaClient.companyAddress.delete({where: {id}})
    logger.info(`Company address hard deleted: ${id}`)
    revalidatePath('/companies')
  },
})

export const undeleteCompanyAddressAction = protectedServerFunction({
  schema: companyAddressIdSchema,
  functionName: 'Undelete company address action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.companyAddress.update({where: {id}, data: {deleted: false}})
    logger.info(`Company address undeleted: ${id}`)
    revalidatePath('/companies')
  },
})

export async function createCompanyAndReturnIdAction(
  data: Parameters<typeof createCompanyAction>[0],
): Promise<{id: string; name: string}> {
  await createCompanyAction(data)
  const record = await prismaClient.company.findFirstOrThrow({
    where: {number: data.number},
    orderBy: {createdAt: 'desc'},
    select: {id: true, name: true},
  })
  return record
}

export type CompanyAddressOption = {
  id: string
  label: string
}

export async function getCompanyAddressesAction(companyId: string): Promise<CompanyAddressOption[]> {
  const addresses = await getCompanyAddresses(companyId)
  return addresses.map(a => ({
    id: a.id,
    label: buildAddressLabel(a),
  }))
}

function buildAddressLabel(a: {
  typeAddress: string | null
  street: string | null
  houseNumber: string | null
  busNumber: string | null
  zipCode: string | null
  place: string | null
  Country: {name: string} | null
}): string {
  const parts: string[] = []
  if (a.typeAddress) parts.push(`[${a.typeAddress}]`)
  const street = [a.street, a.houseNumber, a.busNumber].filter(Boolean).join(' ')
  if (street) parts.push(street)
  const city = [a.zipCode, a.place].filter(Boolean).join(' ')
  if (city) parts.push(city)
  if (a.Country?.name) parts.push(a.Country.name)
  return parts.join(' · ') || 'Address'
}
