import * as LucideIcons from 'lucide-react'
import type {LucideIcon} from 'lucide-react'

// Return type is always a React component
export function getIconByName(name: string): LucideIcon {
  return (LucideIcons[name as keyof typeof LucideIcons] as LucideIcon) ?? LucideIcons.Clipboard
}
