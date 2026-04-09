import {getQuoteSuppliers, getPaymentConditionOptions} from '@/dal/quoteSuppliers'
import {mapQuoteSupplier} from '@/extra/quoteSuppliers'
import {QuoteSupplierTable} from '@/components/custom/quoteSupplierTable'
import {DEPARTMENT_ACTIONS} from '@/extra/departmentActions'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getSupplierCompanies} from '@/dal/companies'
import {getDepartmentById} from '@/dal/department'
import {getDepartmentRoleInfo} from '@/lib/utils'
import {getMaterialById} from '@/dal/materials'

interface PageProps {
  params: Promise<{departmentId: string}>
  searchParams?: Promise<{materialId?: string; supplierId?: string}>
}

export default async function OrderQuotePage({params, searchParams}: PageProps) {
  const {departmentId} = await params
  const {materialId, supplierId} = (await searchParams) ?? {}

  const [department, entriesFromDAL, companiesRaw, paymentConditionsRaw, profile, materialData] = await Promise.all([
    getDepartmentById(departmentId),
    getQuoteSuppliers(),
    getSupplierCompanies(),
    getPaymentConditionOptions(),
    getSessionProfileFromCookieOrThrow(),
    materialId ? getMaterialById(materialId) : Promise.resolve(null),
  ])

  if (!department) return <p>Department not found</p>

  const {currentUserRole, currentUserLevel} = getDepartmentRoleInfo(profile, department.name)

  const entries = entriesFromDAL.map(mapQuoteSupplier)
  const action = DEPARTMENT_ACTIONS[department.name]?.find(a => a.id === 'orderQuote')

  const companyOptions = companiesRaw
    .map(c => ({id: c.id, name: c.name}))
    .sort((a, b) => a.name.localeCompare(b.name))

  const paymentConditionOptions = paymentConditionsRaw
    .map(pc => ({id: pc.id, name: pc.name}))
    .sort((a, b) => a.name.localeCompare(b.name))

  const selectedSupplier = supplierId ? companyOptions.find(c => c.id === supplierId) ?? null : null

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{action?.name ?? 'Order Quotes'}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {action?.description ?? 'Manage supplier quotations and comparisons.'}
            </p>
          </div>
          {materialData && (
            <div className="rounded-lg border border-border/60 bg-card p-3 space-y-2">
              <p className="text-xs text-muted-foreground"><strong>Creating quote for material:</strong></p>
              <div className="flex items-baseline gap-2">
                <span className="font-medium">{materialData.beNumber ?? materialData.id.slice(0, 8)}</span>
                <span className="text-sm text-muted-foreground">{materialData.shortDescription ?? materialData.name ?? '—'}</span>
              </div>
              {selectedSupplier && (
                <p className="text-xs text-muted-foreground">
                  <strong>Supplier preselected:</strong> {selectedSupplier.name}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="text-foreground">
              {entries.length}
              <span className="ml-1 text-xs uppercase tracking-wide text-muted-foreground">total</span>
            </span>
            <span className="text-xs uppercase tracking-wide">
              Viewing as {profile.firstName} {profile.lastName}
            </span>
          </div>
        </header>

        <QuoteSupplierTable
          initialEntries={entries}
          companies={companyOptions}
          paymentConditions={paymentConditionOptions}
          currentUserRole={currentUserRole}
          currentUserLevel={currentUserLevel}
          defaultMaterialId={materialId}
          defaultSupplierId={selectedSupplier?.id}
        />
      </div>
    </main>
  )
}
