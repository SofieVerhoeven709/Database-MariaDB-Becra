'use client'

import {useEffect, useState} from 'react'
import {Plus, Trash2, Pencil} from 'lucide-react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import type {MappedCompany, MappedCompanyAddress} from '@/types/company'
import {
  createCompanyAddressAction,
  updateCompanyAddressAction,
  softDeleteCompanyAddressAction,
  hardDeleteCompanyAddressAction,
  undeleteCompanyAddressAction,
} from '@/serverFunctions/companies'
import type {RoleLevelOption} from '@/types/roleLevel'
import {VisibilityForRoleTab, buildInitialVisibilityRows} from '@/components/custom/visibilityForRoleTab'
import type {VisibilityRow} from '@/components/custom/visibilityForRoleTab'
import {useRouter} from 'next/navigation'
import {generateCompanyNumber} from '@/lib/utils'

interface Option {
  id: string
  name: string
}

interface CompanyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  company: MappedCompany | null
  companies: Option[]
  onSave: (company: MappedCompany, visibilityRows: VisibilityRow[]) => Promise<void>
  isAdmin: boolean
  canDelete: boolean
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
}

const emptyCompany = (): MappedCompany => ({
  id: '',
  name: '',
  number: generateCompanyNumber(),
  mail: null,
  businessPhone: null,
  website: null,
  vatNumber: null,
  bankNumber: null,
  iban: null,
  bic: null,
  becraCustomerNumber: null,
  becraWebsiteLogin: null,
  supplier: false,
  prefferedSupplier: false,
  companyActive: true,
  newsLetter: false,
  customer: false,
  potentialCustomer: false,
  headQuarters: false,
  potentialSubContractor: false,
  subContractor: false,
  notes: null,
  createdAt: new Date().toISOString(),
  createdBy: '',
  createdByName: '',
  companyId: null,
  parentCompanyName: null,
  deleted: false,
  deletedAt: null,
  deletedBy: null,
  deletedByName: null,
  addresses: [],
  targetId: '',
  visibilityForRoles: [],
})

type AddrForm = {
  id: string
  street: string | null
  houseNumber: string | null
  busNumber: string | null
  zipCode: string | null
  place: string | null
  typeAdress: string | null
  companyId: string
}

const emptyAddrForm = (companyId: string): AddrForm => ({
  id: '',
  street: null,
  houseNumber: null,
  busNumber: null,
  zipCode: null,
  place: null,
  typeAdress: null,
  companyId,
})

function AddrFields({value, onChange}: {value: AddrForm; onChange: (v: AddrForm) => void}) {
  const s = (k: keyof AddrForm, v: string) => onChange({...value, [k]: v || null})
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Type</Label>
        <Input
          value={value.typeAdress ?? ''}
          onChange={e => s('typeAdress', e.target.value)}
          placeholder="e.g. Main, Billing…"
          className="h-8 text-xs bg-secondary border-border"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Street</Label>
        <Input
          value={value.street ?? ''}
          onChange={e => s('street', e.target.value)}
          className="h-8 text-xs bg-secondary border-border"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">House #</Label>
        <Input
          value={value.houseNumber ?? ''}
          onChange={e => s('houseNumber', e.target.value)}
          className="h-8 text-xs bg-secondary border-border"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Bus #</Label>
        <Input
          value={value.busNumber ?? ''}
          onChange={e => s('busNumber', e.target.value)}
          className="h-8 text-xs bg-secondary border-border"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Zip Code</Label>
        <Input
          value={value.zipCode ?? ''}
          onChange={e => s('zipCode', e.target.value)}
          className="h-8 text-xs bg-secondary border-border"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Place</Label>
        <Input
          value={value.place ?? ''}
          onChange={e => s('place', e.target.value)}
          className="h-8 text-xs bg-secondary border-border"
        />
      </div>
    </div>
  )
}

