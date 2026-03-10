import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

const projectInclude = {
  Company: true,
  ProjectType: true,
  Target: {
    include: {
      VisibilityForRole: {
        include: {
          RoleLevel: {
            include: {
              Role: true,
              SubRole: true,
            },
          },
        },
      },
    },
  },
} as const

export async function getProjects() {
  return prismaClient.project.findMany({
    include: projectInclude,
  })
}

export async function getProjectById(id: string) {
  return prismaClient.project.findUniqueOrThrow({
    where: {id},
    include: {
      Company: true,
      ProjectType: true,
      Employee: true,
      Project: true,
      other_Project: {
        include: {
          Company: true,
          ProjectType: true,
        },
      },
      ProjectContact: {
        include: {
          Contact: true,
          Employee_ProjectContact_createdByToEmployee: true,
        },
      },
      WorkOrder: {
        include: {
          Employee: true,
        },
      },
      Purchase: {
        include: {
          Company: true,
          Employee: true,
        },
      },
      MaterialSerialTrack: {
        include: {
          Company: true,
          Employee: true,
        },
      },
      Target: {
        include: {
          VisibilityForRole: {
            include: {
              RoleLevel: {include: {Role: true, SubRole: true}},
            },
          },
        },
      },
    },
  })
}

export async function getProjectTypes() {
  return prismaClient.projectType.findMany()
}
