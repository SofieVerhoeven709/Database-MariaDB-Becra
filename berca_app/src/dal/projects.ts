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

export async function getProjectTypes() {
  return prismaClient.projectType.findMany()
}
