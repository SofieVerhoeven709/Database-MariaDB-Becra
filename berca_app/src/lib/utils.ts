import {clsx, type ClassValue} from 'clsx'
import {twMerge} from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Indent a string with a given number of spaces on each line except the first.
 *
 * @param text The text to indent.
 * @param spaces The number of spaces to indent with.
 * @return The indented multi-line string.
 */
export function indentMultiline(text: string, spaces = 4): string {
  const indent = ' '.repeat(spaces)
  return text
    .split('\n')
    .map((line, i) => (i === 0 ? line : indent + line))
    .join('\n')
}

export function generateProjectNumber() {
  const now = new Date()

  const year = now.getFullYear().toString().slice(-2) // 26
  const month = String(now.getMonth() + 1).padStart(2, '0') // 02
  const day = String(now.getDate()).padStart(2, '0') // 24

  const random = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, '0') // two random digits

  return `P${year}${month}${day}${random}`
}

export function generateWorkOrderNumber() {
  const now = new Date()

  const year = now.getFullYear().toString().slice(-2) // 26
  const month = String(now.getMonth() + 1).padStart(2, '0') // 02
  const day = String(now.getDate()).padStart(2, '0') // 24

  const random = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, '0') // two random digits

  return `WO${year}${month}${day}${random}`
}
