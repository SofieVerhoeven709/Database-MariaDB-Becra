import 'server-only'
import {prismaClient} from '@/dal/prismaClient'
import type {HrHseFileRow, HrHseIncludeField} from '@/types/hrHseFile'

function toIsoDate(value: Date | null | undefined) {
  return value?.toISOString() ?? null
}

function formatAddress(employee: {
  street: string | null
  houseNumber: string | null
  busNumber: string | null
  zipCode: string | null
  place: string | null
}) {
  const street = [employee.street, employee.houseNumber, employee.busNumber].filter(Boolean).join(' ')
  const city = [employee.zipCode, employee.place].filter(Boolean).join(' ')
  return [street, city].filter(Boolean).join(', ') || null
}

export async function getHrHseFileRows(): Promise<HrHseFileRow[]> {
  const employees = await prismaClient.employee.findMany({
    where: {deleted: false},
    orderBy: [{lastName: 'asc'}, {firstName: 'asc'}],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      mail: true,
      phoneNumber: true,
      photoFileId: true,
      birthDate: true,
      street: true,
      houseNumber: true,
      busNumber: true,
      zipCode: true,
      place: true,
      employmentStatus: true,
      contractType: true,
      EmergencyContact: true,
      HrEmployeeHseFile_HrEmployeeHseFile_employeeIdToEmployee: {
        include: {
          Company: {select: {name: true}},
        },
      },
      HrCertificationTraining_HrCertificationTraining_employeeIdToEmployee: {
        where: {deleted: false, includeInHseFile: true},
        orderBy: [{certificateValidUntil: 'asc'}, {trainingName: 'asc'}],
        select: {
          id: true,
          trainingDocumentNumber: true,
          trainingName: true,
          trainingType: true,
          certificateValidUntil: true,
          providerName: true,
        },
      },
    },
  })

  return employees.map(employee => {
    const hseFile = employee.HrEmployeeHseFile_HrEmployeeHseFile_employeeIdToEmployee

    return {
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`.trim(),
      photoFileId: employee.photoFileId,
      mail: employee.mail,
      phoneNumber: employee.phoneNumber,
      birthDate: toIsoDate(employee.birthDate),
      address: formatAddress(employee),
      employmentStatus: employee.employmentStatus,
      contractType: employee.contractType,
      hseConfigured: Boolean(hseFile && !hseFile.deleted),
      includeEmployeeData: hseFile?.includeEmployeeData ?? true,
      includePartnerData: hseFile?.includePartnerData ?? false,
      partnerName: hseFile?.partnerName ?? null,
      partnerPhone: hseFile?.partnerPhone ?? null,
      partnerEmail: hseFile?.partnerEmail ?? null,
      includeEmergencyContact: hseFile?.includeEmergencyContact ?? true,
      emergencyContacts: employee.EmergencyContact.map(contact => ({
        id: contact.id,
        name: contact.name,
        relationship: contact.relationship,
        mail: contact.mail,
        phoneNumber: contact.phoneNumber,
      })),
      includeEmployerData: hseFile?.includeEmployerData ?? true,
      employerName: hseFile?.employerName ?? hseFile?.Company?.name ?? null,
      employerContactName: hseFile?.employerContactName ?? null,
      employerPhone: hseFile?.employerPhone ?? null,
      employerEmail: hseFile?.employerEmail ?? null,
      includeMedicalExamination: hseFile?.includeMedicalExamination ?? true,
      lastMedicalExaminationDate: toIsoDate(hseFile?.lastMedicalExaminationDate),
      lastMedicalExaminationValidUntil: toIsoDate(hseFile?.lastMedicalExaminationValidUntil),
      lastMedicalExaminationProvider: hseFile?.lastMedicalExaminationProvider ?? null,
      includeTrainingData: hseFile?.includeTrainingData ?? true,
      trainings: employee.HrCertificationTraining_HrCertificationTraining_employeeIdToEmployee.map(training => ({
        id: training.id,
        documentNumber: training.trainingDocumentNumber,
        name: training.trainingName,
        type: training.trainingType,
        validUntil: toIsoDate(training.certificateValidUntil),
        providerName: training.providerName,
      })),
    }
  })
}

export async function updateHrHseIncludeField(data: {
  employeeId: string
  field: HrHseIncludeField
  value: boolean
  profileId: string
}) {
  return prismaClient.hrEmployeeHseFile.upsert({
    where: {employeeId: data.employeeId},
    update: {
      [data.field]: data.value,
      updatedAt: new Date(),
      Employee_HrEmployeeHseFile_updatedByToEmployee: {connect: {id: data.profileId}},
    },
    create: {
      id: crypto.randomUUID(),
      [data.field]: data.value,
      createdAt: new Date(),
      Employee_HrEmployeeHseFile_employeeIdToEmployee: {connect: {id: data.employeeId}},
      Employee_HrEmployeeHseFile_createdByToEmployee: {connect: {id: data.profileId}},
    },
  })
}
