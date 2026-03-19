'use client'

import {useState} from 'react'
import {Plus, Loader2} from 'lucide-react'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {createCountryAction} from '@/serverFunctions/countries'

export interface CountryOption {
  id: string
  name: string
}

interface CountrySelectProps {
  value: string | null // countryId or null
  onChange: (id: string | null, name: string | null) => void
  countries: CountryOption[] // initial list from server
  className?: string
}

const NONE = '__none__'
const CREATE = '__create__'

/**
 * Dropdown that lists existing countries + an inline "Create new" flow.
 * When the user types a new name and confirms, it calls the server action,
 * appends the new country to the local list, and selects it.
 */
export function CountrySelect({value, onChange, countries, className}: CountrySelectProps) {
  const [options, setOptions] = useState<CountryOption[]>(countries)
  const [creatingMode, setCreatingMode] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    const trimmed = newName.trim()
    if (!trimmed) return
    // Prevent duplicates (case-insensitive)
    const existing = options.find(o => o.name.toLowerCase() === trimmed.toLowerCase())
    if (existing) {
      onChange(existing.id, existing.name)
      setCreatingMode(false)
      setNewName('')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const created = await createCountryAction({name: trimmed})
      const newOption: CountryOption = {id: created.id, name: created.name}
      setOptions(prev => [...prev, newOption].sort((a, b) => a.name.localeCompare(b.name)))
      onChange(created.id, created.name)
      setCreatingMode(false)
      setNewName('')
    } catch {
      setError('Failed to create country. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (creatingMode) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-1.5">
          <Input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleCreate()
              }
              if (e.key === 'Escape') {
                setCreatingMode(false)
                setNewName('')
              }
            }}
            placeholder="Country name…"
            className={`h-8 text-xs bg-secondary border-border flex-1 ${className ?? ''}`}
          />
          <Button
            type="button"
            size="sm"
            className="h-8 px-3 text-xs bg-accent text-accent-foreground hover:bg-accent/80 shrink-0"
            disabled={saving || !newName.trim()}
            onClick={handleCreate}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Add'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs border-border shrink-0"
            onClick={() => {
              setCreatingMode(false)
              setNewName('')
            }}>
            Cancel
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex gap-1.5">
      <Select
        value={value ?? NONE}
        onValueChange={v => {
          if (v === CREATE) {
            setCreatingMode(true)
          } else if (v === NONE) {
            onChange(null, null)
          } else {
            const opt = options.find(o => o.id === v)
            onChange(v, opt?.name ?? null)
          }
        }}>
        <SelectTrigger className={`h-8 text-xs bg-secondary border-border flex-1 ${className ?? ''}`}>
          <SelectValue placeholder="Select country…" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          <SelectItem value={NONE} className="text-xs text-muted-foreground">
            None
          </SelectItem>
          {options.map(o => (
            <SelectItem key={o.id} value={o.id} className="text-xs">
              {o.name}
            </SelectItem>
          ))}
          <SelectItem value={CREATE} className="text-xs text-accent">
            <span className="flex items-center gap-1">
              <Plus className="h-3 w-3" /> Add new country…
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
