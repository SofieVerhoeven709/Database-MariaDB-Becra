'use client'

import {useMemo, useState} from 'react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {Button} from '@/components/ui/button'
import {TableCsvActions} from '@/components/custom/tableCsvActions'
import {PurchaseFormDialog} from '@/components/custom/purchaseFormDialog'
import type {MappedPurchase} from '@/types/purchase'
import {updatePurchaseAction} from '@/serverFunctions/purchases'

interface PurchaseOrdersConfirmationTableProps {
  initialPurchases: MappedPurchase[]
  departmentId: string
  customerOptions: {id: string; name: string}[]
  focusedPurchaseId?: string
}

export function PurchaseOrdersConfirmationTable({
  initialPurchases,
  departmentId,
  customerOptions,
  focusedPurchaseId,
}: PurchaseOrdersConfirmationTableProps) {
  const router = useRouter()
  const [rows, setRows] = useState(initialPurchases)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MappedPurchase | null>(null)

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => (a.purchaseDate ?? '').localeCompare(b.purchaseDate ?? '') * -1),
    [rows],
  )

  async function handleSave(p: MappedPurchase) {
    await updatePurchaseAction({
      id: p.id,
      purchaseNumber: p.purchaseNumber,
      purchaseDate: p.purchaseDate ?? new Date().toISOString(),
      status: p.status,
      companyId: p.companyId,
      quoteSupplierId: p.quoteSupplierId,
      paymentConditionId: p.paymentConditionId,
      customerPoNumber: p.customerPoNumber,
      bocNumber: p.bocNumber,
      bocCustomerName: p.bocCustomerName,
      bocDescription: p.bocDescription,
      bocCreatedAt: p.bocCreatedAt,
      bocStatus: p.bocStatus,
      description: p.description,
      additionalInfo: p.additionalInfo,
    })

    setRows(prev => prev.map(row => (row.id === p.id ? p : row)))
    setEditing(null)
    router.refresh()
  }

  return (
    <>
      <div className="mb-3 flex justify-end">
        <TableCsvActions filename="purchase-orders-confirmation-table.csv" />
      </div>
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
            {sortedRows.map(purchase => (
              <tr
                key={purchase.id}
                className={`border-t border-border/70 align-top ${focusedPurchaseId === purchase.id ? 'bg-accent/10' : ''}`}>
                <td className="px-4 py-3 text-muted-foreground">{purchase.purchaseNumber || '-'}</td>
                <td className="px-4 py-3 text-muted-foreground">{purchase.bocNumber || '-'}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {purchase.bocDescription || purchase.description || '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline" className="border-border">
                      <Link href={`/departments/${departmentId}/orders/${purchase.id}`}>Open purchase order</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border"
                      onClick={() => {
                        setEditing({
                          ...purchase,
                          bocCreatedAt: purchase.bocCreatedAt ?? new Date().toISOString(),
                          bocStatus: purchase.bocStatus ?? 'DRAFT',
                        })
                        setDialogOpen(true)
                      }}>
                      {purchase.bocNumber ? 'Edit confirmation' : 'Create confirmation'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {sortedRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No confirmations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PurchaseFormDialog
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
        purchase={editing}
        companies={[]}
        customerOptions={customerOptions}
        quoteSuppliers={[]}
        paymentConditions={[]}
        confirmationOnly
        onSave={handleSave}
      />
    </>
  )
}
