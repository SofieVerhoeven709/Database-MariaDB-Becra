import {notFound} from 'next/navigation'
import {
  getInvoiceInById,
  getInvoiceTypes,
  getPaymentMethods,
  getInvoiceSentTypes,
  getInvoiceStatuses,
  getVatMargins,
} from '@/dal/invoices'
import {getCompanies} from '@/dal/companies'
import {mapInvoiceIn} from '@/extra/invoices'
import {InvoiceInDetail} from '@/components/custom/invoiceInDetail'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {getPurchases} from '@/dal/purchases'

interface PageProps {
  params: Promise<{departmentId: string; invoiceInId: string}>
}

export default async function InvoiceInDetailPage({params}: PageProps) {
  const {departmentId, invoiceInId} = await params

  const [
    department,
    invoiceRaw,
    invoiceTypes,
    paymentMethods,
    invoiceSentTypes,
    invoiceStatuses,
    vatMargins,
    companiesRaw,
    profile,
    purchases,
  ] = await Promise.all([
    getDepartmentById(departmentId),
    getInvoiceInById(invoiceInId).catch(() => null),
    getInvoiceTypes(),
    getPaymentMethods(),
    getInvoiceSentTypes(),
    getInvoiceStatuses(),
    getVatMargins(),
    getCompanies(),
    getSessionProfileFromCookieOrThrow(),
    getPurchases(),
  ])

  if (!department) return <p>Department not found</p>
  if (!invoiceRaw) notFound()

  const invoice = mapInvoiceIn(invoiceRaw)
  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)
  const companyOptions = companiesRaw.filter(c => !c.deleted).map(c => ({id: c.id, name: c.name}))
  const purchaseOptions = purchases
    .filter(c => !c.deleted)
    .map(c => ({id: c.id, purchaseNumber: c.purchaseNumber, description: c.description, companyId: c.companyId}))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <InvoiceInDetail
          invoice={invoice}
          invoiceTypes={invoiceTypes}
          paymentMethods={paymentMethods}
          invoiceSentTypes={invoiceSentTypes}
          invoiceStatuses={invoiceStatuses}
          vatMargins={vatMargins}
          companyOptions={companyOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          purchaseOptions={purchaseOptions}
        />
      </div>
    </main>
  )
}
