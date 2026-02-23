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
