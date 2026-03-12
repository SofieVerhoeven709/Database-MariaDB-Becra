'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowLeft, Pencil, X, Save, ExternalLink} from 'lucide-react'
import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {updateCompanyAction} from '@/serverFunctions/companies'
import {VisibilityForRoleTab, buildInitialVisibilityRows} from '@/components/custom/visibilityForRoleTab'
import type {VisibilityRow} from '@/components/custom/visibilityForRoleTab'
import type {Route} from 'next'
import type {RoleLevelOption} from '@/types/roleLevel'
import type {CompanyDetailData} from '@/types/company'

interface Option {
  id: string
  name: string
}

interface CompanyDetailProps {
  company: CompanyDetailData
  companies: Option[]
  currentUserRole: string
  currentUserLevel: number
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
}

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
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

function isActiveContact(endDate: string | null) {
  if (!endDate) return true
  return new Date(endDate) > new Date()
}

const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'
const thClass = 'whitespace-nowrap text-xs'

export function CompanyDetail({
  company,
  companies,
  currentUserRole,
  currentUserLevel,
  roleLevelOptions,
  defaultVisibleRoleNames,
}: CompanyDetailProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAllContacts, setShowAllContacts] = useState(false)

  // ─── Edit form ─────────────────────────────────────────────────────────────
  const buildForm = () => ({
    name: company.name,
    number: company.number,
    mail: company.mail ?? '',
    businessPhone: company.businessPhone ?? '',
    website: company.website ?? '',
    vatNumber: company.vatNumber ?? '',
    bankNumber: company.bankNumber ?? '',
    iban: company.iban ?? '',
    bic: company.bic ?? '',
    becraCustomerNumber: company.becraCustomerNumber ?? '',
    becraWebsiteLogin: company.becraWebsiteLogin ?? '',
    notes: company.notes ?? '',
    companyId: company.companyId ?? 'none',
    supplier: company.supplier,
    preferredSupplier: company.preferredSupplier,
    companyActive: company.companyActive,
    newsLetter: company.newsLetter,
    customer: company.customer,
    potentialCustomer: company.potentialCustomer,
    headQuarters: company.headQuarters,
    potentialSubContractor: company.potentialSubContractor,
    subContractor: company.subContractor,
  })

  const [form, setForm] = useState(buildForm)
  const s = <K extends keyof ReturnType<typeof buildForm>>(key: K, v: ReturnType<typeof buildForm>[K]) =>
    setForm(f => ({...f, [key]: v}))

  // ─── Visibility state (controlled, flushed on save) ────────────────────────
  const [visibilityRows, setVisibilityRows] = useState<VisibilityRow[]>(() =>
    buildInitialVisibilityRows(company.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames),
  )

  function handleCancel() {
    setForm(buildForm())
    // Reset visibility back to what the server has
    setVisibilityRows(buildInitialVisibilityRows(company.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames))
    setEditing(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateCompanyAction({
        id: company.id,
        name: form.name,
        number: form.number,
        mail: form.mail || null,
        businessPhone: form.businessPhone || null,
        website: form.website || null,
        vatNumber: form.vatNumber || null,
        bankNumber: form.bankNumber || null,
        iban: form.iban || null,
        bic: form.bic || null,
        becraCustomerNumber: form.becraCustomerNumber || null,
        becraWebsiteLogin: form.becraWebsiteLogin || null,
        notes: form.notes || null,
        companyId: form.companyId === 'none' ? null : form.companyId,
        supplier: form.supplier,
        preferredSupplier: form.preferredSupplier,
        companyActive: form.companyActive,
        newsLetter: form.newsLetter,
        customer: form.customer,
        potentialCustomer: form.potentialCustomer,
        headQuarters: form.headQuarters,
        potentialSubContractor: form.potentialSubContractor,
        subContractor: form.subContractor,
        // Visibility flushed here, not on every toggle
        visibilityForRoles: visibilityRows,
      })
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const activeContacts = company.contacts.filter(c => isActiveContact(c.endDate))
  const visibleContacts = showAllContacts ? company.contacts : activeContacts
  const activeProjects = company.projects.filter(p => p.isOpen && !p.isClosed)
  const closedProjects = company.projects.filter(p => p.isClosed || !p.isOpen)

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{company.name}</h1>
            <p className="text-sm text-muted-foreground">
              #{company.number}
              {company.parentCompanyName && ` · ${company.parentCompanyName}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={handleCancel} className="gap-2 border-border">
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2 bg-accent text-accent-foreground hover:bg-accent/80">
                <Save className="h-4 w-4" />
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)} variant="outline" className="gap-2 border-border">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* ── Info card ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/60 bg-card p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              {key: 'name', label: 'Name'},
              {key: 'number', label: 'Number'},
              {key: 'mail', label: 'Email'},
              {key: 'businessPhone', label: 'Business Phone'},
              {key: 'website', label: 'Website'},
              {key: 'vatNumber', label: 'VAT Number'},
              {key: 'bankNumber', label: 'Bank Number'},
              {key: 'iban', label: 'IBAN'},
              {key: 'bic', label: 'BIC'},
              {key: 'becraCustomerNumber', label: 'Becra Customer #'},
              {key: 'becraWebsiteLogin', label: 'Becra Login'},
            ] as const
          ).map(({key, label}) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              {editing ? (
                <Input
                  value={form[key]}
                  onChange={e => s(key, e.target.value)}
                  className="bg-secondary border-border"
                  disabled={key === 'number'}
                />
              ) : (
                <p className="text-sm">
                  {key === 'website' && company.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-accent hover:underline">
                      {company.website}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">{company[key] ?? '-'}</span>
                  )}
                </p>
              )}
            </div>
          ))}

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Parent Company</Label>
            {editing ? (
              <Select value={form.companyId} onValueChange={v => s('companyId', v)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="none">None</SelectItem>
                  {companies
                    .filter(c => c.id !== company.id)
                    .map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                {company.parentCompanyName ? (
                  <Link href={`/companies/${company.companyId}` as Route} className="hover:text-accent hover:underline">
                    {company.parentCompanyName}
                  </Link>
                ) : (
                  '-'
                )}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Created By</Label>
            <p className="text-sm text-muted-foreground">{company.createdByName}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Created At</Label>
            <p className="text-sm text-muted-foreground">{formatDate(company.createdAt)}</p>
          </div>

          <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(
              [
                {key: 'companyActive', label: 'Active'},
                {key: 'customer', label: 'Customer'},
                {key: 'potentialCustomer', label: 'Pot. Customer'},
                {key: 'supplier', label: 'Supplier'},
                {key: 'preferredSupplier', label: 'Pref. Supplier'},
                {key: 'subContractor', label: 'Sub-Contractor'},
                {key: 'potentialSubContractor', label: 'Pot. Sub-Con'},
                {key: 'headQuarters', label: 'Head Quarters'},
                {key: 'newsLetter', label: 'Newsletter'},
              ] as const
            ).map(({key, label}) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                {editing ? (
                  <Switch checked={form[key]} onCheckedChange={v => s(key, v)} />
                ) : (
                  <YesNoBadge value={company[key]} />
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
            <Label className="text-xs text-muted-foreground">Notes</Label>
            {editing ? (
              <Textarea
                value={form.notes}
                onChange={e => s('notes', e.target.value)}
                rows={3}
                className="bg-secondary border-border resize-none"
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{company.notes ?? '-'}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="contacts">
        <TabsList className="bg-secondary border border-border/60 flex-wrap h-auto gap-1">
          <TabsTrigger value="contacts">
            Contacts
            <Badge variant="secondary" className="ml-2 text-xs">
              {activeContacts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="projects">
            Projects
            <Badge variant="secondary" className="ml-2 text-xs">
              {company.projects.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="addresses">
            Addresses
            <Badge variant="secondary" className="ml-2 text-xs">
              {company.addresses.length}
            </Badge>
          </TabsTrigger>
          {company.subsidiaries.length > 0 && (
            <TabsTrigger value="subsidiaries">
              Subsidiaries
              <Badge variant="secondary" className="ml-2 text-xs">
                {company.subsidiaries.length}
              </Badge>
            </TabsTrigger>
          )}
          {isAdmin && <TabsTrigger value="visibility">Visibility</TabsTrigger>}
        </TabsList>

        {/* ── Contacts ─────────────────────────────────────────────────────── */}
        <TabsContent value="contacts" className="mt-3">
          {company.contacts.length > activeContacts.length && (
            <div className="flex items-center gap-2 mb-3">
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 border-border"
                onClick={() => setShowAllContacts(v => !v)}>
                {showAllContacts
                  ? `Active only (${activeContacts.length})`
                  : `Show all incl. ended (${company.contacts.length})`}
              </Button>
            </div>
          )}
          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className={thClass}>Name</TableHead>
                  <TableHead className={thClass}>Role at Company</TableHead>
                  <TableHead className={thClass}>Email</TableHead>
                  <TableHead className={thClass}>Phone</TableHead>
                  <TableHead className={thClass}>Mobile</TableHead>
                  <TableHead className={thClass}>Started</TableHead>
                  <TableHead className={thClass}>End Date</TableHead>
                  <TableHead className={thClass}>Status</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Open</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      No active contacts at this company.
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleContacts.map(cc => {
                    const active = isActiveContact(cc.endDate)
                    return (
                      <TableRow
                        key={cc.id}
                        className={`border-border/40 hover:bg-secondary/50 ${!active ? 'opacity-50' : ''}`}>
                        <TableCell className={`${tdClass} text-foreground font-medium`}>
                          {cc.contact.firstName} {cc.contact.lastName}
                        </TableCell>
                        <TableCell className={tdClass}>{cc.roleWithCompany ?? '-'}</TableCell>
                        <TableCell className={tdClass}>{cc.contact.mail1 ?? '-'}</TableCell>
                        <TableCell className={tdClass}>{cc.contact.generalPhone ?? '-'}</TableCell>
                        <TableCell className={tdClass}>{cc.contact.mobilePhone ?? '-'}</TableCell>
                        <TableCell className={tdClass}>{formatDate(cc.startedDate)}</TableCell>
                        <TableCell className={tdClass}>{formatDate(cc.endDate)}</TableCell>
                        <TableCell>
                          {active ? (
                            <Badge className="bg-accent/15 text-accent border-0 font-medium">Active</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-muted-foreground font-medium">
                              Ended
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link href={`/contacts/${cc.contact.id}` as Route}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-accent/10">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Projects ─────────────────────────────────────────────────────── */}
        <TabsContent value="projects" className="mt-3">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Active ({activeProjects.length})
              </p>
              <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/60">
                      <TableHead className={thClass}>Project #</TableHead>
                      <TableHead className={thClass}>Name</TableHead>
                      <TableHead className={thClass}>Type</TableHead>
                      <TableHead className={thClass}>Start</TableHead>
                      <TableHead className={thClass}>End</TableHead>
                      <TableHead className={thClass}>Main</TableHead>
                      <TableHead className={thClass}>Internal</TableHead>
                      <TableHead className={thClass}>Created By</TableHead>
                      <TableHead className="w-10">
                        <span className="sr-only">Open</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeProjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-20 text-center text-muted-foreground">
                          No active projects.
                        </TableCell>
                      </TableRow>
                    ) : (
                      activeProjects.map(p => (
                        <TableRow key={p.id} className="border-border/40 hover:bg-secondary/50">
                          <TableCell className={`${tdClass} text-foreground font-medium`}>{p.projectNumber}</TableCell>
                          <TableCell className={tdClass}>{p.projectName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-border text-muted-foreground font-normal">
                              {p.projectTypeName}
                            </Badge>
                          </TableCell>
                          <TableCell className={tdClass}>{formatDate(p.startDate)}</TableCell>
                          <TableCell className={tdClass}>{formatDate(p.endDate)}</TableCell>
                          <TableCell>
                            <YesNoBadge value={p.isMainProject} />
                          </TableCell>
                          <TableCell>
                            <YesNoBadge value={p.isIntern} />
                          </TableCell>
                          <TableCell className={tdClass}>{p.createdByName}</TableCell>
                          <TableCell>
                            <Link href={`/departments/project/project/${p.id}` as Route}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-accent/10">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {closedProjects.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Closed / Not open ({closedProjects.length})
                </p>
                <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-border/60">
                        <TableHead className={thClass}>Project #</TableHead>
                        <TableHead className={thClass}>Name</TableHead>
                        <TableHead className={thClass}>Type</TableHead>
                        <TableHead className={thClass}>Start</TableHead>
                        <TableHead className={thClass}>End</TableHead>
                        <TableHead className={thClass}>Open</TableHead>
                        <TableHead className={thClass}>Closed</TableHead>
                        <TableHead className="w-10">
                          <span className="sr-only">Open</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {closedProjects.map(p => (
                        <TableRow key={p.id} className="border-border/40 hover:bg-secondary/50 opacity-60">
                          <TableCell className={`${tdClass} text-foreground font-medium`}>{p.projectNumber}</TableCell>
                          <TableCell className={tdClass}>{p.projectName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-border text-muted-foreground font-normal">
                              {p.projectTypeName}
                            </Badge>
                          </TableCell>
                          <TableCell className={tdClass}>{formatDate(p.startDate)}</TableCell>
                          <TableCell className={tdClass}>{formatDate(p.endDate)}</TableCell>
                          <TableCell>
                            <YesNoBadge value={p.isOpen} />
                          </TableCell>
                          <TableCell>
                            <YesNoBadge value={p.isClosed} />
                          </TableCell>
                          <TableCell>
                            <Link href={`/departments/project/project/${p.id}` as Route}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-accent/10">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Addresses ────────────────────────────────────────────────────── */}
        <TabsContent value="addresses" className="mt-3">
          {company.addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No addresses recorded.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {company.addresses.map(a => (
                <div key={a.id} className="rounded-lg border border-border bg-card p-4 flex flex-col gap-1">
                  {a.typeAdress && (
                    <Badge variant="outline" className="w-fit text-xs border-border mb-1">
                      {a.typeAdress}
                    </Badge>
                  )}
                  <p className="text-sm text-foreground">
                    {[a.street, a.houseNumber, a.busNumber].filter(Boolean).join(' ') || '-'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {[a.zipCode, a.place].filter(Boolean).join(' ') || '-'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Subsidiaries ─────────────────────────────────────────────────── */}
        {company.subsidiaries.length > 0 && (
          <TabsContent value="subsidiaries" className="mt-3">
            <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/60">
                    <TableHead className={thClass}>Name</TableHead>
                    <TableHead className={thClass}>Number</TableHead>
                    <TableHead className={thClass}>Active</TableHead>
                    <TableHead className="w-10">
                      <span className="sr-only">Open</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {company.subsidiaries.map(sub => (
                    <TableRow key={sub.id} className="border-border/40 hover:bg-secondary/50">
                      <TableCell className={`${tdClass} text-foreground font-medium`}>{sub.name}</TableCell>
                      <TableCell className={tdClass}>{sub.number}</TableCell>
                      <TableCell>
                        <YesNoBadge value={sub.companyActive} />
                      </TableCell>
                      <TableCell>
                        <Link href={`/companies/${sub.id}` as Route}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-accent/10">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        )}

        {/* ── Visibility ───────────────────────────────────────────────────── */}
        {isAdmin && (
          <TabsContent value="visibility" className="mt-3">
            {editing ? (
              <VisibilityForRoleTab
                roleLevelOptions={roleLevelOptions}
                value={visibilityRows}
                onChange={setVisibilityRows}
              />
            ) : (
              // Read-only summary when not editing
              <div className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">Click Edit to change visibility settings.</p>
                <div className="flex flex-wrap gap-3">
                  {roleLevelOptions.map(rl => {
                    const visible = visibilityRows.find(r => r.roleLevelId === rl.id)?.visible ?? false
                    return (
                      <div
                        key={rl.id}
                        className="flex flex-col items-start gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 w-60">
                        <div>
                          <p className="text-sm text-foreground">{rl.roleName}</p>
                          <p className="text-xs text-muted-foreground">
                            {rl.subRoleName} — level {rl.subRoleLevel}
                          </p>
                        </div>
                        <YesNoBadge value={visible} />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
