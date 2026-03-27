'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowLeft, Pencil, X, Save, Plus, Check, Trash2} from 'lucide-react'
import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {VisibilityForRoleTab, buildInitialVisibilityRows} from '@/components/custom/visibilityForRoleTab'
import type {VisibilityRow} from '@/components/custom/visibilityForRoleTab'
import {
  updateTrainingAction,
  addTrainingContactAction,
  updateTrainingContactAction,
  softDeleteTrainingContactAction,
  hardDeleteTrainingContactAction,
  undeleteTrainingContactAction,
} from '@/serverFunctions/training'
import type {TrainingDetailData} from '@/types/training'
import type {RoleLevelOption} from '@/types/roleLevel'
import type {Route} from 'next'

interface TrainingDetailProps {
  training: TrainingDetailData
  currentUserRole: string
  currentUserLevel: number
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  departmentId: string
  standardOptions: {id: string; name: string}[]
  workOrderOptions: {id: string; name: string}[]
  contactOptions: {id: string; name: string}[]
}

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function YesNoBadge({value}: {value: boolean}) {
  return value ? (
    <Badge className="bg-accent/15 text-accent border-0 font-medium text-xs">Yes</Badge>
  ) : (
    <Badge variant="secondary" className="text-muted-foreground font-medium text-xs">
      No
    </Badge>
  )
}

type ContactForm = {
  contactId: string
  attended: boolean
  succeeded: boolean
  certificateSent: boolean
  certSentDate: string
}

const emptyContactForm = (): ContactForm => ({
  contactId: 'none',
  attended: false,
  succeeded: false,
  certificateSent: false,
  certSentDate: '',
})

type EditContactForm = {
  attended: boolean
  succeeded: boolean
  certificateSent: boolean
  certSentDate: string
}

