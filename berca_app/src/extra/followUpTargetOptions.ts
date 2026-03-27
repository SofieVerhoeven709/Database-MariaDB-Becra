import type {PrismaClient} from '@/generated/prisma/client'
import type {TargetOptions} from '@/types/followUpTargetOptions'

function idName(id: string, description: string | null | undefined, fallback?: string): string {
  return description?.trim() || fallback || `(${id.slice(0, 8)})`
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function getFollowUpTargetOptions(prisma: PrismaClient): Promise<TargetOptions> {
  const [
    contacts,
    companies,
    projects,
    workOrders,
    workOrderStructures,
    departments,
    departmentExterns,
    invoiceIns,
    invoiceOuts,
    trainings,
    trainingStandards,
    certificates,
    documentStructures,
    employees,
    followUps,
    followUpStructures,
  ] = await Promise.all([
    prisma.contact.findMany({
      where: {deleted: false},
      orderBy: [{lastName: 'asc'}, {firstName: 'asc'}],
      select: {id: true, firstName: true, lastName: true},
    }),
    prisma.company.findMany({
      where: {deleted: false},
      orderBy: {name: 'asc'},
      select: {id: true, name: true},
    }),
    prisma.project.findMany({
      where: {deleted: false},
      orderBy: {projectNumber: 'asc'},
      select: {id: true, projectNumber: true, projectName: true},
    }),
    prisma.workOrder.findMany({
      where: {deleted: false},
      orderBy: {workOrderNumber: 'asc'},
      select: {id: true, workOrderNumber: true, description: true},
    }),
    prisma.workOrderStructure.findMany({
      where: {deleted: false},
      orderBy: {createdAt: 'desc'},
      select: {id: true, shortDescription: true, clientNumber: true},
    }),
    prisma.department.findMany({
      where: {deleted: false},
      orderBy: {name: 'asc'},
      select: {id: true, name: true},
    }),
    prisma.departmentExtern.findMany({
      where: {deleted: false},
      orderBy: {name: 'asc'},
      select: {id: true, name: true},
    }),
    prisma.invoiceIn.findMany({
      where: {deleted: false},
      orderBy: {invoiceDate: 'desc'},
      select: {id: true, invoiceNumber: true, invoiceDate: true},
    }),
    prisma.invoiceOut.findMany({
      where: {deleted: false},
      orderBy: {invoiceDate: 'desc'},
      select: {id: true, invoiceNumber: true, invoiceDate: true},
    }),
    prisma.training.findMany({
      where: {deleted: false},
      orderBy: {trainingDate: 'desc'},
      select: {id: true, trainingNumber: true, trainingDate: true},
    }),
    prisma.trainingStandard.findMany({
      where: {deleted: false},
      orderBy: {createdAt: 'desc'},
      select: {id: true, descriptionShort: true},
    }),
    prisma.certificate.findMany({
      where: {deleted: false},
      orderBy: {createdAt: 'desc'},
      select: {id: true, descriptionShort: true},
    }),
    prisma.documentStructure.findMany({
      where: {deleted: false},
      orderBy: {documentNumber: 'asc'},
      select: {id: true, documentNumber: true, descriptionShort: true},
    }),
    prisma.employee.findMany({
      where: {deleted: false},
      orderBy: [{lastName: 'asc'}, {firstName: 'asc'}],
      select: {id: true, firstName: true, lastName: true},
    }),
    prisma.followUp.findMany({
      where: {deleted: false},
      orderBy: {createdAt: 'desc'},
      select: {id: true, activityDescription: true, createdAt: true},
    }),
    prisma.followUpStructure.findMany({
      where: {deleted: false},
      orderBy: {contactDate: 'desc'},
      select: {id: true, item: true, contactDate: true},
    }),
  ])

  return {
    Contact: contacts.map(c => ({
      id: c.id,
      name: `${c.lastName}, ${c.firstName}`,
    })),

    Company: companies.map(c => ({
      id: c.id,
      name: c.name,
    })),

    Project: projects.map(p => ({
      id: p.id,
      name: `${p.projectNumber} – ${p.projectName}`,
    })),

    WorkOrder: workOrders.map(w => ({
      id: w.id,
      name: idName(w.id, w.workOrderNumber, w.description?.slice(0, 40) ?? undefined),
    })),

    WorkOrderStructure: workOrderStructures.map(w => ({
      id: w.id,
      name: idName(w.id, w.shortDescription, w.clientNumber ?? undefined),
    })),

    Department: departments.map(d => ({
      id: d.id,
      name: d.name,
    })),

    DepartmentExtern: departmentExterns.map(d => ({
      id: d.id,
      name: d.name,
    })),

    InvoiceIn: invoiceIns.map(i => ({
      id: i.id,
      name: i.invoiceNumber ?? `Invoice ${formatDate(i.invoiceDate)} (${i.id.slice(0, 8)})`,
    })),

    InvoiceOut: invoiceOuts.map(i => ({
      id: i.id,
      name: i.invoiceNumber ?? `Invoice ${formatDate(i.invoiceDate)} (${i.id.slice(0, 8)})`,
    })),

    Training: trainings.map(t => ({
      id: t.id,
      name: t.trainingNumber ?? `Training ${formatDate(t.trainingDate)} (${t.id.slice(0, 8)})`,
    })),

    TrainingStandard: trainingStandards.map(t => ({
      id: t.id,
      name: idName(t.id, t.descriptionShort),
    })),

    Certificate: certificates.map(c => ({
      id: c.id,
      name: idName(c.id, c.descriptionShort),
    })),

    DocumentStructure: documentStructures.map(d => ({
      id: d.id,
      name: `${d.documentNumber} – ${d.descriptionShort}`,
    })),

    Employee: employees.map(e => ({
      id: e.id,
      name: `${e.lastName}, ${e.firstName}`,
    })),

    FollowUp: followUps.map(f => ({
      id: f.id,
      name: f.activityDescription
        ? f.activityDescription.slice(0, 60) + (f.activityDescription.length > 60 ? '…' : '')
        : `Follow-up ${formatDate(f.createdAt)} (${f.id.slice(0, 8)})`,
    })),

    FollowUpStructure: followUpStructures.map(f => ({
      id: f.id,
      name: f.item
        ? f.item.slice(0, 60) + (f.item.length > 60 ? '…' : '')
        : `Entry ${formatDate(f.contactDate)} (${f.id.slice(0, 8)})`,
    })),
  }
}
