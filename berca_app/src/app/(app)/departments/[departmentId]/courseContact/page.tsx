import {TrainingContactTable} from '@/components/custom/trainingContactTable'
import {getTrainings} from '@/dal/training'
import {getAllRoleLevels} from '@/dal/roleLevel'
import {mapTraining} from '../../../../../mapper/training'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {prismaClient} from '@/dal/prismaClient'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function TrainingContactPage({params}: PageProps) {
  const {departmentId} = await params

  const [department, trainingsFromDAL, profile, contacts, trainingContactsRaw] = await Promise.all([
    getDepartmentById(departmentId),
    getTrainings(),
    getSessionProfileFromCookieOrThrow(),
    prismaClient.contact.findMany({
      where: {deleted: false},
      orderBy: [{lastName: 'asc'}, {firstName: 'asc'}],
      select: {id: true, firstName: true, lastName: true},
    }),
    prismaClient.trainingContact.findMany({
      orderBy: {createdAt: 'desc'},
      include: {
        Contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            Function: {select: {name: true}},
            CompanyContact: {
              where: {deleted: false},
              select: {endDate: true, Company: {select: {name: true}}},
            },
          },
        },
        Training: {
          select: {
            id: true,
            trainingNumber: true,
            trainingDate: true,
            TrainingStandard: {select: {descriptionShort: true}},
          },
        },
        Employee: {select: {firstName: true, lastName: true}},
        Employee_TrainingContact_deletedByToEmployee: {select: {firstName: true, lastName: true}},
      },
    }),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)

  const now = new Date()
  const trainingContacts = trainingContactsRaw.map(tc => ({
    id: tc.id,
    attendeeNumber: tc.attendeeNumber,
    succeeded: tc.succeeded,
    attended: tc.attended,
    certificateSent: tc.certificateSent,
    certSentDate: tc.certSentDate?.toISOString() ?? null,
    createdAt: tc.createdAt.toISOString(),
    createdByName: `${tc.Employee.firstName} ${tc.Employee.lastName}`,
    deleted: tc.deleted,
    deletedAt: tc.deletedAt?.toISOString() ?? null,
    deletedByName: tc.Employee_TrainingContact_deletedByToEmployee
      ? `${tc.Employee_TrainingContact_deletedByToEmployee.firstName} ${tc.Employee_TrainingContact_deletedByToEmployee.lastName}`
      : null,
    contact: {
      id: tc.Contact.id,
      firstName: tc.Contact.firstName,
      lastName: tc.Contact.lastName,
      functionName: tc.Contact.Function?.name ?? null,
      currentCompanyName:
        tc.Contact.CompanyContact.find(cc => cc.endDate === null || cc.endDate > now)?.Company.name ?? null,
    },
    training: {
      id: tc.Training.id,
      trainingNumber: tc.Training.trainingNumber,
      trainingDate: tc.Training.trainingDate.toISOString(),
      trainingStandardDescriptionShort: tc.Training.TrainingStandard.descriptionShort ?? null,
    },
  }))

  const trainingOptions = trainingsFromDAL
    .filter(t => !t.deleted)
    .map(mapTraining)
    .map(t => ({
      id: t.id,
      name: `${t.trainingNumber ?? '(no number)'} — ${t.trainingStandardDescriptionShort ?? ''} — ${new Date(t.trainingDate).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})}`,
    }))

  const contactOptions = contacts.map(c => ({id: c.id, name: `${c.lastName} ${c.firstName}`}))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Training Course Contacts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage participant links across all training courses</p>
        </div>
        <TrainingContactTable
          initialTrainingContacts={trainingContacts}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          departmentId={departmentId}
          trainingOptions={trainingOptions}
          contactOptions={contactOptions}
        />
      </div>
    </main>
  )
}
