import {notFound} from 'next/navigation'
import {
  getInvoiceOutById,
  getInvoiceTypes,
  getPaymentMethods,
  getInvoiceSentTypes,
  getInvoiceStatuses,
  getVatMargins,
  getCompanyContactsForInvoice,
} from '@/dal/invoices'
import {mapInvoiceOut} from '@/extra/invoices'
import {InvoiceOutDetail} from '@/components/custom/invoiceOutDetail'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface PageProps {
  params: Promise<{departmentId: string; invoiceOutId: string}>
}

export default async function InvoiceOutDetailPage({params}: PageProps) {
  const {departmentId, invoiceOutId} = await params

  const [department, invoiceRaw, invoiceTypes, paymentMethods, invoiceSentTypes, invoiceStatuses, vatMargins, profile] =
    await Promise.all([
      getDepartmentById(departmentId),
      getInvoiceOutById(invoiceOutId).catch(() => null),
      getInvoiceTypes(),
      getPaymentMethods(),
      getInvoiceSentTypes(),
      getInvoiceStatuses(),
      getVatMargins(),
      getSessionProfileFromCookieOrThrow(),
    ])

  if (!department) return <p>Department not found</p>
  if (!invoiceRaw) notFound()

  const invoice = mapInvoiceOut(invoiceRaw)
  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)

  // Derive company IDs from linked work orders → projects
  const companyIds = [...new Set(invoice.workOrders.map(wo => wo.companyId))]
  const companyContacts = await getCompanyContactsForInvoice(companyIds)
  const contactOptions = companyContacts.map(cc => ({
    id: cc.Contact.id,
    name: `${cc.Contact.firstName} ${cc.Contact.lastName}`,
  }))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <InvoiceOutDetail
          invoice={invoice}
          invoiceTypes={invoiceTypes}
          paymentMethods={paymentMethods}
          invoiceSentTypes={invoiceSentTypes}
          invoiceStatuses={invoiceStatuses}
          vatMargins={vatMargins}
          contactOptions={contactOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          departmentId={departmentId}
        />
      </div>
    </main>
  )
}
