'use client'
import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import type {MappedQuoteBecra} from '@/types/quoteBecra'

interface QuoteBecraFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: MappedQuoteBecra | null
  onSave: (item: Partial<MappedQuoteBecra> & {id: string}) => Promise<void>
}

const inputStyles = 'bg-secondary border-border placeholder:text-muted-foreground/60 focus-visible:ring-accent'

const EMPTY: Partial<MappedQuoteBecra> & {id: string} = {
  id: '',
  description: '',
  validDate: false,
  date: null,
}

export function QuoteBecraFormDialog({open, onOpenChange, item, onSave}: QuoteBecraFormDialogProps) {
  const isEditing = item !== null
  const makeForm = (): Partial<MappedQuoteBecra> & {id: string} =>
    item ? {...item} : {...EMPTY, id: crypto.randomUUID()}

  const [form, setForm] = useState(makeForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(makeForm())
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id])

  function update<K extends keyof MappedQuoteBecra>(field: K, value: MappedQuoteBecra[K]) {
    setForm(prev => ({...prev, [field]: value}))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave(form)
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
          <DialogTitle className="text-foreground">
            {isEditing ? 'Edit Quote' : 'New Becra Quote'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? `Editing quote: ${item.id.slice(0, 8)}…` : 'Create a new Becra quote record.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
              value={form.date ? form.date.slice(0, 10) : ''}
              onChange={e => update('date', e.target.value ? new Date(e.target.value).toISOString() : null)}
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
              Valid date confirmed
            </Label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Quote'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

