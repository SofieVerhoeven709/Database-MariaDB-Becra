'use client'

import {useMemo, useState} from 'react'
import {useRouter} from 'next/navigation'
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
} from 'lucide-react'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {
  HrAbsenceFormDialog,
  HrCertificationTrainingFormDialog,
  absenceTypeLabel,
  toHrDate,
  trainingTypeLabel,
  type HrAbsenceFormValue,
  type HrCertificationTrainingFormValue,
} from '@/components/custom/hrCertificationTrainingFormDialog'
import {
  createHrAbsenceAction,
  createHrCertificationTrainingAction,
  deleteHrAbsenceAction,
  deleteHrCertificationTrainingAction,
  updateHrAbsenceAction,
  updateHrCertificationTrainingAction,
} from '@/serverFunctions/hrCertificationTraining'
import type {
  HrAbsence,
  HrAbsenceType,
  HrCertificationTraining,
  HrCertificationTrainingEmployeeOption,
} from '@/types/hrCertificationTraining'

interface HrCertificationTrainingTableProps {
  certifications: HrCertificationTraining[]
  absences: HrAbsence[]
  employees: HrCertificationTrainingEmployeeOption[]
  departmentId: string
}

type ValidityFilter = 'all' | 'expiring' | 'valid' | 'expired' | 'no_validity'
type AbsenceFilter = HrAbsenceType | 'all'

function formatDate(iso: string | null) {
  if (!iso) return '-'
  return new Intl.DateTimeFormat('nl-BE', {day: '2-digit', month: 'short', year: 'numeric'}).format(new Date(iso))
}

function getValidityState(record: HrCertificationTraining) {
  if (!record.certificateValidUntil) return 'no_validity'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const validUntil = new Date(record.certificateValidUntil)
  validUntil.setHours(0, 0, 0, 0)
  const warningDate = new Date(today)
  warningDate.setMonth(warningDate.getMonth() + 6)

  if (validUntil < today) return 'expired'
  if (validUntil <= warningDate) return 'expiring'
  return 'valid'
}

function validityBadge(record: HrCertificationTraining) {
  const state = getValidityState(record)

  if (state === 'expired') {
    return <Badge className="border-0 bg-red-500/15 text-red-700 dark:text-red-300">Vervallen</Badge>
  }
  if (state === 'expiring') {
    return (
      <Badge className="border-0 bg-amber-500/20 text-amber-800 dark:text-amber-300">
        <AlertTriangle className="h-3.5 w-3.5" />
        Withing 6 months
      </Badge>
    )
  }
  if (state === 'valid') {
    return <Badge className="border-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Geldig</Badge>
  }
  return <Badge variant="secondary">Geen certificaat</Badge>
}

function recurrenceLabel(value: string) {
  if (value === '5y') return '5 year'
  if (value === '10y') return '10 jaar'
  return '-'
}

