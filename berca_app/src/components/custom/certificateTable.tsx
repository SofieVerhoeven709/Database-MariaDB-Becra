'use client'

import {useState} from 'react'
import {Search, Plus, Pencil, ChevronDown, ChevronUp, Trash2, ExternalLink} from 'lucide-react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import type {Route} from 'next'
import type {MappedCertificate, MappedCertificateType} from '@/types/training'
import type {RoleLevelOption} from '@/types/roleLevel'
import type {VisibilityRow} from '@/components/custom/visibilityForRoleTab'
import {CertificateFormDialog} from '@/components/custom/certificateFormDialog'
import {CertificateTypeFormDialog} from '@/components/custom/certificateTypeFormDialog'
import {
  softDeleteCertificateAction,
  hardDeleteCertificateAction,
  undeleteCertificateAction,
  createCertificateAction,
  updateCertificateAction,
  createCertificateTypeAction,
  updateCertificateTypeAction,
  softDeleteCertificateTypeAction,
  hardDeleteCertificateTypeAction,
  undeleteCertificateTypeAction,
} from '@/serverFunctions/training'
import {TableCsvActions} from '@/components/custom/tableCsvActions'
import {getCsvValue, normalizeCsvLookup, type CsvRow} from '@/lib/csv'

type FilterDeleted = 'not-deleted' | 'deleted' | 'all'
type SortDir = 'asc' | 'desc'

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function csvErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Could not create certificate.'
}

interface CertificateTableProps {
  initialCertificates: MappedCertificate[]
  initialCertificateTypes: MappedCertificateType[]
  currentUserRole: string
  currentUserLevel: number
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  departmentId: string
}

