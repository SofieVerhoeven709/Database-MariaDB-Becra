export function formatDate(date: Date | null | undefined) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

export function formatDateTime(date: Date | null | undefined) {
  if (!date) return '-'
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function toInputDate(date: Date | null | undefined) {
  if (!date) return ''
  return new Date(date).toISOString().slice(0, 10)
}

export function toInputTime(date: Date | null | undefined) {
  if (!date) return ''
  return new Date(date).toTimeString().slice(0, 5)
}

export function combineDateAndTime(date: string, time: string): Date | null {
  if (!date || !time) return null
  return new Date(`${date}T${time}`)
}

export const tdClass = 'whitespace-nowrap text-muted-foreground text-sm'
export const thClass = 'whitespace-nowrap text-xs'
