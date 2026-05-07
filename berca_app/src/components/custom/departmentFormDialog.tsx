'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {createDepartmentAction, updateDepartmentAction} from '@/serverFunctions/departments'
import type {MappedDepartment} from '@/types/department'
import {useRouter} from 'next/navigation'

interface DepartmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  department: MappedDepartment | null
}

function emptyForm() {
  return {
    name: '',
    color: '',
    icon: '',
    description: '',
    number: '',
  }
}

export function DepartmentFormDialog({open, onOpenChange, department}: DepartmentFormDialogProps) {
  const router = useRouter()
  const isEdit = !!department
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm())

  useEffect(() => {
    if (department) {
      // Seed form values from the selected department.
      setForm({
        name: department.name,
        color: department.color ?? '',
        icon: department.icon ?? '',
        description: department.description ?? '',
        number: department.number?.toString() ?? '',
      })
    } else if (open) {
      setForm(emptyForm())
    }
  }, [department?.id, open])

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({...prev, [key]: value}))
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        color: form.color || null,
        icon: form.icon || null,
        description: form.description || null,
        number: form.number ? parseInt(form.number) : null,
      }

      if (isEdit) {
        await updateDepartmentAction({...payload, id: department.id})
      } else {
        await createDepartmentAction(payload)
      }

      onOpenChange(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const canSubmit = !!form.name.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? 'Edit Department' : 'New Department'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-5 py-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Name *</Label>
            <Input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="bg-secondary border-border"
              placeholder="e.g. Engineering"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Color</Label>
            <div className="flex items-center gap-2">
              <Input
                value={form.color}
                onChange={e => set('color', e.target.value)}
                className="bg-secondary border-border"
                placeholder="#3b82f6"
                maxLength={10}
              />
              {form.color && (
                <div
                  className="h-8 w-8 rounded-md border border-border flex-shrink-0"
                  style={{backgroundColor: form.color}}
                />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Number</Label>
            <Input
              type="number"
              value={form.number}
              onChange={e => set('number', e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Icon</Label>
            <Input
              value={form.icon}
              onChange={e => set('icon', e.target.value)}
              className="bg-secondary border-border"
              placeholder="e.g. settings, users, wrench"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              className="bg-secondary border-border resize-none"
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !canSubmit}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Department'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
