import 'server-only'
import JWT from 'jsonwebtoken'
import type {Profile, SessionWithProfile} from '@/models/employees'
import type {Role} from '@/generated/prisma/client'

const {PUBLIC_KEY, PRIVATE_KEY} = process.env
const TOKEN_EXPIRATION = '24h'

const PUBLIC_KEY_DECODED = Buffer.from(PUBLIC_KEY!, 'base64').toString('utf-8')
const PRIVATE_KEY_DECODED = Buffer.from(PRIVATE_KEY!, 'base64').toString('utf-8')

export interface TokenBody {
  id: string
  role: Role
  username: string
  iat: number
  exp: number
  iss: string
  sub: string
}

export interface StatefulJwtTokenBody extends TokenBody {
  sessionId: string
}

export const validateJwtToken = (token: string): TokenBody | undefined => {
  try {
    return JWT.verify(token, PUBLIC_KEY_DECODED) as unknown as TokenBody
  } catch (_e) {
    return undefined
  }
}

export const validateStatefulJwtToken = (token: string): StatefulJwtTokenBody | undefined => {
  try {
    return JWT.verify(token, PUBLIC_KEY_DECODED) as unknown as StatefulJwtTokenBody
  } catch (_e) {
    return undefined
  }
}

export const createJwtToken = (employee: Profile) => {
  return JWT.sign(
    {
      id: employee.id,
      username: employee.username,
      role: employee.RoleLevelEmployee.reduce<(typeof employee.RoleLevelEmployee)[0] | null>((highest, current) => {
        if (!highest) return current
        return current.RoleLevel.SubRole.level > highest.RoleLevel.SubRole.level ? current : highest
      }, null)?.roleLevelId,
    },
    PRIVATE_KEY_DECODED,
    {algorithm: 'RS256', expiresIn: TOKEN_EXPIRATION, subject: employee.username, issuer: 'contacts-app'},
  )
}

export const createStatefulJwtToken = (session: SessionWithProfile) => {
  return JWT.sign(
    {
      id: session.Employee.id,
      username: session.Employee.username,
      role: session.Employee.RoleLevelEmployee.reduce<(typeof session.Employee.RoleLevelEmployee)[0] | null>(
        (highest, current) => {
          if (!highest) return current
          return current.RoleLevel.SubRole.level > highest.RoleLevel.SubRole.level ? current : highest
        },
        null,
      )?.roleLevelId,
      sessionId: session.id,
    },
    PRIVATE_KEY_DECODED,
    {algorithm: 'RS256', expiresIn: TOKEN_EXPIRATION, subject: session.Employee.username, issuer: 'contacts-app'},
  )
}
