import type {Prisma} from '@/generated/prisma/client'

export type ProjectDetailData = Prisma.ProjectGetPayload<{
  include: {
    Company: true
    ProjectType: true
    Employee: true
    Project: true
    ProjectContact: {
      include: {
        Contact: true
        Employee_ProjectContact_createdByToEmployee: true
      }
    }
    WorkOrder: {
      include: {
        Employee: true
      }
    }
    Purchase: {
      include: {
        Company: true
        Employee: true
      }
    }
    MaterialSerialTrack: {
      include: {
        Company: true
        Employee: true
      }
    }
  }
}>
