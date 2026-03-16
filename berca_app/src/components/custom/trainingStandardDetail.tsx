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
import {VisibilityForRoleTab, buildInitialVisibilityRows} from '@/components/custom/visibilityForRoleTab'
import type {VisibilityRow} from '@/components/custom/visibilityForRoleTab'
import {updateTrainingStandardAction} from '@/serverFunctions/training'
import type {TrainingStandardDetailData} from '@/types/training'
import type {RoleLevelOption} from '@/types/roleLevel'
import type {Route} from 'next'

interface TrainingStandardDetailProps {
  standard: TrainingStandardDetailData
  certificateOptions: {id: string; name: string}[]
  currentUserRole: string
  currentUserLevel: number
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  departmentId: string
}

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

export function TrainingStandardDetail({
  standard,
  certificateOptions,
  currentUserRole,
  currentUserLevel,
  roleLevelOptions,
  defaultVisibleRoleNames,
  departmentId,
}: TrainingStandardDetailProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const buildForm = () => ({
    descriptionShort: standard.descriptionShort ?? '',
    description: standard.description ?? '',
    location: standard.location ?? '',
    certificate: standard.certificate,
    repeat: standard.repeat,
    certificateId: standard.certificateId,
  })

  const [form, setForm] = useState(buildForm)
  const [visibilityRows, setVisibilityRows] = useState<VisibilityRow[]>(() =>
    buildInitialVisibilityRows(standard.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames),
  )

  function handleCancel() {
    setForm(buildForm())
    setVisibilityRows(
      buildInitialVisibilityRows(standard.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames),
    )
    setEditing(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateTrainingStandardAction({
        id: standard.id,
        descriptionShort: form.descriptionShort || null,
        description: form.description || null,
        location: form.location || null,
        certificate: form.certificate,
        repeat: form.repeat,
        certificateId: form.certificateId,
        visibilityForRoles: visibilityRows,
      })
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const thClass = 'whitespace-nowrap text-xs'
  const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'
  const activeTrainings = standard.trainings.filter(t => !t.deleted && !t.closed)
  const closedTrainings = standard.trainings.filter(t => t.closed || t.deleted)

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
            <h1 className="text-lg font-semibold text-foreground">
              {standard.descriptionShort ?? 'Training Standard'}
            </h1>
            <p className="text-sm text-muted-foreground">{standard.certificateName ?? 'No certificate linked'}</p>
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

      {/* Info card */}
      <div className="rounded-xl border border-border/60 bg-card p-6 flex flex-col gap-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Details</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Short Name</Label>
              {editing ? (
                <Input
                  value={form.descriptionShort}
                  onChange={e => setForm(f => ({...f, descriptionShort: e.target.value}))}
                  className="bg-secondary border-border"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{standard.descriptionShort ?? '-'}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Location</Label>
              {editing ? (
                <Input
                  value={form.location}
                  onChange={e => setForm(f => ({...f, location: e.target.value}))}
                  className="bg-secondary border-border"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{standard.location ?? '-'}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Certificate</Label>
              {editing ? (
                <Select
                  value={form.certificateId || 'none'}
                  onValueChange={v => setForm(f => ({...f, certificateId: v === 'none' ? '' : v}))}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">None</SelectItem>
                    {certificateOptions.map(o => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">{standard.certificateName ?? '-'}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Created By</Label>
              <p className="text-sm text-muted-foreground">{standard.createdByName}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Created At</Label>
              <p className="text-sm text-muted-foreground">{formatDate(standard.createdAt)}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Description</p>
          {editing ? (
            <Textarea
              value={form.description}
              onChange={e => setForm(f => ({...f, description: e.target.value}))}
              rows={3}
              className="bg-secondary border-border resize-none"
            />
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{standard.description || '-'}</p>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Flags</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
              <Label className="text-xs text-muted-foreground">Has Certificate</Label>
              {editing ? (
                <Switch checked={form.certificate} onCheckedChange={v => setForm(f => ({...f, certificate: v}))} />
              ) : (
                <Badge
                  variant={standard.certificate ? 'default' : 'secondary'}
                  className={standard.certificate ? 'bg-accent/15 text-accent border-0' : ''}>
                  {standard.certificate ? 'Yes' : 'No'}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
              <Label className="text-xs text-muted-foreground">Repeat</Label>
              {editing ? (
                <Switch checked={form.repeat} onCheckedChange={v => setForm(f => ({...f, repeat: v}))} />
              ) : (
                <Badge
                  variant={standard.repeat ? 'default' : 'secondary'}
                  className={standard.repeat ? 'bg-accent/15 text-accent border-0' : ''}>
                  {standard.repeat ? 'Yes' : 'No'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="trainings">
        <TabsList className="bg-secondary border border-border/60 flex-wrap h-auto gap-1">
          <TabsTrigger value="trainings">
            Trainings
            <Badge variant="secondary" className="ml-2 text-xs">
              {standard.trainings.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documents
            <Badge variant="secondary" className="ml-2 text-xs">
              {standard.documents.length}
            </Badge>
          </TabsTrigger>
          {isAdmin && <TabsTrigger value="visibility">Visibility</TabsTrigger>}
        </TabsList>

        <TabsContent value="trainings" className="mt-3">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Active ({activeTrainings.length})
              </p>
              <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/60">
                      <TableHead className={thClass}>Training #</TableHead>
                      <TableHead className={thClass}>Date</TableHead>
                      <TableHead className={thClass}>Created By</TableHead>
                      <TableHead className="w-10">
                        <span className="sr-only">Open</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeTrainings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                          No active trainings.
                        </TableCell>
                      </TableRow>
                    ) : (
                      activeTrainings.map(t => (
                        <TableRow key={t.id} className="border-border/40 hover:bg-secondary/50">
                          <TableCell className="text-sm text-foreground font-medium">
                            {t.trainingNumber ?? '-'}
                          </TableCell>
                          <TableCell className={tdClass}>{formatDate(t.trainingDate)}</TableCell>
                          <TableCell className={tdClass}>{t.createdByName}</TableCell>
                          <TableCell>
                            <Link href={`/departments/${departmentId}/course/${t.id}` as Route}>
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
            {closedTrainings.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Closed / Deleted ({closedTrainings.length})
                </p>
                <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-border/60">
                        <TableHead className={thClass}>Training #</TableHead>
                        <TableHead className={thClass}>Date</TableHead>
                        <TableHead className={thClass}>Created By</TableHead>
                        <TableHead className={thClass}>Status</TableHead>
                        <TableHead className="w-10">
                          <span className="sr-only">Open</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {closedTrainings.map(t => (
                        <TableRow key={t.id} className="border-border/40 hover:bg-secondary/50 opacity-60">
                          <TableCell className="text-sm text-foreground font-medium">
                            {t.trainingNumber ?? '-'}
                          </TableCell>
                          <TableCell className={tdClass}>{formatDate(t.trainingDate)}</TableCell>
                          <TableCell className={tdClass}>{t.createdByName}</TableCell>
                          <TableCell>
                            {t.deleted ? (
                              <Badge variant="destructive" className="text-xs">
                                Deleted
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Closed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Link href={`/departments/${departmentId}/course/${t.id}` as Route}>
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

        <TabsContent value="documents" className="mt-3">
          <div className="rounded-xl border border-border/60 bg-card p-8 text-center text-muted-foreground text-sm">
            Document management is not yet available.
          </div>
        </TabsContent>

        {isAdmin && (
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
