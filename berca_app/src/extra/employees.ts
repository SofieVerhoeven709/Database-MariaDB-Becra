import type {EmergencyContact, Employee} from '@/generated/prisma/client'
import type {MappedEmployee} from '@/types/employee'

type EmployeeWithRelations = Employee & {
  RoleLevel_Employee_roleLevelIdToRoleLevel: {
    Role: {name: string}
    SubRole: {name: string}
  } | null
  Title_Employee_titleIdToTitle: {name: string} | null
  EmergencyContact: EmergencyContact[]
  Employee: {id: string} | null
  Employee_Employee_deletedByToEmployee: {id: string} | null
}

export function mapEmployee(prismaEmp: EmployeeWithRelations): MappedEmployee {
  return {
    id: prismaEmp.id,
    firstName: prismaEmp.firstName,
    lastName: prismaEmp.lastName,
    mail: prismaEmp.mail,
    username: prismaEmp.username,
    phoneNumber: prismaEmp.phoneNumber,
    birthDate: prismaEmp.birthDate?.toISOString() ?? null,
    startDate: prismaEmp.startDate?.toISOString(),
    endDate: prismaEmp.endDate?.toISOString() ?? null,
    info: prismaEmp.info,
    street: prismaEmp.street,
    houseNumber: prismaEmp.houseNumber,
    busNumber: prismaEmp.busNumber,
    zipCode: prismaEmp.zipCode,
    place: prismaEmp.place,
    permanentEmployee: prismaEmp.permanentEmployee,
    checkInfo: prismaEmp.checkInfo,
    newYearCard: prismaEmp.newYearCard,
    active: prismaEmp.active,
    createdAt: prismaEmp.createdAt.toISOString(),
    createdBy: prismaEmp.Employee?.id ?? null,
    passwordCreatedAt: prismaEmp.passwordCreatedAt.toISOString(),
    pictureId: prismaEmp.pictureId,
    deleted: prismaEmp.deleted,
    deletedAt: prismaEmp.deletedAt?.toISOString() ?? null,
    deletedBy: prismaEmp.Employee_Employee_deletedByToEmployee?.id ?? null,
    roleLevelId: prismaEmp.roleLevelId,
    titleId: prismaEmp.titleId,
    roleName: prismaEmp.RoleLevel_Employee_roleLevelIdToRoleLevel
      ? `${prismaEmp.RoleLevel_Employee_roleLevelIdToRoleLevel.Role.name.replace(' Role', '')} / ${prismaEmp.RoleLevel_Employee_roleLevelIdToRoleLevel.SubRole.name}`
      : '-',
    titleName: prismaEmp.Title_Employee_titleIdToTitle?.name ?? '-',
    emergencyContacts: prismaEmp.EmergencyContact ?? [],
  }
}
