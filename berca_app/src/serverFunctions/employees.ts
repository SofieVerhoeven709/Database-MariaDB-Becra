/**
 * Het 'use server' directive wordt gebruikt om aan te geven dat de code in dit bestand enkel server actions bevat.
 * Server actions zijn asynchrone functies die enkel op de server uitgevoerd kunnen worden.
 * Een server action wordt automatisch geconverteerd naar HTTP endpoints door Next.js en kunnen dus aangeroepen worden
 * van op de client.
 *
 * Zodra het 'use server' directive toegevoegd wordt, mag het bestand enkel asynchrone functies exporteren.
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

export const registerAction = publicFormAction({
  schema: registerSchema,
  serverFn: async ({data: {passwordConfirmation: _, ...data}, logger}) => {
    const employee = await createEmployee(data)
    logger.info(`New employee created: ${employee.id}`)

    const role = await prismaClient.roleLevel.findUnique({
      where: {id: employee.roleLevelId!},
      include: {
        Role: true, // RoleLevel → Role
        SubRole: true, // RoleLevel → SubRole
      },
    })
    if (!role) throw new Error('Employee has no role assigned.')

    const session = await startSession(employee.id, role.SubRole)
    logger.info(`New session started: ${session.id}, ends at ${session.activeUntil.toISOString()}`)

    await setSessionCookie(session)
    redirect('/')
  },
  functionName: 'Register action',
  globalErrorMessage: "We couldn't create an account for you, please try again or log in with an existing account.",
})

export const signInAction = publicFormAction({
  schema: signInSchema,
  serverFn: async ({data, logger}) => {
    const employee = await getEmployeeByUsername(data.username)

    // Als we meteen een unauthorized terug geven nadat een gebruiker niet gevonden is in de database, kan een aanvaller
    // hieruit afleiden dat het e-mailadres niet bestaat.
    // Vervolgens kan de aanvaller overgaan naar andere email adressen, en moet deze geen tijd meer spenderen aan het adres
    // dat niet bestaat.
    // Als oplossing voegen we een alternatief wachtwoord toe dat gebruikt wordt als de gebruiker niet gevonden is in de
    // database.
    // Omdat we nu in alle gevallen een wachtwoord hashen, is het moeilijker om te bepalen of een e-mailadres bestaat of
    // niet op basis van de response tijd.
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

    const role = await prismaClient.roleLevel.findUnique({
      where: {id: employee!.roleLevelId!},
      include: {
        Role: true, // RoleLevel → Role
        SubRole: true, // RoleLevel → SubRole
      },
    })
    if (!role) throw new Error('Employee has no role assigned.')

    const session = await startSession(employee!.id, role.SubRole)
    logger.info(`New session started: ${session.id}, ends at ${session.activeUntil.toISOString()}`)

    await setSessionCookie(session)

    // De gebruiker is ingelogd, dus redirecten we naar de contactenpagina.
    redirect('/dashboard')
  },
  functionName: 'Sign in action',
})

/**
 * Pas de profielgegevens van de ingelogde gebruiker aan.
 *
 * @param _prevData De vorige data die ingestuurd werd naar de actie. We maken hier geen gebruik van, de parameter is
 * enkel aanwezig om de signatuur van de functie gelijkt te stellen met wat Next.js/React verwacht.
 * @param formData De data die ingestuurd werd naar de actie.
 */
export const updateProfileAction = protectedFormAction({
  schema: updateEmployeeSchema,
  serverFn: async ({data, profile}) => {
    // Het is belangrijk dat het id van de gebruiker opgehaald wordt op basis van de sessie (via de backend) en niet
    // zomaar door de client ingevuld kan worden.
    // Als je de formuliergegevens die de client doorstuurt blindelings vertrouwd, kan een kwaadwillige gebruiker data van
    // andere gebruikers aanpassen.
    await updateEmployee({...data, id: profile.id})

    // Het profiel wordt gebruikt in de Navbar component, aangezien deze component op de homepagina staat moeten we
    // het root path van de applicatie revalideren.
    revalidatePath('/', 'layout')
  },
  functionName: 'Update profile action',
})

/**
 * Log uit en redirect naar de homepagina.
 */
export const signOutServerFunction = protectedServerFunction({
  serverFn: async ({logger}) => {
    // Deze server action heeft geen parameters, dit betekent dat we deze actie niet kunnen aanroepen via een formulier.
    // De action kan echter wel gewoon opgeroepen worden als klik handler op een knop.
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
  serverFn: async ({data: {emergencyContacts, password_hash, ...data}, logger, profile}) => {
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
  serverFn: async ({data: {emergencyContacts, password_hash, id, ...data}, logger}) => {
    await prismaClient.employee.update({
      where: {id},
      data: {
        ...data,
        ...(password_hash ? {password_hash: hashPassword(password_hash), passwordCreatedAt: new Date()} : {}),
        EmergencyContact: {
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
