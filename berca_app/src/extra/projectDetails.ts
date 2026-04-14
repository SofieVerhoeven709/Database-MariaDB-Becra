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
    ProjectBOM: true
    MaterialSerialTrack: {
      include: {
        Company: true
        Employee: true
      }
    }
    other_Project: {
      include: {
        Company: true
        ProjectType: true
      }
    }
    Target: {
      include: {
        VisibilityForRole: {
          include: {
            RoleLevel: {
              include: {
                Role: true
                SubRole: true
              }
            }
          }
        }
      }
    }
  }
}>
