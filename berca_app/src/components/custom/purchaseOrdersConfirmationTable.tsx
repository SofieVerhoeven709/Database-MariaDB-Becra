'use client'

import {useMemo, useState} from 'react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {Button} from '@/components/ui/button'
import {TableCsvActions} from '@/components/custom/tableCsvActions'
import {PurchaseFormDialog} from '@/components/custom/purchaseFormDialog'
import {getCsvValue, normalizeCsvLookup, type CsvRow} from '@/lib/csv'
import type {MappedPurchase} from '@/types/purchase'
import {updatePurchaseAction} from '@/serverFunctions/purchases'

interface PurchaseOrdersConfirmationTableProps {
  initialPurchases: MappedPurchase[]
  departmentId: string
  customerOptions: {id: string; name: string}[]
  focusedPurchaseId?: string
}

function csvErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Could not update purchase order confirmation.'
}

function parseCsvDate(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
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

  async function handleUploadCsv(csvRows: CsvRow[]) {
    if (csvRows.length === 0) {
      window.alert('The selected CSV file does not contain rows.')
      return
    }

    const errors: string[] = []
    let updated = 0
    const nextRows = [...rows]

    for (const [index, row] of csvRows.entries()) {
      const rowNumber = index + 2
      const purchaseValue = getCsvValue(row, [
        'Purchase order number customer',
        'Purchase #',
        'Purchase Number',
        'purchaseNumber',
      ])
      const normalized = normalizeCsvLookup(purchaseValue)
      const purchaseIndex = nextRows.findIndex(
        purchase =>
          normalizeCsvLookup(purchase.purchaseNumber ?? '') === normalized ||
          normalizeCsvLookup(purchase.customerPoNumber ?? '') === normalized,
      )

      if (purchaseIndex === -1) {
        errors.push(`Row ${rowNumber}: Purchase order could not be matched.`)
        continue
      }

      const purchase = nextRows[purchaseIndex]
      const bocCreatedAt =
        parseCsvDate(getCsvValue(row, ['BOC Created At', 'Confirmation Date', 'bocCreatedAt'])) ??
        purchase.bocCreatedAt ??
        new Date().toISOString()
      const updatedPurchase: MappedPurchase = {
        ...purchase,
        bocNumber:
          getCsvValue(row, ['Becra order confirmation number', 'Confirmation', 'BOC Number', 'bocNumber']) ||
          purchase.bocNumber,
        bocDescription:
          getCsvValue(row, [
            'Description of Becra order confirmation',
            'BOC Description',
            'Confirmation Description',
            'bocDescription',
          ]) || purchase.bocDescription,
        bocCustomerName: getCsvValue(row, ['BOC Customer', 'bocCustomerName']) || purchase.bocCustomerName,
        bocCreatedAt,
        bocStatus:
          getCsvValue(row, ['BOC Status', 'Confirmation Status', 'bocStatus']) || purchase.bocStatus || 'DRAFT',
      }

      try {
        await updatePurchaseAction({
          id: updatedPurchase.id,
          purchaseNumber: updatedPurchase.purchaseNumber,
          purchaseDate: updatedPurchase.purchaseDate ?? new Date().toISOString(),
          status: updatedPurchase.status,
          companyId: updatedPurchase.companyId,
          quoteSupplierId: updatedPurchase.quoteSupplierId,
          paymentConditionId: updatedPurchase.paymentConditionId,
          customerPoNumber: updatedPurchase.customerPoNumber,
          bocNumber: updatedPurchase.bocNumber,
          bocCustomerName: updatedPurchase.bocCustomerName,
          bocDescription: updatedPurchase.bocDescription,
          bocCreatedAt: updatedPurchase.bocCreatedAt,
          bocStatus: updatedPurchase.bocStatus,
          description: updatedPurchase.description,
          additionalInfo: updatedPurchase.additionalInfo,
        })
        nextRows[purchaseIndex] = updatedPurchase
        updated += 1
      } catch (error) {
        errors.push(`Row ${rowNumber}: ${csvErrorMessage(error)}`)
      }
    }

    setRows(nextRows)
    if (updated > 0) router.refresh()
    window.alert(
      errors.length
        ? `Updated ${updated} purchase order confirmation(s). ${errors.slice(0, 5).join(' ')}${
            errors.length > 5 ? ` +${errors.length - 5} more error(s).` : ''
          }`
        : `Updated ${updated} purchase order confirmation(s).`,
    )
  }

  return (
    <>
      <div className="mb-3 flex justify-end">
        <TableCsvActions filename="purchase-orders-confirmation-table.csv" onUpload={handleUploadCsv} />
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
