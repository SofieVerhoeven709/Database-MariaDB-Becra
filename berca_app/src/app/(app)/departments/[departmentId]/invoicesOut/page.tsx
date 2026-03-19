import {
  getInvoicesOut,
  getInvoiceTypes,
  getPaymentMethods,
  getInvoiceSentTypes,
  getInvoiceStatuses,
  getVatMargins,
} from '@/dal/invoices'
import {getContactOptions} from '@/dal/contacts'
import {mapInvoiceOut} from '@/extra/invoices'
import {InvoiceOutTable} from '@/components/custom/invoiceOutTable'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'

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
    vatMargins,
    contactOptions,
    profile,
  ] = await Promise.all([
    getDepartmentById(departmentId),
    getInvoicesOut(),
    getInvoiceTypes(),
    getPaymentMethods(),
    getInvoiceSentTypes(),
    getInvoiceStatuses(),
    getVatMargins(),
    getContactOptions(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const invoices = invoicesRaw.map(mapInvoiceOut)
  const mappedContacts = (contactOptions ?? []).map(c => ({id: c.id, name: `${c.firstName} ${c.lastName}`}))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Outgoing Invoices</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage invoices sent to clients</p>
        </div>

        <InvoiceOutTable
          initialInvoices={invoices}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          departmentId={departmentId}
          invoiceTypes={invoiceTypes}
          paymentMethods={paymentMethods}
          invoiceSentTypes={invoiceSentTypes}
          invoiceStatuses={invoiceStatuses}
          vatMargins={vatMargins}
          contactOptions={mappedContacts}
        />
      </div>
    </main>
  )
}
