import type {Prisma} from '@/generated/prisma/client'

// Full project detail payload for the detail view.
export type ProjectDetailData = Prisma.ProjectGetPayload<{
  include: {
    Company: true
    ProjectType: true
    Employee: true
    Project: true
    ProjectContact: {
      include: {
        Contact: true
        // Include creator metadata for contact link rows.
        Employee_ProjectContact_createdByToEmployee: true
      }
    }
    WorkOrder: {
      include: {
        // Include the creator for list display.
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
    ProjectEmployee: {
      include: {
        Employee: true
      }
    }
  }
}>
