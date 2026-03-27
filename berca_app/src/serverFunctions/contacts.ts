'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {createContactSchema, updateContactSchema, contactIdSchema} from '@/schemas/contactSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {createTargetForType} from '@/dal/targets'
import {upsertVisibilityRows} from '@/serverFunctions/visibilityForRoles'

// ─── Contact ──────────────────────────────────────────────────────────────────
export const createContactAction = protectedServerFunction({
  schema: createContactSchema,
  functionName: 'Create contact action',
  serverFn: async ({
    data: {visibilityForRoles, initialCompanyId, initialRoleWithCompany, initialProjectId, ...data},
    logger,
    profile,
  }) => {
    logger.info(`Creating contact, createdBy: ${profile.id}`)

    const target = await createTargetForType('Contact', profile.id)
    const contactId = crypto.randomUUID()
    const now = new Date()

    await prismaClient.contact.create({
      data: {
        ...data,
        id: contactId,
        createdBy: profile.id,
        createdAt: now,
        targetId: target.id,
      },
    })

    // Create company link if a company was selected
    if (initialCompanyId) {
      await prismaClient.companyContact.create({
        data: {
          id: crypto.randomUUID(),
          contactId,
          companyId: initialCompanyId,
          roleWithCompany: initialRoleWithCompany ?? null,
          startedDate: now,
          createdBy: profile.id,
          createdAt: now,
        },
      })
    }

    // Link to project if provided
    if (initialProjectId) {
      await prismaClient.projectContact.create({
        data: {
          id: crypto.randomUUID(),
          contactId,
          projectId: initialProjectId,
          description: null,
          createdBy: profile.id,
          modifiedBy: profile.id,
          createdAt: now,
        },
      })
    }

    if (visibilityForRoles.length > 0) {
      await upsertVisibilityRows(target.id, visibilityForRoles)
    }

    logger.info(
      `Contact created: ${contactId} with ${visibilityForRoles.length} visibility row(s)${initialCompanyId ? ` linked to company ${initialCompanyId}` : ''}`,
    )
    revalidatePath('/contacts')
  },
})

export const updateContactAction = protectedServerFunction({
  schema: updateContactSchema,
  functionName: 'Update contact action',
  serverFn: async ({data: {id, visibilityForRoles, ...data}, logger}) => {
    const {targetId} = await prismaClient.contact.findUniqueOrThrow({
      where: {id},
      select: {targetId: true},
    })

    await Promise.all([
      prismaClient.contact.update({where: {id}, data}),
      upsertVisibilityRows(targetId, visibilityForRoles),
    ])

    logger.info(`Contact updated: ${id} with ${visibilityForRoles.length} visibility row(s)`)
    revalidatePath('/contacts')
  },
})

export const softDeleteContactAction = protectedServerFunction({
  schema: contactIdSchema,
  functionName: 'Soft delete contact action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.contact.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Contact soft deleted: ${id}`)
    revalidatePath('/contacts')
  },
})

export const hardDeleteContactAction = protectedServerFunction({
  schema: contactIdSchema,
  functionName: 'Hard delete contact action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.contact.delete({where: {id}})
    logger.info(`Contact hard deleted: ${id}`)
    revalidatePath('/contacts')
  },
})

export const undeleteContactAction = protectedServerFunction({
  schema: contactIdSchema,
  functionName: 'Undelete contact action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.contact.update({where: {id}, data: {deleted: false}})
    logger.info(`Contact undeleted: ${id}`)
    revalidatePath('/contacts')
  },
})

export async function createContactAndReturnIdAction(
  data: Parameters<typeof createContactAction>[0],
): Promise<{id: string; firstName: string; lastName: string}> {
  await createContactAction(data)
  const record = await prismaClient.contact.findFirstOrThrow({
    where: {firstName: data.firstName, lastName: data.lastName},
    orderBy: {createdAt: 'desc'},
    select: {id: true, firstName: true, lastName: true},
  })
  return record
}
