'use client'

import {useState} from 'react'
import {Search, Plus, Pencil, ChevronDown, ChevronUp, Trash2, ExternalLink} from 'lucide-react'
import {CompanyFormDialog} from '@/components/custom/companyFormDialog'
import type {VisibilityRow} from '@/components/custom/visibilityForRoleTab'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import type {MappedCompany} from '@/types/company'
import type {RoleLevelOption} from '@/types/roleLevel'
import {
  createCompanyAction,
  updateCompanyAction,
  softDeleteCompanyAction,
  hardDeleteCompanyAction,
  undeleteCompanyAction,
} from '@/serverFunctions/companies'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import type {Route} from 'next'

type SortField =
  | 'name'
  | 'number'
  | 'mail'
  | 'businessPhone'
  | 'website'
  | 'vatNumber'
  | 'iban'
  | 'bic'
  | 'bankNumber'
  | 'becraCustomerNumber'
  | 'customer'
  | 'potentialCustomer'
  | 'supplier'
  | 'preferredSupplier'
  | 'subContractor'
  | 'potentialSubContractor'
  | 'headQuarters'
  | 'newsLetter'
  | 'companyActive'
  | 'parentCompany'
  | 'createdAt'
  | 'createdBy'
  | 'deleted'

type SortDir = 'asc' | 'desc'
type FilterDeleted = 'not-deleted' | 'deleted' | 'all'

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function SortIcon({field, sortField, sortDir}: {field: SortField; sortField: SortField; sortDir: SortDir}) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? (
    <ChevronUp className="inline h-3.5 w-3.5 ml-1" />
  ) : (
    <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
  )
}

function YesNoBadge({value}: {value: boolean}) {
  return value ? (
    <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
  ) : (
    <Badge variant="secondary" className="text-muted-foreground font-medium">
      No
    </Badge>
  )
}

interface CompanyTableProps {
  initialCompanies: MappedCompany[]
  currentUserRole: string
  currentUserLevel: number
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  departmentId: string
}

const thClass = 'cursor-pointer select-none whitespace-nowrap text-xs'
const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

function Th({
  field,
  label,
  sortField,
  sortDir,
  onSort,
}: {
  field: SortField
  label: string
  sortField: SortField
  sortDir: SortDir
  onSort: (f: SortField) => void
}) {
  return (
    <TableHead className={thClass} onClick={() => onSort(field)}>
      {label} <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </TableHead>
  )
}

