'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import type {MappedCertificateType} from '@/types/training'

interface CertificateTypeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  certificateType: MappedCertificateType | null
  onSave: (name: string, id?: string) => Promise<void>
}

export function CertificateTypeFormDialog({
  open,
  onOpenChange,
  certificateType,
  onSave,
}: CertificateTypeFormDialogProps) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Re-seed the form when switching between types or reopening.
    setName(certificateType?.name ?? '')
  }, [certificateType?.id, open])

  async function handleSubmit() {
    setSaving(true)
    try {
      await onSave(name.trim(), certificateType?.id)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {certificateType ? 'Edit Type' : 'New Certificate Type'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1.5 py-3">
          <Label className="text-xs text-muted-foreground">Name *</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Safety, Technical…"
            className="bg-secondary border-border"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="bg-accent text-accent-foreground hover:bg-accent/80">
            {saving ? 'Saving…' : certificateType ? 'Save Changes' : 'Create Type'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
