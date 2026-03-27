import {prismaClient} from '@/dal/prismaClient'
import {protectedApiRoute, publicApiRoute} from '@/lib/apiRoute'
import {type RoleContextInput, roleContextInputSchema} from '@/schemas/roleSchemas'
import {NextResponse} from 'next/server'

// Helper function to get departments by role
async function getDepartmentsByRoleContext(context: RoleContextInput) {
  const {roleLevelIds} = context

  // 1️⃣ Find TargetType for Department
  const departmentTargetType = await prismaClient.targetType.findFirst({
    where: {
      name: 'Department',
      deleted: false,
    },
    select: {id: true},
  })

  if (!departmentTargetType) {
    return []
  }

  // 2️⃣ Get visible department targets for this roleLevel
  const visibleDepartmentTargets = await prismaClient.visibilityForRole.findMany({
    where: {
      roleLevelId: {in: roleLevelIds},
      visible: true,
      Target: {
        deleted: false,
        targetTypeId: departmentTargetType.id,
      },
    },
    select: {
      targetId: true,
    },
  })

  const targetIds = visibleDepartmentTargets.map(v => v.targetId)

  if (targetIds.length === 0) {
    return []
  }

  // 3️⃣ Fetch departments linked to those targets
  return prismaClient.department.findMany({
    where: {
      targetId: {in: targetIds},
    },
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
}

export const GET = protectedApiRoute({
  authenticationType: 'cookie',
  routeFn: async ({profile}) => {
    const departments = await getDepartmentsByRoleContext({
      roleLevelIds: profile.RoleLevelEmployee.map(rle => rle.roleLevelId),
    })
    return NextResponse.json(departments)
  },
})

export const POST = publicApiRoute<{}, typeof roleContextInputSchema>({
  type: 'body',
  schema: roleContextInputSchema,
  routeFn: async ({data}) => {
    const departments = await getDepartmentsByRoleContext({
      roleLevelIds: data.roleLevelIds,
    })
    return NextResponse.json(departments)
  },
})
