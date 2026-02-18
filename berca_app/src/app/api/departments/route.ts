import {prismaClient} from '@/dal/prismaClient'
import {publicApiRoute} from '@/lib/apiRoute'
import {type RoleContextInput, roleContextInputSchema} from '@/schemas/roleSchemas'
import {NextResponse} from 'next/server'

// Helper function to get departments by role
async function getDepartmentsByRoleContext(context: RoleContextInput) {
  const allDepartments = await prismaClient.department.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      color: true,
      number: true,
    },
    orderBy: {number: 'asc'},
  })

  const role = context.role.toLowerCase()
  const subRole = context.subRole?.toLowerCase()
  const level = context.level

  // ADMIN → everything
  if (role === 'administrator') {
    return allDepartments
  }

  // MANAGER rules
  if (role === 'manager') {
    if (level >= 2) {
      return allDepartments.filter(d => ['finance', 'hr', 'marketing', 'analytics', 'operations'].includes(d.id))
    }

    return allDepartments.filter(d => ['hr', 'operations'].includes(d.id))
  }

  // SUPPORT rules
  if (role === 'support') {
    if (subRole === 'hr') {
      return allDepartments.filter(d => ['support', 'hr'].includes(d.id))
    }

    return allDepartments.filter(d => d.id === 'support')
  }

  // DEVELOPER rules
  if (role === 'developer') {
    return allDepartments.filter(d => ['engineering', 'analytics', 'security'].includes(d.id))
  }

  // fallback: nothing
  return []
}

export const POST = publicApiRoute<{}, typeof roleContextInputSchema>({
  type: 'body',
  schema: roleContextInputSchema,
  routeFn: async ({data}) => {
    const departments = await getDepartmentsByRoleContext({
      role: data.role,
      subRole: data.subRole,
      level: data.level,
    })

    return NextResponse.json(departments)
  },
})