export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
  companies,
  onSave,
  isAdmin,
  canDelete,
  roleLevelOptions,
  defaultVisibleRoleNames,
}: CompanyFormDialogProps) {
  const router = useRouter()
  const [form, setForm] = useState<MappedCompany>(emptyCompany())
  const [saving, setSaving] = useState(false)
  const [addingAddr, setAddingAddr] = useState(false)
  const [newAddr, setNewAddr] = useState<AddrForm>(emptyAddrForm(''))
  const [editingAddrId, setEditingAddrId] = useState<string | null>(null)
  const [editingAddrForm, setEditingAddrForm] = useState<AddrForm>(emptyAddrForm(''))
  const [showDeletedAddrs, setShowDeletedAddrs] = useState(false)
  const [visibilityRows, setVisibilityRows] = useState<VisibilityRow[]>(() =>
    buildInitialVisibilityRows(company?.visibilityForRoles ?? [], roleLevelOptions, defaultVisibleRoleNames),
  )

  // Reset everything when the dialog opens or switches to a different company
  useEffect(() => {
    const next = company ?? emptyCompany()
    setForm(next)
    setAddingAddr(false)
    setEditingAddrId(null)
    setShowDeletedAddrs(false)
    setVisibilityRows(buildInitialVisibilityRows(next.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames))
  }, [company?.id, open])

  // Sync addresses from refreshed company prop without resetting the rest of the form
  useEffect(() => {
    if (!open || !company) return
    setForm(prev => ({...prev, addresses: company.addresses, visibilityForRoles: company.visibilityForRoles}))
    setVisibilityRows(buildInitialVisibilityRows(company.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(company?.addresses), JSON.stringify(company?.visibilityForRoles)])

  function set<K extends keyof MappedCompany>(key: K, value: MappedCompany[K]) {
    setForm(prev => ({...prev, [key]: value}))
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      await onSave(form, visibilityRows)
    } finally {
      setSaving(false)
    }
  }

  // ── Address handlers ──────────────────────────────────────────────────────
  async function handleAddAddr() {
    if (!form.id) {
      const addr: MappedCompanyAddress = {
        ...newAddr,
        id: `temp-${crypto.randomUUID()}`,
        companyId: '',
        createdAt: new Date().toISOString(),
        createdBy: '',
        deleted: false,
        deletedAt: null,
        deletedBy: null,
      }
      setForm(f => ({...f, addresses: [...f.addresses, addr]}))
    } else {
      await createCompanyAddressAction({...newAddr, companyId: form.id})
      router.refresh()
    }
    setNewAddr(emptyAddrForm(form.id))
    setAddingAddr(false)
  }

  async function handleSaveEditAddr() {
    if (!editingAddrId) return
    if (editingAddrId.startsWith('temp-')) {
      setForm(f => ({...f, addresses: f.addresses.map(a => (a.id === editingAddrId ? {...a, ...editingAddrForm} : a))}))
    } else {
      await updateCompanyAddressAction({...editingAddrForm, id: editingAddrId})
      router.refresh()
    }
    setEditingAddrId(null)
  }

  async function handleSoftDeleteAddr(id: string) {
    if (id.startsWith('temp-')) {
      setForm(f => ({...f, addresses: f.addresses.filter(a => a.id !== id)}))
      return
    }
    await softDeleteCompanyAddressAction({id})
    router.refresh()
  }

  async function handleHardDeleteAddr(id: string) {
    if (id.startsWith('temp-')) {
      setForm(f => ({...f, addresses: f.addresses.filter(a => a.id !== id)}))
      return
    }
    await hardDeleteCompanyAddressAction({id})
    router.refresh()
  }

  async function handleUndeleteAddr(id: string) {
    await undeleteCompanyAddressAction({id})
    router.refresh()
  }

  const isEdit = !!company
  const parentOptions = companies.filter(c => c.id !== form.id)
  const visibleAddrs = form.addresses.filter(a => (showDeletedAddrs ? true : !a.deleted))
  const activeAddrCount = form.addresses.filter(a => !a.deleted).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? 'Edit Company' : 'New Company'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="bg-secondary border border-border/60">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="addresses">
              Addresses
              <Badge variant="secondary" className="ml-2 text-xs">
                {activeAddrCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="visibility">Visibility</TabsTrigger>
          </TabsList>

          {/* ── Details ───────────────────────────────────────────────────── */}
          <TabsContent value="details">
            <div className="grid grid-cols-1 gap-5 py-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Name *</Label>
                <Input
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>

              {/* Number — auto-generated + regeneratable on create, read-only on edit */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">
                  Number
                  {isEdit ? (
                    <span className="ml-1.5 text-muted-foreground/60">(locked)</span>
                  ) : (
                    <span className="ml-1.5 text-muted-foreground/60">(auto-generated)</span>
                  )}
                </Label>
                {isEdit ? (
                  <div className="flex h-10 items-center rounded-md border border-border bg-secondary/40 px-3 text-sm text-muted-foreground cursor-not-allowed select-none">
                    {form.number}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={form.number}
                      readOnly
                      className="bg-secondary/40 border-border text-muted-foreground flex-1 cursor-default"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 px-3 border-border text-xs shrink-0"
                      onClick={() => set('number', generateCompanyNumber())}>
                      Regenerate
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input
                  value={form.mail ?? ''}
                  onChange={e => set('mail', e.target.value || null)}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Business Phone</Label>
                <Input
                  value={form.businessPhone ?? ''}
                  onChange={e => set('businessPhone', e.target.value || null)}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Website</Label>
                <Input
                  value={form.website ?? ''}
                  onChange={e => set('website', e.target.value || null)}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">VAT Number</Label>
                <Input
                  value={form.vatNumber ?? ''}
                  onChange={e => set('vatNumber', e.target.value || null)}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Bank Number</Label>
                <Input
                  value={form.bankNumber ?? ''}
                  onChange={e => set('bankNumber', e.target.value || null)}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">IBAN</Label>
                <Input
                  value={form.iban ?? ''}
                  onChange={e => set('iban', e.target.value || null)}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">BIC</Label>
                <Input
                  value={form.bic ?? ''}
                  onChange={e => set('bic', e.target.value || null)}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Becra Customer Number</Label>
                <Input
                  value={form.becraCustomerNumber ?? ''}
                  onChange={e => set('becraCustomerNumber', e.target.value || null)}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Becra Website Login</Label>
                <Input
                  value={form.becraWebsiteLogin ?? ''}
                  onChange={e => set('becraWebsiteLogin', e.target.value || null)}
                  className="bg-secondary border-border"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Parent Company</Label>
                <Select value={form.companyId ?? 'none'} onValueChange={v => set('companyId', v === 'none' ? null : v)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">None</SelectItem>
                    {parentOptions.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <Textarea
                  value={form.notes ?? ''}
                  onChange={e => set('notes', e.target.value || null)}
                  rows={3}
                  className="bg-secondary border-border resize-none"
                />
              </div>

              <div className="sm:col-span-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(
                  [
                    {key: 'companyActive', label: 'Active'},
                    {key: 'customer', label: 'Customer'},
                    {key: 'potentialCustomer', label: 'Potential Customer'},
                    {key: 'supplier', label: 'Supplier'},
                    {key: 'prefferedSupplier', label: 'Preferred Supplier'},
                    {key: 'subContractor', label: 'Sub-Contractor'},
                    {key: 'potentialSubContractor', label: 'Potential Sub-Con'},
                    {key: 'headQuarters', label: 'Head Quarters'},
                    {key: 'newsLetter', label: 'Newsletter'},
                  ] as const
                ).map(({key, label}) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    <Switch checked={form[key]} onCheckedChange={v => set(key, v)} />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── Addresses ─────────────────────────────────────────────────── */}
          <TabsContent value="addresses">
            <div className="flex flex-col gap-4 py-3">
              <div className="flex items-center gap-2">
                {!addingAddr && (
                  <Button
                    size="sm"
                    className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/80 text-xs h-7"
                    onClick={() => {
                      setNewAddr(emptyAddrForm(form.id))
                      setEditingAddrId(null)
                      setAddingAddr(true)
                    }}>
                    <Plus className="h-3 w-3" />
                    Add Address
                  </Button>
                )}
                {canDelete && form.addresses.some(a => a.deleted) && (
                  <Button
                    size="sm"
                    variant={showDeletedAddrs ? 'secondary' : 'outline'}
                    className="gap-1.5 border-border text-xs h-7 ml-auto"
                    onClick={() => setShowDeletedAddrs(v => !v)}>
                    {showDeletedAddrs ? 'Hide deleted' : 'Show deleted'}
                  </Button>
                )}
              </div>

              {addingAddr && (
                <div className="rounded-lg border border-border bg-secondary/40 p-4 flex flex-col gap-3">
                  <p className="text-xs font-medium text-foreground">New Address</p>
                  <AddrFields value={newAddr} onChange={setNewAddr} />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-accent text-accent-foreground hover:bg-accent/80"
                      onClick={handleAddAddr}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-border"
                      onClick={() => setAddingAddr(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {visibleAddrs.length === 0 && !addingAddr ? (
                <p className="text-sm text-muted-foreground text-center py-8">No addresses yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {visibleAddrs.map(a => (
                    <div
                      key={a.id}
                      className={`rounded-lg border border-border bg-secondary/40 p-4 flex flex-col gap-3 ${a.deleted ? 'opacity-50' : ''}`}>
                      {editingAddrId === a.id ? (
                        <>
                          <AddrFields value={editingAddrForm} onChange={setEditingAddrForm} />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-accent text-accent-foreground hover:bg-accent/80"
                              onClick={handleSaveEditAddr}>
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-border"
                              onClick={() => setEditingAddrId(null)}>
                              Cancel
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              {a.typeAdress && (
                                <Badge variant="outline" className="text-xs border-border">
                                  {a.typeAdress}
                                </Badge>
                              )}
                              {a.deleted && (
                                <Badge variant="destructive" className="text-xs">
                                  deleted
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-foreground">
                              {[a.street, a.houseNumber, a.busNumber].filter(Boolean).join(' ') || '-'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {[a.zipCode, a.place].filter(Boolean).join(' ') || '-'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {a.deleted ? (
                              <>
                                {canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary px-2"
                                    onClick={() => handleUndeleteAddr(a.id)}>
                                    Restore
                                  </Button>
                                )}
                                {isAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                    onClick={() => handleHardDeleteAddr(a.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                  onClick={() => {
                                    setEditingAddrId(a.id)
                                    setEditingAddrForm({
                                      id: a.id,
                                      street: a.street,
                                      houseNumber: a.houseNumber,
                                      busNumber: a.busNumber,
                                      zipCode: a.zipCode,
                                      place: a.place,
                                      typeAdress: a.typeAdress,
                                      companyId: a.companyId,
                                    })
                                  }}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                {canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleSoftDeleteAddr(a.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Visibility ────────────────────────────────────────────────── */}
          <TabsContent value="visibility">
            <div className="py-3">
              <VisibilityForRoleTab
                roleLevelOptions={roleLevelOptions}
                value={visibilityRows}
                onChange={setVisibilityRows}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !form.name || !form.number}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Company'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
