'use client'

import {useEffect, useState} from 'react'
import {useTheme} from 'next-themes'
import {Switch} from '@/components/ui/switch'

export function ThemeToggle() {
  const {resolvedTheme, setTheme} = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const isDark = resolvedTheme === 'dark'

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Dark mode</span>
      <Switch
        checked={isDark}
        onCheckedChange={checked => setTheme(checked ? 'dark' : 'light')}
        aria-label="Toggle dark mode"
      />
    </div>
  )
}
