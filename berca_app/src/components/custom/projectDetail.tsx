'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowLeft, Pencil, X, Save, Plus, ExternalLink, Link2, Trash2, Trash, Undo2} from 'lucide-react'
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
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {updateProjectAction} from '@/serverFunctions/projects'
import {
  createPurchaseAction,
  updatePurchaseAction,
  softDeletePurchaseAction,
  hardDeletePurchaseAction,
  undeletePurchaseAction,
} from '@/serverFunctions/purchases'
import {createContactAndReturnIdAction} from '@/serverFunctions/contacts'
import {
  createProjectContactAction,
  updateProjectContactAction,
  softDeleteProjectContactAction,
  hardDeleteProjectContactAction,
  undeleteProjectContactAction,
} from '@/serverFunctions/projectContacts'
import {
  softDeleteWorkOrderAction,
  hardDeleteWorkOrderAction,
  undeleteWorkOrderAction,
} from '@/serverFunctions/workOrders'
import type {Route} from 'next'
import type {ProjectDetailData} from '@/extra/projectDetails'
import type {MappedVisibilityForRole} from '@/types/visibilityForRole'
import type {RoleLevelOption} from '@/types/roleLevel'
import type {MappedContact} from '@/types/contact'
import {VisibilityForRoleTab, buildInitialVisibilityRows} from '@/components/custom/visibilityForRoleTab'
import type {VisibilityRow} from '@/components/custom/visibilityForRoleTab'
import {ContactFormDialog} from '@/components/custom/contactFormDialog'
import {WorkOrderFormDialog} from '@/components/custom/workOrderFormDialog'

interface Option {
  id: string
  name: string
}

interface EmployeeOption {
  id: string
  firstName: string
  lastName: string
}

interface AvailablePurchase {
  id: string
  orderNumber: string | null
  companyName: string | null
  status: string | null
}

interface ProjectDetailProps {
  project: ProjectDetailData
  projectTypes: Option[]
  companies: Option[]
  employees: EmployeeOption[]
  contacts: Option[]
  currentUserRole: string
  currentUserLevel: number
  availablePurchases: AvailablePurchase[]
  roleLevelOptions: RoleLevelOption[]
  defaultVisibleRoleNames: string[]
  visibilityForRoles: MappedVisibilityForRole[]
  functionOptions: Option[]
  departmentExternOptions: Option[]
  titleOptions: Option[]
  departmentId: string
}

