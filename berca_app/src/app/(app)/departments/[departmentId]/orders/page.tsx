import {PurchaseTable} from '@/components/custom/purchaseTable'
import {getPurchases} from '@/dal/purchases'
import {mapPurchase} from '@/extra/purchases'
import {DEPARTMENT_ACTIONS} from '@/extra/departmentActions'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getCompanies} from '@/dal/companies'
import {getPaymentConditionOptions, getQuoteSuppliers} from '@/dal/quoteSuppliers'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'

interface PageProps {
  params: Promise<{departmentId: string}>
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

export default async function PurchaseOrdersPage({params}: PageProps) {
  const {departmentId} = await params

  const [department, purchasesFromDAL, profile, companiesRaw, quoteSuppliersRaw, paymentConditionsRaw] = await Promise.all([
    getDepartmentById(departmentId),
    getPurchases(),
    getSessionProfileFromCookieOrThrow(),
    getCompanies(),
    getQuoteSuppliers(),
    getPaymentConditionOptions(),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)

  const purchases = purchasesFromDAL.map(mapPurchase)
  const action = DEPARTMENT_ACTIONS[department.name]?.find(a => a.id === 'orders')

  const companyOptions = companiesRaw
    .filter(c => !c.deleted)
    // Keep dropdowns stable and searchable by name.
    .map(c => ({id: c.id, name: c.name}))
    .sort((a, b) => a.name.localeCompare(b.name))

  const quoteSupplierOptions = quoteSuppliersRaw
    .filter(q => !q.deleted)
    .map(q => ({id: q.id, name: `${q.quoteNumber} - ${q.Company?.name ?? 'Unknown supplier'}`}))
    .sort((a, b) => a.name.localeCompare(b.name))

  const paymentConditionOptions = paymentConditionsRaw
    .map(pc => ({id: pc.id, name: pc.name}))
    .sort((a, b) => a.name.localeCompare(b.name))

  const datedEntries = purchases
    .map(p => (p.purchaseDate ? new Date(p.purchaseDate) : null))
    .filter((d): d is Date => Boolean(d))

  const earliest = datedEntries.reduce<Date | null>((candidate, current) => {
    if (!candidate || current < candidate) return current
    return candidate
  }, null)

  const latest = datedEntries.reduce<Date | null>((candidate, current) => {
    if (!candidate || current > candidate) return current
    return candidate
  }, null)

  const dateRangeLabel = (() => {
    // Friendly summary of purchase activity dates.
    if (!earliest || !latest) return 'No purchase dates yet'
    if (earliest.getTime() === latest.getTime()) return formatShortDate(latest)
    return `${formatShortDate(earliest)} – ${formatShortDate(latest)}`
  })()

  const userName = `${profile.firstName} ${profile.lastName}`

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{action?.name ?? 'Purchase Orders'}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {action?.description ?? 'Browse and manage supplier purchase orders and their fulfillment status.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="text-foreground">
              {purchases.length}
              <span className="ml-1 text-xs uppercase tracking-wide text-muted-foreground">total</span>
            </span>
            <span className="rounded-full border border-border/70 px-3 py-1 text-xs uppercase tracking-wide">
              Date range: {dateRangeLabel}
            </span>
            <span className="text-xs uppercase tracking-wide">Viewing as {userName}</span>
          </div>
        </header>

        <PurchaseTable
          initialPurchases={purchases}
          companies={companyOptions}
          quoteSuppliers={quoteSupplierOptions}
          paymentConditions={paymentConditionOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          departmentId={departmentId}
        />
      </div>
    </main>
  )
}
