import {getPurchases} from '@/dal/purchases'
import {mapPurchase} from '@/extra/purchases'
import {DEPARTMENT_ACTIONS} from '@/extra/departmentActions'
import {getDepartmentById} from '@/dal/department'
import {PurchaseOrdersConfirmationTable} from '@/components/custom/purchaseOrdersConfirmationTable'

interface PageProps {
  params: Promise<{departmentId: string}>
  searchParams?: Promise<{purchaseId?: string}>
}

export default async function PurchaseOrdersConfirmationPage({params, searchParams}: PageProps) {
  const {departmentId} = await params
  const query = (await searchParams) ?? {}
  const focusedPurchaseId = typeof query.purchaseId === 'string' ? query.purchaseId : undefined

  const [department, purchasesFromDAL] = await Promise.all([getDepartmentById(departmentId), getPurchases()])

  if (!department) return <p>Department not found</p>

  const purchases = purchasesFromDAL.map(mapPurchase)
  const action = DEPARTMENT_ACTIONS[department.name]?.find(a => a.id === 'purchaseOrdersConfirmation')

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{action?.name ?? 'Purchase Orders Confirmation'}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {action?.description ?? 'Review and manage Becra order confirmations from purchase orders.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span className="text-foreground">
              {purchases.length}
              <span className="ml-1 text-xs uppercase tracking-wide text-muted-foreground">total</span>
            </span>
          </div>
        </header>

        <PurchaseOrdersConfirmationTable
          initialPurchases={purchases}
          departmentId={departmentId}
          focusedPurchaseId={focusedPurchaseId}
        />
      </div>
    </main>
  )
}
