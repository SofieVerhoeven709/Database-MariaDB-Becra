'use client'

import {useMemo, useState} from 'react'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Checkbox} from '@/components/ui/checkbox'
import {Input} from '@/components/ui/input'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {BriefcaseBusiness, Download, HeartPulse, Phone, Search, ShieldCheck, UserRound} from 'lucide-react'
import {useRouter} from 'next/navigation'
import {updateHrHseIncludeFieldAction} from '@/serverFunctions/hrHseFile'
import type {HrHseFileRow, HrHseIncludeField} from '@/types/hrHseFile'

interface HrHseFileOverviewProps {
  rows: HrHseFileRow[]
  departmentId: string
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('nl-BE', {day: '2-digit', month: 'short', year: 'numeric'}).format(new Date(value))
}

function firstLine(values: Array<string | null | undefined>) {
  return values.find(value => value && value.trim()) ?? '-'
}

function configuredBadge(configured: boolean) {
  if (configured)
    return <Badge className="border-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Configured</Badge>
  return <Badge variant="outline">Default</Badge>
}

function IncludeToggle({
  checked,
  label,
  onChange,
  disabled,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
      <Checkbox checked={checked} onCheckedChange={value => onChange(value === true)} disabled={disabled} />
      {label}
    </label>
  )
}

function NotIncluded() {
  return <div className="text-xs text-muted-foreground">Not included in HSE file.</div>
}

export function HrHseFileOverview({rows, departmentId}: HrHseFileOverviewProps) {
  const router = useRouter()
  const [filter, setFilter] = useState('')
  const [localRows, setLocalRows] = useState(rows)
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const filteredRows = useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase()
    if (!normalizedFilter) return localRows
    return localRows.filter(row => row.employeeName.toLowerCase().includes(normalizedFilter))
  }, [filter, localRows])

  const configuredCount = localRows.filter(row => row.hseConfigured).length
  const trainingCount = localRows.reduce((total, row) => total + row.trainings.length, 0)

  async function handleIncludeChange(employeeId: string, field: HrHseIncludeField, value: boolean) {
    const key = `${employeeId}-${field}`
    const previousRows = localRows

    setSavingKey(key)
    setLocalRows(currentRows =>
      currentRows.map(row => (row.employeeId === employeeId ? {...row, hseConfigured: true, [field]: value} : row)),
    )

    try {
      await updateHrHseIncludeFieldAction({departmentId, employeeId, field, value})
      router.refresh()
    } catch (error) {
      setLocalRows(previousRows)
      throw error
    } finally {
      setSavingKey(null)
    }
  }

  function renderToggle(row: HrHseFileRow, field: HrHseIncludeField, label: string) {
    return (
      <IncludeToggle
        checked={Boolean(row[field])}
        label={label}
        disabled={savingKey === `${row.employeeId}-${field}`}
        onChange={value => handleIncludeChange(row.employeeId, field, value)}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            HSE files
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {configuredCount}/{localRows.length}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            Emergency contacts
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {localRows.filter(row => row.emergencyContacts.length).length}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <HeartPulse className="h-4 w-4" />
            HSE training
          </div>
          <div className="mt-2 text-2xl font-semibold">{trainingCount}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">HSE File</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Employee dossier with partner, emergency contact, employer, medical examination and HSE training.
          </p>
        </div>
        <label className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={event => setFilter(event.target.value)}
            placeholder="Filter by name"
            className="pl-9"
          />
        </label>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <span className="inline-flex items-center gap-2">
                  <UserRound className="h-4 w-4" />
                  Employee
                </span>
              </TableHead>
              <TableHead>Partner</TableHead>
              <TableHead>Emergency Contact</TableHead>
              <TableHead>
                <span className="inline-flex items-center gap-2">
                  <BriefcaseBusiness className="h-4 w-4" />
                  Employer
                </span>
              </TableHead>
              <TableHead>Last medical exam</TableHead>
              <TableHead>Training</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">PDF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map(row => {
              const emergencyContact = row.includeEmergencyContact ? row.emergencyContacts[0] : null
              const firstTraining = row.includeTrainingData ? row.trainings[0] : null

              return (
                <TableRow key={row.employeeId}>
                  <TableCell>
                    {renderToggle(row, 'includeEmployeeData', 'Include employee data')}
                    <div className="flex items-start gap-3">
                      {row.includeEmployeeData && row.photoFileId ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.photoFileId}
                          alt={row.employeeName}
                          className="h-12 w-12 rounded-full border border-border bg-secondary object-cover"
                        />
                      ) : null}
                      <div>
                        <div className="font-medium">{row.employeeName}</div>
                        {row.includeEmployeeData ? (
                          <>
                            <div className="text-xs text-muted-foreground">
                              {firstLine([row.mail, row.phoneNumber])}
                            </div>
                            <div className="text-xs text-muted-foreground">{row.address ?? '-'}</div>
                          </>
                        ) : (
                          <NotIncluded />
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {renderToggle(row, 'includePartnerData', 'Include partner')}
                    {row.includePartnerData ? (
                      <>
                        <div>{row.partnerName ?? '-'}</div>
                        <div className="text-xs text-muted-foreground">
                          {firstLine([row.partnerPhone, row.partnerEmail])}
                        </div>
                      </>
                    ) : (
                      <NotIncluded />
                    )}
                  </TableCell>
                  <TableCell>
                    {renderToggle(row, 'includeEmergencyContact', 'Include emergency contact')}
                    {emergencyContact ? (
                      <>
                        <div>{emergencyContact.name}</div>
                        <div className="text-xs text-muted-foreground">{emergencyContact.relationship}</div>
                        <div className="text-xs text-muted-foreground">{emergencyContact.phoneNumber}</div>
                      </>
                    ) : (
                      <NotIncluded />
                    )}
                  </TableCell>
                  <TableCell>
                    {renderToggle(row, 'includeEmployerData', 'Include employer')}
                    {row.includeEmployerData ? (
                      <>
                        <div>{row.employerName ?? 'Becra'}</div>
                        <div className="text-xs text-muted-foreground">
                          {firstLine([row.employerContactName, row.employerPhone, row.employerEmail])}
                        </div>
                      </>
                    ) : (
                      <NotIncluded />
                    )}
                  </TableCell>
                  <TableCell>
                    {renderToggle(row, 'includeMedicalExamination', 'Include medical exam')}
                    {row.includeMedicalExamination ? (
                      <>
                        <div>{formatDate(row.lastMedicalExaminationDate)}</div>
                        <div className="text-xs text-muted-foreground">
                          Valid until {formatDate(row.lastMedicalExaminationValidUntil)}
                        </div>
                        <div className="text-xs text-muted-foreground">{row.lastMedicalExaminationProvider ?? '-'}</div>
                      </>
                    ) : (
                      <NotIncluded />
                    )}
                  </TableCell>
                  <TableCell>
                    {renderToggle(row, 'includeTrainingData', 'Include training')}
                    {firstTraining ? (
                      <>
                        <div>{row.trainings.length} training(s)</div>
                        <div className="text-xs text-muted-foreground">
                          {firstTraining.documentNumber ?? firstTraining.name} - {formatDate(firstTraining.validUntil)}
                        </div>
                      </>
                    ) : (
                      <NotIncluded />
                    )}
                  </TableCell>
                  <TableCell>{configuredBadge(row.hseConfigured)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button asChild variant="outline" size="sm">
                        <a href={`/api/hr/hse-file/${row.employeeId}/pdf`} target="_blank" rel="noreferrer">
                          <Download className="h-4 w-4" />
                          PDF
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {!filteredRows.length && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                  No HSE files found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