export function CompanyTable({
  initialCompanies,
  currentUserRole,
  currentUserLevel,
  roleLevelOptions,
  defaultVisibleRoleNames,
  departmentId,
}: CompanyTableProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canDelete = currentUserRole === 'Administrator' || currentUserLevel >= 80

  const companies = initialCompanies
  const [search, setSearch] = useState('')
  const [filterDeleted, setFilterDeleted] = useState<FilterDeleted>('not-deleted')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<MappedCompany | null>(null)

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filtered = companies
    .filter(c => {
      if (filterDeleted === 'not-deleted' && c.deleted) return false
      if (filterDeleted === 'deleted' && !c.deleted) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        c.name.toLowerCase().includes(q) ||
        c.number.toLowerCase().includes(q) ||
        (c.mail?.toLowerCase().includes(q) ?? false) ||
        (c.vatNumber?.toLowerCase().includes(q) ?? false) ||
        (c.website?.toLowerCase().includes(q) ?? false) ||
        (c.businessPhone?.toLowerCase().includes(q) ?? false) ||
        (c.iban?.toLowerCase().includes(q) ?? false) ||
        (c.becraCustomerNumber?.toLowerCase().includes(q) ?? false)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const s = (x: string | null, y: string | null) => dir * (x ?? '').localeCompare(y ?? '')
      const n = (x: boolean, y: boolean) => dir * (Number(x) - Number(y))
      switch (sortField) {
        case 'name':
          return s(a.name, b.name)
        case 'number':
          return s(a.number, b.number)
        case 'mail':
          return s(a.mail, b.mail)
        case 'businessPhone':
          return s(a.businessPhone, b.businessPhone)
        case 'website':
          return s(a.website, b.website)
        case 'vatNumber':
          return s(a.vatNumber, b.vatNumber)
        case 'iban':
          return s(a.iban, b.iban)
        case 'bic':
          return s(a.bic, b.bic)
        case 'bankNumber':
          return s(a.bankNumber, b.bankNumber)
        case 'becraCustomerNumber':
          return s(a.becraCustomerNumber, b.becraCustomerNumber)
        case 'customer':
          return n(a.customer, b.customer)
        case 'potentialCustomer':
          return n(a.potentialCustomer, b.potentialCustomer)
        case 'supplier':
          return n(a.supplier, b.supplier)
        case 'preferredSupplier':
          return n(a.preferredSupplier, b.preferredSupplier)
        case 'subContractor':
          return n(a.subContractor, b.subContractor)
        case 'potentialSubContractor':
          return n(a.potentialSubContractor, b.potentialSubContractor)
        case 'headQuarters':
          return n(a.headQuarters, b.headQuarters)
        case 'newsLetter':
          return n(a.newsLetter, b.newsLetter)
        case 'companyActive':
          return n(a.companyActive, b.companyActive)
        case 'parentCompany':
          return s(a.parentCompanyName, b.parentCompanyName)
        case 'createdAt':
          return s(a.createdAt, b.createdAt)
        case 'createdBy':
          return s(a.createdByName, b.createdByName)
        case 'deleted':
          return n(a.deleted, b.deleted)
        default:
          return 0
      }
    })

  async function handleSave(c: MappedCompany, visibilityRows: VisibilityRow[]) {
    // Core editable fields — present in both schemas
    const core = {
      name: c.name,
      number: c.number,
      mail: c.mail,
      businessPhone: c.businessPhone,
      website: c.website,
      vatNumber: c.vatNumber,
      bankNumber: c.bankNumber,
      iban: c.iban,
      bic: c.bic,
      becraCustomerNumber: c.becraCustomerNumber,
      becraWebsiteLogin: c.becraWebsiteLogin,
      supplier: c.supplier,
      preferredSupplier: c.preferredSupplier,
      companyActive: c.companyActive,
      newsLetter: c.newsLetter,
      customer: c.customer,
      potentialCustomer: c.potentialCustomer,
      headQuarters: c.headQuarters,
      potentialSubContractor: c.potentialSubContractor,
      subContractor: c.subContractor,
      notes: c.notes,
      companyId: c.companyId,
    }

    if (editingCompany) {
      await updateCompanyAction({id: c.id, ...core, visibilityForRoles: visibilityRows})
    } else {
      await createCompanyAction({
        ...core,
        addresses: c.addresses.map(a => ({
          street: a.street,
          houseNumber: a.houseNumber,
          busNumber: a.busNumber,
          zipCode: a.zipCode,
          place: a.place,
          typeAdress: a.typeAdress,
        })),
        visibilityForRoles: visibilityRows,
      })
    }
    setDialogOpen(false)
    router.refresh()
  }

  async function handleSoftDelete(c: MappedCompany) {
    await softDeleteCompanyAction({id: c.id})
    router.refresh()
  }

  async function handleHardDelete(c: MappedCompany) {
    await hardDeleteCompanyAction({id: c.id})
    router.refresh()
  }

  async function handleUndelete(c: MappedCompany) {
    await undeleteCompanyAction({id: c.id})
    router.refresh()
  }

  const showDeletedCols = filterDeleted !== 'not-deleted'

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, number, VAT, IBAN, phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border placeholder:text-muted-foreground/60 focus-visible:ring-accent"
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
        <Button
          onClick={() => {
            setEditingCompany(null)
            setDialogOpen(true)
          }}
          className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2">
          <Plus className="h-4 w-4" />
          New Company
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <Th field="name" label="Name" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="number" label="Number" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="mail" label="Email" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="businessPhone" label="Phone" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="website" label="Website" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="vatNumber" label="VAT" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="bankNumber" label="Bank #" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="iban" label="IBAN" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="bic" label="BIC" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th
                field="becraCustomerNumber"
                label="Becra #"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="companyActive" label="Active" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="customer" label="Customer" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th
                field="potentialCustomer"
                label="Pot. Customer"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="supplier" label="Supplier" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th
                field="preferredSupplier"
                label="Pref. Supplier"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="subContractor" label="Sub-Con" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th
                field="potentialSubContractor"
                label="Pot. Sub-Con"
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <Th field="headQuarters" label="HQ" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="newsLetter" label="Newsletter" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="parentCompany" label="Parent" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="createdAt" label="Created At" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <Th field="createdBy" label="Created By" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              {showDeletedCols && (
                <>
                  <Th field="deleted" label="Deleted" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <TableHead className="whitespace-nowrap text-xs">Deleted At</TableHead>
                  <TableHead className="whitespace-nowrap text-xs">Deleted By</TableHead>
                </>
              )}
              <TableHead className="w-24">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showDeletedCols ? 26 : 23} className="h-32 text-center text-muted-foreground">
                  No companies found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(c => (
                <TableRow
                  key={c.id}
                  className={`border-border/40 hover:bg-secondary/50 ${c.deleted ? 'opacity-50' : ''}`}>
                  <TableCell className={`${tdClass} text-foreground font-medium`}>
                    <Link
                      href={`/departments/${departmentId}/company/${c.id}` as Route}
                      className="hover:text-accent hover:underline transition-colors">
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className={tdClass}>{c.number}</TableCell>
                  <TableCell className={tdClass}>{c.mail ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{c.businessPhone ?? '-'}</TableCell>
                  <TableCell className={tdClass}>
                    {c.website ? (
                      <a
                        href={c.website}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-accent hover:underline transition-colors truncate max-w-[140px] inline-block">
                        {c.website}
                      </a>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className={tdClass}>{c.vatNumber ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{c.bankNumber ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{c.iban ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{c.bic ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{c.becraCustomerNumber ?? '-'}</TableCell>
                  <TableCell>
                    <YesNoBadge value={c.companyActive} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={c.customer} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={c.potentialCustomer} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={c.supplier} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={c.preferredSupplier} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={c.subContractor} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={c.potentialSubContractor} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={c.headQuarters} />
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={c.newsLetter} />
                  </TableCell>
                  <TableCell className={tdClass}>{c.parentCompanyName ?? '-'}</TableCell>
                  <TableCell className={tdClass}>{formatDate(c.createdAt)}</TableCell>
                  <TableCell className={tdClass}>{c.createdByName}</TableCell>
                  {showDeletedCols && (
                    <>
                      <TableCell>
                        {c.deleted ? (
                          <Badge variant="destructive" className="font-medium">
                            Yes
                          </Badge>
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
                      <Link href={`/departments/${departmentId}/company/${c.id}` as Route}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10">
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span className="sr-only">View {c.name}</span>
                        </Button>
                      </Link>
                      {!c.deleted && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                            onClick={() => {
                              setEditingCompany(c)
                              setDialogOpen(true)
                            }}>
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Edit {c.name}</span>
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleSoftDelete(c)}>
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="sr-only">Delete {c.name}</span>
                            </Button>
                          )}
                        </>
                      )}
                      {c.deleted && (
                        <>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary px-2"
                              onClick={() => handleUndelete(c)}>
                              Restore
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => handleHardDelete(c)}>
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="sr-only">Permanently delete {c.name}</span>
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

      <div className="text-xs text-muted-foreground">
        Showing {filtered.length} of {companies.length} companies
      </div>

      <CompanyFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        company={editingCompany}
        companies={companies.filter(c => !c.deleted).map(c => ({id: c.id, name: c.name}))}
        onSave={handleSave}
        isAdmin={isAdmin}
        canDelete={canDelete}
        roleLevelOptions={roleLevelOptions}
        defaultVisibleRoleNames={defaultVisibleRoleNames}
      />
    </div>
  )
}
