/**
 * The 'use server' directive marks this file as server actions only.
 * Server actions are async functions that can only run on the server.
 * Next.js turns server actions into HTTP endpoints so they can be called
 * from the client.
 *
 * Once the 'use server' directive is present, this file may only export
 * async functions.
 */
'use server'

import {redirect} from 'next/navigation'
import {revalidatePath} from 'next/cache'
import {createEmployee, getEmployeeByUsername, startSession, stopSession, updateEmployee} from '@/dal/employees'
import {getSalt, hashOptions, hashPassword, verifyPassword} from '@/lib/passwordUtils'
import {clearSessionCookie, getSessionId, setSessionCookie} from '@/lib/sessionUtils'
import {protectedFormAction, protectedServerFunction, publicFormAction} from '@/lib/serverFunctions'
import {registerSchema, signInSchema, updateEmployeeSchema, upsertEmployeeSchema} from '@/schemas/employeeSchemas'
import {prismaClient} from '@/dal/prismaClient'

export const signInAction = publicFormAction({
  schema: signInSchema,
  serverFn: async ({data, logger}) => {
    const employee = await getEmployeeByUsername(data.username)

    // If we immediately return unauthorized when a user is not found,
    // an attacker can infer that the email does not exist.
    // They can then move on to other email addresses without wasting time
    // on nonexistent accounts.
    // To avoid this, we hash a fallback password even when the user is missing.
    // This makes response timing less useful for account enumeration.
    const timingSafePassword = `${hashOptions.iterations}$${hashOptions.keyLength}$preventTimingBasedAttacks123$${getSalt()}`
    const isValidPassword = verifyPassword(employee?.password_hash ?? timingSafePassword, data.password_hash)

    if (!isValidPassword) {
      logger.warn(`Failed sign in attempt for ${data.username}.`)
      return {
        success: false,
        errors: {
          errors: ['No account found with the given email/password combination.'],
        },
      }
    }

    logger.info(`Successful authentication request for ${employee!.id}`)

    type EmployeeRoleLevelItem = NonNullable<typeof employee>['RoleLevelEmployee'][0]

    const highestRoleLevel = employee!.RoleLevelEmployee.reduce<EmployeeRoleLevelItem | null>((highest, current) => {
      if (!highest) return current
      return current.RoleLevel.SubRole.level > highest.RoleLevel.SubRole.level ? current : highest
    }, null)?.RoleLevel

    if (!highestRoleLevel) throw new Error('Employee has no role assigned.')

    const session = await startSession(employee!.id, highestRoleLevel.SubRole)
    logger.info(`New session started: ${session.id}, ends at ${session.activeUntil.toISOString()}`)

    await setSessionCookie(session)

    // User is signed in, redirect to the dashboard.
    redirect('/dashboard')
  },
  functionName: 'Sign in action',
})

/**
 * Update profile details for the signed-in user.
 *
 * @param _prevData Previous data submitted to the action. Not used here; it exists
 * to match the signature expected by Next.js/React.
 * @param formData The data submitted to the action.
 */
export const updateProfileAction = protectedFormAction({
  schema: updateEmployeeSchema,
  serverFn: async ({data, profile}) => {
    // The user id must come from the session (server-side), not from the client.
    // Trusting client-sent ids would allow modifying other users' data.
    await updateEmployee({...data, id: profile.id})

    // The profile is used in the Navbar (rendered on the home layout),
    // so we revalidate the app root layout.
    revalidatePath('/', 'layout')
  },
  functionName: 'Update profile action',
})

/**
 * Sign out and redirect to the home page.
 */
export const signOutServerFunction = protectedServerFunction({
  serverFn: async ({logger}) => {
    // This action has no parameters, so it cannot be invoked via a form.
    // It can still be called from a button click handler.
    const sessionId = await getSessionId()

    if (sessionId) {
      await stopSession(sessionId)
      logger.info(`Session stopped: ${sessionId}.`)

      await clearSessionCookie()
    }

    redirect('/')
  },
  functionName: 'Sign out action',
})

export const createEmployeeAction = protectedServerFunction({
  schema: upsertEmployeeSchema,
  functionName: 'Create employee action',
  serverFn: async ({data: {emergencyContacts, password_hash, roleLevelIds, ...data}, logger, profile}) => {
    if (!password_hash) throw new Error('Password is required when creating an employee.')

    logger.info(`Creating employee, createdBy: ${profile.id}`)

    const employee = await prismaClient.employee.create({
      data: {
        ...data,
        id: crypto.randomUUID(),
        password_hash: hashPassword(password_hash),
        createdBy: profile.id,
        createdAt: new Date(),
        passwordCreatedAt: new Date(),
        // Create role-level links only when provided.
        RoleLevelEmployee: roleLevelIds?.length
          ? {
              create: roleLevelIds.map((roleLevelId: string) => ({
                id: crypto.randomUUID(),
                roleLevelId,
              })),
            }
          : undefined,
        // Seed emergency contacts when provided.
        EmergencyContact: emergencyContacts?.length
          ? {
              create: emergencyContacts.map(c => ({
                id: crypto.randomUUID(),
                name: c.name,
                relationship: c.relationship,
                mail: c.mail,
                phoneNumber: c.phoneNumber,
              })),
            }
          : undefined,
      },
    })

    logger.info(`Employee created: ${employee.id}`)
    revalidatePath('/departments/hr/records')
  },
})

export const updateEmployeeAdminAction = protectedServerFunction({
  schema: upsertEmployeeSchema,
  functionName: 'Update employee admin action',
  serverFn: async ({data: {emergencyContacts, password_hash, id, roleLevelIds, ...data}, logger}) => {
    await prismaClient.employee.update({
      where: {id},
      data: {
        ...data,
        // Update password only when provided.
        ...(password_hash ? {password_hash: hashPassword(password_hash), passwordCreatedAt: new Date()} : {}),
        RoleLevelEmployee: {
          // Replace role links to match current selection.
          deleteMany: {employeeId: id},
          ...(roleLevelIds?.length
            ? {
                create: roleLevelIds.map((roleLevelId: string) => ({
                  id: crypto.randomUUID(),
                  roleLevelId,
                })),
              }
            : {}),
        },
        EmergencyContact: {
          // Replace emergency contacts to match current list.
          deleteMany: {employeeId: id},
          ...(emergencyContacts?.length
            ? {
                create: emergencyContacts.map(c => ({
                  id: c.id ?? crypto.randomUUID(),
                  name: c.name,
                  relationship: c.relationship,
                  mail: c.mail,
                  phoneNumber: c.phoneNumber,
                })),
              }
            : {}),
        },
      },
    })

    logger.info(`Employee updated: ${id}`)
    revalidatePath('/employees')
  },
})

export const softDeleteEmployeeAction = protectedServerFunction({
  schema: updateEmployeeSchema,
  functionName: 'Soft delete employee action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.employee.update({
      where: {id},
      data: {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: profile.id,
      },
    })
    logger.info(`Employee soft deleted: ${id} by ${profile.id}`)
    revalidatePath('/employees')
  },
})

export const hardDeleteEmployeeAction = protectedServerFunction({
  schema: updateEmployeeSchema,
  functionName: 'Hard delete employee action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.emergencyContact.deleteMany({where: {employeeId: id}})
    await prismaClient.employee.delete({where: {id}})
    logger.info(`Employee hard deleted: ${id}`)
    revalidatePath('/employees')
  },
})