export function HrCertificationTrainingTable({
  certifications,
  absences,
  employees,
  departmentId,
}: HrCertificationTrainingTableProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [validityFilter, setValidityFilter] = useState<ValidityFilter>('all')
  const [absenceTypeFilter, setAbsenceTypeFilter] = useState<AbsenceFilter>('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [certificationDialogOpen, setCertificationDialogOpen] = useState(false)
  const [absenceDialogOpen, setAbsenceDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingCertification, setEditingCertification] = useState<HrCertificationTraining | null>(null)
  const [editingAbsence, setEditingAbsence] = useState<HrAbsence | null>(null)

  const years = useMemo(() => {
    const uniqueYears = new Set(absences.map(absence => absence.year))
    uniqueYears.add(new Date().getFullYear())
    return [...uniqueYears].sort((a, b) => b - a)
  }, [absences])

  const filteredCertifications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return certifications.filter(record => {
      if (validityFilter !== 'all' && getValidityState(record) !== validityFilter) return false
      if (!normalizedQuery) return true

      return [record.employeeName, record.trainingName, record.providerName]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    })
  }, [certifications, query, validityFilter])

  const filteredAbsences = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return absences.filter(absence => {
      if (absenceTypeFilter !== 'all' && absence.absenceType !== absenceTypeFilter) return false
      if (yearFilter !== 'all' && String(absence.year) !== yearFilter) return false
      if (!normalizedQuery) return true

      return absence.employeeName.toLowerCase().includes(normalizedQuery)
    })
  }, [absenceTypeFilter, absences, query, yearFilter])

  function openCreateCertificationDialog() {
    setEditingCertification(null)
    setCertificationDialogOpen(true)
  }

  function openEditCertificationDialog(record: HrCertificationTraining) {
    setEditingCertification(record)
    setCertificationDialogOpen(true)
  }

  function openCreateAbsenceDialog() {
    setEditingAbsence(null)
    setAbsenceDialogOpen(true)
  }

  function openEditAbsenceDialog(absence: HrAbsence) {
    setEditingAbsence(absence)
    setAbsenceDialogOpen(true)
  }

  async function handleSaveCertification(form: HrCertificationTrainingFormValue) {
    setSaving(true)
    try {
      const payload = {
        departmentId,
        employeeId: form.employeeId,
        trainingName: form.trainingName.trim(),
        trainingType: form.trainingType,
        recurrenceInterval: form.recurrenceInterval,
        trainingDate: toHrDate(form.trainingDate),
        certificateValidUntil: form.certificateValidUntil ? toHrDate(form.certificateValidUntil) : null,
        providerName: form.providerName.trim(),
        additionalInfo: form.additionalInfo.trim() || null,
      }

      if (editingCertification) {
        await updateHrCertificationTrainingAction({...payload, id: editingCertification.id})
      } else {
        await createHrCertificationTrainingAction(payload)
      }

      setCertificationDialogOpen(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAbsence(form: HrAbsenceFormValue) {
    setSaving(true)
    try {
      const payload = {
        departmentId,
        employeeId: form.employeeId,
        year: Number(form.year),
        absenceType: form.absenceType,
        days: Number(form.days),
        additionalInfo: form.additionalInfo.trim() || null,
      }

      if (editingAbsence) {
        await updateHrAbsenceAction({...payload, id: editingAbsence.id})
      } else {
        await createHrAbsenceAction(payload)
      }

      setAbsenceDialogOpen(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteCertification(record: HrCertificationTraining) {
    await deleteHrCertificationTrainingAction({id: record.id, departmentId})
    router.refresh()
  }

  async function handleDeleteAbsence(absence: HrAbsence) {
    await deleteHrAbsenceAction({id: absence.id, departmentId})
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employee Certificates & Training</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Beheer opleidingen, certificaten en afwezigheden per werknemer.
          </p>
        </div>

        <label className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Zoek werknemer, opleiding of verstrekker"
            className="pl-9"
          />
        </label>
      </div>

      <Tabs defaultValue="certifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="certifications">
            <BadgeCheck className="h-4 w-4" />
            Certificates & training
          </TabsTrigger>
          <TabsTrigger value="absences">
            <CalendarDays className="h-4 w-4" />
            Afwezigheden
          </TabsTrigger>
        </TabsList>

        <TabsContent value="certifications" className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Select value={validityFilter} onValueChange={value => setValidityFilter(value as ValidityFilter)}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle certificaten</SelectItem>
                <SelectItem value="expiring">Binnen 6 maanden</SelectItem>
                <SelectItem value="expired">Vervallen</SelectItem>
                <SelectItem value="valid">Geldig</SelectItem>
                <SelectItem value="no_validity">Geen certificaat</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" onClick={openCreateCertificationDialog}>
              <Plus className="h-4 w-4" />
              Opleiding toevoegen
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <span className="inline-flex items-center gap-2">
                      <UserRound className="h-4 w-4" />
                      Werknemer
                    </span>
                  </TableHead>
                  <TableHead>
                    <span className="inline-flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Opleiding
                    </span>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Geldig tot</TableHead>
                  <TableHead>Verstrekker</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCertifications.map(record => (
                  <TableRow
                    key={record.id}
                    className={getValidityState(record) === 'expiring' ? 'bg-amber-500/5' : undefined}>
                    <TableCell className="font-medium">{record.employeeName}</TableCell>
                    <TableCell>
                      <div className="font-medium">{record.trainingName}</div>
                      {record.additionalInfo && (
                        <div className="mt-1 text-xs text-muted-foreground">{record.additionalInfo}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>{trainingTypeLabel(record.trainingType)}</div>
                      <div className="text-xs text-muted-foreground">{recurrenceLabel(record.recurrenceInterval)}</div>
                    </TableCell>
                    <TableCell>{formatDate(record.trainingDate)}</TableCell>
                    <TableCell>{formatDate(record.certificateValidUntil)}</TableCell>
                    <TableCell>{record.providerName}</TableCell>
                    <TableCell>{validityBadge(record)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditCertificationDialog(record)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCertification(record)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredCertifications.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                      Geen opleidingen of certificaten gevonden.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="absences" className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle jaren</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={absenceTypeFilter} onValueChange={value => setAbsenceTypeFilter(value as AbsenceFilter)}>
                <SelectTrigger className="w-full sm:w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle types</SelectItem>
                  <SelectItem value="ADV">ADV</SelectItem>
                  <SelectItem value="VACATION">Vakantiedagen</SelectItem>
                  <SelectItem value="SICKNESS">Ziekte</SelectItem>
                  <SelectItem value="SMALL_LEAVE">Klein verlet</SelectItem>
                  <SelectItem value="HOLIDAY">Feestdag</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="button" onClick={openCreateAbsenceDialog}>
              <Plus className="h-4 w-4" />
              Afwezigheid toevoegen
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Werknemer</TableHead>
                  <TableHead>Jaar</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dagen</TableHead>
                  <TableHead>Additional info</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAbsences.map(absence => (
                  <TableRow key={absence.id}>
                    <TableCell className="font-medium">{absence.employeeName}</TableCell>
                    <TableCell>{absence.year}</TableCell>
                    <TableCell>{absenceTypeLabel(absence.absenceType)}</TableCell>
                    <TableCell>{absence.days}</TableCell>
                    <TableCell>{absence.additionalInfo ?? '-'}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditAbsenceDialog(absence)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleDeleteAbsence(absence)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredAbsences.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                      Geen afwezigheden gevonden.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <HrCertificationTrainingFormDialog
        open={certificationDialogOpen}
        onOpenChange={setCertificationDialogOpen}
        record={editingCertification}
        employees={employees}
        saving={saving}
        onSave={handleSaveCertification}
      />
      <HrAbsenceFormDialog
        open={absenceDialogOpen}
        onOpenChange={setAbsenceDialogOpen}
        absence={editingAbsence}
        employees={employees}
        saving={saving}
        onSave={handleSaveAbsence}
      />
    </div>
  )
}
