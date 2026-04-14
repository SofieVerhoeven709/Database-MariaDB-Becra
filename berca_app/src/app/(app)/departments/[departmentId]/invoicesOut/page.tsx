import {
  getInvoicesOut,
  getInvoiceTypes,
  getPaymentMethods,
  getInvoiceSentTypes,
  getInvoiceStatuses,
  getAllVatMargins,
  getCountries,
  getOpenProjects,
} from '@/dal/invoices'
import {getContactOptions} from '@/dal/contacts'
import {mapInvoiceOut} from '@/extra/invoices'
import {InvoiceOutTable} from '@/components/custom/invoiceOutTable'
import {VatMarginTable} from '@/components/custom/vatMarginTable'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Badge} from '@/components/ui/badge'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function InvoicesOutPage({params}: PageProps) {
  const {departmentId} = await params

  const [
    department,
    invoicesRaw,
    invoiceTypes,
    paymentMethods,
    invoiceSentTypes,
    invoiceStatuses,
    vatMarginsRaw,
    countries,
    contactOptions,
    projectsRaw,
    profile,
  ] = await Promise.all([
    getDepartmentById(departmentId),
    getInvoicesOut(),
    getInvoiceTypes(),
    getPaymentMethods(),
    getInvoiceSentTypes(),
    getInvoiceStatuses(),
    getAllVatMargins(),
    getCountries(),
    getContactOptions(),
    getOpenProjects(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>

  // Deep fix: Ensure all beNumber fields are strings for WorkOrderStructure.Material
  const invoicesRawFixed = invoicesRaw.map(inv => ({
    ...inv,
    WorkOrderInvoice:
      inv.WorkOrderInvoice?.map(wi => ({
        ...wi,
        WorkOrder:
          wi.WorkOrder && Array.isArray(wi.WorkOrder.WorkOrderStructure)
            ? {
                ...wi.WorkOrder,
                WorkOrderStructure: wi.WorkOrder.WorkOrderStructure.map(wos => ({
                  ...wos,
                  Material: wos.Material
                    ? {
                        ...wos.Material,
                        beNumber: typeof wos.Material.beNumber === 'string' ? wos.Material.beNumber : '',
                      }
                    : wos.Material,
                })),
              }
            : wi.WorkOrder,
      })) ?? [],
  }))

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const invoices = invoicesRawFixed.map(inv => mapInvoiceOut(inv as any))
  const mappedContacts = (contactOptions ?? []).map(c => ({id: c.id, name: `${c.firstName} ${c.lastName}`}))
  const projectOptions = projectsRaw.map(p => ({
    id: p.id,
    projectNumber: p.projectNumber,
    projectName: p.projectName,
    companyName: p.Company?.name ?? '',
  }))

  // Map VAT margins for table display
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
          <h1 className="text-lg font-semibold text-foreground">Outgoing Invoices</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage invoices sent to clients</p>
        </div>

        <Tabs defaultValue="invoices" className="w-full">
          <TabsList className="bg-secondary border border-border/60">
            <TabsTrigger value="invoices">
              Invoices
              <Badge variant="secondary" className="ml-2 text-xs">
                {invoices.filter(inv => !inv.deleted).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="vatMargins">
              VAT Margins
              <Badge variant="secondary" className="ml-2 text-xs">
                {mappedVatMargins.filter(v => !v.deleted).length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="mt-4">
            <InvoiceOutTable
              initialInvoices={invoices}
              currentUserRole={currentUserRole}
              currentUserLevel={currentUserLevel}
              departmentId={departmentId}
              invoiceTypes={invoiceTypes}
              paymentMethods={paymentMethods}
              invoiceSentTypes={invoiceSentTypes}
              invoiceStatuses={invoiceStatuses}
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
