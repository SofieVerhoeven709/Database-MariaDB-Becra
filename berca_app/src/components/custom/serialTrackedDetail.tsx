'use client'

import {Badge} from '@/components/ui/badge'
import {Pencil} from 'lucide-react'
import {useState} from 'react'
import {MaterialSerialTrackedFormDialog} from '@/components/custom/serialTrackedFormDialog'

interface Props {
  item: any
  companies: {id: string; name: string}[]
  projects: {id: string; name: string}[]
  materialGroups: {id: string; name: string}[]
  materialOptions: any[] // Add this line
  currentUserRole: string
  currentUserLevel: number
}

export function MaterialSerialTrackedDetail({item, companies, projects, materialGroups, materialOptions, currentUserRole, currentUserLevel}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Serial Tracked Item</h1>
          <p className="text-muted-foreground text-sm">BE Number: {item.beNumber ?? '-'}</p>
        </div>
        <button
          className="ml-4 rounded p-2 hover:bg-accent/20"
          title="Edit"
          onClick={() => setDialogOpen(true)}
        >
          <Pencil className="h-5 w-5 text-accent" />
        </button>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-lg p-4">
        <Field label="Short Description" value={item.shortDescription} />
        <Field label="Brand Name" value={item.brandName} />
        <Field label="Management" value={item.management} />
        <Field label="Order Number" value={item.orderNumber} />
        <Field label="Transaction Type" value={item.transactionType} />
        <Field label="From Location" value={item.fromLocation} />
        <Field label="To Location" value={item.toLocation} />
        <Field label="Preferred Supplier" value={item.preferredSupplier} />
        <Field label="Becra Code" value={item.becraCode} />

        <div>
          <p className="text-xs text-muted-foreground">Rejected</p>
          {item.rejected === true ? (
            <Badge variant="destructive">Yes</Badge>
          ) : item.rejected === false ? (
            <Badge variant="secondary">No</Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      </div>

      {/* Descriptions */}
      <div className="space-y-3">
        <Field label="Long Description" value={item.longDescription} multiline />
        <Field label="Additional Info" value={item.additionalInfo} multiline />
      </div>

      <MaterialSerialTrackedFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        materialSerialTracked={item}
        companyOptions={companies}
        projectOptions={projects}
        materialGroupOptions={materialGroups}
        materialOptions={materialOptions} // Pass the prop
        departmentId={item.departmentId}
      />
    </div>
  )
}

function Field({label, value, multiline}: {label: string; value?: string | null; multiline?: boolean}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={multiline ? 'whitespace-pre-wrap' : ''}>{value || '-'}</p>
    </div>
  )
}
