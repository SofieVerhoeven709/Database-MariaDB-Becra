'use client'

import Link from 'next/link'
import type {Route} from 'next'
import {useMemo, useState} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowLeft, Check, Pencil, Trash2, X} from 'lucide-react'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import type {MappedQuoteSupplierDetail} from '@/types/quoteSupplier'
import {
  createQuoteSupplierLineAction,
  deleteQuoteSupplierLineAction,
  selectQuoteSupplierLineAction,
  updateQuoteSupplierLineAction,
} from '@/serverFunctions/quoteSupplierLines'

interface QuoteSupplierDetailProps {
  quote: MappedQuoteSupplierDetail
  departmentId: string
  currentUserLevel: number
  materialOptions: Array<{id: string; beNumber: string | null; name: string | null; shortDescription: string | null}>
  materialDemandOptions: Array<{id: string; materialId: string; label: string}>
  defaultMaterialId?: string
  defaultMaterialDemandId?: string
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function materialLabel(m: {beNumber: string | null; shortDescription: string | null; name: string | null; id: string}) {
  return [m.beNumber, m.shortDescription ?? m.name].filter(Boolean).join(' — ') || m.id
}

function getLifecycleStatus(quote: MappedQuoteSupplierDetail): 'pending' | 'sent' | 'received' | 'approved' | 'rejected' {
  if (quote.rejected) return 'rejected'
  if (quote.acceptedForPOB) return 'approved'
  if (quote.received) return 'received'
  if (quote.sent) return 'sent'
  return 'pending'
}

export function QuoteSupplierDetail({
  quote,
  departmentId,
  currentUserLevel,
  materialOptions,
  materialDemandOptions,
  defaultMaterialId,
  defaultMaterialDemandId,
}: QuoteSupplierDetailProps) {
  const router = useRouter()
  const isApprovedLocked = quote.acceptedForPOB && currentUserLevel < 80
  const canEditLines = currentUserLevel >= 40 && !isApprovedLocked
  const canCreateLines = currentUserLevel >= 60 && !quote.sent && !isApprovedLocked
  const canDeleteLines = currentUserLevel >= 80 && !isApprovedLocked
  const lifecycleStatus = getLifecycleStatus(quote)

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [editingLineId, setEditingLineId] = useState<string | null>(null)

  const [newMaterialId, setNewMaterialId] = useState(defaultMaterialId ?? '__none__')
  const [newMaterialDemandId, setNewMaterialDemandId] = useState(defaultMaterialDemandId ?? '__none__')
  const [newQuantity, setNewQuantity] = useState('1')
  const [newUnitPrice, setNewUnitPrice] = useState('')
  const [newMinQuantity, setNewMinQuantity] = useState('')

  const [editQuantity, setEditQuantity] = useState('1')
  const [editUnitPrice, setEditUnitPrice] = useState('')
  const [editMinQuantity, setEditMinQuantity] = useState('')

  const demandOptionsForSelectedMaterial = useMemo(() => {
    if (!newMaterialId || newMaterialId === '__none__') return materialDemandOptions
    return materialDemandOptions.filter(option => option.materialId === newMaterialId)
  }, [materialDemandOptions, newMaterialId])

  function startEdit(line: MappedQuoteSupplierDetail['lines'][number]) {
    setEditingLineId(line.id)
    setEditQuantity(String(line.quantity))
    setEditUnitPrice(String(line.unitPrice))
    setEditMinQuantity(line.minQuantity !== null ? String(line.minQuantity) : '')
  }

  function cancelEdit() {
    setEditingLineId(null)
    setEditQuantity('1')
    setEditUnitPrice('')
    setEditMinQuantity('')
  }

  async function handleCreateLine() {
    const quantity = Number.parseInt(newQuantity, 10)
    const unitPrice = Number.parseFloat(newUnitPrice)
    const minQuantity = newMinQuantity.trim() ? Number.parseInt(newMinQuantity, 10) : undefined

    if (!newMaterialId || newMaterialId === '__none__') {
      setError('Please select a material for the quote line.')
      return
    }
    if (Number.isNaN(quantity) || quantity < 1) {
      setError('Quantity must be at least 1.')
      return
    }
    if (Number.isNaN(unitPrice) || unitPrice <= 0) {
      setError('Unit price must be greater than 0.')
      return
    }
    if (minQuantity !== undefined && (Number.isNaN(minQuantity) || minQuantity < 0)) {
      setError('Minimum quantity cannot be negative.')
      return
    }

    try {
      setSubmitting(true)
      await createQuoteSupplierLineAction({
        quoteSupplierId: quote.id,
        materialId: newMaterialId,
        materialDemandId: newMaterialDemandId !== '__none__' ? newMaterialDemandId : undefined,
        quantity,
        unitPrice,
        minQuantity,
      })

      setError(null)
      setNewQuantity('1')
      setNewUnitPrice('')
      setNewMinQuantity('')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create quote line.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdateLine(lineId: string) {
    const quantity = Number.parseInt(editQuantity, 10)
    const unitPrice = Number.parseFloat(editUnitPrice)
    const minQuantity = editMinQuantity.trim() ? Number.parseInt(editMinQuantity, 10) : undefined

    if (Number.isNaN(quantity) || quantity < 1) {
      setError('Quantity must be at least 1.')
      return
    }
    if (Number.isNaN(unitPrice) || unitPrice <= 0) {
      setError('Unit price must be greater than 0.')
      return
    }
    if (minQuantity !== undefined && (Number.isNaN(minQuantity) || minQuantity < 0)) {
      setError('Minimum quantity cannot be negative.')
      return
    }

    try {
      setSubmitting(true)
      await updateQuoteSupplierLineAction({
        id: lineId,
        quantity,
        unitPrice,
        minQuantity,
      })

      setError(null)
      cancelEdit()
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update quote line.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteLine(lineId: string) {
    try {
      setSubmitting(true)
      await deleteQuoteSupplierLineAction({id: lineId})
      setError(null)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete quote line.')
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleSelected(lineId: string, selected: boolean, materialDemandId: string | null) {
    try {
      setSubmitting(true)
      await selectQuoteSupplierLineAction({
        id: lineId,
        selected,
        materialDemandId: materialDemandId ?? undefined,
      })
      setError(null)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update selection.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/departments/${departmentId}/orderQuote` as Route}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{quote.quoteNumber}</h1>
            <p className="text-sm text-muted-foreground">
              {quote.companyName} | {quote.lineCount} line(s) | Valid until {formatDate(quote.validUntil)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lifecycleStatus === 'rejected' && <Badge className="bg-red-500/15 text-red-700 border border-red-500/30">Rejected</Badge>}
          {lifecycleStatus === 'approved' && <Badge className="bg-green-500/15 text-green-700 border border-green-500/30">Approved</Badge>}
          {lifecycleStatus === 'received' && <Badge className="bg-blue-500/15 text-blue-700 border border-blue-500/30">Received</Badge>}
          {lifecycleStatus === 'sent' && <Badge className="bg-slate-500/15 text-slate-700 border border-slate-500/30">Sent</Badge>}
          {lifecycleStatus === 'pending' && (
            <Badge className="bg-yellow-500/15 text-yellow-700 border border-yellow-500/30">Pending</Badge>
          )}
        </div>
      </div>

      {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

      <div className="rounded-xl border border-border/60 bg-card p-4">
        <h2 className="text-sm font-medium text-foreground mb-3">Quote details</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="text-sm text-muted-foreground">
            <span className="text-xs uppercase tracking-wide text-muted-foreground/80">Quotation number</span>
            <div className="text-foreground mt-0.5">{quote.quotationNumber ?? '—'}</div>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="text-xs uppercase tracking-wide text-muted-foreground/80">Payment condition</span>
            <div className="text-foreground mt-0.5">{quote.paymentConditionName ?? '—'}</div>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="text-xs uppercase tracking-wide text-muted-foreground/80">Delivery time</span>
            <div className="text-foreground mt-0.5">{quote.deliveryTimeDays !== null ? `${quote.deliveryTimeDays} day(s)` : '—'}</div>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="text-xs uppercase tracking-wide text-muted-foreground/80">Valid until</span>
            <div className="text-foreground mt-0.5">{formatDate(quote.validUntil)}</div>
          </div>
          <div className="md:col-span-2 text-sm text-muted-foreground">
            <span className="text-xs uppercase tracking-wide text-muted-foreground/80">Description</span>
            <div className="text-foreground mt-0.5 whitespace-pre-wrap">{quote.description ?? '—'}</div>
          </div>
          <div className="md:col-span-2 text-sm text-muted-foreground">
            <span className="text-xs uppercase tracking-wide text-muted-foreground/80">Additional info</span>
            <div className="text-foreground mt-0.5 whitespace-pre-wrap">{quote.additionalInfo ?? '—'}</div>
          </div>
        </div>
      </div>

      {quote.sent && (
        <div className="rounded-md border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm text-sky-800">
          This quote is sent. You can no longer add new line items.
        </div>
      )}

      {isApprovedLocked && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800">
          This quote is approved. Only managers can edit it.
        </div>
      )}

      {canCreateLines && (
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <h2 className="text-sm font-medium text-foreground mb-3">Add quote line</h2>
          <div className="grid gap-3 md:grid-cols-5">
            <div className="md:col-span-2">
              <Label className="text-xs">Material</Label>
              <Select
                value={newMaterialId}
                onValueChange={value => {
                  setNewMaterialId(value)
                  const firstDemandForMaterial = materialDemandOptions.find(option => option.materialId === value)
                  if (firstDemandForMaterial) setNewMaterialDemandId(firstDemandForMaterial.id)
                }}>
                <SelectTrigger className="bg-secondary border-border mt-1">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="__none__">— Select material —</SelectItem>
                  {materialOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {materialLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Material demand (optional)</Label>
              <Select value={newMaterialDemandId} onValueChange={setNewMaterialDemandId}>
                <SelectTrigger className="bg-secondary border-border mt-1">
                  <SelectValue placeholder="Select demand" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="__none__">— None —</SelectItem>
                  {demandOptionsForSelectedMaterial.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Qty</Label>
              <Input type="number" min={1} value={newQuantity} onChange={e => setNewQuantity(e.target.value)} className="bg-secondary border-border mt-1" />
            </div>

            <div>
              <Label className="text-xs">Unit Price</Label>
              <Input type="number" step="0.01" min={0.01} value={newUnitPrice} onChange={e => setNewUnitPrice(e.target.value)} className="bg-secondary border-border mt-1" />
            </div>
          </div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="w-40">
              <Label className="text-xs">Min Qty (optional)</Label>
              <Input type="number" min={0} value={newMinQuantity} onChange={e => setNewMinQuantity(e.target.value)} className="bg-secondary border-border mt-1" />
            </div>
            <Button onClick={handleCreateLine} disabled={submitting}>Add Line</Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className="text-xs">Material</TableHead>
              <TableHead className="text-xs">Demand</TableHead>
              <TableHead className="text-xs">Qty</TableHead>
              <TableHead className="text-xs">Min Qty</TableHead>
              <TableHead className="text-xs">Unit Price</TableHead>
              <TableHead className="text-xs">Selected</TableHead>
              <TableHead className="w-24"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quote.lines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground text-sm">
                  No quote lines yet. Add one or more lines above.
                </TableCell>
              </TableRow>
            ) : (
              quote.lines.map(line => {
                const isEditing = editingLineId === line.id
                return (
                  <TableRow key={line.id} className="border-border/40 hover:bg-secondary/50">
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex flex-col">
                        <span className="text-foreground">{line.materialBeNumber ?? '—'}</span>
                        <span className="text-xs">{line.materialShortDescription ?? line.materialName ?? line.materialId}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{line.materialDemandLabel ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {isEditing ? (
                        <Input type="number" min={1} value={editQuantity} onChange={e => setEditQuantity(e.target.value)} className="h-8 bg-secondary border-border" />
                      ) : (
                        line.quantity
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {isEditing ? (
                        <Input type="number" min={0} value={editMinQuantity} onChange={e => setEditMinQuantity(e.target.value)} className="h-8 bg-secondary border-border" />
                      ) : (
                        line.minQuantity ?? '—'
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {isEditing ? (
                        <Input type="number" step="0.01" min={0.01} value={editUnitPrice} onChange={e => setEditUnitPrice(e.target.value)} className="h-8 bg-secondary border-border" />
                      ) : (
                        formatMoney(line.unitPrice)
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={line.selected ? 'secondary' : 'outline'}
                        className="h-7 text-xs"
                        disabled={submitting}
                        onClick={() => toggleSelected(line.id, !line.selected, line.materialDemandId)}>
                        {line.selected ? 'Selected' : 'Select'}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10" onClick={() => handleUpdateLine(line.id)}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:bg-secondary" onClick={cancelEdit}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          canEditLines && (
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => startEdit(line)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )
                        )}
                        {canDeleteLines && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteLine(line.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

