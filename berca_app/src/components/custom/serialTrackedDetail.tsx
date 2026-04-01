'use client'

import {Badge} from '@/components/ui/badge'
import {Pencil} from 'lucide-react'
import {useEffect, useState} from 'react'
import {MaterialSerialTrackedFormDialog} from '@/components/custom/serialTrackedFormDialog'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'


interface Props {
  item: any
  companies: {id: string; name: string}[]
  projects: {id: string; name: string}[]
  materialGroups: {id: string; name: string}[]
  warehousePlaces: {id: string; label: string}[]
  materialOptions: any[] // Add this line
  currentUserRole: string
  currentUserLevel: number
}

export function MaterialSerialTrackedDetail({item, companies, projects, materialGroups, warehousePlaces, materialOptions, currentUserRole, currentUserLevel}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [structure, setStructure] = useState<any[]>([])
  useEffect(() => {
    async function fetchStructure() {
      // Fetch from API route instead of direct DAL call
      const res = await fetch(`/api/serialTrackedStructure/${item.id}`)
      if (res.ok) {
        const data = await res.json()
        setStructure(data)
      } else {
        setStructure([])
      }
    }
    fetchStructure()
  }, [item.id])

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

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="structure">Structure</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          {/* Info grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-lg p-4">
            <Field label="Short Description" value={item.shortDescription} />
            <Field label="Brand Name" value={item.brandName} />
            <Field label="Management" value={item.management} />
            <Field label="Order Number" value={item.orderNumber} />
            <Field label="Transaction Type" value={item.transactionType} />
            <Field
              label="Stock Location"
              value={
                item.WarehousePlace?.[0]
                  ? [
                      item.WarehousePlace[0].abbreviation,
                      item.WarehousePlace[0].place,
                      item.WarehousePlace[0].shelf,
                      item.WarehousePlace[0].column,
                      item.WarehousePlace[0].layer,
                      item.WarehousePlace[0].layerPlace,
                    ]
                      .filter(Boolean)
                      .join(' / ')
                  : null
              }
            />
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
        </TabsContent>
        <TabsContent value="structure">
          <div className="rounded-xl border border-border bg-card p-6">
            {structure.length === 0 ? (
              <p className="text-muted-foreground text-sm">No structure found for this serial tracked item.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Short Description</TableHead>
                    <TableHead>Long Description</TableHead>
                    <TableHead>BE Number</TableHead>
                    <TableHead>Material Group</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {structure.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.shortDescription}</TableCell>
                      <TableCell>{s.longDescription}</TableCell>
                      <TableCell>{s.MaterialSerialTrack?.beNumber ?? '-'}</TableCell>
                      <TableCell>
                        {s.MaterialSerialTrack?.MaterialGroup
                          ? [s.MaterialSerialTrack.MaterialGroup.groupA, s.MaterialSerialTrack.MaterialGroup.groupB, s.MaterialSerialTrack.MaterialGroup.groupC, s.MaterialSerialTrack.MaterialGroup.groupD].filter(Boolean).join(' / ')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <MaterialSerialTrackedFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        materialSerialTracked={item}
        companyOptions={companies}
        projectOptions={projects}
        materialGroupOptions={materialGroups}
        warehousePlaceOptions={warehousePlaces}
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