export function TrainingDetail({
  training,
  currentUserRole,
  currentUserLevel,
  roleLevelOptions,
  defaultVisibleRoleNames,
  departmentId,
  standardOptions,
  workOrderOptions,
  contactOptions,
}: TrainingDetailProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  // Level thresholds:
  //   >= 40  can edit + add participants
  //   >= 80  can delete + manage visibility
  const canEdit = currentUserLevel >= 40
  const canDelete = currentUserLevel >= 80
  const canManageVisibility = currentUserLevel >= 80

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showDeletedContacts, setShowDeletedContacts] = useState(false)

  const [addingContact, setAddingContact] = useState(false)
  const [contactForm, setContactForm] = useState<ContactForm>(emptyContactForm())
  const [editingContactId, setEditingContactId] = useState<string | null>(null)
  const [editContactForm, setEditContactForm] = useState<EditContactForm>({
    attended: false,
    succeeded: false,
    certificateSent: false,
    certSentDate: '',
  })

  const buildForm = () => ({
    trainingNumber: training.trainingNumber ?? '',
    trainingDate: training.trainingDate.slice(0, 10),
    closed: training.closed,
    workOrderId: training.workOrderId,
    trainingStandardId: training.trainingStandardId,
  })

  const [form, setForm] = useState(buildForm)
  const [visibilityRows, setVisibilityRows] = useState<VisibilityRow[]>(() =>
    buildInitialVisibilityRows(training.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames),
  )

  function handleCancel() {
    setForm(buildForm())
    setVisibilityRows(
      buildInitialVisibilityRows(training.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames),
    )
    setEditing(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateTrainingAction({
        id: training.id,
        trainingNumber: form.trainingNumber || null,
        trainingDate: new Date(form.trainingDate),
        closed: form.closed,
        workOrderId: form.workOrderId,
        trainingStandardId: form.trainingStandardId,
        visibilityForRoles: visibilityRows,
      })
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const nonDeletedContacts = training.contacts.filter(c => !c.deleted)
  const visibleContacts = showDeletedContacts ? training.contacts : nonDeletedContacts
  const hasDeletedContacts = training.contacts.some(c => c.deleted)

  const thClass = 'whitespace-nowrap text-xs'
  const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
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
            <h1 className="text-lg font-semibold text-foreground">{training.trainingNumber ?? 'Training'}</h1>
            <p className="text-sm text-muted-foreground">{training.trainingStandardDescriptionShort ?? '-'}</p>
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
            canEdit && (
              <Button onClick={() => setEditing(true)} variant="outline" className="gap-2 border-border">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            )
          )}
        </div>
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-border/60 bg-card p-6 flex flex-col gap-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Training Details</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Training number — always locked */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">
                Training Number<span className="ml-1.5 text-muted-foreground/60">(locked)</span>
              </Label>
              <div className="flex h-10 items-center rounded-md border border-border bg-secondary/40 px-3 text-sm text-muted-foreground cursor-not-allowed select-none">
                {training.trainingNumber ?? '-'}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Training Date</Label>
              {editing ? (
                <Input
                  type="date"
                  value={form.trainingDate}
                  onChange={e => setForm(f => ({...f, trainingDate: e.target.value}))}
                  className="bg-secondary border-border"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{formatDate(training.trainingDate)}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Standard</Label>
              {editing ? (
                <Select
                  value={form.trainingStandardId || 'none'}
                  onValueChange={v => setForm(f => ({...f, trainingStandardId: v === 'none' ? '' : v}))}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">None</SelectItem>
                    {standardOptions.map(o => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">{training.trainingStandardDescriptionShort ?? '-'}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Work Order</Label>
              {editing ? (
                <Select
                  value={form.workOrderId || 'none'}
                  onValueChange={v => setForm(f => ({...f, workOrderId: v === 'none' ? '' : v}))}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">None</SelectItem>
                    {workOrderOptions.map(o => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">{training.workOrderNumber ?? '-'}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Created By</Label>
              <p className="text-sm text-muted-foreground">{training.createdByName}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Created At</Label>
              <p className="text-sm text-muted-foreground">{formatDate(training.createdAt)}</p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
              <Label className="text-xs text-muted-foreground">Closed</Label>
              {editing ? (
                <Switch checked={form.closed} onCheckedChange={v => setForm(f => ({...f, closed: v}))} />
              ) : (
                <YesNoBadge value={training.closed} />
              )}
            </div>
          </div>
        </div>

        {/* Standard Details */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Standard Details</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Standard Name</Label>
              <p className="text-sm text-muted-foreground">{training.trainingStandard.descriptionShort ?? '-'}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Location</Label>
              <p className="text-sm text-muted-foreground">{training.trainingStandard.location ?? '-'}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Certificate</Label>
              <p className="text-sm text-muted-foreground">{training.trainingStandard.certificateName ?? '-'}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {training.trainingStandard.description || '-'}
              </p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
              <Label className="text-xs text-muted-foreground">Has Certificate</Label>
              <YesNoBadge value={training.trainingStandard.certificate} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
              <Label className="text-xs text-muted-foreground">Repeat</Label>
              <YesNoBadge value={training.trainingStandard.repeat} />
            </div>
          </div>
          <div className="mt-3">
            <Link href={`/departments/${departmentId}/courseStandard/${training.trainingStandard.id}` as Route}>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 border-border gap-1 text-muted-foreground hover:text-accent">
                View Standard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="contacts">
        <TabsList className="bg-secondary border border-border/60 flex-wrap h-auto gap-1">
          <TabsTrigger value="contacts">
            Participants
            <Badge variant="secondary" className="ml-2 text-xs">
              {nonDeletedContacts.length}
            </Badge>
          </TabsTrigger>
          {canManageVisibility && <TabsTrigger value="visibility">Visibility</TabsTrigger>}
        </TabsList>

        {/* ── Contacts tab ── */}
        <TabsContent value="contacts" className="mt-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {hasDeletedContacts && (
                <Button
                  size="sm"
                  variant={showDeletedContacts ? 'secondary' : 'outline'}
                  className="text-xs h-7 border-border"
                  onClick={() => setShowDeletedContacts(v => !v)}>
                  {showDeletedContacts ? 'Hide deleted' : 'Show deleted'}
                </Button>
              )}
            </div>
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 border-border gap-1"
                onClick={() => {
                  setAddingContact(true)
                  setContactForm(emptyContactForm())
                }}>
                <Plus className="h-3.5 w-3.5" /> Add Participant
              </Button>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className={thClass}>Contact</TableHead>
                  <TableHead className={thClass}>Company</TableHead>
                  <TableHead className={thClass}>Attendee #</TableHead>
                  <TableHead className={thClass}>Attended</TableHead>
                  <TableHead className={thClass}>Succeeded</TableHead>
                  <TableHead className={thClass}>Cert. Sent</TableHead>
                  <TableHead className={thClass}>Cert. Date</TableHead>
                  <TableHead className={thClass}>Added By</TableHead>
                  <TableHead className="w-28">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addingContact && (
                  <TableRow className="border-border/40 bg-secondary/30">
                    <TableCell>
                      <Select
                        value={contactForm.contactId}
                        onValueChange={v => setContactForm(f => ({...f, contactId: v}))}>
                        <SelectTrigger className="h-7 text-xs bg-background border-border">
                          <SelectValue placeholder="Select contact…" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {contactOptions.map(o => (
                            <SelectItem key={o.id} value={o.id} className="text-xs">
                              {o.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell />
                    <TableCell>
                      <div className="flex h-7 items-center px-2 text-xs text-muted-foreground/60 italic">
                        Auto-generated
                      </div>
                    </TableCell>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={contactForm.attended}
                        onChange={e => setContactForm(f => ({...f, attended: e.target.checked}))}
                        className="h-3.5 w-3.5 accent-accent"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={contactForm.succeeded}
                        onChange={e => setContactForm(f => ({...f, succeeded: e.target.checked}))}
                        className="h-3.5 w-3.5 accent-accent"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={contactForm.certificateSent}
                        onChange={e => setContactForm(f => ({...f, certificateSent: e.target.checked}))}
                        className="h-3.5 w-3.5 accent-accent"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={contactForm.certSentDate}
                        onChange={e => setContactForm(f => ({...f, certSentDate: e.target.value}))}
                        className="h-7 text-xs bg-background border-border"
                      />
                    </TableCell>
                    <TableCell />
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-accent hover:bg-accent/10"
                          disabled={contactForm.contactId === 'none'}
                          onClick={async () => {
                            if (contactForm.contactId === 'none') return
                            await addTrainingContactAction({
                              trainingId: training.id,
                              contactId: contactForm.contactId,
                              attended: contactForm.attended,
                              succeeded: contactForm.succeeded,
                              certificateSent: contactForm.certificateSent,
                              certSentDate: contactForm.certSentDate ? new Date(contactForm.certSentDate) : null,
                            })
                            setAddingContact(false)
                            router.refresh()
                          }}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:bg-secondary"
                          onClick={() => setAddingContact(false)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {visibleContacts.length === 0 && !addingContact ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-20 text-center text-muted-foreground">
                      No participants added.
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleContacts.map(tc => {
                    const isEditingThis = editingContactId === tc.id
                    return (
                      <TableRow
                        key={tc.id}
                        className={`border-border/40 hover:bg-secondary/50 ${tc.deleted ? 'opacity-40' : ''}`}>
                        {isEditingThis ? (
                          <>
                            <TableCell className="text-sm text-foreground font-medium">
                              {tc.contact.lastName} {tc.contact.firstName}
                            </TableCell>
                            <TableCell className={tdClass}>{tc.contact.currentCompanyName ?? '-'}</TableCell>
                            <TableCell className={tdClass}>{tc.attendeeNumber ?? '-'}</TableCell>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={editContactForm.attended}
                                onChange={e => setEditContactForm(f => ({...f, attended: e.target.checked}))}
                                className="h-3.5 w-3.5 accent-accent"
                              />
                            </TableCell>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={editContactForm.succeeded}
                                onChange={e => setEditContactForm(f => ({...f, succeeded: e.target.checked}))}
                                className="h-3.5 w-3.5 accent-accent"
                              />
                            </TableCell>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={editContactForm.certificateSent}
                                onChange={e => setEditContactForm(f => ({...f, certificateSent: e.target.checked}))}
                                className="h-3.5 w-3.5 accent-accent"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="date"
                                value={editContactForm.certSentDate}
                                onChange={e => setEditContactForm(f => ({...f, certSentDate: e.target.value}))}
                                className="h-7 text-xs bg-background border-border"
                              />
                            </TableCell>
                            <TableCell />
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-accent hover:bg-accent/10"
                                  onClick={async () => {
                                    await updateTrainingContactAction({
                                      id: tc.id,
                                      attended: editContactForm.attended,
                                      succeeded: editContactForm.succeeded,
                                      certificateSent: editContactForm.certificateSent,
                                      certSentDate: editContactForm.certSentDate
                                        ? new Date(editContactForm.certSentDate)
                                        : null,
                                    })
                                    setEditingContactId(null)
                                    router.refresh()
                                  }}>
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:bg-secondary"
                                  onClick={() => setEditingContactId(null)}>
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="text-sm text-foreground font-medium">
                              <Link
                                href={`/departments/${departmentId}/contact/${tc.contact.id}` as Route}
                                className="hover:text-accent hover:underline transition-colors">
                                {tc.contact.lastName} {tc.contact.firstName}
                              </Link>
                            </TableCell>
                            <TableCell className={tdClass}>{tc.contact.currentCompanyName ?? '-'}</TableCell>
                            <TableCell className={tdClass}>{tc.attendeeNumber ?? '-'}</TableCell>
                            <TableCell>
                              <YesNoBadge value={tc.attended} />
                            </TableCell>
                            <TableCell>
                              <YesNoBadge value={tc.succeeded} />
                            </TableCell>
                            <TableCell>
                              <YesNoBadge value={tc.certificateSent} />
                            </TableCell>
                            <TableCell className={tdClass}>{formatDate(tc.certSentDate)}</TableCell>
                            <TableCell className={tdClass}>{tc.createdByName}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {tc.deleted ? (
                                  <>
                                    {canEdit && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                        onClick={async () => {
                                          await undeleteTrainingContactAction({id: tc.id})
                                          router.refresh()
                                        }}>
                                        Restore
                                      </Button>
                                    )}
                                    {isAdmin && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                        onClick={async () => {
                                          await hardDeleteTrainingContactAction({id: tc.id})
                                          router.refresh()
                                        }}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    {canEdit && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                        onClick={() => {
                                          setEditingContactId(tc.id)
                                          setEditContactForm({
                                            attended: tc.attended,
                                            succeeded: tc.succeeded,
                                            certificateSent: tc.certificateSent,
                                            certSentDate: tc.certSentDate ? tc.certSentDate.slice(0, 10) : '',
                                          })
                                        }}>
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                    {canDelete && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        onClick={async () => {
                                          await softDeleteTrainingContactAction({id: tc.id})
                                          router.refresh()
                                        }}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {canManageVisibility && (
          <TabsContent value="visibility" className="mt-3">
            {editing ? (
              <VisibilityForRoleTab
                roleLevelOptions={roleLevelOptions}
                value={visibilityRows}
                onChange={setVisibilityRows}
              />
            ) : (
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
                        <Badge
                          variant={visible ? 'default' : 'secondary'}
                          className={visible ? 'bg-accent/15 text-accent border-0' : ''}>
                          {visible ? 'Yes' : 'No'}
                        </Badge>
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
