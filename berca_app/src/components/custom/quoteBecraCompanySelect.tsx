'use client'

import {useEffect, useMemo, useRef, useState} from 'react'
import {Check, ChevronDown, Loader2, Plus} from 'lucide-react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'

export type QuoteBecraCompanyOption = {
  id: string
  name: string
}

interface QuoteBecraCompanySelectProps {
  value: string | null
  onChange: (value: string | null) => void
  companies: QuoteBecraCompanyOption[]
  onCreateCompany: (name: string) => Promise<QuoteBecraCompanyOption>
  className?: string
}

function sortCompanies(options: QuoteBecraCompanyOption[]) {
  return [...options].sort((a, b) => a.name.localeCompare(b.name))
}

export function QuoteBecraCompanySelect({value, onChange, companies, onCreateCompany, className}: QuoteBecraCompanySelectProps) {
  const [query, setQuery] = useState(value ?? '')
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setQuery(value ?? '')
  }, [value])

  useEffect(() => {
    return () => {
      if (blurTimer.current) clearTimeout(blurTimer.current)
    }
  }, [])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    const sorted = sortCompanies(companies)
    if (!term) return sorted.slice(0, 12)
    return sorted.filter(option => option.name.toLowerCase().includes(term)).slice(0, 12)
  }, [companies, query])

  const exactMatch = companies.some(option => option.name.toLowerCase() === query.trim().toLowerCase())

  function commitValue(nextValue: string | null) {
    onChange(nextValue)
  }

  function closeDropdownSoon() {
    if (blurTimer.current) clearTimeout(blurTimer.current)
    blurTimer.current = setTimeout(() => setOpen(false), 150)
  }

  async function handleCreateCompany() {
    const candidate = (newCompanyName || query).trim()
    if (!candidate) return
    setSaving(true)
    setError(null)
    try {
      const created = await onCreateCompany(candidate)
      commitValue(created.name)
      setQuery(created.name)
      setCreating(false)
      setNewCompanyName('')
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create company. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={e => {
          const next = e.target.value
          setQuery(next)
          commitValue(next)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={closeDropdownSoon}
        placeholder="Search or enter a company…"
        className={`bg-secondary border-border pr-8 ${className ?? ''}`}
      />
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg">
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">No matching companies.</div>
            ) : (
              filtered.map(option => {
                const selected = option.name.toLowerCase() === query.trim().toLowerCase()
                return (
                  <button
                    key={option.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm hover:bg-muted"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => {
                      commitValue(option.name)
                      setQuery(option.name)
                      setOpen(false)
                    }}>
                    <span className="truncate">{option.name}</span>
                    {selected && <Check className="h-4 w-4 text-accent" />}
                  </button>
                )
              })
            )}
          </div>

          <div className="border-t border-border bg-secondary/40 p-2">
            {!creating ? (
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start gap-2 text-xs text-accent hover:text-accent"
                onMouseDown={e => e.preventDefault()}
                onClick={() => {
                  setCreating(true)
                  setNewCompanyName(query.trim())
                }}>
                <Plus className="h-3.5 w-3.5" />
                {exactMatch ? 'Add a new company anyway…' : 'Add new company…'}
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <Input
                  autoFocus
                  value={newCompanyName}
                  onChange={e => setNewCompanyName(e.target.value)}
                  placeholder="New company name…"
                  className="h-8 bg-secondary border-border text-xs"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void handleCreateCompany()
                    }
                    if (e.key === 'Escape') {
                      setCreating(false)
                      setNewCompanyName('')
                      setError(null)
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 flex-1 bg-accent text-accent-foreground hover:bg-accent/80"
                    disabled={saving || !newCompanyName.trim()}
                    onClick={() => void handleCreateCompany()}>
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Create'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 border-border"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => {
                      setCreating(false)
                      setNewCompanyName('')
                      setError(null)
                    }}>
                    Cancel
                  </Button>
                </div>
                {error && <p className="text-[11px] text-destructive">{error}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

