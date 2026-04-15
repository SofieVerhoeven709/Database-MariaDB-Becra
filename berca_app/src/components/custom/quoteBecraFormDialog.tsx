'use client'
import {useEffect, useRef, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import type {MappedQuoteBecra} from '@/types/quoteBecra'
import {QuoteBecraCompanySelect, type QuoteBecraCompanyOption} from '@/components/custom/quoteBecraCompanySelect'

interface QuoteBecraFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: MappedQuoteBecra | null
  onSave: (item: Partial<MappedQuoteBecra> & {id: string; originalId?: string}) => Promise<void>
  companyOptions: QuoteBecraCompanyOption[]
  onCreateCompany: (name: string) => Promise<QuoteBecraCompanyOption>
}

const inputStyles = 'bg-secondary border-border placeholder:text-muted-foreground/60 focus-visible:ring-accent'

const EMPTY: Partial<MappedQuoteBecra> & {id: string} = {
  id: '',
  company: '',
  description: '',
  validDate: false,
  date: null,
}

function generatePrefixFromDate(date: Date | string | null): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  const year = String(d.getFullYear()).slice(-2).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}


function generateSuffix() {
  return String(Math.floor(Math.random() * 100)).padStart(2, '0')
}

export function QuoteBecraFormDialog({
  open,
  onOpenChange,
  item,
  onSave,
  companyOptions,
  onCreateCompany,
}: QuoteBecraFormDialogProps) {
  const isEditing = item !== null
  const makeForm = (): Partial<MappedQuoteBecra> & {id: string} => (item ? {...item} : {...EMPTY})

  const [form, setForm] = useState(makeForm)
  const [quotePrefix, setQuotePrefix] = useState(() => (item?.id ? item.id.slice(0, 6) : ''))
  const [quoteSuffix, setQuoteSuffix] = useState(() => (item?.id ? item.id.slice(6, 8) : ''))
  const [displayDate, setDisplayDate] = useState(() =>
    item?.date ? item.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const generatedForPrefixRef = useRef('')
  const [isUserModifiedPrefix, setIsUserModifiedPrefix] = useState(false)
  const hasValidQuoteNumber = /^\d{6}$/.test(quotePrefix) && /^\d{2}$/.test(quoteSuffix)

  useEffect(() => {
    if (open) {
      setForm(makeForm())
      setError(null)
      setIsUserModifiedPrefix(false)

      setQuotePrefix(item?.id ? item.id.slice(0, 6) : '')
      setQuoteSuffix(item?.id ? item.id.slice(6, 8) : '')
      setDisplayDate(item?.date ? item.date.slice(0, 10) : new Date().toISOString().slice(0, 10))
      generatedForPrefixRef.current = item?.id ? item.id.slice(0, 8) : ''

      // For new quotes, auto-generate prefix from today
      if (!item) {
        const today = new Date().toISOString().slice(0, 10)
        const generatedPrefix = generatePrefixFromDate(today)
        setQuotePrefix(generatedPrefix)
        generatedForPrefixRef.current = generatedPrefix
        setQuoteSuffix(generateSuffix())
      }
    }
  }, [open, item?.id])

  useEffect(() => {
    if (!displayDate) return
    const generatedPrefix = generatePrefixFromDate(displayDate)
    if (!isUserModifiedPrefix && generatedPrefix && generatedPrefix !== quotePrefix) {
      setQuotePrefix(generatedPrefix)
      generatedForPrefixRef.current = generatedPrefix
      setQuoteSuffix(generateSuffix())
    }
  }, [displayDate, quotePrefix, isUserModifiedPrefix])

  useEffect(() => {
    if (quotePrefix.length < 6) {
      generatedForPrefixRef.current = ''
      setQuoteSuffix('')
      setForm(prev => ({...prev, id: quotePrefix}))
      return
    }

    if (generatedForPrefixRef.current !== quotePrefix) {
      const suffix = generateSuffix()
      generatedForPrefixRef.current = quotePrefix
      setQuoteSuffix(suffix)
      setForm(prev => ({...prev, id: `${quotePrefix}${suffix}`}))
      return
    }

    setForm(prev => ({...prev, id: `${quotePrefix}${quoteSuffix}`}))
  }, [quotePrefix, quoteSuffix])

  function update<K extends keyof MappedQuoteBecra>(field: K, value: MappedQuoteBecra[K]) {
    setForm(prev => ({...prev, [field]: value}))
  }

  function handleDateChange(value: string) {
    setDisplayDate(value)
    update('date', value ? new Date(value).toISOString() : null)
  }

  function handlePrefixChange(value: string) {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 6)
    setQuotePrefix(digitsOnly)
    if (digitsOnly.length > 0) {
      setIsUserModifiedPrefix(true)
    }
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const id = `${quotePrefix}${quoteSuffix}`
      if (!/^\d{8}$/.test(id)) {
        setError('Please enter exactly 6 digits first so the final 2 digits can be generated automatically.')
        return
      }
      await onSave({...form, id, originalId: item?.id})
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong, please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEditing ? 'Edit Quote' : 'New Becra Quote'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Editing quote: ${item.id}`
              : 'Create a new Becra quote record. Enter the first 6 digits and the last 2 digits will be generated automatically.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="qb-number" className="text-xs text-muted-foreground">
                Quote Number
              </Label>
              <div className="grid grid-cols-[minmax(0,1fr)_5rem] gap-2">
                <Input
                  id="qb-number"
                  className={inputStyles}
                  value={quotePrefix}
                      onChange={e => handlePrefixChange(e.target.value)}
                      placeholder="YYMMDD"
                      inputMode="numeric"
                      maxLength={6}
                      aria-label="Quote prefix (YYMMDD) - auto-filled from date or edit manually"
                  required
                />
                <Input
                  className={`${inputStyles} text-center`}
                  value={quoteSuffix}
                  readOnly
                  aria-label="Auto-generated random suffix"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">YYMMDD auto-filled from date, or edit manually. Suffix is 2 random digits. Example: 2026-04-14 → 260414 + 01 = 26041401</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="qb-company" className="text-xs text-muted-foreground">
                Company
              </Label>
              <QuoteBecraCompanySelect
                value={form.company ?? ''}
                onChange={value => update('company', value)}
                companies={companyOptions}
                onCreateCompany={onCreateCompany}
                className={inputStyles}
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="qb-description" className="text-xs text-muted-foreground">
              Description
            </Label>
            <Textarea
              id="qb-description"
              className={inputStyles}
              value={form.description ?? ''}
              onChange={e => update('description', e.target.value)}
              placeholder="Quote description…"
              rows={3}
            />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="qb-date" className="text-xs text-muted-foreground">
              Quote Date
            </Label>
            <Input
              id="qb-date"
              type="date"
              className={inputStyles}
              value={displayDate}
              onChange={e => handleDateChange(e.target.value)}
            />
          </div>

          {/* Valid Date toggle */}
          <div className="flex items-center gap-3">
            <Switch
              id="qb-validDate"
              checked={form.validDate ?? false}
              onCheckedChange={checked => update('validDate', checked)}
            />
            <Label htmlFor="qb-validDate" className="text-sm text-foreground cursor-pointer">
              Quote validity confirmed
            </Label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !hasValidQuoteNumber}
              className="bg-accent text-accent-foreground hover:bg-accent/90">
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Quote'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