export function CertificateTable({
  initialCertificates,
  initialCertificateTypes,
  currentUserRole,
  currentUserLevel,
  roleLevelOptions,
  defaultVisibleRoleNames,
  departmentId,
}: CertificateTableProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  // Level thresholds:
  //   >= 40  can edit certificates / types
  //   >= 60  can create new certificates / types
  //   >= 80  can delete + manage visibility
  const canEdit = currentUserLevel >= 40
  const canCreate = currentUserLevel >= 60
  const canDelete = currentUserLevel >= 80
  const canManageVisibility = currentUserLevel >= 80

  // ── Certificate state ──────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [sortField, setSortField] = useState<'descriptionShort' | 'certificateTypeName' | 'createdAt'>(
    'descriptionShort',
  )
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [certDialogOpen, setCertDialogOpen] = useState(false)
  const [editingCert, setEditingCert] = useState<MappedCertificate | null>(null)

  // ── Certificate Type state ─────────────────────────────────────────────────
  const [typeSearch, setTypeSearch] = useState('')
  const [typeFilterDeleted, setTypeFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [typeDialogOpen, setTypeDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<MappedCertificateType | null>(null)

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const SortIcon = ({field}: {field: typeof sortField}) => {
    if (sortField !== field) return null
    return sortDir === 'asc' ? (
      <ChevronUp className="inline h-3.5 w-3.5 ml-1" />
    ) : (
      <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
    )
  }

  async function handleUploadCsv(rows: CsvRow[]) {
    if (rows.length === 0) {
      window.alert('The selected CSV file does not contain rows.')
      return
    }

    const errors: string[] = []
    let created = 0

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2
      const descriptionShort = getCsvValue(row, ['Name', 'Certificate Name', 'Short Name', 'descriptionShort'])
      const certificateTypeValue = getCsvValue(row, ['Type', 'Certificate Type', 'certificateTypeId'])
      const certificateType = certificateTypeOptions.find(
        option =>
          option.id === certificateTypeValue ||
          normalizeCsvLookup(option.name) === normalizeCsvLookup(certificateTypeValue),
      )

      if (!descriptionShort) {
        errors.push(`Row ${rowNumber}: Certificate name is required.`)
        continue
      }

      if (!certificateType) {
        errors.push(`Row ${rowNumber}: Certificate Type could not be matched.`)
        continue
      }

      try {
        await createCertificateAction({
          descriptionShort,
          description: getCsvValue(row, ['Description', 'description']) || null,
          certificateTypeId: certificateType.id,
          visibilityForRoles: [],
        })
        created += 1
      } catch (error) {
        errors.push(`Row ${rowNumber}: ${csvErrorMessage(error)}`)
      }
    }

    if (created > 0) router.refresh()

    window.alert(
      errors.length > 0
        ? `Created ${created} certificate(s). ${errors.slice(0, 5).join(' ')}${
            errors.length > 5 ? ` +${errors.length - 5} more error(s).` : ''
          }`
        : `Created ${created} certificate(s).`,
    )
  }
  // Apply filters and sorting for the certificate list.
  const filteredCerts = initialCertificates
    .filter(c => {
      if (filterDeleted === 'not-deleted' && c.deleted) return false
      if (filterDeleted === 'deleted' && !c.deleted) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        (c.descriptionShort?.toLowerCase().includes(q) ?? false) ||
        (c.description?.toLowerCase().includes(q) ?? false) ||
        c.certificateTypeName.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const s = (x: string | null, y: string | null) => dir * (x ?? '').localeCompare(y ?? '')
      if (sortField === 'descriptionShort') return s(a.descriptionShort, b.descriptionShort)
      if (sortField === 'certificateTypeName') return s(a.certificateTypeName, b.certificateTypeName)
      return s(a.createdAt, b.createdAt)
    })

  // Apply filters for the certificate type list.
  const filteredTypes = initialCertificateTypes
    .filter(t => {
      if (typeFilterDeleted === 'not-deleted' && t.deleted) return false
      if (typeFilterDeleted === 'deleted' && !t.deleted) return false
      if (!typeSearch) return true
      return t.name.toLowerCase().includes(typeSearch.toLowerCase())
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  // Options for the certificate type dropdown (non-deleted only).
  const certificateTypeOptions = initialCertificateTypes.filter(t => !t.deleted).map(t => ({id: t.id, name: t.name}))

  async function handleSaveCert(c: MappedCertificate, visibilityRows: VisibilityRow[]) {
    const core = {
      description: c.description,
      descriptionShort: c.descriptionShort,
      certificateTypeId: c.certificateTypeId,
      visibilityForRoles: visibilityRows,
    }
    if (editingCert) {
      await updateCertificateAction({id: c.id, ...core})
    } else {
      await createCertificateAction(core)
    }
    setCertDialogOpen(false)
    router.refresh()
  }

  async function handleSaveType(name: string, id?: string) {
    if (id) {
      await updateCertificateTypeAction({id, name})
    } else {
      await createCertificateTypeAction({name})
    }
    setTypeDialogOpen(false)
    router.refresh()
  }
  const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
  const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'
  const showDeletedCols = filterDeleted !== 'not-deleted'

  return (
    <div className="flex flex-col gap-6">
      <Tabs defaultValue="certificates">
        <TabsList className="bg-secondary border border-border/60">
          <TabsTrigger value="certificates">
            Certificates
            <Badge variant="secondary" className="ml-2 text-xs">
              {initialCertificates.filter(c => !c.deleted).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="types">
            Certificate Types
            <Badge variant="secondary" className="ml-2 text-xs">
              {initialCertificateTypes.filter(t => !t.deleted).length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── Certificates tab ── */}
        <TabsContent value="certificates" className="mt-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search certificates…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                />
              </div>
              <Select value={filterDeleted} onValueChange={v => setFilterDeleted(v as FilterDeleted)}>
                <SelectTrigger className="w-[150px] bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="not-deleted">Not Deleted</SelectItem>
                  <SelectItem value="deleted">Deleted Only</SelectItem>
                  <SelectItem value="all">Show All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <TableCsvActions filename="certificate-table.csv" onUpload={handleUploadCsv} />

            {canCreate && (
              <Button
                onClick={() => {
                  setEditingCert(null)
                  setCertDialogOpen(true)
                }}
                className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
                <Plus className="h-4 w-4" /> New Certificate
              </Button>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className={thClass} onClick={() => toggleSort('descriptionShort')}>
                    Name <SortIcon field="descriptionShort" />
                  </TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Description</TableHead>
                  <TableHead className={thClass} onClick={() => toggleSort('certificateTypeName')}>
                    Type <SortIcon field="certificateTypeName" />
                  </TableHead>
                  <TableHead className={thClass} onClick={() => toggleSort('createdAt')}>
                    Created At <SortIcon field="createdAt" />
                  </TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Created By</TableHead>
                  {showDeletedCols && (
                    <>
                      <TableHead className="text-xs whitespace-nowrap">Deleted</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">Deleted At</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">Deleted By</TableHead>
                    </>
                  )}
                  <TableHead className="w-24">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showDeletedCols ? 8 : 5} className="h-32 text-center text-muted-foreground">
                      No certificates found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCerts.map(c => (
                    <TableRow
                      key={c.id}
                      className={`border-border/40 hover:bg-secondary/50 ${c.deleted ? 'opacity-50' : ''}`}>
                      <TableCell className={`${tdClass} text-foreground font-medium`}>
                        <Link
                          href={`/departments/${departmentId}/certificateTraining/${c.id}` as Route}
                          className="hover:text-accent hover:underline transition-colors">
                          {c.descriptionShort ?? '-'}
                        </Link>
                      </TableCell>
                      <TableCell className={`${tdClass} max-w-xs`}>
                        <p className="truncate max-w-[200px]" title={c.description ?? ''}>
                          {c.description ?? '-'}
                        </p>
                      </TableCell>
                      <TableCell className={tdClass}>{c.certificateTypeName}</TableCell>
                      <TableCell className={tdClass}>{formatDate(c.createdAt)}</TableCell>
                      <TableCell className={tdClass}>{c.createdByName}</TableCell>
                      {showDeletedCols && (
                        <>
                          <TableCell>
                            {c.deleted ? (
                              <Badge variant="destructive">Yes</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">No</span>
                            )}
                          </TableCell>
                          <TableCell className={tdClass}>{formatDate(c.deletedAt)}</TableCell>
                          <TableCell className={tdClass}>{c.deletedByName ?? '-'}</TableCell>
                        </>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link href={`/departments/${departmentId}/certificateTraining/${c.id}` as Route}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          {!c.deleted && canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                              onClick={() => {
                                setEditingCert(c)
                                setCertDialogOpen(true)
                              }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {!c.deleted && canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={async () => {
                                await softDeleteCertificateAction({id: c.id})
                                router.refresh()
                              }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {c.deleted && (
                            <>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                  onClick={async () => {
                                    await undeleteCertificateAction({id: c.id})
                                    router.refresh()
                                  }}>
                                  Restore
                                </Button>
                              )}
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                  onClick={async () => {
                                    await hardDeleteCertificateAction({id: c.id})
                                    router.refresh()
                                  }}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Showing {filteredCerts.length} of {initialCertificates.length} certificates
          </p>
        </TabsContent>

        {/* ── Certificate Types tab ── */}
        <TabsContent value="types" className="mt-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search types…"
                  value={typeSearch}
                  onChange={e => setTypeSearch(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                />
              </div>
              <Select value={typeFilterDeleted} onValueChange={v => setTypeFilterDeleted(v as FilterDeleted)}>
                <SelectTrigger className="w-[150px] bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="not-deleted">Not Deleted</SelectItem>
                  <SelectItem value="deleted">Deleted Only</SelectItem>
                  <SelectItem value="all">Show All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {canCreate && (
              <Button
                onClick={() => {
                  setEditingType(null)
                  setTypeDialogOpen(true)
                }}
                className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
                <Plus className="h-4 w-4" /> New Type
              </Button>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="text-xs whitespace-nowrap">Name</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Created At</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Created By</TableHead>
                  {typeFilterDeleted !== 'not-deleted' && (
                    <>
                      <TableHead className="text-xs whitespace-nowrap">Deleted</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">Deleted At</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">Deleted By</TableHead>
                    </>
                  )}
                  <TableHead className="w-24">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTypes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={typeFilterDeleted !== 'not-deleted' ? 7 : 4}
                      className="h-32 text-center text-muted-foreground">
                      No certificate types found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTypes.map(t => (
                    <TableRow
                      key={t.id}
                      className={`border-border/40 hover:bg-secondary/50 ${t.deleted ? 'opacity-50' : ''}`}>
                      <TableCell className="text-sm text-foreground font-medium">{t.name}</TableCell>
                      <TableCell className={tdClass}>{formatDate(t.createdAt)}</TableCell>
                      <TableCell className={tdClass}>{t.createdByName}</TableCell>
                      {typeFilterDeleted !== 'not-deleted' && (
                        <>
                          <TableCell>
                            {t.deleted ? (
                              <Badge variant="destructive">Yes</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">No</span>
                            )}
                          </TableCell>
                          <TableCell className={tdClass}>{formatDate(t.deletedAt)}</TableCell>
                          <TableCell className={tdClass}>{t.deletedByName ?? '-'}</TableCell>
                        </>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {!t.deleted && canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                              onClick={() => {
                                setEditingType(t)
                                setTypeDialogOpen(true)
                              }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {!t.deleted && canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={async () => {
                                await softDeleteCertificateTypeAction({id: t.id})
                                router.refresh()
                              }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {t.deleted && (
                            <>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                  onClick={async () => {
                                    await undeleteCertificateTypeAction({id: t.id})
                                    router.refresh()
                                  }}>
                                  Restore
                                </Button>
                              )}
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                  onClick={async () => {
                                    await hardDeleteCertificateTypeAction({id: t.id})
                                    router.refresh()
                                  }}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Showing {filteredTypes.length} of {initialCertificateTypes.length} types
          </p>
        </TabsContent>
      </Tabs>

      <CertificateFormDialog
        open={certDialogOpen}
        onOpenChange={setCertDialogOpen}
        certificate={editingCert}
        onSave={handleSaveCert}
        isAdmin={isAdmin}
        roleLevelOptions={roleLevelOptions}
        defaultVisibleRoleNames={defaultVisibleRoleNames}
        certificateTypeOptions={certificateTypeOptions}
        canManageVisibility={canManageVisibility}
      />

      <CertificateTypeFormDialog
        open={typeDialogOpen}
        onOpenChange={setTypeDialogOpen}
        certificateType={editingType}
        onSave={handleSaveType}
      />
    </div>
  )
}
