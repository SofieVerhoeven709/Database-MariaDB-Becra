import {notFound} from 'next/navigation'
import {
  getInvoiceOutById,
  getInvoiceTypes,
  getPaymentMethods,
  getInvoiceSentTypes,
  getInvoiceStatuses,
  getVatMargins,
} from '@/dal/invoices'
import {getContactOptions} from '@/dal/contacts'
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

  const [
    department,
    invoiceRaw,
    invoiceTypes,
    paymentMethods,
    invoiceSentTypes,
    invoiceStatuses,
    vatMargins,
    contactOptions,
    profile,
  ] = await Promise.all([
    getDepartmentById(departmentId),
    getInvoiceOutById(invoiceOutId).catch(() => null),
    getInvoiceTypes(),
    getPaymentMethods(),
    getInvoiceSentTypes(),
    getInvoiceStatuses(),
    getVatMargins(),
    getContactOptions(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>
  if (!invoiceRaw) notFound()

  const invoice = mapInvoiceOut(invoiceRaw)
  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const mappedContacts = (contactOptions ?? []).map(c => ({id: c.id, name: `${c.firstName} ${c.lastName}`}))

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
          contactOptions={mappedContacts}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
        />
      </div>
    </main>
  )
}
