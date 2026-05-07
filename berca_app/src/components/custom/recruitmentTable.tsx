'use client'

import {useMemo, useState} from 'react'
import {useRouter} from 'next/navigation'
import {BriefcaseBusiness, CalendarDays, FileText, Pencil, Plus, Search, Trash2, UserRound} from 'lucide-react'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {
  RecruitmentApplicantFormDialog,
  toNullableDate,
  type RecruitmentApplicantFormValue,
} from '@/components/custom/recruitmentApplicantFormDialog'
import {
  RecruitmentVacancyFormDialog,
  toNullableSalary,
  type RecruitmentVacancyFormValue,
} from '@/components/custom/recruitmentVacancyFormDialog'
import {
  createRecruitmentApplicantAction,
  createRecruitmentVacancyAction,
  deleteRecruitmentApplicantAction,
  deleteRecruitmentVacancyAction,
  updateRecruitmentApplicantAction,
  updateRecruitmentVacancyAction,
} from '@/serverFunctions/recruitment'
import type {RecruitmentApplicant, RecruitmentVacancy} from '@/types/recruitment'

interface RecruitmentTableProps {
  applicants: RecruitmentApplicant[]
  vacancies: RecruitmentVacancy[]
  departmentId: string
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('nl-BE', {day: '2-digit', month: 'short', year: 'numeric'}).format(new Date(value))
}

function contactLabel(value: RecruitmentApplicant['contactType']) {
  return value === 'phone' ? 'Phone' : 'Email'
}

function contractLabel(value: RecruitmentVacancy['contractType']) {
  return value === 'temporary' ? 'Temporary' : 'Permanent'
}

function regimeLabel(value: RecruitmentVacancy['workRegime']) {
  return value === 'parttime' ? 'Part-time' : 'Full-time'
}

function salaryRange(vacancy: RecruitmentVacancy) {
  if (vacancy.salaryMin == null && vacancy.salaryMax == null) return '-'
  const formatter = new Intl.NumberFormat('nl-BE', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0})
  if (vacancy.salaryMin == null) return `from ${formatter.format(vacancy.salaryMax ?? 0)}`
  if (vacancy.salaryMax == null) return `to ${formatter.format(vacancy.salaryMin)}`
  return `${formatter.format(vacancy.salaryMin)} - ${formatter.format(vacancy.salaryMax)}`
}

function publicationLabels(vacancy: RecruitmentVacancy) {
  return [
    vacancy.publishWebsite && 'Website',
    vacancy.publishVdab && 'VDAB',
    vacancy.publishLinkedIn && 'LinkedIn',
    vacancy.publishTempAgencies && 'Temp Agencies',
    vacancy.publishRecruitmentAgencies && 'Recruitment Agencies',
    vacancy.publishOther && 'Other',
    vacancy.otherPublication,
  ].filter(Boolean)
}

