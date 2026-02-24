import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

export async function getProjects() {
  return prismaClient.project.findMany({
    include: {
      Company: true,
      ProjectType: true,
    },
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
        where: {deleted: false},
        include: {
          Company: true,
          ProjectType: true,
        },
      },
      ProjectContact: {
        where: {deleted: false},
        include: {
          Contact: true,
          Employee_ProjectContact_createdByToEmployee: true,
        },
      },
      WorkOrder: {
        where: {deleted: false},
        include: {
          Employee: true,
        },
      },
      Purchase: {
        where: {deleted: false},
        include: {
          Company: true,
          Employee: true,
        },
      },
      MaterialSerialTrack: {
        where: {deleted: false},
        include: {
          Company: true,
          Employee: true,
        },
      },
    },
  })
}

export async function getProjectTypes() {
  return prismaClient.projectType.findMany()
}
