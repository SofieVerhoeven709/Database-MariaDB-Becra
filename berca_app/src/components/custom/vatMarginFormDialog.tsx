'use client'

import {useEffect, useState} from 'react'
import type {FormEvent} from 'react'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {createVatMarginAction, updateVatMarginAction} from '@/serverFunctions/invoices'
import {CountrySelect} from '@/components/custom/countrySelect'
import type {CountryOption} from '@/components/custom/countrySelect'

interface VatMarginFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingMargin: {id: string; vat: number; countryId: string | null; countryName: string | null} | null
  countries: Array<{id: string; name: string}>
  onSuccess: () => void
}

export function VatMarginFormDialog({
  open,
  onOpenChange,
  editingMargin,
  countries,
  onSuccess,
}: VatMarginFormDialogProps) {
  const [vat, setVat] = useState(editingMargin?.vat?.toString() ?? '')
  const [countryId, setCountryId] = useState<string | null>(editingMargin?.countryId ?? null)
  const [countryName, setCountryName] = useState<string | null>(editingMargin?.countryName ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const countryOptions: CountryOption[] = countries

  const resetForm = () => {
    setVat('')
    setCountryId(null)
    setCountryName(null)
    setError(null)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const vatNum = parseFloat(vat)
      if (isNaN(vatNum) || vatNum < 0 || vatNum > 100) {
        setError('VAT must be between 0 and 100')
        setLoading(false)
        return
      }

      if (editingMargin) {
        await updateVatMarginAction({
          id: editingMargin.id,
          vat: vatNum,
          countryId,
        })
      } else {
        await createVatMarginAction({
          vat: vatNum,
          countryId,
        })
      }

      handleOpenChange(false)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Update form when editingMargin changes
  useEffect(() => {
    if (open && editingMargin) {
      setVat(editingMargin.vat?.toString() ?? '')
      setCountryId(editingMargin.countryId ?? null)
      setCountryName(editingMargin.countryName ?? null)
    } else if (open) {
      resetForm()
    }
  }, [open, editingMargin])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingMargin ? 'Edit VAT Margin' : 'Create VAT Margin'}</DialogTitle>
          <DialogDescription>
            {editingMargin ? 'Update the VAT margin details' : 'Create a new VAT margin with optional country assignment'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="vat" className="text-sm font-medium">
              VAT Percentage (%)
            </Label>
            <Input
              id="vat"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="e.g., 21"
              value={vat}
              onChange={e => setVat(e.target.value)}
              required
              className="bg-background border-border/40"
            />
            <p className="text-xs text-muted-foreground">Enter a value between 0 and 100</p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="country" className="text-sm font-medium">
              Country (Optional)
            </Label>
            <CountrySelect
              value={countryId}
              currentName={countryName}
              onChange={(id, name) => {
                setCountryId(id)
                setCountryName(name)
              }}
              countries={countryOptions}
              className="bg-background border-border/40"
            />
            <p className="text-xs text-muted-foreground">
              Optionally assign this VAT rate to a specific country, or add one inline.
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/80">
              {loading ? 'Saving...' : editingMargin ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

