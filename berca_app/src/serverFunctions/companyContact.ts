'use server'

import {prismaClient} from '@/dal/prismaClient'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {revalidatePath} from 'next/cache'
import {
  addCompanyContactSchema,
  updateCompanyContactSchema,
  companyContactIdSchema,
} from '@/schemas/companyContactSchemas'

export const addCompanyContactAction = protectedServerFunction({
  schema: addCompanyContactSchema,
  functionName: 'Add company contact action',
  serverFn: async ({data, profile}) => {
    const now = new Date()
    const {endPreviousActive, ...rest} = data

    // Auto-end any currently active links for this contact
    if (endPreviousActive) {
      const activeLinks = await prismaClient.companyContact.findMany({
        where: {
          contactId: rest.contactId,
          deleted: false,
          OR: [{endDate: null}, {endDate: {gt: now}}],
        },
        select: {id: true},
      })
      if (activeLinks.length > 0) {
        await prismaClient.companyContact.updateMany({
          where: {id: {in: activeLinks.map(l => l.id)}},
          data: {endDate: rest.startedDate},
        })
      }
    }

    await prismaClient.companyContact.create({
      data: {
        id: crypto.randomUUID(),
        contactId: rest.contactId,
        companyId: rest.companyId,
        roleWithCompany: rest.roleWithCompany ?? null,
        startedDate: rest.startedDate,
        endDate: rest.endDate ?? null,
        createdBy: profile.id,
        createdAt: now,
      },
    })
    revalidatePath(`/departments`)
  },
})

export const updateCompanyContactAction = protectedServerFunction({
  schema: updateCompanyContactSchema,
  functionName: 'Update company contact action',
  serverFn: async ({data}) => {
    await prismaClient.companyContact.update({
      where: {id: data.id},
      data: {
        roleWithCompany: data.roleWithCompany ?? null,
        startedDate: data.startedDate,
        endDate: data.endDate ?? null,
      },
    })
    revalidatePath(`/departments`)
  },
})

export const endCompanyContactAction = protectedServerFunction({
  schema: companyContactIdSchema,
  functionName: 'End company contact action',
  serverFn: async ({data}) => {
    await prismaClient.companyContact.update({
      where: {id: data.id},
      data: {endDate: new Date()},
    })
    revalidatePath(`/departments`)
  },
})

export const deleteCompanyContactAction = protectedServerFunction({
  schema: companyContactIdSchema,
  functionName: 'Delete company contact action',
  serverFn: async ({data, profile}) => {
    await prismaClient.companyContact.update({
      where: {id: data.id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    revalidatePath(`/departments`)
  },
})
