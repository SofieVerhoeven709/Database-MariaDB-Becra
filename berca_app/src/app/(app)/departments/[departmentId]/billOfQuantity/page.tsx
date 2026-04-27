import {
  getBoqs,
  getBoqTypes,
  getPaymentMethods,
  getBoqSentTypes,
  getBoqStatuses,
  getOpenProjects,
} from '@/dal/billOfQuantities'
import {getContactOptions} from '@/dal/contacts'
import {mapBoq} from '@/extra/billOfQuantities'
import {BoqTable} from '@/components/custom/billOfQuantityTable'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {VatMarginTable} from '@/components/custom/vatMarginTable'
import {Badge} from '@/components/ui/badge'
import {getAllVatMargins, getCountries} from '@/dal/invoices'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function BoqPage({params}: PageProps) {
  const {departmentId} = await params

  const [
    department,
    boqsRaw,
    boqTypes,
    paymentMethods,
    boqSentTypes,
    boqStatuses,
    contactOptions,
    projectsRaw,
    profile,
    vatMarginsRaw,
    countries,
  ] = await Promise.all([
    getDepartmentById(departmentId),
    getBoqs(),
    getBoqTypes(),
    getPaymentMethods(),
    getBoqSentTypes(),
    getBoqStatuses(),
    getContactOptions(),
    getOpenProjects(),
    getSessionProfileFromCookieOrThrow(),
    getAllVatMargins(),
    getCountries(),
  ])

  if (!department) return <p>Department not found</p>

  // Coerce beNumber fields to string
  const boqsRawFixed = boqsRaw.map(boq => ({
    ...boq,
    WorkOrderBoQ:
      boq.WorkOrderBoQ?.map(wb => ({
        ...wb,
        WorkOrder:
          wb.WorkOrder && Array.isArray(wb.WorkOrder.WorkOrderStructure)
            ? {
                ...wb.WorkOrder,
                WorkOrderStructure: wb.WorkOrder.WorkOrderStructure.map(wos => ({
                  ...wos,
                  Material: wos.Material
                    ? {
                        ...wos.Material,
                        beNumber: typeof wos.Material.beNumber === 'string' ? wos.Material.beNumber : '',
                      }
                    : wos.Material,
                })),
              }
            : wb.WorkOrder,
      })) ?? [],
  }))

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const boqs = boqsRawFixed.map(boq => mapBoq(boq as any))
  const mappedContacts = (contactOptions ?? []).map(c => ({id: c.id, name: `${c.firstName} ${c.lastName}`}))
  const projectOptions = projectsRaw.map(p => ({
    id: p.id,
    projectNumber: p.projectNumber,
    projectName: p.projectName,
    companyName: p.Company?.name ?? '',
  }))
  const mappedVatMargins = vatMarginsRaw.map(v => ({
    id: v.id,
    vat: v.vat,
    countryId: v.countryId,
    countryName: v.countryName,
    createdAt: new Date(v.createdAt).toISOString(),
    createdByName: v.createdByName,
    deletedAt: v.deletedAt ? new Date(v.deletedAt).toISOString() : null,
    deletedByName: v.deletedByName,
    deleted: v.deleted,
  }))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Bills of Quantities</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage bills of quantities sent to clients</p>
        </div>

        <Tabs defaultValue="boqs" className="w-full">
          <TabsList className="bg-secondary border border-border/60">
            <TabsTrigger value="boqs">
              Bill of quantities
              <Badge variant="secondary" className="ml-2 text-xs">
                {boqs.filter(boq => !boq.deleted).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="vatMargins">
              VAT Margins
              <Badge variant="secondary" className="ml-2 text-xs">
                {mappedVatMargins.filter(v => !v.deleted).length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="boqs" className="mt-4">
            <BoqTable
              initialBoqs={boqs}
              currentUserRole={currentUserRole}
              currentUserLevel={currentUserLevel}
              departmentId={departmentId}
              boqTypes={boqTypes}
              paymentMethods={paymentMethods}
              boqSentTypes={boqSentTypes}
              boqStatuses={boqStatuses}
              contactOptions={mappedContacts}
              projectOptions={projectOptions}
            />
          </TabsContent>

          <TabsContent value="vatMargins" className="mt-4">
            <VatMarginTable
              initialVatMargins={mappedVatMargins}
              countries={countries}
              currentUserRole={currentUserRole}
              currentUserLevel={currentUserLevel}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