export function RecruitmentTable({applicants, vacancies, departmentId}: RecruitmentTableProps) {
  const router = useRouter()
  const [filter, setFilter] = useState('')
  const [saving, setSaving] = useState(false)
  const [applicantDialogOpen, setApplicantDialogOpen] = useState(false)
  const [vacancyDialogOpen, setVacancyDialogOpen] = useState(false)
  const [editingApplicant, setEditingApplicant] = useState<RecruitmentApplicant | null>(null)
  const [editingVacancy, setEditingVacancy] = useState<RecruitmentVacancy | null>(null)

  const normalizedFilter = filter.trim().toLowerCase()
  const filteredApplicants = useMemo(() => {
    if (!normalizedFilter) return applicants
    return applicants.filter(applicant =>
      [applicant.candidateName, applicant.profile, applicant.description, applicant.cvPath]
        .filter(Boolean)
        .some(value => value?.toLowerCase().includes(normalizedFilter)),
    )
  }, [applicants, normalizedFilter])

  const filteredVacancies = useMemo(() => {
    if (!normalizedFilter) return vacancies
    return vacancies.filter(vacancy =>
      [vacancy.title, vacancy.department, vacancy.description, vacancy.otherPublication]
        .filter(Boolean)
        .some(value => value?.toLowerCase().includes(normalizedFilter)),
    )
  }, [normalizedFilter, vacancies])

  function openApplicantDialog(applicant: RecruitmentApplicant | null) {
    setEditingApplicant(applicant)
    setApplicantDialogOpen(true)
  }

  function openVacancyDialog(vacancy: RecruitmentVacancy | null) {
    setEditingVacancy(vacancy)
    setVacancyDialogOpen(true)
  }

  async function saveApplicant(form: RecruitmentApplicantFormValue) {
    setSaving(true)
    try {
      const payload = {
        departmentId,
        candidateName: form.candidateName.trim(),
        profile: form.profile.trim() || null,
        contactDate: toNullableDate(form.contactDate),
        interviewDate: toNullableDate(form.interviewDate),
        contactType: form.contactType,
        description: form.description.trim() || null,
        cvPath: form.cvPath.trim() || null,
        potential: form.potential,
        retained: form.retained,
      }

      if (editingApplicant) await updateRecruitmentApplicantAction({...payload, id: editingApplicant.id})
      else await createRecruitmentApplicantAction(payload)

      setApplicantDialogOpen(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function saveVacancy(form: RecruitmentVacancyFormValue) {
    setSaving(true)
    try {
      const payload = {
        departmentId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        department: form.department,
        contractType: form.contractType,
        workRegime: form.workRegime,
        salaryMin: toNullableSalary(form.salaryMin),
        salaryMax: toNullableSalary(form.salaryMax),
        publishWebsite: form.publishWebsite,
        publishVdab: form.publishVdab,
        publishOther: form.publishOther,
        publishLinkedIn: form.publishLinkedIn,
        publishTempAgencies: form.publishTempAgencies,
        publishRecruitmentAgencies: form.publishRecruitmentAgencies,
        otherPublication: form.otherPublication.trim() || null,
      }

      if (editingVacancy) await updateRecruitmentVacancyAction({...payload, id: editingVacancy.id})
      else await createRecruitmentVacancyAction(payload)

      setVacancyDialogOpen(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function deleteApplicant(applicant: RecruitmentApplicant) {
    await deleteRecruitmentApplicantAction({id: applicant.id, departmentId})
    router.refresh()
  }

  async function deleteVacancy(vacancy: RecruitmentVacancy) {
    await deleteRecruitmentVacancyAction({id: vacancy.id, departmentId})
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recruitment</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage job applicants en Job offers in HR.</p>
        </div>

        <label className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={event => setFilter(event.target.value)}
            placeholder="Search"
            className="pl-9"
          />
        </label>
      </div>

      <Tabs defaultValue="applicants">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="applicants">
              <UserRound className="h-4 w-4" />
              Applicants
            </TabsTrigger>
            <TabsTrigger value="vacancies">
              <BriefcaseBusiness className="h-4 w-4" />
              Job Offers
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => openApplicantDialog(null)}>
              <Plus className="h-4 w-4" />
              Applicants
            </Button>
            <Button type="button" onClick={() => openVacancyDialog(null)}>
              <Plus className="h-4 w-4" />
              Job Offers
            </Button>
          </div>
        </div>

        <TabsContent value="applicants">
          <div className="rounded-lg border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name candidate</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Contact
                    </span>
                  </TableHead>
                  <TableHead>Meeting</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>CV</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplicants.map(applicant => (
                  <TableRow key={applicant.id}>
                    <TableCell className="font-medium">{applicant.candidateName}</TableCell>
                    <TableCell className="max-w-xs truncate">{applicant.profile ?? '-'}</TableCell>
                    <TableCell>
                      {formatDate(applicant.contactDate)}
                      <div className="text-xs text-muted-foreground">{contactLabel(applicant.contactType)}</div>
                    </TableCell>
                    <TableCell>{formatDate(applicant.interviewDate)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {applicant.potential && <Badge variant="outline">Potential</Badge>}
                        {applicant.retained ? <Badge>Retained</Badge> : <Badge variant="secondary">Not retained</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-48 truncate">{applicant.cvPath ?? '-'}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => openApplicantDialog(applicant)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => deleteApplicant(applicant)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredApplicants.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                      No applicants found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="vacancies">
          <div className="rounded-lg border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>Pay scale</TableHead>
                  <TableHead>Publication</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVacancies.map(vacancy => (
                  <TableRow key={vacancy.id}>
                    <TableCell>
                      <div className="font-medium">{vacancy.title}</div>
                      <div className="max-w-md truncate text-xs text-muted-foreground">
                        {vacancy.description ?? '-'}
                      </div>
                    </TableCell>
                    <TableCell>{vacancy.department}</TableCell>
                    <TableCell>
                      {contractLabel(vacancy.contractType)}
                      <div className="text-xs text-muted-foreground">{regimeLabel(vacancy.workRegime)}</div>
                    </TableCell>
                    <TableCell>{salaryRange(vacancy)}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {publicationLabels(vacancy).join(', ') || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => openVacancyDialog(vacancy)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => deleteVacancy(vacancy)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredVacancies.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                      No job offers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <RecruitmentApplicantFormDialog
        open={applicantDialogOpen}
        onOpenChange={setApplicantDialogOpen}
        applicant={editingApplicant}
        saving={saving}
        onSave={saveApplicant}
      />
      <RecruitmentVacancyFormDialog
        open={vacancyDialogOpen}
        onOpenChange={setVacancyDialogOpen}
        vacancy={editingVacancy}
        saving={saving}
        onSave={saveVacancy}
      />
    </div>
  )
}
