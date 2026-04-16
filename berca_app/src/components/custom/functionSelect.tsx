'use client'

import {useEffect, useState} from 'react'
import {Plus, Loader2} from 'lucide-react'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {createFunctionAction} from '@/serverFunctions/functions'

export interface FunctionOption {
  id: string
  name: string
}

interface FunctionSelectProps {
  value: string | null
  currentName?: string | null
  onChange: (id: string | null, name: string | null) => void
  options: FunctionOption[]
  className?: string
}

const NONE = '__none__'
const CREATE = '__create__'

export function FunctionSelect({value, currentName, onChange, options, className}: FunctionSelectProps) {
  function buildOptions(base: FunctionOption[], selectedId: string | null, selectedName: string | null | undefined) {
    if (!selectedId || !selectedName) return base
    const already = base.some(o => o.id === selectedId)
    if (already) return base
    return [{id: selectedId, name: selectedName}, ...base].sort((a, b) => a.name.localeCompare(b.name))
  }

  const [list, setList] = useState<FunctionOption[]>(() => buildOptions(options, value, currentName))
  const [creatingMode, setCreatingMode] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setList(buildOptions(options, value, currentName))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, value, currentName])

  async function handleCreate() {
    const trimmed = newName.trim()
    if (!trimmed) return
    const existing = list.find(o => o.name.toLowerCase() === trimmed.toLowerCase())
    if (existing) {
      onChange(existing.id, existing.name)
      setCreatingMode(false)
      setNewName('')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const created = await createFunctionAction({name: trimmed})
      const newOption: FunctionOption = {id: created.id, name: created.name}
      setList(prev => [...prev, newOption].sort((a, b) => a.name.localeCompare(b.name)))
      onChange(created.id, created.name)
      setCreatingMode(false)
      setNewName('')
    } catch {
      setError('Failed to create function. Please try again.')
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
            placeholder="Function name…"
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
            const opt = list.find(o => o.id === v)
            onChange(v, opt?.name ?? null)
          }
        }}>
        <SelectTrigger className={`h-8 text-xs bg-secondary border-border flex-1 ${className ?? ''}`}>
          <SelectValue placeholder="Select function…" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          <SelectItem value={NONE} className="text-xs text-muted-foreground">
            None
          </SelectItem>
          {list.map(o => (
            <SelectItem key={o.id} value={o.id} className="text-xs">
              {o.name}
            </SelectItem>
          ))}
          <SelectItem value={CREATE} className="text-xs text-accent">
            <span className="flex items-center gap-1">
              <Plus className="h-3 w-3" /> Add new function…
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

