import {
  getInvoicesIn,
  getInvoiceTypes,
  getPaymentMethods,
  getInvoiceSentTypes,
  getInvoiceStatuses,
  getVatMargins,
} from '@/dal/invoices'
import {getCompanies} from '@/dal/companies'
import {mapInvoiceIn} from '@/extra/invoices'
import {InvoiceInTable} from '@/components/custom/invoiceInTable'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'

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
    vatMargins,
    companiesRaw,
    profile,
  ] = await Promise.all([
    getDepartmentById(departmentId),
    getInvoicesIn(),
    getInvoiceTypes(),
    getPaymentMethods(),
    getInvoiceSentTypes(),
    getInvoiceStatuses(),
    getVatMargins(),
    getCompanies(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const invoices = invoicesRaw.map(mapInvoiceIn)
  const companyOptions = companiesRaw.filter(c => !c.deleted).map(c => ({id: c.id, name: c.name}))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Incoming Invoices</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage invoices received from suppliers</p>
        </div>

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
        />
      </div>
    </main>
  )
}
