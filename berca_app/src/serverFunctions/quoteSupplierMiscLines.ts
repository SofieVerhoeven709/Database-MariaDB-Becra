'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {
  createQuoteSupplierMiscLineSchema,
  updateQuoteSupplierMiscLineSchema,
  quoteSupplierMiscLineIdSchema,
} from '@/schemas/quoteSupplierSchemas'

const REVALIDATE_DEPARTMENTS_PATH = '/departments'

function getHighestRoleLevel(profile: {RoleLevelEmployee: Array<{RoleLevel: {SubRole: {level: number}}}>}): number {
  return Math.max(0, ...profile.RoleLevelEmployee.map(row => row.RoleLevel.SubRole.level))
}

/**
 * Resolve the quote for a misc line mutation and assert it is in a state that
 * allows editing misc lines:
 *   - Must exist
 *   - Must be sent or received (misc lines are post-send additions)
 *   - Must NOT be accepted for PO (locked once approved)
 */
async function assertMiscLineMutationAllowedByQuoteId(
  quoteSupplierId: string,
  profile: {RoleLevelEmployee: Array<{RoleLevel: {SubRole: {level: number}}}>},
) {
  const quote = await prismaClient.quoteSupplier.findUnique({
    where: {id: quoteSupplierId},
    select: {sent: true, received: true, acceptedForPOB: true},
  })
  if (!quote) throw new Error('Quote supplier not found.')
  if (!quote.sent && !quote.received) {
    throw new Error('Misc lines can only be added once the quote has been sent or received.')
  }
  if (quote.acceptedForPOB) {
    throw new Error('This quote is approved for PO. Misc lines can no longer be changed.')
  }
}

async function assertMiscLineMutationAllowedByMiscLineId(
  miscLineId: string,
  profile: {RoleLevelEmployee: Array<{RoleLevel: {SubRole: {level: number}}}>},
) {
  const miscLine = await prismaClient.quoteSupplierMiscLine.findUnique({
    where: {id: miscLineId},
    select: {QuoteSupplier: {select: {sent: true, received: true, acceptedForPOB: true}}},
  })
  if (!miscLine) throw new Error('Misc line not found.')
  const {sent, received, acceptedForPOB} = miscLine.QuoteSupplier
  if (!sent && !received) {
    throw new Error('Misc lines can only be edited once the quote has been sent or received.')
  }
  if (acceptedForPOB) {
    throw new Error('This quote is approved for PO. Misc lines can no longer be changed.')
  }
}

/**
 * Create a miscellaneous cost line on a quote.
 * Only available after the quote is sent or received, and before it is approved for PO.
 */
export const createQuoteSupplierMiscLineAction = protectedServerFunction({
  schema: createQuoteSupplierMiscLineSchema,
  functionName: 'Create quote supplier misc line action',
  serverFn: async ({data, profile, logger}) => {
    await assertMiscLineMutationAllowedByQuoteId(data.quoteSupplierId, profile)

    const id = crypto.randomUUID()
    await prismaClient.quoteSupplierMiscLine.create({
      data: {
        id,
        quoteSupplierId: data.quoteSupplierId,
        description: data.description,
        unitPrice: data.unitPrice,
      },
    })

    logger.info(`Created QuoteSupplierMiscLine: ${id} for quote ${data.quoteSupplierId}`)
    revalidatePath(REVALIDATE_DEPARTMENTS_PATH, 'layout')
  },
})

/**
 * Update the description or unit price of a miscellaneous cost line.
 * Only available before the quote is approved for PO.
 */
export const updateQuoteSupplierMiscLineAction = protectedServerFunction({
  schema: updateQuoteSupplierMiscLineSchema,
  functionName: 'Update quote supplier misc line action',
  serverFn: async ({data: {id, ...updates}, profile, logger}) => {
    await assertMiscLineMutationAllowedByMiscLineId(id, profile)

    await prismaClient.quoteSupplierMiscLine.update({
      where: {id},
      data: updates,
    })

    logger.info(`Updated QuoteSupplierMiscLine: ${id}`)
    revalidatePath(REVALIDATE_DEPARTMENTS_PATH, 'layout')
  },
})

/**
 * Delete a miscellaneous cost line.
 * Only available before the quote is approved for PO.
 */
export const deleteQuoteSupplierMiscLineAction = protectedServerFunction({
  schema: quoteSupplierMiscLineIdSchema,
  functionName: 'Delete quote supplier misc line action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await assertMiscLineMutationAllowedByMiscLineId(id, profile)

    await prismaClient.quoteSupplierMiscLine.delete({where: {id}})

    logger.info(`Deleted QuoteSupplierMiscLine: ${id}`)
    revalidatePath(REVALIDATE_DEPARTMENTS_PATH, 'layout')
  },
})
