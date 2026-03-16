'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowLeft, Pencil, X, Save, ExternalLink} from 'lucide-react'
import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {VisibilityForRoleTab, buildInitialVisibilityRows} from '@/components/custom/visibilityForRoleTab'
import type {VisibilityRow} from '@/components/custom/visibilityForRoleTab'
import {updateCertificateAction} from '@/serverFunctions/training'
import type {CertificateDetailData, MappedCertificateType} from '@/types/training'
import type {RoleLevelOption} from '@/types/roleLevel'
import type {Route} from 'next'

interface SelectOption {
  id: string
  name: string
}

interface CertificateDetailProps {
  certificate: CertificateDetailData
  certificateTypes: MappedCertificateType[]
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

export function CertificateDetail({
  certificate,
  certificateTypes,
  currentUserRole,
  currentUserLevel,
  roleLevelOptions,
  defaultVisibleRoleNames,
  departmentId,
}: CertificateDetailProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const buildForm = () => ({
    descriptionShort: certificate.descriptionShort ?? '',
    description: certificate.description ?? '',
    certificateTypeId: certificate.certificateTypeId,
  })

  const [form, setForm] = useState(buildForm)
  const [visibilityRows, setVisibilityRows] = useState<VisibilityRow[]>(() =>
    buildInitialVisibilityRows(certificate.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames),
  )

  function handleCancel() {
    setForm(buildForm())
    setVisibilityRows(
      buildInitialVisibilityRows(certificate.visibilityForRoles, roleLevelOptions, defaultVisibleRoleNames),
    )
    setEditing(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateCertificateAction({
        id: certificate.id,
        descriptionShort: form.descriptionShort || null,
        description: form.description || null,
        certificateTypeId: form.certificateTypeId,
        visibilityForRoles: visibilityRows,
      })
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const certificateTypeOptions: SelectOption[] = certificateTypes
    .filter(t => !t.deleted)
    .map(t => ({id: t.id, name: t.name}))

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
            <h1 className="text-lg font-semibold text-foreground">{certificate.descriptionShort ?? 'Certificate'}</h1>
            <p className="text-sm text-muted-foreground">{certificate.certificateTypeName}</p>
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
      <div className="rounded-xl border border-border/60 bg-card p-6 flex flex-col gap-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Details</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Short Name</Label>
            {editing ? (
              <Input
                value={form.descriptionShort}
                onChange={e => setForm(f => ({...f, descriptionShort: e.target.value}))}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{certificate.descriptionShort ?? '-'}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Certificate Type</Label>
            {editing ? (
              <Select value={form.certificateTypeId} onValueChange={v => setForm(f => ({...f, certificateTypeId: v}))}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {certificateTypeOptions.map(o => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">{certificate.certificateTypeName}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Description</Label>
            {editing ? (
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({...f, description: e.target.value}))}
                rows={3}
                className="bg-secondary border-border resize-none"
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{certificate.description || '-'}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Created By</Label>
            <p className="text-sm text-muted-foreground">{certificate.createdByName}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Created At</Label>
            <p className="text-sm text-muted-foreground">{formatDate(certificate.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="standards">
        <TabsList className="bg-secondary border border-border/60 flex-wrap h-auto gap-1">
          <TabsTrigger value="standards">
            Training Standards
            <Badge variant="secondary" className="ml-2 text-xs">
              {certificate.trainingStandards.length}
            </Badge>
          </TabsTrigger>
          {isAdmin && <TabsTrigger value="visibility">Visibility</TabsTrigger>}
        </TabsList>

        <TabsContent value="standards" className="mt-3">
          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className={thClass}>Standard</TableHead>
                  <TableHead className={thClass}>Location</TableHead>
                  <TableHead className={thClass}>Repeat</TableHead>
                  <TableHead className={thClass}>Certificate</TableHead>
                  <TableHead className={thClass}>Created At</TableHead>
                  <TableHead className={thClass}>Status</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Open</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificate.trainingStandards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                      No training standards linked.
                    </TableCell>
                  </TableRow>
                ) : (
                  certificate.trainingStandards.map(ts => (
                    <TableRow
                      key={ts.id}
                      className={`border-border/40 hover:bg-secondary/50 ${ts.deleted ? 'opacity-50' : ''}`}>
                      <TableCell className="text-sm text-foreground font-medium">
                        {ts.descriptionShort ?? '-'}
                      </TableCell>
                      <TableCell className={tdClass}>{ts.location ?? '-'}</TableCell>
                      <TableCell>
                        <Badge variant={ts.repeat ? 'default' : 'secondary'} className="text-xs">
                          {ts.repeat ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ts.certificate ? 'default' : 'secondary'} className="text-xs">
                          {ts.certificate ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell className={tdClass}>{formatDate(ts.createdAt)}</TableCell>
                      <TableCell>
                        {ts.deleted ? (
                          <Badge variant="destructive" className="text-xs">
                            Deleted
                          </Badge>
                        ) : (
                          <Badge className="bg-accent/15 text-accent border-0 text-xs">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/departments/${departmentId}/courseStandard/${ts.id}` as Route}>
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
