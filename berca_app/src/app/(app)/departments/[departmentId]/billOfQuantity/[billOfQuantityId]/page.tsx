import {notFound} from 'next/navigation'
import {
  getBoqById,
  getBoqTypes,
  getPaymentMethods,
  getBoqSentTypes,
  getBoqStatuses,
  getCompanyContactsForBoq,
  getPriceListsForCompanies,
} from '@/dal/billOfQuantities'
import {mapBoq} from '../../../../../../mapper/billOfQuantities'
import {BoqDetail} from '@/components/custom/billOfQuantityDetail'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {getMaterialPricesForBeNumbers} from '@/dal/invoices'

interface PageProps {
  params: Promise<{departmentId: string; billOfQuantityId: string}>
}

export default async function BoqDetailPage({params}: PageProps) {
  const {departmentId, billOfQuantityId} = await params

  const [department, boqRaw, boqTypes, paymentMethods, boqSentTypes, boqStatuses, profile] = await Promise.all([
    getDepartmentById(departmentId),
    getBoqById(billOfQuantityId).catch(() => null),
    getBoqTypes(),
    getPaymentMethods(),
    getBoqSentTypes(),
    getBoqStatuses(),
    getSessionProfileFromCookieOrThrow(),
  ])

  if (!department) return <p>Department not found</p>
  if (!boqRaw) notFound()

  // Coerce beNumber fields to string
  let boqRawFixed = boqRaw
  if (boqRaw && Array.isArray(boqRaw.WorkOrderBoQ)) {
    boqRawFixed = {
      ...boqRaw,
      WorkOrderBoQ: boqRaw.WorkOrderBoQ.map(wb => ({
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
                        beNumber: wos.Material.beNumber ?? '',
                      }
                    : wos.Material,
                })),
              }
            : wb.WorkOrder,
      })),
    }
  }

  const beNumbers = [
    ...new Set(
      boqRawFixed.WorkOrderBoQ.flatMap((wb: any) =>
        (wb.WorkOrder?.WorkOrderStructure ?? []).map((wos: any) => wos.Material?.beNumber).filter(Boolean),
      ),
    ),
  ]

  const materialPriceMap = await getMaterialPricesForBeNumbers(beNumbers)
  const boq = mapBoq(boqRawFixed as any, materialPriceMap)
  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)

  const companyIds = [...new Set(boq.workOrders.map(wo => wo.companyId))]

  const [companyContacts, priceListOptions] = await Promise.all([
    getCompanyContactsForBoq(companyIds),
    getPriceListsForCompanies(companyIds),
  ])

  const contactOptions = companyContacts.map(cc => ({
    id: cc.Contact.id,
    name: `${cc.Contact.firstName} ${cc.Contact.lastName}`,
  }))

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <BoqDetail
          boq={boq}
          boqTypes={boqTypes}
          paymentMethods={paymentMethods}
          boqSentTypes={boqSentTypes}
          boqStatuses={boqStatuses}
          contactOptions={contactOptions}
          priceListOptions={priceListOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          departmentId={departmentId}
        />
      </div>
    </main>
  )
}
