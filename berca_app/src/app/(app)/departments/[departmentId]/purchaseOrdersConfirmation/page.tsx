import {getPurchases} from '@/dal/purchases'
import {mapPurchase} from '@/extra/purchases'
import {DEPARTMENT_ACTIONS} from '@/extra/departmentActions'
import {getDepartmentById} from '@/dal/department'
import Link from 'next/link'
import {Button} from '@/components/ui/button'

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
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/80">
              <Link href={`/departments/${departmentId}/orders`}>New confirmation</Link>
            </Button>
          </div>
        </header>

        <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-foreground">Purchase order number customer</th>
                <th className="px-4 py-3 font-medium text-foreground">Becra order confirmation number</th>
                <th className="px-4 py-3 font-medium text-foreground">Description of Becra order confirmation</th>
                <th className="px-4 py-3 font-medium text-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map(purchase => (
                <tr
                  key={purchase.id}
                  className={`border-t border-border/70 align-top ${focusedPurchaseId === purchase.id ? 'bg-accent/10' : ''}`}>
                  <td className="px-4 py-3 text-muted-foreground">{purchase.customerPoNumber || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{purchase.bocNumber || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{purchase.bocDescription || purchase.description || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline" className="border-border">
                        <Link href={`/departments/${departmentId}/orders/${purchase.id}`}>Open purchase order</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="border-border">
                        <Link href={`/departments/${departmentId}/orders?prefillPurchaseId=${purchase.id}&returnTo=confirmation`}>
                          Create confirmation
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No confirmations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
