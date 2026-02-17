import {prismaClient} from '@/dal/prismaClient'
import {publicApiRoute} from '@/lib/apiRoute'
import {roleSchema} from '@/schemas/roleSchemas'
import {NextResponse} from 'next/server'

// Helper function to get departments by role
async function getDepartmentsByRole(role: string) {
  const allDepartments = await prismaClient.department.findMany({
    select: {id: true, name: true, description: true, icon: true, color: true, number: true},
    orderBy: {
      number: 'asc',
    },
  })

  const ROLE_DEPARTMENTS: Record<string, string[]> = {
    administrator: allDepartments.map(d => d.id),
    manager: ['finance', 'hr', 'marketing', 'analytics', 'operations'],
    developer: ['engineering', 'analytics', 'security'],
    support: ['support', 'hr'],
  }

  const allowedIds = ROLE_DEPARTMENTS[role.toLowerCase()] ?? ROLE_DEPARTMENTS['administrator']
  return allDepartments.filter(d => allowedIds.includes(d.id))
}

// Use your publicApiRoute helper since everyone can fetch departments
export const POST = publicApiRoute<{}, typeof roleSchema>({
  type: 'body',
  schema: roleSchema,
  routeFn: async ({data}) => {
    const departments = await getDepartmentsByRole(data.name.toLowerCase())
    return NextResponse.json(departments)
  },
})
