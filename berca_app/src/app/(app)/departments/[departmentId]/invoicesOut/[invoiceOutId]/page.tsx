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
  params: { departmentId: string; invoiceOutId: string }
}

export default async function InvoiceOutDetailPage({params}: PageProps) {
  const {departmentId, invoiceOutId} = params

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

  // Fix: Deep clone and coerce all beNumber fields to string for WorkOrderStructure.Material
  let invoiceRawFixed = invoiceRaw
  if (invoiceRaw && Array.isArray(invoiceRaw.WorkOrderInvoice)) {
    invoiceRawFixed = {
      ...invoiceRaw,
      WorkOrderInvoice: invoiceRaw.WorkOrderInvoice.map(wi => ({
        ...wi,
        WorkOrder: wi.WorkOrder && Array.isArray(wi.WorkOrder.WorkOrderStructure)
          ? {
              ...wi.WorkOrder,
              WorkOrderStructure: wi.WorkOrder.WorkOrderStructure.map(wos => ({
                ...wos,
                Material: wos.Material
                  ? {
                      ...wos.Material,
                      beNumber: wos.Material.beNumber ?? '',
                    }
                  : wos.Material,
              })),
            }
          : wi.WorkOrder,
      })),
    }
  }
  const invoice = mapInvoiceOut(invoiceRawFixed as any)
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