function formatDate(date: Date | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function toInputDate(date: Date | null) {
  if (!date) return ''
  return new Date(date).toISOString().slice(0, 10)
}

const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'
const thClass = 'whitespace-nowrap text-xs'

// ─── Permission thresholds ────────────────────────────────────────────────────
const PERM = {
  contacts: 20,
  purchases: 60,
  materials: 80,
  workOrders: 80,
  delete: 80,
} as const

const PURCHASE_STATUS_OPTIONS = ['Pending', 'Ordered', 'Delivered', 'Cancelled', 'On Hold']

// ─── Empty form states ────────────────────────────────────────────────────────
const emptyContact = () => ({contactId: '', description: ''})
const emptyPurchase = () => ({orderNumber: '', shortDescription: '', status: '', companyId: ''})
const emptyMaterial = () => ({becraCode: '', shortDescription: '', brandName: '', transactionType: ''})
const emptyContactEdit = () => ({id: '', description: '', extraInfo: '', isValid: true})
const emptyPurchaseEdit = () => ({id: '', orderNumber: '', shortDescription: '', status: '', companyId: ''})

export function ProjectDetail({
  project,
  projectTypes,
  companies,
  employees: _employees,
  contacts,
  currentUserRole,
  currentUserLevel,
  availablePurchases,
  roleLevelOptions,
  defaultVisibleRoleNames,
  visibilityForRoles: initialVisibilityForRoles,
  functionOptions,
  departmentExternOptions,
  titleOptions,
  departmentId,
}: ProjectDetailProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showDeletedContacts, setShowDeletedContacts] = useState(false)
  const [showDeletedWorkOrders, setShowDeletedWorkOrders] = useState(false)
  const [showDeletedPurchases, setShowDeletedPurchases] = useState(false)
  const [showDeletedMaterials, setShowDeletedMaterials] = useState(false)
  const [showDeletedSubProjects, setShowDeletedSubProjects] = useState(false)
  const [workOrderDialogOpen, setWorkOrderDialogOpen] = useState(false)

  // ─── Project edit form ────────────────────────────────────────────────────
  const [form, setForm] = useState({
    projectNumber: project.projectNumber,
    projectName: project.projectName,
    description: project.description ?? '',
    extraInfo: project.extraInfo ?? '',
    companyId: project.companyId,
    projectTypeId: project.projectTypeId,
    startDate: toInputDate(project.startDate),
    endDate: toInputDate(project.endDate),
    engineeringStartDate: toInputDate(project.engineeringStartDate),
    closingDate: toInputDate(project.closingDate),
    isMainProject: project.isMainProject,
    isIntern: project.isIntern,
    isOpen: project.isOpen,
    isClosed: project.isClosed,
  })

  // ─── Inline row visibility ────────────────────────────────────────────────
  const [showInlineContact, setShowInlineContact] = useState(false)
  const [showInlinePurchase, setShowInlinePurchase] = useState(false)
  const [showInlineMaterial, setShowInlineMaterial] = useState(false)

  // ─── Inline row form states ───────────────────────────────────────────────
  const [inlineContact, setInlineContact] = useState(emptyContact())
  const [inlinePurchase, setInlinePurchase] = useState(emptyPurchase())
  const [inlineMaterial, setInlineMaterial] = useState(emptyMaterial())

  // ─── Dialog visibility ────────────────────────────────────────────────────
  const [dialogContact, setDialogContact] = useState(false)
  const [dialogPurchase, setDialogPurchase] = useState(false)
  const [dialogLinkPurchase, setDialogLinkPurchase] = useState(false)
  const [dialogMaterial, setDialogMaterial] = useState(false)
  const [nestedContactDialog, setNestedContactDialog] = useState(false)

  // ─── Edit dialog visibility ───────────────────────────────────────────────
  const [editContactDialog, setEditContactDialog] = useState(false)
  const [editPurchaseDialog, setEditPurchaseDialog] = useState(false)

  // ─── Edit form states ─────────────────────────────────────────────────────
  const [editContactForm, setEditContactForm] = useState(emptyContactEdit())
  const [editPurchaseForm, setEditPurchaseForm] = useState(emptyPurchaseEdit())

  // ─── Delete confirm state ─────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'contact' | 'purchase' | 'workorder'
    id: string
    label: string
    action: 'soft' | 'hard' | 'undelete'
  } | null>(null)

  // ─── Dialog form states ───────────────────────────────────────────────────
  const [dialogContactForm, setDialogContactForm] = useState(emptyContact())
  const [dialogPurchaseForm, setDialogPurchaseForm] = useState(emptyPurchase())
  const [dialogMaterialForm, setDialogMaterialForm] = useState(emptyMaterial())

  // ─── Local contacts list ──────────────────────────────────────────────────
  const [localContacts, setLocalContacts] = useState(contacts)

  // ─── Saving states ────────────────────────────────────────────────────────
  const [linkPurchaseId, setLinkPurchaseId] = useState('')
  const [savingNewPurchase, setSavingNewPurchase] = useState(false)
  const [savingLinkPurchase, setSavingLinkPurchase] = useState(false)
  const [savingContact, setSavingContact] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [savingDelete, setSavingDelete] = useState(false)

  // ─── Visibility state ─────────────────────────────────────────────────────
  const [visibilityRows, setVisibilityRows] = useState<VisibilityRow[]>(() =>
    buildInitialVisibilityRows(initialVisibilityForRoles, roleLevelOptions, defaultVisibleRoleNames),
  )

  const can = (level: number) => currentUserLevel >= level
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100
  const canDelete = isAdmin || currentUserLevel >= PERM.delete
  const canManageWorkOrders = isAdmin || currentUserLevel >= PERM.workOrders
  const workOrderProjectOptions = [
    {
      id: project.id,
      name: `${project.projectNumber} — ${project.projectName}`,
    },
  ]

  function handleCancel() {
    setForm({
      projectNumber: project.projectNumber,
      projectName: project.projectName,
      description: project.description ?? '',
      extraInfo: project.extraInfo ?? '',
      companyId: project.companyId,
      projectTypeId: project.projectTypeId,
      startDate: toInputDate(project.startDate),
      endDate: toInputDate(project.endDate),
      engineeringStartDate: toInputDate(project.engineeringStartDate),
      closingDate: toInputDate(project.closingDate),
      isMainProject: project.isMainProject,
      isIntern: project.isIntern,
      isOpen: project.isOpen,
      isClosed: project.isClosed,
    })
    setVisibilityRows(buildInitialVisibilityRows(initialVisibilityForRoles, roleLevelOptions, defaultVisibleRoleNames))
    setEditing(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateProjectAction({
        id: project.id,
        projectNumber: form.projectNumber,
        projectName: form.projectName,
        description: form.description || null,
        extraInfo: form.extraInfo || null,
        companyId: form.companyId,
        projectTypeId: form.projectTypeId,
        startDate: form.startDate ? new Date(form.startDate) : null,
        endDate: form.endDate ? new Date(form.endDate) : null,
        engineeringStartDate: form.engineeringStartDate ? new Date(form.engineeringStartDate) : null,
        closingDate: form.closingDate ? new Date(form.closingDate) : null,
        isMainProject: form.isMainProject,
        isIntern: form.isIntern,
        isOpen: form.isOpen,
        isClosed: form.isClosed,
        createdAt: project.createdAt,
        createdBy: project.createdBy,
        parentProjectId: project.parentProjectId,
        deleted: project.deleted,
        deletedAt: project.deletedAt,
        deletedBy: project.deletedBy,
        visibilityForRoles: visibilityRows,
      })
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  // ─── Inline submit handlers ───────────────────────────────────────────────
  async function handleInlineContactSave() {
    if (!inlineContact.contactId) return
    await createProjectContactAction({
      projectId: project.id,
      contactId: inlineContact.contactId,
      isValid: true,
      description: inlineContact.description || null,
    })
    setInlineContact(emptyContact())
    setShowInlineContact(false)
    router.refresh()
  }

  async function handleInlinePurchaseSave() {
    await createPurchaseAction({
      orderNumber: inlinePurchase.orderNumber || null,
      shortDescription: inlinePurchase.shortDescription || null,
      status: inlinePurchase.status || null,
      companyId: inlinePurchase.companyId || null,
      projectId: project.id,
    })
    setInlinePurchase(emptyPurchase())
    setShowInlinePurchase(false)
    router.refresh()
  }

  async function handleInlineMaterialSave() {
    // TODO: await createMaterialSerialTrackAction({...inlineMaterial, projectId: project.id})
    setInlineMaterial(emptyMaterial())
    setShowInlineMaterial(false)
    router.refresh()
  }

  // ─── Dialog submit handlers ───────────────────────────────────────────────

  async function handleDialogContactSave() {
    if (!dialogContactForm.contactId) return
    setSavingContact(true)
    try {
      await createProjectContactAction({
        projectId: project.id,
        contactId: dialogContactForm.contactId,
        isValid: true,
        description: dialogContactForm.description || null,
      })
      setDialogContactForm(emptyContact())
      setDialogContact(false)
      router.refresh()
    } finally {
      setSavingContact(false)
    }
  }

  async function handleNestedContactSave(
    contact: MappedContact,
    nestedVisibilityRows: VisibilityRow[],
    initialCompanyId?: string,
    initialRoleWithCompany?: string,
  ) {
    const created = await createContactAndReturnIdAction({
      firstName: contact.firstName,
      lastName: contact.lastName,
      mail1: contact.mail1,
      mail2: contact.mail2,
      mail3: contact.mail3,
      generalPhone: contact.generalPhone,
      homePhone: contact.homePhone,
      mobilePhone: contact.mobilePhone,
      info: contact.info,
      birthDate: contact.birthDate ? new Date(contact.birthDate) : null,
      through: contact.through,
      description: contact.description,
      infoCorrect: contact.infoCorrect,
      checkInfo: contact.checkInfo,
      newYearCard: contact.newYearCard,
      active: contact.active,
      newsLetter: contact.newsLetter,
      mailing: contact.mailing,
      trainingAdvice: contact.trainingAdvice,
      contactForTrainingAndAdvice: contact.contactForTrainingAndAdvice,
      customerTrainingAndAdvice: contact.customerTrainingAndAdvice,
      potentialCustomerTrainingAndAdvice: contact.potentialCustomerTrainingAndAdvice,
      potentialTeacherTrainingAndAdvice: contact.potentialTeacherTrainingAndAdvice,
      teacherTrainingAndAdvice: contact.teacherTrainingAndAdvice,
      participantTrainingAndAdvice: contact.participantTrainingAndAdvice,
      functionId: contact.functionId,
      departmentExternId: contact.departmentExternId,
      titleId: contact.titleId,
      businessCardId: contact.businessCardId,
      visibilityForRoles: nestedVisibilityRows,
      initialCompanyId: initialCompanyId ?? null,
      initialRoleWithCompany: initialRoleWithCompany ?? null,
    })

    const newOption = {id: created.id, name: `${created.firstName} ${created.lastName}`}
    setLocalContacts(prev => [...prev, newOption])
    setDialogContactForm(f => ({...f, contactId: created.id}))
    setNestedContactDialog(false)
    router.refresh()
  }

  async function handleDialogPurchaseSave() {
    setSavingNewPurchase(true)
    try {
      await createPurchaseAction({
        orderNumber: dialogPurchaseForm.orderNumber || null,
        shortDescription: dialogPurchaseForm.shortDescription || null,
        status: dialogPurchaseForm.status || null,
        companyId: dialogPurchaseForm.companyId || null,
        projectId: project.id,
      })
      setDialogPurchaseForm(emptyPurchase())
      setDialogPurchase(false)
      router.refresh()
    } finally {
      setSavingNewPurchase(false)
    }
  }

  async function handleDialogLinkPurchaseSave() {
    if (!linkPurchaseId) return
    setSavingLinkPurchase(true)
    try {
      await updatePurchaseAction({
        id: linkPurchaseId,
        projectId: project.id,
      })
      setLinkPurchaseId('')
      setDialogLinkPurchase(false)
      router.refresh()
    } finally {
      setSavingLinkPurchase(false)
    }
  }

  async function handleDialogMaterialSave() {
    // TODO: await createMaterialSerialTrackAction({...dialogMaterialForm, projectId: project.id})
    setDialogMaterialForm(emptyMaterial())
    setDialogMaterial(false)
    router.refresh()
  }

  // ─── Edit handlers ────────────────────────────────────────────────────────

  function openEditContact(pc: {id: string; description: string | null; extraInfo: string | null; isValid: boolean}) {
    setEditContactForm({
      id: pc.id,
      description: pc.description ?? '',
      extraInfo: pc.extraInfo ?? '',
      isValid: pc.isValid,
    })
    setEditContactDialog(true)
  }

  async function handleSaveContactEdit() {
    setSavingEdit(true)
    try {
      await updateProjectContactAction({
        id: editContactForm.id,
        projectId: project.id,
        description: editContactForm.description || null,
        extraInfo: editContactForm.extraInfo || null,
        isValid: editContactForm.isValid,
      })
      setEditContactDialog(false)
      router.refresh()
    } finally {
      setSavingEdit(false)
    }
  }

  function openEditPurchase(p: {
    id: string
    orderNumber: string | null
    shortDescription: string | null
    status: string | null
    companyId: string | null
  }) {
    setEditPurchaseForm({
      id: p.id,
      orderNumber: p.orderNumber ?? '',
      shortDescription: p.shortDescription ?? '',
      status: p.status ?? '',
      companyId: p.companyId ?? '',
    })
    setEditPurchaseDialog(true)
  }

  async function handleSavePurchaseEdit() {
    setSavingEdit(true)
    try {
      await updatePurchaseAction({
        id: editPurchaseForm.id,
        orderNumber: editPurchaseForm.orderNumber || null,
        shortDescription: editPurchaseForm.shortDescription || null,
        status: editPurchaseForm.status || null,
        companyId: editPurchaseForm.companyId || null,
      })
      setEditPurchaseDialog(false)
      router.refresh()
    } finally {
      setSavingEdit(false)
    }
  }

  // ─── Delete handler ───────────────────────────────────────────────────────

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setSavingDelete(true)
    try {
      const {type, id, action} = deleteTarget
      if (type === 'contact') {
        if (action === 'hard') await hardDeleteProjectContactAction({id, projectId: project.id})
        else if (action === 'undelete') await undeleteProjectContactAction({id, projectId: project.id})
        else await softDeleteProjectContactAction({id, projectId: project.id})
      } else if (type === 'purchase') {
        if (action === 'hard') await hardDeletePurchaseAction({id})
        else if (action === 'undelete') await undeletePurchaseAction({id})
        else await softDeletePurchaseAction({id})
      } else if (type === 'workorder') {
        if (action === 'hard') await hardDeleteWorkOrderAction({id})
        else if (action === 'undelete') await undeleteWorkOrderAction({id})
        else await softDeleteWorkOrderAction({id})
      }
      setDeleteTarget(null)
      router.refresh()
    } finally {
      setSavingDelete(false)
    }
  }

  // ─── Reusable tab action bar ──────────────────────────────────────────────
  function TabActions({
    canAdd,
    onInline,
    onDialog,
    showInline,
  }: {
    canAdd: boolean
    onInline: () => void
    onDialog: () => void
    showInline: boolean
  }) {
    if (!canAdd) return null
    return (
      <div className="flex items-center gap-2 mb-3">
        <Button size="sm" variant="outline" className="gap-1.5 border-border text-xs h-7" onClick={onInline}>
          <Plus className="h-3 w-3" />
          {showInline ? 'Cancel inline' : 'Add inline'}
        </Button>
        <Button
          size="sm"
          className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/80 text-xs h-7"
          onClick={onDialog}>
          <Plus className="h-3 w-3" />
          Add via dialog
        </Button>
      </div>
    )
  }

  // ─── Reusable row action buttons ──────────────────────────────────────────
  function RowActions({
    onEdit,
    onSoftDelete,
    onHardDelete,
    onUndelete,
    isDeleted,
  }: {
    onEdit?: () => void
    onSoftDelete: () => void
    onHardDelete: () => void
    onUndelete: () => void
    isDeleted?: boolean
  }) {
    if (!canDelete) return null
    return (
      <div className="flex items-center gap-1">
        {!isDeleted && (
          <>
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-accent/10"
                onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              title="Delete"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={onSoftDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
        {isDeleted && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary px-2"
              onClick={onUndelete}>
              Restore
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                title="Permanently delete"
                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                onClick={onHardDelete}>
                <Trash className="h-3.5 w-3.5" />
              </Button>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/departments/${departmentId}/project` as Route}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {project.projectNumber} {project.projectName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {project.Company.name} · {project.ProjectType.name}
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

      {/* Project info */}
      <div className="rounded-xl border border-border/60 bg-card p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Project Number</Label>
            {editing ? (
              <Input value={form.projectNumber} readOnly className="bg-secondary border-border" />
            ) : (
              <p className="text-sm text-foreground font-medium">{project.projectNumber}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Project Name</Label>
            {editing ? (
              <Input
                value={form.projectName}
                onChange={e => setForm(f => ({...f, projectName: e.target.value}))}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-foreground font-medium">{project.projectName}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Company</Label>
            {editing ? (
              <Select value={form.companyId} onValueChange={v => setForm(f => ({...f, companyId: v}))}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">{project.Company.name}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Project Type</Label>
            {editing ? (
              <Select value={form.projectTypeId} onValueChange={v => setForm(f => ({...f, projectTypeId: v}))}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {projectTypes.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline" className="w-fit border-border text-muted-foreground font-normal">
                {project.ProjectType.name}
              </Badge>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Parent Project</Label>
            <p className="text-sm text-muted-foreground">{project.Project?.projectNumber ?? '-'}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Start Date</Label>
            {editing ? (
              <Input
                type="date"
                value={form.startDate}
                onChange={e => setForm(f => ({...f, startDate: e.target.value}))}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{formatDate(project.startDate)}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">End Date</Label>
            {editing ? (
              <Input
                type="date"
                value={form.endDate}
                onChange={e => setForm(f => ({...f, endDate: e.target.value}))}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{formatDate(project.endDate)}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Engineering Start</Label>
            {editing ? (
              <Input
                type="date"
                value={form.engineeringStartDate}
                onChange={e => setForm(f => ({...f, engineeringStartDate: e.target.value}))}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{formatDate(project.engineeringStartDate)}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Closing Date</Label>
            {editing ? (
              <Input
                type="date"
                value={form.closingDate}
                onChange={e => setForm(f => ({...f, closingDate: e.target.value}))}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{formatDate(project.closingDate)}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Created By</Label>
            <p className="text-sm text-muted-foreground">
              {project.Employee.firstName} {project.Employee.lastName}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Created At</Label>
            <p className="text-sm text-muted-foreground">{formatDate(project.createdAt)}</p>
          </div>

          <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(
              [
                {key: 'isMainProject', label: 'Main Project'},
                {key: 'isIntern', label: 'Internal'},
                {key: 'isOpen', label: 'Open'},
                {key: 'isClosed', label: 'Closed'},
              ] as const
            ).map(({key, label}) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                {editing ? (
                  <Switch checked={form[key]} onCheckedChange={v => setForm(f => ({...f, [key]: v}))} />
                ) : project[key] ? (
                  <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
                ) : (
                  <Badge variant="secondary" className="text-muted-foreground font-medium">
                    No
                  </Badge>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
            <Label className="text-xs text-muted-foreground">Description</Label>
            {editing ? (
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({...f, description: e.target.value}))}
                rows={3}
                className="bg-secondary border-border resize-none"
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description ?? '-'}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
            <Label className="text-xs text-muted-foreground">Extra Info</Label>
            {editing ? (
              <Textarea
                value={form.extraInfo}
                onChange={e => setForm(f => ({...f, extraInfo: e.target.value}))}
                rows={3}
                className="bg-secondary border-border resize-none"
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.extraInfo ?? '-'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="contacts">
        <TabsList className="bg-secondary border border-border/60">
          <TabsTrigger value="contacts">
            Contacts
            <Badge variant="secondary" className="ml-2 text-xs">
              {project.ProjectContact.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="workorders">
            Work Orders
            <Badge variant="secondary" className="ml-2 text-xs">
              {project.WorkOrder.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="purchases">
            Purchases
            <Badge variant="secondary" className="ml-2 text-xs">
              {project.Purchase.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="materials">
            Material Tracks
            <Badge variant="secondary" className="ml-2 text-xs">
              {project.MaterialSerialTrack.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="subprojects">
            Sub-projects
            <Badge variant="secondary" className="ml-2 text-xs">
              {project.other_Project.length}
            </Badge>
          </TabsTrigger>
          {isAdmin && <TabsTrigger value="visibility">Visibility</TabsTrigger>}
        </TabsList>

        {/* ── Contacts ──────────────────────────────────────────────────────── */}
        <TabsContent value="contacts" className="mt-3">
          <TabActions
            canAdd={can(PERM.contacts)}
            onInline={() => {
              setShowInlineContact(v => !v)
              setInlineContact(emptyContact())
            }}
            onDialog={() => {
              setDialogContactForm(emptyContact())
              setDialogContact(true)
            }}
            showInline={showInlineContact}
          />
          {canDelete && (
            <div className="flex justify-end mb-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7 text-muted-foreground gap-1.5"
                onClick={() => setShowDeletedContacts(v => !v)}>
                {showDeletedContacts ? 'Hide deleted' : 'Show deleted'}
              </Button>
            </div>
          )}
          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className={thClass}>Name</TableHead>
                  <TableHead className={thClass}>Email</TableHead>
                  <TableHead className={thClass}>Phone</TableHead>
                  <TableHead className={thClass}>Description</TableHead>
                  <TableHead className={thClass}>Valid</TableHead>
                  <TableHead className={thClass}>Added By</TableHead>
                  <TableHead className={thClass}>Added At</TableHead>
                  {canDelete && (
                    <TableHead className="w-24">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {showInlineContact && (
                  <TableRow className="bg-secondary/30 border-border/40">
                    <TableCell colSpan={2}>
                      <Select
                        value={inlineContact.contactId}
                        onValueChange={v => setInlineContact(f => ({...f, contactId: v}))}>
                        <SelectTrigger className="h-7 text-xs bg-secondary border-border">
                          <SelectValue placeholder="Select contact" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {localContacts.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell colSpan={2}>
                      <Input
                        placeholder="Description"
                        value={inlineContact.description}
                        onChange={e => setInlineContact(f => ({...f, description: e.target.value}))}
                        className="h-7 text-xs bg-secondary border-border"
                      />
                    </TableCell>
                    <TableCell colSpan={canDelete ? 4 : 3}>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-accent text-accent-foreground hover:bg-accent/80"
                          onClick={handleInlineContactSave}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-border"
                          onClick={() => setShowInlineContact(false)}>
                          Cancel
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {project.ProjectContact.filter(pc => (showDeletedContacts ? !!pc.deleted : !pc.deleted)).length === 0 &&
                !showInlineContact ? (
                  <TableRow>
                    <TableCell colSpan={canDelete ? 8 : 7} className="h-24 text-center text-muted-foreground">
                      No contacts linked.
                    </TableCell>
                  </TableRow>
                ) : (
                  project.ProjectContact.filter(pc => (showDeletedContacts ? !!pc.deleted : !pc.deleted)).map(pc => (
                    <TableRow
                      key={pc.id}
                      className={`border-border/40 hover:bg-secondary/50 ${pc.deleted ? 'opacity-50' : ''}`}>
                      <TableCell className={`${tdClass} text-foreground font-medium`}>
                        {pc.Contact ? `${pc.Contact.firstName} ${pc.Contact.lastName}` : '-'}
                      </TableCell>
                      <TableCell className={tdClass}>{pc.Contact?.mail1 ?? '-'}</TableCell>
                      <TableCell className={tdClass}>{pc.Contact?.generalPhone ?? '-'}</TableCell>
                      <TableCell className={tdClass}>
                        <span className="max-w-[200px] truncate inline-block">{pc.description ?? '-'}</span>
                      </TableCell>
                      <TableCell>
                        {pc.isValid ? (
                          <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground font-medium">
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className={tdClass}>
                        {pc.Employee_ProjectContact_createdByToEmployee.firstName}{' '}
                        {pc.Employee_ProjectContact_createdByToEmployee.lastName}
                      </TableCell>
                      <TableCell className={tdClass}>{formatDate(pc.createdAt)}</TableCell>
                      {canDelete && (
                        <TableCell>
                          <RowActions
                            isDeleted={!!pc.deleted}
                            onEdit={() =>
                              openEditContact({
                                id: pc.id,
                                description: pc.description,
                                extraInfo: pc.extraInfo,
                                isValid: pc.isValid,
                              })
                            }
                            onSoftDelete={() =>
                              setDeleteTarget({
                                type: 'contact',
                                id: pc.id,
                                label: pc.Contact ? `${pc.Contact.firstName} ${pc.Contact.lastName}` : pc.id,
                                action: 'soft',
                              })
                            }
                            onHardDelete={() =>
                              setDeleteTarget({
                                type: 'contact',
                                id: pc.id,
                                label: pc.Contact ? `${pc.Contact.firstName} ${pc.Contact.lastName}` : pc.id,
                                action: 'hard',
                              })
                            }
                            onUndelete={() =>
                              setDeleteTarget({
                                type: 'contact',
                                id: pc.id,
                                label: pc.Contact ? `${pc.Contact.firstName} ${pc.Contact.lastName}` : pc.id,
                                action: 'undelete',
                              })
                            }
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Work Orders ───────────────────────────────────────────────────── */}
        <TabsContent value="workorders" className="mt-3">
          {canManageWorkOrders && (
            <div className="flex items-center gap-2 mb-3">
              <Button
                size="sm"
                className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/80 text-xs h-7"
                onClick={() => setWorkOrderDialogOpen(true)}>
                <Plus className="h-3 w-3" />
                New Work Order
              </Button>
            </div>
          )}
          {canDelete && (
            <div className="flex justify-end mb-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7 text-muted-foreground gap-1.5"
                onClick={() => setShowDeletedWorkOrders(v => !v)}>
                {showDeletedWorkOrders ? 'Hide deleted' : 'Show deleted'}
              </Button>
            </div>
          )}
          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className={thClass}>Work Order #</TableHead>
                  <TableHead className={thClass}>Description</TableHead>
                  <TableHead className={thClass}>Start Date</TableHead>
                  <TableHead className={thClass}>End Date</TableHead>
                  <TableHead className={thClass}>Completed</TableHead>
                  <TableHead className={thClass}>Invoice Sent</TableHead>
                  <TableHead className={thClass}>Hours/Material Closed</TableHead>
                  <TableHead className={thClass}>Created By</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Open</span>
                  </TableHead>
                  {canDelete && (
                    <TableHead className="w-24">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.WorkOrder.filter(wo => (showDeletedWorkOrders ? !!wo.deleted : !wo.deleted)).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canDelete ? 10 : 9} className="h-24 text-center text-muted-foreground">
                      No work orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  project.WorkOrder.filter(wo => (showDeletedWorkOrders ? !!wo.deleted : !wo.deleted)).map(wo => (
                    <TableRow key={wo.id} className="border-border/40 hover:bg-secondary/50">
                      <TableCell className={`${tdClass} text-foreground font-medium`}>
                        {wo.workOrderNumber ?? '-'}
                      </TableCell>
                      <TableCell className={tdClass}>
                        <span className="max-w-[200px] truncate inline-block">{wo.description ?? '-'}</span>
                      </TableCell>
                      <TableCell className={tdClass}>{formatDate(wo.startDate)}</TableCell>
                      <TableCell className={tdClass}>{formatDate(wo.endDate)}</TableCell>
                      <TableCell>
                        {wo.completed ? (
                          <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground font-medium">
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {wo.invoiceSent ? (
                          <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground font-medium">
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {wo.hoursMaterialClosed ? (
                          <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground font-medium">
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className={tdClass}>
                        {wo.Employee.firstName} {wo.Employee.lastName}
                      </TableCell>
                      <TableCell>
                        <Link href={`/departments/${departmentId}/workOrder/${wo.id}` as Route}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-accent/10">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </TableCell>
                      {canDelete && (
                        <TableCell>
                          <RowActions
                            isDeleted={!!wo.deleted}
                            onSoftDelete={() =>
                              setDeleteTarget({
                                type: 'workorder',
                                id: wo.id,
                                label: wo.workOrderNumber ?? wo.id,
                                action: 'soft',
                              })
                            }
                            onHardDelete={() =>
                              setDeleteTarget({
                                type: 'workorder',
                                id: wo.id,
                                label: wo.workOrderNumber ?? wo.id,
                                action: 'hard',
                              })
                            }
                            onUndelete={() =>
                              setDeleteTarget({
                                type: 'workorder',
                                id: wo.id,
                                label: wo.workOrderNumber ?? wo.id,
                                action: 'undelete',
                              })
                            }
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Purchases ─────────────────────────────────────────────────────── */}
        <TabsContent value="purchases" className="mt-3">
          {can(PERM.purchases) && (
            <div className="flex items-center gap-2 mb-3">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-border text-xs h-7"
                onClick={() => {
                  setShowInlinePurchase(v => !v)
                  setInlinePurchase(emptyPurchase())
                }}>
                <Plus className="h-3 w-3" />
                {showInlinePurchase ? 'Cancel inline' : 'Add inline'}
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/80 text-xs h-7"
                onClick={() => {
                  setDialogPurchaseForm(emptyPurchase())
                  setDialogPurchase(true)
                }}>
                <Plus className="h-3 w-3" />
                Create new
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-border text-xs h-7"
                disabled={availablePurchases.length === 0}
                onClick={() => {
                  setLinkPurchaseId('')
                  setDialogLinkPurchase(true)
                }}>
                <Link2 className="h-3 w-3" />
                Link existing
                {availablePurchases.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                    {availablePurchases.length}
                  </Badge>
                )}
              </Button>
            </div>
          )}
          {canDelete && (
            <div className="flex justify-end mb-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7 text-muted-foreground gap-1.5"
                onClick={() => setShowDeletedPurchases(v => !v)}>
                {showDeletedPurchases ? 'Hide deleted' : 'Show deleted'}
              </Button>
            </div>
          )}
          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className={thClass}>Order #</TableHead>
                  <TableHead className={thClass}>Description</TableHead>
                  <TableHead className={thClass}>Status</TableHead>
                  <TableHead className={thClass}>Supplier</TableHead>
                  <TableHead className={thClass}>Purchase Date</TableHead>
                  <TableHead className={thClass}>Created By</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Open</span>
                  </TableHead>
                  {canDelete && (
                    <TableHead className="w-24">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {showInlinePurchase && (
                  <TableRow className="bg-secondary/30 border-border/40">
                    <TableCell>
                      <Input
                        placeholder="Order #"
                        value={inlinePurchase.orderNumber}
                        onChange={e => setInlinePurchase(f => ({...f, orderNumber: e.target.value}))}
                        className="h-7 text-xs bg-secondary border-border"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Description"
                        value={inlinePurchase.shortDescription}
                        onChange={e => setInlinePurchase(f => ({...f, shortDescription: e.target.value}))}
                        className="h-7 text-xs bg-secondary border-border"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={inlinePurchase.status}
                        onValueChange={v => setInlinePurchase(f => ({...f, status: v}))}>
                        <SelectTrigger className="h-7 text-xs bg-secondary border-border">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {PURCHASE_STATUS_OPTIONS.map(s => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={inlinePurchase.companyId}
                        onValueChange={v => setInlinePurchase(f => ({...f, companyId: v}))}>
                        <SelectTrigger className="h-7 text-xs bg-secondary border-border">
                          <SelectValue placeholder="Supplier" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {companies.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell colSpan={canDelete ? 4 : 3}>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-accent text-accent-foreground hover:bg-accent/80"
                          onClick={handleInlinePurchaseSave}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-border"
                          onClick={() => setShowInlinePurchase(false)}>
                          Cancel
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {project.Purchase.filter(p => (showDeletedPurchases ? !!p.deleted : !p.deleted)).length === 0 &&
                !showInlinePurchase ? (
                  <TableRow>
                    <TableCell colSpan={canDelete ? 8 : 7} className="h-24 text-center text-muted-foreground">
                      No purchases found.
                    </TableCell>
                  </TableRow>
                ) : (
                  project.Purchase.filter(p => (showDeletedPurchases ? !!p.deleted : !p.deleted)).map(p => (
                    <TableRow key={p.id} className="border-border/40 hover:bg-secondary/50">
                      <TableCell className={`${tdClass} text-foreground font-medium`}>{p.orderNumber ?? '-'}</TableCell>
                      <TableCell className={tdClass}>
                        <span className="max-w-[200px] truncate inline-block">{p.shortDescription ?? '-'}</span>
                      </TableCell>
                      <TableCell>
                        {p.status ? (
                          <Badge variant="outline" className="border-border text-muted-foreground font-normal">
                            {p.status}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className={tdClass}>{p.Company?.name ?? '-'}</TableCell>
                      <TableCell className={tdClass}>{formatDate(p.purchaseDate)}</TableCell>
                      <TableCell className={tdClass}>
                        {p.Employee.firstName} {p.Employee.lastName}
                      </TableCell>
                      <TableCell>
                        <Link href={`/departments/purchasing/orders/${p.id}` as Route}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-accent/10">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </TableCell>
                      {canDelete && (
                        <TableCell>
                          <RowActions
                            isDeleted={!!p.deleted}
                            onEdit={() =>
                              openEditPurchase({
                                id: p.id,
                                orderNumber: p.orderNumber,
                                shortDescription: p.shortDescription,
                                status: p.status,
                                companyId: p.companyId,
                              })
                            }
                            onSoftDelete={() =>
                              setDeleteTarget({
                                type: 'purchase',
                                id: p.id,
                                label: p.orderNumber ?? p.id,
                                action: 'soft',
                              })
                            }
                            onHardDelete={() =>
                              setDeleteTarget({
                                type: 'purchase',
                                id: p.id,
                                label: p.orderNumber ?? p.id,
                                action: 'hard',
                              })
                            }
                            onUndelete={() =>
                              setDeleteTarget({
                                type: 'purchase',
                                id: p.id,
                                label: p.orderNumber ?? p.id,
                                action: 'undelete',
                              })
                            }
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Material Tracks ───────────────────────────────────────────────── */}
        <TabsContent value="materials" className="mt-3">
          <TabActions
            canAdd={can(PERM.materials)}
            onInline={() => {
              setShowInlineMaterial(v => !v)
              setInlineMaterial(emptyMaterial())
            }}
            onDialog={() => {
              setDialogMaterialForm(emptyMaterial())
              setDialogMaterial(true)
            }}
            showInline={showInlineMaterial}
          />
          {canDelete && (
            <div className="flex justify-end mb-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7 text-muted-foreground gap-1.5"
                onClick={() => setShowDeletedMaterials(v => !v)}>
                {showDeletedMaterials ? 'Hide deleted' : 'Show deleted'}
              </Button>
            </div>
          )}
          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className={thClass}>Becra Code</TableHead>
                  <TableHead className={thClass}>Description</TableHead>
                  <TableHead className={thClass}>Brand</TableHead>
                  <TableHead className={thClass}>Transaction Type</TableHead>
                  <TableHead className={thClass}>Supplier</TableHead>
                  <TableHead className={thClass}>Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showInlineMaterial && (
                  <TableRow className="bg-secondary/30 border-border/40">
                    <TableCell>
                      <Input
                        placeholder="Becra code"
                        value={inlineMaterial.becraCode}
                        onChange={e => setInlineMaterial(f => ({...f, becraCode: e.target.value}))}
                        className="h-7 text-xs bg-secondary border-border"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Description"
                        value={inlineMaterial.shortDescription}
                        onChange={e => setInlineMaterial(f => ({...f, shortDescription: e.target.value}))}
                        className="h-7 text-xs bg-secondary border-border"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Brand"
                        value={inlineMaterial.brandName}
                        onChange={e => setInlineMaterial(f => ({...f, brandName: e.target.value}))}
                        className="h-7 text-xs bg-secondary border-border"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Transaction type"
                        value={inlineMaterial.transactionType}
                        onChange={e => setInlineMaterial(f => ({...f, transactionType: e.target.value}))}
                        className="h-7 text-xs bg-secondary border-border"
                      />
                    </TableCell>
                    <TableCell colSpan={2}>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-accent text-accent-foreground hover:bg-accent/80"
                          onClick={handleInlineMaterialSave}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-border"
                          onClick={() => setShowInlineMaterial(false)}>
                          Cancel
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {project.MaterialSerialTrack.filter(m => (showDeletedMaterials ? !!m.deleted : !m.deleted)).length ===
                  0 && !showInlineMaterial ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No material tracks found.
                    </TableCell>
                  </TableRow>
                ) : (
                  project.MaterialSerialTrack.filter(m => (showDeletedMaterials ? !!m.deleted : !m.deleted)).map(m => (
                    <TableRow key={m.id} className="border-border/40 hover:bg-secondary/50">
                      <TableCell className={`${tdClass} text-foreground font-medium`}>{m.becraCode ?? '-'}</TableCell>
                      <TableCell className={tdClass}>
                        <span className="max-w-[200px] truncate inline-block">{m.shortDescription ?? '-'}</span>
                      </TableCell>
                      <TableCell className={tdClass}>{m.brandName ?? '-'}</TableCell>
                      <TableCell className={tdClass}>{m.transactionType ?? '-'}</TableCell>
                      <TableCell className={tdClass}>{m.Company?.name ?? '-'}</TableCell>
                      <TableCell className={tdClass}>
                        {m.Employee ? `${m.Employee.firstName} ${m.Employee.lastName}` : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Sub-projects ──────────────────────────────────────────────────── */}
        <TabsContent value="subprojects" className="mt-3">
          {canDelete && (
            <div className="flex justify-end mb-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7 text-muted-foreground gap-1.5"
                onClick={() => setShowDeletedSubProjects(v => !v)}>
                {showDeletedSubProjects ? 'Hide deleted' : 'Show deleted'}
              </Button>
            </div>
          )}
          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className={thClass}>Project #</TableHead>
                  <TableHead className={thClass}>Company</TableHead>
                  <TableHead className={thClass}>Type</TableHead>
                  <TableHead className={thClass}>Start Date</TableHead>
                  <TableHead className={thClass}>End Date</TableHead>
                  <TableHead className={thClass}>Open</TableHead>
                  <TableHead className={thClass}>Closed</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Open</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.other_Project.filter(sp => (showDeletedSubProjects ? !!sp.deleted : !sp.deleted)).length ===
                0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No sub-projects found.
                    </TableCell>
                  </TableRow>
                ) : (
                  project.other_Project
                    .filter(sp => (showDeletedSubProjects ? !!sp.deleted : !sp.deleted))
                    .map(sp => (
                      <TableRow
                        key={sp.id}
                        className={`border-border/40 hover:bg-secondary/50 ${sp.deleted ? 'opacity-50' : ''}`}>
                        <TableCell className={`${tdClass} text-foreground font-medium`}>{sp.projectNumber}</TableCell>
                        <TableCell className={tdClass}>{sp.Company.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-border text-muted-foreground font-normal">
                            {sp.ProjectType.name}
                          </Badge>
                        </TableCell>
                        <TableCell className={tdClass}>{formatDate(sp.startDate)}</TableCell>
                        <TableCell className={tdClass}>{formatDate(sp.endDate)}</TableCell>
                        <TableCell>
                          {sp.isOpen ? (
                            <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-muted-foreground font-medium">
                              No
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {sp.isClosed ? (
                            <Badge className="bg-accent/15 text-accent border-0 font-medium">Yes</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-muted-foreground font-medium">
                              No
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link href={`/departments/${departmentId}/project/${sp.id}` as Route}>
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

        {/* ── Visibility ────────────────────────────────────────────────────── */}
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
                        {visible ? (
                          <Badge className="bg-accent/15 text-accent border-0 font-medium">Visible</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground font-medium">
                            Hidden
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* ── Contact Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={dialogContact} onOpenChange={setDialogContact}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Contact</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Contact</Label>
              <div className="flex gap-2">
                <Select
                  value={dialogContactForm.contactId}
                  onValueChange={v => {
                    if (v === '__create__') {
                      setNestedContactDialog(true)
                    } else {
                      setDialogContactForm(f => ({...f, contactId: v}))
                    }
                  }}>
                  <SelectTrigger className="bg-secondary border-border flex-1">
                    <SelectValue placeholder="Select contact" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {localContacts.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="__create__">+ Create New Contact</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  className="border-border shrink-0"
                  onClick={() => setNestedContactDialog(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea
                value={dialogContactForm.description}
                onChange={e => setDialogContactForm(f => ({...f, description: e.target.value}))}
                rows={3}
                className="bg-secondary border-border resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogContact(false)} className="border-border">
              Cancel
            </Button>
            <Button
              onClick={handleDialogContactSave}
              disabled={!dialogContactForm.contactId || savingContact}
              className="bg-accent text-accent-foreground hover:bg-accent/80">
              {savingContact ? 'Adding…' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Nested Contact Creator ───────────────────────────────────────────── */}
      <ContactFormDialog
        open={nestedContactDialog}
        onOpenChange={setNestedContactDialog}
        contact={null}
        onSave={handleNestedContactSave}
        isAdmin={isAdmin}
        roleLevelOptions={roleLevelOptions}
        defaultVisibleRoleNames={defaultVisibleRoleNames}
        functionOptions={functionOptions}
        departmentExternOptions={departmentExternOptions}
        titleOptions={titleOptions}
        companyOptions={companies}
      />

      <WorkOrderFormDialog
        open={workOrderDialogOpen}
        onOpenChange={setWorkOrderDialogOpen}
        workOrder={null}
        projectOptions={workOrderProjectOptions}
      />

      {/* ── Edit Contact Dialog ──────────────────────────────────────────────── */}
      <Dialog open={editContactDialog} onOpenChange={setEditContactDialog}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Contact Link</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea
                value={editContactForm.description}
                onChange={e => setEditContactForm(f => ({...f, description: e.target.value}))}
                rows={3}
                className="bg-secondary border-border resize-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Extra Info</Label>
              <Textarea
                value={editContactForm.extraInfo}
                onChange={e => setEditContactForm(f => ({...f, extraInfo: e.target.value}))}
                rows={3}
                className="bg-secondary border-border resize-none"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
              <Label className="text-xs text-muted-foreground">ID Valid</Label>
              <Switch
                checked={editContactForm.isValid}
                onCheckedChange={v => setEditContactForm(f => ({...f, isValid: v}))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditContactDialog(false)} className="border-border">
              Cancel
            </Button>
            <Button
              onClick={handleSaveContactEdit}
              disabled={savingEdit}
              className="bg-accent text-accent-foreground hover:bg-accent/80">
              {savingEdit ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Purchase Dialog ─────────────────────────────────────────────── */}
      <Dialog open={editPurchaseDialog} onOpenChange={setEditPurchaseDialog}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Purchase</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Order Number</Label>
              <Input
                value={editPurchaseForm.orderNumber}
                onChange={e => setEditPurchaseForm(f => ({...f, orderNumber: e.target.value}))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Input
                value={editPurchaseForm.shortDescription}
                onChange={e => setEditPurchaseForm(f => ({...f, shortDescription: e.target.value}))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                value={editPurchaseForm.status}
                onValueChange={v => setEditPurchaseForm(f => ({...f, status: v}))}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {PURCHASE_STATUS_OPTIONS.map(s => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Supplier</Label>
              <Select
                value={editPurchaseForm.companyId}
                onValueChange={v => setEditPurchaseForm(f => ({...f, companyId: v}))}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPurchaseDialog(false)} className="border-border">
              Cancel
            </Button>
            <Button
              onClick={handleSavePurchaseEdit}
              disabled={savingEdit}
              className="bg-accent text-accent-foreground hover:bg-accent/80">
              {savingEdit ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ────────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {deleteTarget?.action === 'undelete'
                ? 'Restore entry'
                : deleteTarget?.action === 'hard'
                  ? 'Permanently delete'
                  : 'Delete entry'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteTarget?.action === 'undelete'
              ? `Restore "${deleteTarget?.label}"?`
              : deleteTarget?.action === 'hard'
                ? `Permanently delete "${deleteTarget?.label}"? This cannot be undone.`
                : `Soft-delete "${deleteTarget?.label}"? It can be restored later.`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="border-border">
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={savingDelete}
              className={
                deleteTarget?.action === 'hard'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : deleteTarget?.action === 'undelete'
                    ? 'bg-green-600 text-white hover:bg-green-600/90'
                    : 'bg-accent text-accent-foreground hover:bg-accent/80'
              }>
              {savingDelete
                ? 'Working…'
                : deleteTarget?.action === 'undelete'
                  ? 'Restore'
                  : deleteTarget?.action === 'hard'
                    ? 'Permanently Delete'
                    : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Purchase Dialog ───────────────────────────────────────────── */}
      <Dialog open={dialogPurchase} onOpenChange={setDialogPurchase}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Purchase</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Order Number</Label>
              <Input
                value={dialogPurchaseForm.orderNumber}
                onChange={e => setDialogPurchaseForm(f => ({...f, orderNumber: e.target.value}))}
                placeholder="e.g. PO-2026-001"
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Input
                value={dialogPurchaseForm.shortDescription}
                onChange={e => setDialogPurchaseForm(f => ({...f, shortDescription: e.target.value}))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                value={dialogPurchaseForm.status ?? ''}
                onValueChange={v => setDialogPurchaseForm(f => ({...f, status: v}))}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {PURCHASE_STATUS_OPTIONS.map(s => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Supplier</Label>
              <Select
                value={dialogPurchaseForm.companyId}
                onValueChange={v => setDialogPurchaseForm(f => ({...f, companyId: v}))}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogPurchase(false)}
              disabled={savingNewPurchase}
              className="border-border">
              Cancel
            </Button>
            <Button
              onClick={handleDialogPurchaseSave}
              disabled={savingNewPurchase}
              className="bg-accent text-accent-foreground hover:bg-accent/80">
              {savingNewPurchase ? 'Creating…' : 'Create Purchase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Link Existing Purchase Dialog ────────────────────────────────────── */}
      <Dialog open={dialogLinkPurchase} onOpenChange={setDialogLinkPurchase}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Link Existing Purchase</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-muted-foreground">
              Select an unassigned purchase order to link to this project.
            </p>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Purchase Order</Label>
              <Select value={linkPurchaseId} onValueChange={setLinkPurchaseId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select purchase order" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {availablePurchases.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.orderNumber ?? '(no order #)'}
                      {p.companyName ? ` · ${p.companyName}` : ''}
                      {p.status ? ` · ${p.status}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogLinkPurchase(false)}
              disabled={savingLinkPurchase}
              className="border-border">
              Cancel
            </Button>
            <Button
              onClick={handleDialogLinkPurchaseSave}
              disabled={!linkPurchaseId || savingLinkPurchase}
              className="bg-accent text-accent-foreground hover:bg-accent/80">
              {savingLinkPurchase ? 'Linking…' : 'Link Purchase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Material Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={dialogMaterial} onOpenChange={setDialogMaterial}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Material Track</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Becra Code</Label>
              <Input
                value={dialogMaterialForm.becraCode}
                onChange={e => setDialogMaterialForm(f => ({...f, becraCode: e.target.value}))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Input
                value={dialogMaterialForm.shortDescription}
                onChange={e => setDialogMaterialForm(f => ({...f, shortDescription: e.target.value}))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Brand</Label>
              <Input
                value={dialogMaterialForm.brandName}
                onChange={e => setDialogMaterialForm(f => ({...f, brandName: e.target.value}))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Transaction Type</Label>
              <Input
                value={dialogMaterialForm.transactionType}
                onChange={e => setDialogMaterialForm(f => ({...f, transactionType: e.target.value}))}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMaterial(false)} className="border-border">
              Cancel
            </Button>
            <Button onClick={handleDialogMaterialSave} className="bg-accent text-accent-foreground hover:bg-accent/80">
              Add Material Track
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
