import {
  getInvoicesIn,
  getInvoiceTypes,
  getPaymentMethods,
  getInvoiceSentTypes,
  getInvoiceStatuses,
  getAllVatMargins,
  getCountries,
} from '@/dal/invoices'
import {getCompanies} from '@/dal/companies'
import {mapInvoiceIn} from '@/extra/invoices'
import {InvoiceInTable} from '@/components/custom/invoiceInTable'
import {VatMarginTable} from '@/components/custom/vatMarginTable'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Badge} from '@/components/ui/badge'
import {getPurchases} from '@/dal/purchases'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function InvoicesInPage({params}: PageProps) {
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
    companiesRaw,
    profile,
    purchases,
  ] = await Promise.all([
    getDepartmentById(departmentId),
    getInvoicesIn(),
    getInvoiceTypes(),
    getPaymentMethods(),
    getInvoiceSentTypes(),
    getInvoiceStatuses(),
    getAllVatMargins(),
    getCountries(),
    getCompanies(),
    getSessionProfileFromCookieOrThrow(),
    getPurchases(),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const invoices = invoicesRaw.map(mapInvoiceIn)
  const companyOptions = companiesRaw.filter(c => !c.deleted).map(c => ({id: c.id, name: c.name}))

  const vatMargins = vatMarginsRaw
    .filter(v => !v.deleted)
    .map(v => ({
      id: v.id,
      vat: v.vat,
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
  const purchaseOptions = purchases
    .filter(c => !c.deleted)
    .map(c => ({id: c.id, purchaseNumber: c.purchaseNumber, description: c.description, companyId: c.companyId}))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Incoming Invoices</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage invoices received from suppliers</p>
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
            <InvoiceInTable
              initialInvoices={invoices}
              currentUserRole={currentUserRole}
              currentUserLevel={currentUserLevel}
              departmentId={departmentId}
              invoiceTypes={invoiceTypes}
              paymentMethods={paymentMethods}
              invoiceSentTypes={invoiceSentTypes}
              invoiceStatuses={invoiceStatuses}
              vatMargins={vatMargins}
              companyOptions={companyOptions}
              purchaseOptions={purchaseOptions}
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
