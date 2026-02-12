import {clsx, type ClassValue} from 'clsx'
import {twMerge} from 'tailwind-merge'
import {parse as uuidParse, stringify as uuidStringify, v4 as uuidv4} from 'uuid'

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

/**
 * Convert a UUID string to a 16-byte Uint8Array (for BINARY(16) columns)
 */
export function uuidToBinary(uuid: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(uuidParse(uuid))
}

/**
 * Convert a 16-byte Uint8Array back to a UUID string
 */
export function binaryToUuid(binary: Uint8Array<ArrayBuffer>): string {
  return uuidStringify(binary)
}

/**
 * Generate a new UUID in binary form
 */
export function generateBinaryUuid(): Uint8Array<ArrayBuffer> {
  return uuidToBinary(uuidv4())
}
